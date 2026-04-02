import type { GitHub } from '@actions/github/lib/utils.js';
import type { RepoContext } from '../core/types.js';

type Octokit = InstanceType<typeof GitHub>;

/**
 * Wraps GitHub API operations (issues, pull requests) via Octokit.
 */
export class GitHubService {
  constructor(
    private readonly octokit: Octokit,
    private readonly context: RepoContext,
  ) {}

  /** Create a comment on the issue and return its ID. */
  async createComment(body: string): Promise<number> {
    const response = await this.octokit.rest.issues.createComment({
      owner: this.context.owner,
      repo: this.context.repo,
      issue_number: this.context.issueNumber,
      body,
    });
    return response.data.id;
  }

  /** Update an existing issue comment. */
  async updateComment(commentId: number, body: string): Promise<void> {
    await this.octokit.rest.issues.updateComment({
      owner: this.context.owner,
      repo: this.context.repo,
      comment_id: commentId,
      body,
    });
  }

  /** Get the issue title and body. */
  async getIssue(): Promise<{ title: string; body: string }> {
    const response = await this.octokit.rest.issues.get({
      owner: this.context.owner,
      repo: this.context.repo,
      issue_number: this.context.issueNumber,
    });
    return {
      title: response.data.title,
      body: response.data.body ?? '',
    };
  }

  /** Create a pull request and return its URL. */
  async createPullRequest(branch: string, title: string, body: string): Promise<string> {
    const response = await this.octokit.rest.pulls.create({
      owner: this.context.owner,
      repo: this.context.repo,
      base: 'main',
      head: branch,
      title,
      body,
    });
    return response.data.html_url;
  }
}
