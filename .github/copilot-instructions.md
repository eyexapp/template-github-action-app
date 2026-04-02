# Architecture — GitHub Action Template

## Overview

This is a **GitHub Action** (Node.js 20 / TypeScript) that uses AI to generate README files.
When an issue is labeled `AutoReadme`, the action analyses the referenced directory, summarizes
each file via AI, and opens a pull request with the generated README.

## Directory Structure

```
src/
├── index.ts              # Entry point — orchestrates the entire workflow
├── action.ts             # Input validation & output setting (Actions runtime)
├── core/
│   ├── types.ts          # Shared interfaces (AIProvider, ActionInputs, etc.)
│   └── errors.ts         # Error hierarchy (ActionError → specialized errors)
├── services/
│   ├── ai/
│   │   ├── provider.ts   # Re-exports AIProvider interface
│   │   ├── gemini.ts     # Google Gemini implementation
│   │   └── factory.ts    # createAIProvider() factory function
│   ├── github.ts         # Octokit wrapper (comments, issues, PRs)
│   └── git.ts            # Git CLI wrapper via @actions/exec
├── agents/
│   └── readme-agent.ts   # Core business logic — file analysis + README generation
└── utils/
    ├── progress.ts       # Progress tracking + Markdown rendering
    ├── files.ts          # File system utilities (collect, filter)
    └── prompts.ts        # AI prompt templates
```

## Key Patterns

### AI Provider Adapter

The `AIProvider` interface (`src/core/types.ts`) decouples business logic from any specific
AI vendor. To add a new provider:

1. Create `src/services/ai/<name>.ts` implementing `AIProvider`
2. Register it in `src/services/ai/factory.ts`
3. Users pass `ai-provider: <name>` in their workflow

### Dependency Injection

`ReadmeAgent` accepts `AIProvider` and `ProgressReporter` through its constructor — no global
state, easy to test with mocks.

### Error Hierarchy

All custom errors extend `ActionError`. Service-specific errors (`AIProviderError`,
`GitOperationError`, `InputValidationError`) carry contextual data for debugging.

## Development Commands

```bash
npm run build         # Bundle with esbuild → dist/index.js
npm run dev           # Build in watch mode
npm run lint          # ESLint check
npm run format:check  # Prettier check
npm run typecheck     # tsc --noEmit
npm test              # Vitest
npm run test:coverage # Vitest with coverage
```

## Testing

Tests live in `tests/` and use Vitest. `@actions/core` is globally mocked in `tests/setup.ts`.
Agent tests use a mock `AIProvider` — no real AI calls needed.

## Adding a New Agent

1. Create `src/agents/<name>-agent.ts` with a class accepting `AIProvider` + `ProgressReporter`
2. Wire it in `src/index.ts`
3. Add tests in `tests/agents/<name>-agent.test.ts`
