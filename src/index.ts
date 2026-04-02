import * as core from '@actions/core';
import * as github from '@actions/github';
import * as path from 'node:path';
import { getActionInputs, setActionOutputs } from './action.js';
import { createAIProvider } from './services/ai/factory.js';
import { GitHubService } from './services/github.js';
import { GitService } from './services/git.js';
import { ReadmeAgent } from './agents/readme-agent.js';
import { ProgressReporter } from './utils/progress.js';

const COMMENT_PREAMBLE = `
👋 Hey there, since you tagged this issue with the \`AutoReadme\` label,
let's generate a \`README.md\` for the directory you're referring to.

This may take a few minutes — I'll update this comment as I make progress.

---
`.trimStart();

async function run(): Promise<void> {
  try {
    // ── Inputs & Services ──────────────────────────────────────────
    const inputs = getActionInputs();
    const octokit = github.getOctokit(inputs.githubToken);
    const rootFolder = process.cwd();

    const repoContext = {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issueNumber: github.context.issue.number,
    };

    const githubService = new GitHubService(octokit, repoContext);
    const gitService = new GitService();
    const aiProvider = createAIProvider(inputs.aiProvider, inputs.aiApiKey);
    const progress = new ProgressReporter();

    progress.info('Getting started...');

    const getCommentBody = () => COMMENT_PREAMBLE + '\n' + progress.toMarkdown();
    let commentId = 0;

    const updateComment = async () => {
      if (commentId) {
        await githubService.updateComment(commentId, getCommentBody());
      }
    };

    progress.onUpdate(() => void updateComment());

    // ── Create tracking comment ────────────────────────────────────
    await core.group('Creating issue comment', async () => {
      commentId = await githubService.createComment(getCommentBody());
    });

    // ── Identify target folder ─────────────────────────────────────
    let targetFolder = '';

    await core.group('Identifying target folder', async () => {
      const agent = new ReadmeAgent(aiProvider, progress);
      const issue = await githubService.getIssue();
      targetFolder = await agent.identifyTargetFolder(rootFolder, `${issue.title} ${issue.body}`);
      progress.info(`Target folder: ${path.relative(rootFolder, targetFolder)}`);
    });

    // ── Generate README ────────────────────────────────────────────
    let readmePath = '';

    await core.group('Generating README', async () => {
      const agent = new ReadmeAgent(aiProvider, progress);
      readmePath = await agent.generateReadme(targetFolder);
    });

    // ── Create PR ──────────────────────────────────────────────────
    await core.group('Creating pull request', async () => {
      const branchName = `issue${repoContext.issueNumber}-readme`;
      const relativeFolder = path.relative(rootFolder, targetFolder);

      progress.info(`Creating branch \`${branchName}\` and pull request...`);

      await gitService.configureUser('GitHub Action', 'action@github.com');
      await gitService.createBranch(branchName);
      await gitService.commitAndPush(
        [readmePath],
        `Create README for ${relativeFolder}`,
        branchName,
      );

      const prUrl = await githubService.createPullRequest(
        branchName,
        `Create README for ${relativeFolder}`,
        `As requested in issue #${repoContext.issueNumber}`,
      );

      progress.info(`[Pull request](${prUrl}) created!`);
      setActionOutputs({ pullRequestUrl: prUrl, readmePath });
    });

    progress.status = 'done';
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}

run();
