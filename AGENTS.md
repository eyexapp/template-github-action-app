# AGENTS.md — GitHub Action (Node.js 20 / TypeScript)

## Project Identity

| Key | Value |
|-----|-------|
| Runtime | Node.js 20 |
| Language | TypeScript (strict) |
| Category | DevTool — GitHub Action |
| Bundler | esbuild → `dist/index.js` |
| AI | Pluggable via `AIProvider` interface |
| Testing | Vitest |
| Linting | ESLint + Prettier |
| Actions SDK | `@actions/core`, `@actions/exec`, `@actions/github` |

> **This is a GitHub Action** — bundled to a single `dist/index.js` via esbuild. No npm install at runtime.

---

## Architecture — DI + AI Provider Adapter

```
src/
├── index.ts              ← Entry: orchestrates entire workflow
├── action.ts             ← Input validation + output setting (Actions runtime)
├── core/
│   ├── types.ts          ← AIProvider, ActionInputs, ProgressReporter interfaces
│   └── errors.ts         ← ActionError hierarchy
├── services/
│   ├── ai/
│   │   ├── provider.ts   ← Re-exports AIProvider interface
│   │   ├── gemini.ts     ← Google Gemini implementation
│   │   └── factory.ts    ← createAIProvider() factory
│   ├── github.ts         ← Octokit wrapper (comments, issues, PRs)
│   └── git.ts            ← Git CLI via @actions/exec
├── agents/
│   └── readme-agent.ts   ← Core logic: file analysis + README generation
└── utils/
    ├── progress.ts       ← Progress tracking + Markdown rendering
    ├── files.ts          ← File system utils (collect, filter)
    └── prompts.ts        ← AI prompt templates
```

### Strict Layer Rules

| Layer | Can Import From | NEVER Imports |
|-------|----------------|---------------|
| `core/` | (none — foundational) | services/, agents/, utils/ |
| `services/` | core/ | agents/ |
| `agents/` | core/, services/, utils/ | — |
| `utils/` | core/ | services/, agents/ |
| `index.ts` | Everything (composition root) | — |

---

## Adding New Code — Where Things Go

### New AI Provider Checklist
1. **Provider**: `src/services/ai/newprovider.ts` implementing `AIProvider`
2. **Register**: Add to `src/services/ai/factory.ts`
3. **Input**: Users pass `ai-provider: newprovider` in workflow YAML
4. **Test**: `tests/services/ai/newprovider.test.ts`

### New Agent Checklist
1. **Agent**: `src/agents/new-agent.ts` accepting `AIProvider` + `ProgressReporter` via constructor
2. **Wire**: Instantiate in `src/index.ts`
3. **Test**: `tests/agents/new-agent.test.ts` with mock AIProvider

### Dependency Injection Pattern
```typescript
// ✅ Constructor injection — no global state
export class ReadmeAgent {
  constructor(
    private readonly ai: AIProvider,
    private readonly progress: ProgressReporter,
  ) {}

  async execute(inputs: ActionInputs): Promise<string> {
    // Use this.ai.generate(), this.progress.update()
  }
}
```

### AI Provider Interface
```typescript
interface AIProvider {
  generate(prompt: string): Promise<string>;
}

// Factory selects implementation based on workflow input
const provider = createAIProvider(inputs.aiProvider);
```

---

## Design & Architecture Principles

### Actions Runtime Integration
```typescript
// ✅ Inputs via @actions/core
import * as core from '@actions/core';
const apiKey = core.getInput('api-key', { required: true });

// ✅ Outputs via core.setOutput
core.setOutput('readme-path', filePath);

// ✅ Errors via core.setFailed
core.setFailed('Action failed: ' + error.message);
```

### Bundle Everything — No Runtime Install
```typescript
// esbuild bundles ALL dependencies into dist/index.js
// Users reference: uses: owner/repo@v1
// action.yml points to: runs.main: dist/index.js
```

### Error Hierarchy
```typescript
class ActionError extends Error { /* base */ }
class AIProviderError extends ActionError { /* AI failures */ }
class GitOperationError extends ActionError { /* git CLI failures */ }
class InputValidationError extends ActionError { /* bad inputs */ }
// Each carries contextual data for debugging
```

---

## Error Handling

### Fail Gracefully in CI
```typescript
// ✅ Always call core.setFailed — never throw unhandled
try {
  await run();
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : String(error));
}
```

### Progress Reporting
```typescript
// Report progress via GitHub issue/PR comments
// ProgressReporter renders Markdown tables/checklists
progress.update('Analyzing files...', 3, 10); // step 3 of 10
```

---

## Code Quality

### Naming Conventions
| Artifact | Convention | Example |
|----------|-----------|---------|
| Agent | `name-agent.ts` | `readme-agent.ts` |
| Service | `name.ts` | `github.ts`, `git.ts` |
| AI provider | `name.ts` | `gemini.ts` |
| Interface | PascalCase | `AIProvider`, `ActionInputs` |
| Error | PascalCase + Error | `AIProviderError` |

### TypeScript Strict Mode
- `strict: true` — no `any`
- All interfaces in `core/types.ts`
- `type` imports preferred

---

## Testing Strategy

| Level | What | Where | Tool |
|-------|------|-------|------|
| Unit | Agents, services, utils | `tests/` | Vitest |
| Integration | Full workflow (mock AI) | `tests/` | Vitest |

### Global Mock Setup
```typescript
// tests/setup.ts — @actions/core globally mocked
vi.mock('@actions/core', () => ({
  getInput: vi.fn(),
  setOutput: vi.fn(),
  setFailed: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
}));
```

### Agent Tests — Mock AI Provider
```typescript
const mockAI: AIProvider = {
  generate: vi.fn().mockResolvedValue('# Generated README\nContent here'),
};
const agent = new ReadmeAgent(mockAI, mockProgress);
const result = await agent.execute(testInputs);
expect(result).toContain('# Generated README');
```

---

## Security & Performance

### Security
- API keys via `core.getInput` with `{ required: true }` — never hardcoded
- Secrets masked in logs automatically by Actions runtime
- Input validation in `action.ts` before any processing
- Git operations scoped to repository checkout

### Performance
- Single bundled file — no `npm install` at runtime
- esbuild minification for smaller `dist/index.js`
- Parallel file analysis when possible

---

## Commands

| Action | Command |
|--------|---------|
| Build | `npm run build` |
| Dev (watch) | `npm run dev` |
| Test | `npm test` |
| Test coverage | `npm run test:coverage` |
| Type check | `npm run typecheck` |
| Lint | `npm run lint` |
| Format check | `npm run format:check` |

---

## Prohibitions — NEVER Do These

1. **NEVER** use global state — constructor injection always
2. **NEVER** throw unhandled errors — always `core.setFailed()`
3. **NEVER** hardcode API keys — `core.getInput()` with secrets
4. **NEVER** skip bundling — `dist/index.js` must be self-contained
5. **NEVER** import concrete AI providers in agents — use `AIProvider` interface
6. **NEVER** use `console.log` — `core.info()`, `core.warning()`, `core.error()`
7. **NEVER** use `any` type — strict TypeScript
8. **NEVER** skip input validation in `action.ts`
9. **NEVER** add runtime dependencies that aren't bundled
10. **NEVER** modify files outside the repository checkout
