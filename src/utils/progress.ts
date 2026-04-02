import type { ProgressLevel, ProgressLineItem } from '../core/types.js';

const LEVEL_PREFIX: Record<ProgressLevel, string> = {
  error: '- 💥 ERROR:',
  warning: '- ⚠️ WARNING:',
  info: '- ',
};

/**
 * Tracks and renders agent progress as Markdown for issue comments.
 * Logs to console simultaneously for GitHub Actions log output.
 */
export class ProgressReporter {
  private _status: 'working' | 'done' = 'working';
  private readonly lineItems: ProgressLineItem[] = [];
  private readonly listeners: Array<() => void> = [];

  get status(): 'working' | 'done' {
    return this._status;
  }

  set status(value: 'working' | 'done') {
    this._status = value;
    console.info(`Status: ${value}`);
    this.notify();
  }

  info(message: string): void {
    this.lineItems.push({ level: 'info', message });
    console.info(message);
    this.notify();
  }

  warning(message: string): void {
    this.lineItems.push({ level: 'warning', message });
    console.warn(message);
    this.notify();
  }

  error(message: string): void {
    this.lineItems.push({ level: 'error', message });
    console.error(message);
    this.notify();
  }

  /** Register a callback invoked on every progress change. */
  onUpdate(callback: () => void): void {
    this.listeners.push(callback);
  }

  /** Render all progress items as a Markdown list. */
  toMarkdown(): string {
    return this.lineItems.map((item) => `${LEVEL_PREFIX[item.level]} ${item.message}`).join('\n');
  }

  private notify(): void {
    for (const fn of this.listeners) {
      fn();
    }
  }
}
