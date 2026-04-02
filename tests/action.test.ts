import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as core from '@actions/core';
import { getActionInputs, setActionOutputs } from '../src/action.js';
import { InputValidationError } from '../src/core/errors.js';

describe('action helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getActionInputs', () => {
    it('returns valid inputs', () => {
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const map: Record<string, string> = {
          'github-token': 'ghp_test123',
          'ai-api-key': 'key-abc',
          'ai-provider': 'gemini',
        };
        return map[name] ?? '';
      });

      const inputs = getActionInputs();
      expect(inputs).toEqual({
        githubToken: 'ghp_test123',
        aiApiKey: 'key-abc',
        aiProvider: 'gemini',
      });
    });

    it('defaults ai-provider to gemini', () => {
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const map: Record<string, string> = {
          'github-token': 'ghp_test',
          'ai-api-key': 'key-abc',
          'ai-provider': '',
        };
        return map[name] ?? '';
      });

      expect(getActionInputs().aiProvider).toBe('gemini');
    });

    it('throws InputValidationError when github-token is empty', () => {
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const map: Record<string, string> = {
          'github-token': '',
          'ai-api-key': 'key',
        };
        return map[name] ?? '';
      });

      expect(() => getActionInputs()).toThrow(InputValidationError);
    });
  });

  describe('setActionOutputs', () => {
    it('sets outputs via core.setOutput', () => {
      setActionOutputs({ pullRequestUrl: 'https://pr', readmePath: 'docs/README.md' });

      expect(core.setOutput).toHaveBeenCalledWith('pull-request-url', 'https://pr');
      expect(core.setOutput).toHaveBeenCalledWith('readme-path', 'docs/README.md');
    });
  });
});
