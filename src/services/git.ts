import * as exec from '@actions/exec';
import { GitOperationError } from '../core/errors.js';

/**
 * Wraps git CLI operations via @actions/exec.
 */
export class GitService {
  /** Configure git user identity. */
  async configureUser(name: string, email: string): Promise<void> {
    await this.run(['config', '--global', 'user.name', name]);
    await this.run(['config', '--global', 'user.email', email]);
  }

  /** Create and checkout a new branch. */
  async createBranch(name: string): Promise<void> {
    await this.run(['checkout', '-b', name]);
  }

  /** Stage files, commit, and push to the remote branch. */
  async commitAndPush(files: string[], message: string, branch: string): Promise<void> {
    await this.run(['add', ...files]);
    await this.run(['commit', '-m', message]);

    // Delete remote branch if it already exists (ignore errors)
    try {
      await this.run(['push', 'origin', `:${branch}`]);
    } catch {
      // Branch doesn't exist remotely — that's fine
    }

    await this.run(['push', 'origin', branch]);
  }

  private async run(args: string[]): Promise<void> {
    const exitCode = await exec.exec('git', args);
    if (exitCode !== 0) {
      throw new GitOperationError(`git ${args.join(' ')} exited with code ${exitCode}`);
    }
  }
}
