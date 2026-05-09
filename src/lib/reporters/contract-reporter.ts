import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';

type ContractTestResult = {
  readonly title: string;
  readonly suite: string;
  readonly status: string;
  readonly duration: number;
  readonly error?: string;
};

type ContractReport = {
  readonly timestamp: string;
  readonly duration: number;
  readonly summary: {
    readonly total: number;
    readonly passed: number;
    readonly failed: number;
    readonly skipped: number;
  };
  readonly suites: Record<string, ContractTestResult[]>;
};

class ContractReporter implements Reporter {
  private startTime = Date.now();
  private results: ContractTestResult[] = [];

  onBegin(_config: FullConfig, _suite: Suite): void {
    this.startTime = Date.now();
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const tags = test.tags.map(t => t.replace('@', ''));
    if (!tags.includes('contract')) return;

    const titlePath = test.titlePath().slice(1);
    const suite = titlePath.length > 1 ? titlePath.slice(0, -1).join(' › ') : 'root';
    const title = titlePath[titlePath.length - 1] ?? test.title;

    this.results.push({
      title,
      suite,
      status: result.status,
      duration: result.duration,
      ...(result.error?.message ? { error: result.error.message.split('\n')[0] } : {}),
    });
  }

  onEnd(_result: FullResult): void {
    if (this.results.length === 0) return;

    const duration = Date.now() - this.startTime;
    const suites: Record<string, ContractTestResult[]> = {};

    for (const r of this.results) {
      const existing = suites[r.suite];
      if (existing) {
        existing.push(r);
      } else {
        suites[r.suite] = [r];
      }
    }

    const report: ContractReport = {
      timestamp: new Date().toISOString(),
      duration,
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.status === 'passed').length,
        failed: this.results.filter(r => r.status === 'failed').length,
        skipped: this.results.filter(r => r.status === 'skipped').length,
      },
      suites,
    };

    const outputDir = path.resolve('test-results');
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(path.join(outputDir, 'contract-report.json'), JSON.stringify(report, null, 2));
  }
}

export default ContractReporter;
