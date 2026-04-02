---
name: architecture
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
  - architecture
  - github action
  - actions sdk
  - esbuild
  - adapter
---

# Architecture — GitHub Action (TypeScript + @actions/*)

## Project Structure

```
src/
├── index.ts                    ← Entry point (run)
├── action.ts                   ← Main action logic
├── adapters/                   ← AI Provider Adapters
│   ├── types.ts                ← AIProvider interface
│   ├── gemini-adapter.ts
│   └── openai-adapter.ts
├── services/
│   ├── github.ts               ← GitHub API wrapper (Octokit)
│   ├── review.ts               ← Code review logic
│   └── comment.ts              ← PR comment formatting
├── utils/
│   ├── diff-parser.ts          ← Parse git diffs
│   └── token-counter.ts
└── types/
    └── index.ts
dist/
└── index.js                    ← esbuild bundle (committed!)
action.yml                      ← Action metadata
```

## Entry Point

```typescript
// src/index.ts
import * as core from '@actions/core';
import { run } from './action';

run().catch((error) => {
  core.setFailed(error instanceof Error ? error.message : String(error));
});
```

## Action Logic

```typescript
// src/action.ts
import * as core from '@actions/core';
import * as github from '@actions/github';
import { createAdapter } from './adapters/types';

export async function run(): Promise<void> {
  const token = core.getInput('github-token', { required: true });
  const aiProvider = core.getInput('ai-provider', { required: true });
  const aiApiKey = core.getInput('ai-api-key', { required: true });
  const model = core.getInput('model');

  const octokit = github.getOctokit(token);
  const context = github.context;

  if (!context.payload.pull_request) {
    core.info('Not a PR event, skipping');
    return;
  }

  const adapter = createAdapter(aiProvider, aiApiKey, model);

  // Get PR diff
  const { data: diff } = await octokit.rest.pulls.get({
    ...context.repo,
    pull_number: context.payload.pull_request.number,
    mediaType: { format: 'diff' },
  });

  // Review with AI
  const review = await adapter.chat([
    { role: 'system', content: 'You are a code reviewer...' },
    { role: 'user', content: `Review this diff:\n${diff}` },
  ]);

  // Post comment
  await octokit.rest.issues.createComment({
    ...context.repo,
    issue_number: context.payload.pull_request.number,
    body: review,
  });

  core.setOutput('review', review);
}
```

## action.yml

```yaml
name: 'AI Code Review'
description: 'AI-powered code review for pull requests'
inputs:
  github-token:
    description: 'GitHub token'
    required: true
  ai-provider:
    description: 'AI provider (gemini, openai)'
    required: true
  ai-api-key:
    description: 'AI provider API key'
    required: true
  model:
    description: 'Model name'
    required: false
outputs:
  review:
    description: 'The review comment text'
runs:
  using: 'node20'
  main: 'dist/index.js'
```

## AI Adapter Pattern

```typescript
// adapters/types.ts
export interface AIProvider {
  chat(messages: { role: string; content: string }[]): Promise<string>;
}

export function createAdapter(provider: string, apiKey: string, model?: string): AIProvider {
  switch (provider) {
    case 'gemini': return new GeminiAdapter(apiKey, model);
    case 'openai': return new OpenAIAdapter(apiKey, model);
    default: throw new Error(`Unknown provider: ${provider}`);
  }
}
```

## Rules

- Bundle to single file: `dist/index.js` (committed to repo).
- esbuild with `--platform=node --target=node20 --bundle`.
- Use `@actions/core` for inputs/outputs/logging.
- Use `@actions/github` for Octokit + context.
- Adapter pattern for swappable AI providers.
- All secrets via action inputs (never hardcode).
