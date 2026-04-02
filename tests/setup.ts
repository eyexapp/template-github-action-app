import { vi } from 'vitest';

// Mock @actions/core — tests should never call the real Actions runtime.
vi.mock('@actions/core', () => ({
  getInput: vi.fn(),
  setOutput: vi.fn(),
  setFailed: vi.fn(),
  group: vi.fn((_name: string, fn: () => Promise<void>) => fn()),
  info: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
}));
