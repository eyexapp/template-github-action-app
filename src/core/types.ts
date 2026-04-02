/**
 * AI provider abstraction — implement this interface to add new providers.
 * Default implementation: GeminiProvider (src/services/ai/gemini.ts)
 */
export interface AIProvider {
  readonly name: string;
  generateText(prompt: string): Promise<string>;
}

/** Validated action inputs from GitHub Actions runtime. */
export interface ActionInputs {
  githubToken: string;
  aiApiKey: string;
  aiProvider: string;
}

/** Action outputs set after successful execution. */
export interface ActionOutputs {
  pullRequestUrl: string;
  readmePath: string;
}

/** Summary of a single file produced by the AI provider. */
export interface FileSummary {
  filename: string;
  summary: string;
}

/** Progress message severity levels. */
export type ProgressLevel = 'info' | 'warning' | 'error';

/** A single progress line item displayed in the issue comment. */
export interface ProgressLineItem {
  level: ProgressLevel;
  message: string;
}

/** GitHub context needed by services. */
export interface RepoContext {
  owner: string;
  repo: string;
  issueNumber: number;
}
