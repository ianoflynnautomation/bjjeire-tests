import { appendFileSync } from 'node:fs';
import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';

// Writes a markdown summary to GITHUB_STEP_SUMMARY when running in GitHub
// Actions. No-op in any other environment.

type Sample = {
  readonly title: string;
  readonly file: string;
  readonly line: number;
  readonly duration: number;
  readonly status: TestResult['status'];
  readonly attempts: number;
  readonly error?: string;
};

const FAIL_LIMIT = 5;
const SLOW_LIMIT = 10;
const ERROR_PREVIEW_LENGTH = 240;

class GithubSummaryReporter implements Reporter {
  private readonly samples = new Map<string, Sample>();
  private startTime = Date.now();

  onBegin(_config: FullConfig, _suite: Suite): void {
    this.startTime = Date.now();
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    // onTestEnd fires once per attempt. The Map deduplicates by id so the
    // last recorded attempt wins, which is the final outcome for that test.
    this.samples.set(test.id, {
      title: test.titlePath().slice(1).join(' > '),
      file: test.location.file,
      line: test.location.line,
      duration: result.duration,
      status: result.status,
      attempts: test.results.length,
      ...(result.error?.message ? { error: result.error.message.split('\n')[0] } : {}),
    });
  }

  onEnd(result: FullResult): void {
    const summaryPath = process.env.GITHUB_STEP_SUMMARY;
    if (!summaryPath) return;

    const all = [...this.samples.values()];
    const elapsedSec = ((Date.now() - this.startTime) / 1000).toFixed(1);

    const failed = all.filter(t => t.status === 'failed').length;
    const flaky = all.filter(t => t.status === 'passed' && t.attempts > 1).length;
    const passed = all.filter(t => t.status === 'passed').length - flaky;
    const skipped = all.filter(t => t.status === 'skipped').length;

    const failures = all.filter(t => t.status === 'failed').slice(0, FAIL_LIMIT);
    const slowest = [...all].sort((a, b) => b.duration - a.duration).slice(0, SLOW_LIMIT);

    const label = result.status === 'passed' ? 'PASS' : result.status === 'failed' ? 'FAIL' : 'WARN';
    const lines: string[] = [];

    lines.push(`## Playwright result: ${label}`);
    lines.push('');
    lines.push('| Total | Passed | Failed | Flaky | Skipped | Duration |');
    lines.push('|------:|-------:|-------:|------:|--------:|---------:|');
    lines.push(`| ${all.length} | ${passed} | ${failed} | ${flaky} | ${skipped} | ${elapsedSec}s |`);
    lines.push('');

    if (failures.length > 0) {
      lines.push(`### Failures (showing ${failures.length} of ${failed})`);
      lines.push('');
      for (const f of failures) {
        lines.push(`- **${f.title}**`);
        lines.push(`  \`${f.file}:${f.line}\``);
        if (f.error) lines.push(`  > ${f.error.replaceAll('\n', ' ').slice(0, ERROR_PREVIEW_LENGTH)}`);
      }
      lines.push('');
    }

    if (slowest.length > 0) {
      lines.push(`### Top ${slowest.length} slowest tests`);
      lines.push('');
      lines.push('| Duration | Test |');
      lines.push('|---------:|------|');
      for (const s of slowest) {
        lines.push(`| ${(s.duration / 1000).toFixed(2)}s | ${s.title} |`);
      }
      lines.push('');
    }

    appendFileSync(summaryPath, lines.join('\n') + '\n');
  }
}

export default GithubSummaryReporter;
