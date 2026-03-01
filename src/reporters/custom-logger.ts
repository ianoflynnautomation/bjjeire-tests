import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';

class CustomLogger implements Reporter {
  private startTime = Date.now();

  onBegin(_config: FullConfig, suite: Suite): void {
    console.log(`\n[CustomLogger] Starting ${suite.allTests().length} test(s)\n`);
    this.startTime = Date.now();
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const status = result.status.toUpperCase().padEnd(6);
    const duration = `${result.duration}ms`.padStart(7);
    const title = test.titlePath().slice(1).join(' › ');
    const errorSnippet = result.error?.message?.split('\n')[0] ?? '';

    console.log(`  [${status}] ${duration}  ${title}${errorSnippet ? `\n           ↳ ${errorSnippet}` : ''}`);
  }

  onEnd(result: FullResult): void {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    console.log(`\n[CustomLogger] Done in ${elapsed}s — overall status: ${result.status}\n`);
  }
}

export default CustomLogger;
