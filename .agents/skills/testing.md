---
name: testing
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
  - test
  - vitest
  - mock
  - action test
---

# Testing — GitHub Action (Vitest)

## Action Tests

```typescript
// src/__tests__/action.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as core from '@actions/core';
import * as github from '@actions/github';

vi.mock('@actions/core');
vi.mock('@actions/github');

describe('run', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock inputs
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        'github-token': 'fake-token',
        'ai-provider': 'gemini',
        'ai-api-key': 'fake-key',
      };
      return inputs[name] ?? '';
    });

    // Mock PR context
    Object.defineProperty(github, 'context', {
      value: {
        payload: { pull_request: { number: 1 } },
        repo: { owner: 'test-owner', repo: 'test-repo' },
      },
    });
  });

  it('skips when not a PR event', async () => {
    Object.defineProperty(github, 'context', {
      value: { payload: {}, repo: { owner: 'test', repo: 'test' } },
    });

    const { run } = await import('../action');
    await run();

    expect(core.info).toHaveBeenCalledWith(expect.stringContaining('Not a PR'));
  });
});
```

## Adapter Tests

```typescript
// adapters/__tests__/gemini-adapter.test.ts
import { describe, it, expect, vi } from 'vitest';
import { GeminiAdapter } from '../gemini-adapter';

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: () => ({
      generateContent: vi.fn().mockResolvedValue({
        response: { text: () => 'Review looks good' },
      }),
    }),
  })),
}));

describe('GeminiAdapter', () => {
  it('returns review from Gemini', async () => {
    const adapter = new GeminiAdapter('fake-key');
    const result = await adapter.chat([{ role: 'user', content: 'Review this code' }]);
    expect(result).toBe('Review looks good');
  });
});
```

## Diff Parser Tests

```typescript
// utils/__tests__/diff-parser.test.ts
import { describe, it, expect } from 'vitest';
import { parseDiff } from '../diff-parser';

describe('parseDiff', () => {
  it('extracts changed files', () => {
    const diff = `diff --git a/src/index.ts b/src/index.ts
--- a/src/index.ts
+++ b/src/index.ts
@@ -1,3 +1,4 @@
 import { run } from './action';
+import * as core from '@actions/core';
 run();`;

    const result = parseDiff(diff);
    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe('src/index.ts');
  });
});
```

## Running Tests

```bash
npx vitest
npx vitest --coverage
```
