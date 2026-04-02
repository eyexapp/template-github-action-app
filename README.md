# GitHub Action Template — AI-Powered README Generator

A GitHub Action that automatically generates `README.md` files for project directories using AI.
Tag an issue with `AutoReadme` and the action opens a pull request with a generated README.

## Features

- **AI-powered** — uses Google Gemini (pluggable via adapter pattern)
- **Automatic PR** — creates a branch, commits the README, and opens a pull request
- **Progress tracking** — updates the issue comment in real-time as it works
- **Typed & tested** — strict TypeScript, Vitest test suite, ESLint + Prettier

## Quick Start

### 1. Add the workflow

Create `.github/workflows/auto-readme.yml`:

```yaml
name: Auto README

on:
  issues:
    types: [labeled]

jobs:
  generate:
    runs-on: ubuntu-latest
    if: github.event.label.name == 'AutoReadme'
    permissions:
      contents: write
      issues: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: <your-org>/github-action-template@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          ai-api-key: ${{ secrets.GEMINI_API_KEY }}
```

### 2. Create an issue

Open an issue describing which directory needs a README, then add the `AutoReadme` label.

### 3. Get a PR

The action will comment on the issue with progress updates and open a pull request.

## Inputs

| Name           | Required | Default  | Description                          |
| -------------- | -------- | -------- | ------------------------------------ |
| `github-token` | Yes      | —        | GitHub token for API access          |
| `ai-api-key`   | Yes      | —        | API key for the AI provider          |
| `ai-provider`  | No       | `gemini` | AI provider (`gemini` or custom)     |

## Outputs

| Name               | Description                       |
| ------------------ | --------------------------------- |
| `pull-request-url` | URL of the created pull request   |
| `readme-path`      | Path to the generated README file |

## Architecture

```
src/
├── index.ts           # Orchestrator entry point
├── action.ts          # Input/output helpers
├── core/              # Types & error hierarchy
├── services/          # AI, GitHub, Git service wrappers
├── agents/            # Business logic (ReadmeAgent)
└── utils/             # Files, progress, prompt templates
```

See [.github/copilot-instructions.md](.github/copilot-instructions.md) for detailed architecture docs.

## Development

```bash
npm install            # Install dependencies
npm run dev            # Build in watch mode
npm test               # Run tests
npm run test:coverage  # Tests with coverage
npm run lint           # ESLint
npm run format:check   # Prettier check
npm run typecheck      # TypeScript check
npm run build          # Production build → dist/index.js
```

## Adding an AI Provider

1. Implement the `AIProvider` interface in `src/services/ai/<name>.ts`
2. Register in `src/services/ai/factory.ts`
3. Users pass `ai-provider: <name>` in their workflow

## License

[Apache-2.0](LICENSE)
