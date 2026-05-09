import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';

type FlakyEntry = {
  readonly title: string;
  readonly file: string;
  readonly line: number;
  readonly attempts: number;
  readonly finalStatus: TestResult['status'];
};

type FlakeReport = {
  readonly timestamp: string;
  readonly totals: {
    readonly tests: number;
    readonly passed: number;
    readonly failed: number;
    readonly flaky: number;
    readonly retried: number;
  };
  readonly flaky: FlakyEntry[];
};

class FlakinessReporter implements Reporter {
  private readonly entries = new Map<string, FlakyEntry>();
  private readonly outcomes = new Map<string, TestResult['status']>();

  onTestEnd(test: TestCase, result: TestResult): void {
    // onTestEnd fires once per attempt. Last write wins, so the map ends up
    // with the final outcome for each test id.
    this.outcomes.set(test.id, result.status);

    if (test.results.length > 1) {
      this.entries.set(test.id, {
        title: test.titlePath().slice(1).join(' > '),
        file: test.location.file,
        line: test.location.line,
        attempts: test.results.length,
        finalStatus: result.status,
      });
    }
  }

  onEnd(_result: FullResult): void {
    const finalOutcomes = [...this.outcomes.values()];
    const flakyEntries = [...this.entries.values()];

    const report: FlakeReport = {
      timestamp: new Date().toISOString(),
      totals: {
        tests: finalOutcomes.length,
        passed: finalOutcomes.filter(s => s === 'passed').length,
        failed: finalOutcomes.filter(s => s === 'failed').length,
        flaky: flakyEntries.filter(e => e.finalStatus === 'passed').length,
        retried: flakyEntries.length,
      },
      flaky: flakyEntries,
    };

    const outputDir = path.resolve('test-results');
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(path.join(outputDir, 'flake-report.json'), JSON.stringify(report, null, 2));
  }
}

export default FlakinessReporter;
