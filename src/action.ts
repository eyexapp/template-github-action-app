import * as core from '@actions/core';
import type { ActionInputs, ActionOutputs } from './core/types.js';
import { InputValidationError } from './core/errors.js';

/** Read and validate required action inputs from the GitHub Actions runtime. */
export function getActionInputs(): ActionInputs {
  const githubToken = core.getInput('github-token', { required: true });
  const aiApiKey = core.getInput('ai-api-key', { required: true });
  const aiProvider = core.getInput('ai-provider') || 'gemini';

  if (!githubToken) {
    throw new InputValidationError('github-token input is required');
  }
  if (!aiApiKey) {
    throw new InputValidationError('ai-api-key input is required');
  }

  return { githubToken, aiApiKey, aiProvider };
}

/** Set action outputs for downstream workflow steps. */
export function setActionOutputs(outputs: ActionOutputs): void {
  core.setOutput('pull-request-url', outputs.pullRequestUrl);
  core.setOutput('readme-path', outputs.readmePath);
}
