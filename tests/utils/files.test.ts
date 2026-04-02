import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { collectSubfolders, collectFiles, filterTextFiles } from '../../src/utils/files.js';

describe('File utilities', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'files-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe('collectSubfolders', () => {
    it('finds nested directories', async () => {
      await fs.mkdir(path.join(tmpDir, 'src', 'utils'), { recursive: true });
      await fs.mkdir(path.join(tmpDir, 'docs'), { recursive: true });

      const folders = await collectSubfolders(tmpDir);
      const relative = folders.map((f) => path.relative(tmpDir, f)).sort();

      expect(relative).toEqual(['docs', 'src', 'src/utils']);
    });

    it('ignores .git and node_modules by default', async () => {
      await fs.mkdir(path.join(tmpDir, '.git'), { recursive: true });
      await fs.mkdir(path.join(tmpDir, 'node_modules'), { recursive: true });
      await fs.mkdir(path.join(tmpDir, 'lib'), { recursive: true });

      const folders = await collectSubfolders(tmpDir);
      const relative = folders.map((f) => path.relative(tmpDir, f));

      expect(relative).toEqual(['lib']);
    });
  });

  describe('collectFiles', () => {
    it('collects files recursively', async () => {
      const nested = path.join(tmpDir, 'a', 'b');
      await fs.mkdir(nested, { recursive: true });
      await fs.writeFile(path.join(tmpDir, 'root.txt'), 'root');
      await fs.writeFile(path.join(nested, 'deep.txt'), 'deep');

      const files = await collectFiles(tmpDir);
      const relative = files.map((f) => path.relative(tmpDir, f)).sort();

      expect(relative).toEqual(['a/b/deep.txt', 'root.txt']);
    });
  });

  describe('filterTextFiles', () => {
    it('includes text files and excludes binary files', async () => {
      const textFile = path.join(tmpDir, 'readme.md');
      const binaryFile = path.join(tmpDir, 'image.png');

      await fs.writeFile(textFile, '# Hello');
      await fs.writeFile(binaryFile, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]));

      const result = await filterTextFiles([textFile, binaryFile]);
      expect(result).toEqual([textFile]);
    });
  });
});
