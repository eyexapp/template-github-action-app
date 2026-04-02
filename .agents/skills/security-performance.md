---
name: security-performance
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
  - security
  - performance
  - secrets
  - permissions
  - bundle
---

# Security & Performance — GitHub Action

## Security

### Secrets Handling

```typescript
// Always mask secrets
const apiKey = core.getInput('ai-api-key', { required: true });
core.setSecret(apiKey);

// Never log sensitive data
core.debug('Processing with provider: ' + provider); // ✅ OK
core.debug('API Key: ' + apiKey); // ❌ NEVER
```

### Minimal Permissions in action.yml

```yaml
# Users should use minimal permissions
# Document required permissions
permissions:
  contents: read
  pull-requests: write
  issues: write
```

### Input Validation

```typescript
const VALID_PROVIDERS = ['gemini', 'openai'] as const;

function validateProvider(input: string): typeof VALID_PROVIDERS[number] {
  if (!VALID_PROVIDERS.includes(input as any)) {
    throw new Error(`Invalid provider: ${input}. Must be one of: ${VALID_PROVIDERS.join(', ')}`);
  }
  return input as typeof VALID_PROVIDERS[number];
}

const maxFiles = parseInt(core.getInput('max-files') || '10', 10);
if (isNaN(maxFiles) || maxFiles < 1 || maxFiles > 100) {
  throw new Error('max-files must be between 1 and 100');
}
```

### Token Scope

```typescript
// Use minimum required GitHub token scope
// GITHUB_TOKEN has limited scope by default — prefer it over PATs
const octokit = github.getOctokit(token);

// Only request needed data
const { data: files } = await octokit.rest.pulls.listFiles({
  ...context.repo,
  pull_number: prNumber,
  per_page: maxFiles,
});
```

## Performance

### Diff Size Limits

```typescript
const MAX_DIFF_CHARS = 100_000; // ~100KB

function truncateDiff(diff: string): string {
  if (diff.length <= MAX_DIFF_CHARS) return diff;
  core.warning(`Diff truncated from ${diff.length} to ${MAX_DIFF_CHARS} chars`);
  return diff.slice(0, MAX_DIFF_CHARS) + '\n... (truncated)';
}
```

### Parallel File Processing

```typescript
// Process multiple files in parallel
const reviews = await Promise.all(
  files.map(async (file) => {
    const review = await adapter.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Review ${file.filename}:\n${file.patch}` },
    ]);
    return { filename: file.filename, review };
  })
);
```

### Bundle Size

```bash
# esbuild produces small bundles — single file, no node_modules at runtime
npx esbuild src/index.ts --bundle --platform=node --target=node20 --outfile=dist/index.js --minify
# Verify size
ls -lh dist/index.js
```

### Caching in CI

```yaml
# Users of the action can cache
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```
