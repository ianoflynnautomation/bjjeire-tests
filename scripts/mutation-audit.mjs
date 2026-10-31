#!/usr/bin/env node
// Mutation audit: do a feature's UI specs notice when the data they show is wrong?
//
//   npm run mutation:audit -- --feature events [--project chromium-desktop] [--only <regex>] [--spec <file>]
//
// 1. Baseline: run the spec once with PW_MUTANT=observe. Every test must pass, and the
//    run records which list resources it reads and which item fields they carry.
// 2. One run per mutant (structural operators per resource, rotate + mangle per field),
//    with PW_MUTANT=<resource>:<operator>[:<field>] (see src/ui/mocks/mutation.mock.ts).
// 3. Killed = at least one test failed. Survived = all passed although the mutant
//    changed a response. No-op = the mutant changed nothing (equivalent, or unread).
//
// Writes playwright/.cache/mutation/<feature>-<stamp>.{json,md} (gitignored) and prints
// the table. Local and docker targets only: it reruns the spec dozens of times.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

const STRUCTURAL = ['drop-first', 'drop-last', 'duplicate-first', 'reverse', 'empty', 'total-plus-one'];
const FIELD = ['rotate', 'mangle'];
const ALLOWED_ENVS = new Set(['local', 'docker']);

const { values: args } = parseArgs({
  options: {
    feature: { type: 'string' },
    spec: { type: 'string' },
    project: { type: 'string', default: 'chromium-desktop' },
    only: { type: 'string' },
  },
});
if (!args.feature) {
  console.error('usage: npm run mutation:audit -- --feature <name> [--project p] [--only regex] [--spec file]');
  process.exit(1);
}
const appEnv = process.env.APP_ENV ?? readDotEnv('APP_ENV') ?? 'local';
if (!ALLOWED_ENVS.has(appEnv)) {
  console.error(`mutation audit runs against local or docker only (APP_ENV=${appEnv})`);
  process.exit(1);
}

const spec = args.spec ?? `tests/features/${args.feature}/${args.feature}.ui.acceptance.spec.ts`;
const outDir = path.join('playwright', '.cache', 'mutation');
mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

function readDotEnv(key) {
  try {
    const line = readFileSync('.env', 'utf8')
      .split('\n')
      .find(l => l.startsWith(`${key}=`));
    return line?.slice(key.length + 1).trim();
  } catch {
    return undefined;
  }
}

function run(mutant) {
  const report = path.join(outDir, 'last-run.json');
  spawnSync(
    'npx',
    [
      'playwright',
      'test',
      '-c',
      'playwright.ui.config.ts',
      spec,
      `--project=${args.project}`,
      '--reporter=json',
      '--retries=0',
      '--max-failures=0',
    ],
    {
      env: { ...process.env, PW_MUTANT: mutant, PLAYWRIGHT_JSON_OUTPUT_NAME: report, PLAYWRIGHT_HTML_OPEN: 'never' },
      stdio: ['ignore', 'ignore', 'pipe'],
      encoding: 'utf8',
    },
  );
  const json = JSON.parse(readFileSync(report, 'utf8'));
  const tests = [];
  const walk = suite => {
    for (const s of suite.specs ?? []) {
      for (const t of s.tests ?? []) {
        const annotations = [...(t.annotations ?? []), ...(t.results ?? []).flatMap(r => r.annotations ?? [])];
        const mutation = annotations.find(a => a.type === 'mutation');
        tests.push({
          title: s.title,
          status: t.status,
          report: mutation ? JSON.parse(mutation.description) : { applied: 0, observed: {} },
        });
      }
    }
    for (const child of suite.suites ?? []) walk(child);
  };
  for (const suite of json.suites ?? []) walk(suite);
  return tests;
}

console.log(`baseline: ${spec} on ${args.project} (APP_ENV=${appEnv})`);
const baseline = run('observe');
const broken = baseline.filter(t => t.status !== 'expected' && t.status !== 'skipped');
if (baseline.length === 0 || broken.length > 0) {
  console.error(`baseline must be green; failing: ${broken.map(t => t.title).join(' | ') || 'no tests ran'}`);
  process.exit(1);
}

const observed = {};
for (const t of baseline) {
  for (const [resource, fields] of Object.entries(t.report.observed)) {
    observed[resource] = [...new Set([...(observed[resource] ?? []), ...fields])].sort();
  }
}
const only = args.only ? new RegExp(args.only) : undefined;
const mutants = Object.entries(observed)
  .flatMap(([resource, fields]) => [
    ...STRUCTURAL.map(op => `${resource}:${op}`),
    ...fields.flatMap(field => FIELD.map(op => `${resource}:${op}:${field}`)),
  ])
  .filter(m => !only || only.test(m));
console.log(
  `${baseline.length} tests · resources: ${Object.keys(observed).join(', ') || 'none'} · ${mutants.length} mutants`,
);

const results = [];
for (const [i, mutant] of mutants.entries()) {
  const tests = run(mutant);
  const applied = tests.reduce((n, t) => n + t.report.applied, 0);
  const killers = tests.filter(t => t.status === 'unexpected').map(t => t.title);
  const verdict = killers.length > 0 ? 'killed' : applied === 0 ? 'no-op' : 'survived';
  results.push({ mutant, verdict, applied, killers });
  console.log(
    `[${i + 1}/${mutants.length}] ${verdict.padEnd(8)} ${mutant}${killers.length ? `  (${killers.length} failed)` : ''}`,
  );
}

const count = v => results.filter(r => r.verdict === v).length;
const scored = count('killed') + count('survived');
const score = scored === 0 ? 'n/a' : `${Math.round((100 * count('killed')) / scored)}%`;
const summary = { feature: args.feature, spec, project: args.project, appEnv, stamp, score, observed, results };

const md = [
  `# Mutation audit: ${args.feature} (${stamp})`,
  '',
  `Spec \`${spec}\` · project \`${args.project}\` · APP_ENV \`${appEnv}\` · ${baseline.length} tests`,
  '',
  `**Score ${score}**: ${count('killed')} killed · ${count('survived')} survived · ${count('no-op')} no-op`,
  '',
  '| Verdict | Mutant | Responses changed | Killed by |',
  '| --- | --- | --- | --- |',
  ...['survived', 'killed', 'no-op'].flatMap(v =>
    results
      .filter(r => r.verdict === v)
      .map(r => `| ${v} | \`${r.mutant}\` | ${r.applied} | ${r.killers.join('<br>') || '—'} |`),
  ),
  '',
].join('\n');

const base = path.join(outDir, `${args.feature}-${stamp}`);
writeFileSync(`${base}.json`, `${JSON.stringify(summary, null, 2)}\n`);
writeFileSync(`${base}.md`, md);
console.log(`\nscore ${score} · ${count('survived')} survived · report ${base}.md`);
