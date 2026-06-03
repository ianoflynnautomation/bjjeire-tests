import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';

// Column widths chosen so the longest legal status (`SKIPPED`, `PASSED`)
// and a 9999ms duration both fit without truncation.
const STATUS_COLUMN_WIDTH = 6;
const DURATION_COLUMN_WIDTH = 7;
const ELAPSED_DECIMAL_PLACES = 1;

class CustomLogger implements Reporter {
  private startTime = Date.now();

  onBegin(_config: FullConfig, suite: Suite): void {
    console.log(`\n[CustomLogger] Starting ${suite.allTests().length} test(s)\n`);
    this.startTime = Date.now();
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const status = result.status.toUpperCase().padEnd(STATUS_COLUMN_WIDTH);
    const duration = `${result.duration}ms`.padStart(DURATION_COLUMN_WIDTH);
    const title = test.titlePath().slice(1).join(' › ');
    const errorSnippet = result.error?.message?.split('\n')[0] ?? '';
    console.log(`  [${status}] ${duration}  ${title}${errorSnippet ? `\n           ↳ ${errorSnippet}` : ''}`);
  }

  onEnd(result: FullResult): void {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(ELAPSED_DECIMAL_PLACES);
    console.log(`\n[CustomLogger] Done in ${elapsed}s — overall status: ${result.status}\n`);
  }
}

export default CustomLogger;
