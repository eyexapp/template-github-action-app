import type { FileSummary } from '../core/types.js';

/** Prompt the AI to identify which subfolder the user is referring to. */
export function buildFolderIdentificationPrompt(folders: string[], issueText: string): string {
  return `
The user would like you to create a README file for one of the folders in their project.
Which of the following folders is the user most likely referring to?

${folders.join('\n')}

User prompt:
${issueText}

The user is referring to the folder: ./`.trim();
}

/** Prompt the AI to summarize a single source file. */
export function buildFileSummaryPrompt(filename: string, content: string): string {
  return `
Provide a summary of no more than 2 sentences of the following code file:

Filename: ${filename}
File contents:
${content}`.trim();
}

/** Prompt the AI to generate a README from file summaries. */
export function buildReadmePrompt(folderName: string, summaries: FileSummary[]): string {
  const summaryBlock = summaries
    .map(({ filename, summary }) => `File ${filename}: ${summary}`)
    .join('\n\n');

  return `
Generate a README.md markdown file that summarizes the following folder containing code:

Folder name: ${folderName}

${summaryBlock}

Contents of README.md:`.trim();
}
