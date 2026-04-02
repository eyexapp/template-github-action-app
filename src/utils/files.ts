import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { isText } from 'istextorbinary';

const IGNORE_DIRS = new Set(['.git', 'node_modules', 'dist', '.github']);

/** Recursively collect all subfolder paths under a root. */
export async function collectSubfolders(
  root: string,
  ignore: Set<string> = IGNORE_DIRS,
): Promise<string[]> {
  const folders: string[] = [];

  for (const name of await fs.readdir(root)) {
    if (ignore.has(name)) continue;

    const itemPath = path.resolve(root, name);
    const stat = await fs.stat(itemPath);

    if (stat.isDirectory()) {
      folders.push(itemPath);
      folders.push(...(await collectSubfolders(itemPath, ignore)));
    }
  }

  return folders;
}

/** Recursively collect all file paths under a folder. */
export async function collectFiles(folder: string): Promise<string[]> {
  const files: string[] = [];

  for (const name of await fs.readdir(folder)) {
    const itemPath = path.resolve(folder, name);
    const stat = await fs.stat(itemPath);

    if (stat.isDirectory()) {
      files.push(...(await collectFiles(itemPath)));
    } else if (stat.isFile()) {
      files.push(itemPath);
    }
  }

  return files;
}

/** Filter a list of file paths to include only text (non-binary) files. */
export async function filterTextFiles(files: string[]): Promise<string[]> {
  const textFiles: string[] = [];

  for (const file of files) {
    const bytes = await fs.readFile(file);
    if (isText(file, Buffer.from(bytes))) {
      textFiles.push(file);
    }
  }

  return textFiles;
}
