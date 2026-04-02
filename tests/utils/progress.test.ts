import { describe, it, expect, beforeEach } from 'vitest';
import { ProgressReporter } from '../../src/utils/progress.js';

describe('ProgressReporter', () => {
  let reporter: ProgressReporter;

  beforeEach(() => {
    reporter = new ProgressReporter();
  });

  it('starts with working status', () => {
    expect(reporter.status).toBe('working');
  });

  it('renders info lines as Markdown', () => {
    reporter.info('Hello world');
    reporter.info('Second line');

    const md = reporter.toMarkdown();
    expect(md).toBe('-  Hello world\n-  Second line');
  });

  it('renders warning and error levels with emoji prefixes', () => {
    reporter.warning('Heads up');
    reporter.error('Something broke');

    const md = reporter.toMarkdown();
    expect(md).toContain('⚠️ WARNING:');
    expect(md).toContain('💥 ERROR:');
  });

  it('notifies listeners on info/warning/error/status changes', () => {
    let count = 0;
    reporter.onUpdate(() => count++);

    reporter.info('a');
    reporter.warning('b');
    reporter.error('c');
    reporter.status = 'done';

    expect(count).toBe(4);
  });

  it('returns empty string when no items', () => {
    expect(reporter.toMarkdown()).toBe('');
  });
});
