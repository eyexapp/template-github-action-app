---
name: version-control
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
  - git
  - commit
  - build
  - esbuild
  - release
---

# Version Control — GitHub Action

## Commits

- `feat(review): add file-level review comments`
- `fix(adapter): handle Gemini API rate limits`
- `build: rebuild dist/index.js`

## Build (CRITICAL)

```bash
# dist/index.js MUST be committed — GitHub Actions runs it directly
npx esbuild src/index.ts --bundle --platform=node --target=node20 --outfile=dist/index.js

# Always rebuild before committing
npm run build && git add dist/
```

## Package Scripts

```json
{
  "scripts": {
    "build": "esbuild src/index.ts --bundle --platform=node --target=node20 --outfile=dist/index.js",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "lint": "biome check src/",
    "all": "npm run lint && npm run typecheck && npm run test && npm run build"
  }
}
```

## .gitignore

```
node_modules/
# Do NOT ignore dist/ — it must be committed
!dist/
```

## Release Workflow

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags: ['v*']
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run all
      - name: Check dist is up to date
        run: |
          git diff --exit-code dist/ || (echo "dist/ is out of date" && exit 1)
```

## Testing the Action Locally

```bash
# Use act (https://github.com/nektos/act)
act pull_request -s GITHUB_TOKEN=fake -s AI_API_KEY=fake
```

## Versioning

```bash
# Tag releases
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0

# Users reference via tag
# uses: owner/repo@v1
```
