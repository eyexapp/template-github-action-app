import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { AIProvider, FileSummary } from '../core/types.js';
import { ActionError } from '../core/errors.js';
import { collectSubfolders, collectFiles, filterTextFiles } from '../utils/files.js';
import {
  buildFolderIdentificationPrompt,
  buildFileSummaryPrompt,
  buildReadmePrompt,
} from '../utils/prompts.js';
import type { ProgressReporter } from '../utils/progress.js';

const MAX_TEXT_FILES = 30;
const MAX_SUBFOLDERS = 30;

/**
 * AI-powered agent that generates README files for project directories.
 *
 * Depends on an injected AIProvider — swap Gemini for any other provider
 * without changing agent logic.
 */
export class ReadmeAgent {
  constructor(
    private readonly ai: AIProvider,
    private readonly progress: ProgressReporter,
  ) {}

  /**
   * Use AI to identify which subfolder the user is referring to
   * based on their issue title/body text.
   */
  async identifyTargetFolder(rootFolder: string, issueText: string): Promise<string> {
    const subfolders = await collectSubfolders(rootFolder);

    if (subfolders.length > MAX_SUBFOLDERS) {
      throw new ActionError(
        `Too many subfolders (${subfolders.length}). Maximum supported: ${MAX_SUBFOLDERS}`,
      );
    }

    const normalize = (p: string) => (p.startsWith('./') ? p : `./${p}`);
    const relativeFolders = subfolders.map((f) => normalize(path.relative(rootFolder, f)));

    const raw = await this.ai.generateText(
      buildFolderIdentificationPrompt(relativeFolders, issueText),
    );

    const chosen = normalize(raw.trim().replace(/^["']|["']$/g, ''));

    if (!relativeFolders.includes(chosen)) {
      throw new ActionError(`Could not identify target folder: "${chosen}"`);
    }

    return path.resolve(rootFolder, chosen);
  }

  /**
   * Generate a README.md for the given folder by:
   * 1. Collecting text files
   * 2. Summarizing each file via AI
   * 3. Generating a final README from summaries
   */
  async generateReadme(folder: string): Promise<string> {
    const readmePath = path.resolve(folder, 'README.md');

    // Collect files
    this.progress.info('Collecting files to summarize');
    const allFiles = await collectFiles(folder);

    if (allFiles.includes(readmePath)) {
      throw new ActionError('This directory already has a README.md file');
    }

    const textFiles = await filterTextFiles(allFiles);

    if (textFiles.length > MAX_TEXT_FILES) {
      throw new ActionError(
        `Too many text files (${textFiles.length}). Maximum supported: ${MAX_TEXT_FILES}`,
      );
    }

    // Summarize each file
    const summaries: FileSummary[] = [];

    for (const [index, file] of textFiles.entries()) {
      const relativePath = path.relative(folder, file);
      const content = await fs.readFile(file, 'utf-8');

      this.progress.info(`Summarizing file ${index + 1}/${textFiles.length}: ${relativePath}`);

      try {
        const summary = await this.ai.generateText(buildFileSummaryPrompt(relativePath, content));
        summaries.push({ filename: relativePath, summary });
      } catch {
        this.progress.warning(`Could not summarize: ${relativePath}`);
      }
    }

    // Generate README from summaries
    this.progress.info('Generating README from summaries');
    const readmeContent = await this.ai.generateText(
      buildReadmePrompt(path.basename(folder), summaries),
    );

    await fs.writeFile(readmePath, readmeContent.trim(), 'utf-8');
    this.progress.info('README generated!');

    return readmePath;
  }
}
