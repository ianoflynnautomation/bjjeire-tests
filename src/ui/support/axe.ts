import { AxeBuilder } from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

const WCAG_2_1_A_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

type AxeResults = Awaited<ReturnType<AxeBuilder['analyze']>>;
type Violation = AxeResults['violations'][number];
type ViolatingNode = Violation['nodes'][number];

function diagnose(node: ViolatingNode): Record<string, unknown> {
  const checks = [...node.any, ...node.all];
  // axe types `data` as `any`; keep it opaque and let the diff render it.
  const data: unknown = checks.find(check => check.data)?.data;
  return {
    target: node.target.join(' '),
    why: checks.map(check => check.message).join('; '),
    ...(data === undefined || data === null ? {} : { data }),
  };
}

/** Scans the page for WCAG 2.1 A/AA violations; a failure diff lists each offending node and why. */
export async function expectNoWcagViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_2_1_A_AA).analyze();

  expect(
    results.violations.map(violation => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.map(diagnose),
    })),
  ).toEqual([]);
}
