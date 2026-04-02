---
name: code-quality
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
  - code quality
  - naming
  - typescript
  - actions sdk
  - inputs
---

# Code Quality — GitHub Action

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Action input | kebab-case | `github-token`, `ai-provider` |
| Action output | kebab-case | `review-comment` |
| TypeScript class | PascalCase | `GeminiAdapter` |
| Function | camelCase | `parseDiff()` |
| Constant | UPPER_SNAKE | `MAX_DIFF_SIZE` |
| File | kebab-case | `diff-parser.ts` |
| Environment variable | UPPER_SNAKE | `GITHUB_TOKEN` |

## Input Handling

```typescript
import * as core from '@actions/core';

// Required inputs — fail fast if missing
const token = core.getInput('github-token', { required: true });
const provider = core.getInput('ai-provider', { required: true });

// Optional inputs with defaults
const model = core.getInput('model') || 'gemini-2.0-flash';
const maxFiles = parseInt(core.getInput('max-files') || '10', 10);

// Boolean inputs
const dryRun = core.getBooleanInput('dry-run');
```

## Logging

```typescript
import * as core from '@actions/core';

core.info('Processing pull request...');
core.warning('Diff too large, truncating');
core.error('Failed to call AI provider');
core.debug('Raw diff content: ...');  // Only shown with ACTIONS_STEP_DEBUG

// Grouping
core.startGroup('Reviewing files');
for (const file of files) {
  core.info(`  ${file.filename}`);
}
core.endGroup();
```

## Error Handling

```typescript
export async function run(): Promise<void> {
  try {
    // ... main logic
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
      if (error.stack) core.debug(error.stack);
    } else {
      core.setFailed('An unexpected error occurred');
    }
  }
}
```

## Output Setting

```typescript
// Set outputs for subsequent steps
core.setOutput('review', reviewComment);
core.setOutput('files-reviewed', filesReviewed.toString());

// Export variable for other steps
core.exportVariable('REVIEW_STATUS', 'completed');
```

## Secret Masking

```typescript
// Mask sensitive values so they don't appear in logs
const apiKey = core.getInput('ai-api-key', { required: true });
core.setSecret(apiKey);
```

## TypeScript Config

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"]
}
```
