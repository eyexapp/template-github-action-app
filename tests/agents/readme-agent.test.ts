import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import type { AIProvider } from '../../src/core/types.js';
import { ActionError } from '../../src/core/errors.js';
import { ProgressReporter } from '../../src/utils/progress.js';
import { ReadmeAgent } from '../../src/agents/readme-agent.js';

function createMockAI(responses: Record<string, string> | string): AIProvider {
  return {
    name: 'mock',
    generateText: vi.fn(async (prompt: string) => {
      if (typeof responses === 'string') return responses;
      for (const [key, value] of Object.entries(responses)) {
        if (prompt.includes(key)) return value;
      }
      return 'mock response';
    }),
  };
}

describe('ReadmeAgent', () => {
  let tmpDir: string;
  let progress: ProgressReporter;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-test-'));
    progress = new ProgressReporter();
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe('identifyTargetFolder', () => {
    it('returns the folder path the AI selects', async () => {
      await fs.mkdir(path.join(tmpDir, 'server'), { recursive: true });
      await fs.mkdir(path.join(tmpDir, 'client'), { recursive: true });

      const ai = createMockAI('./server');
      const agent = new ReadmeAgent(ai, progress);

      const result = await agent.identifyTargetFolder(tmpDir, 'Please document the server');
      expect(result).toBe(path.resolve(tmpDir, './server'));
    });

    it('throws when AI returns an unknown folder', async () => {
      await fs.mkdir(path.join(tmpDir, 'src'), { recursive: true });

      const ai = createMockAI('./nonexistent');
      const agent = new ReadmeAgent(ai, progress);

      await expect(agent.identifyTargetFolder(tmpDir, 'some issue')).rejects.toThrow(
        'Could not identify target folder',
      );
    });
  });

  describe('generateReadme', () => {
    it('generates a README.md from file summaries', async () => {
      const folder = path.join(tmpDir, 'project');
      await fs.mkdir(folder, { recursive: true });
      await fs.writeFile(path.join(folder, 'main.ts'), 'console.log("hi")');

      const ai = createMockAI({
        Summarize: 'Entry point that logs a greeting',
        'Generate a README': '# Project\n\nA simple project.',
      });
      const agent = new ReadmeAgent(ai, progress);

      const result = await agent.generateReadme(folder);
      expect(result).toBe(path.join(folder, 'README.md'));

      const content = await fs.readFile(result, 'utf-8');
      expect(content).toContain('# Project');
    });

    it('throws if README.md already exists', async () => {
      const folder = path.join(tmpDir, 'existing');
      await fs.mkdir(folder, { recursive: true });
      await fs.writeFile(path.join(folder, 'README.md'), '# Existing');
      await fs.writeFile(path.join(folder, 'code.ts'), 'export default 42');

      const ai = createMockAI('mock');
      const agent = new ReadmeAgent(ai, progress);

      await expect(agent.generateReadme(folder)).rejects.toThrow(ActionError);
    });
  });
});
