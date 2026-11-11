#!/usr/bin/env node
/**
 * spec:check — the living spec and the tests must agree.
 *
 * For every `specs/features/<name>.md`, the numbered titles under `## Scenarios`
 * must equal the `test(...)` titles in the slice the spec names on its `**Slice**:`
 * line (the first backticked `tests/...` path, a directory or a file). Every
 * `*.spec.ts` under `tests/` must be claimed by exactly one spec, and must start with
 * `// spec: specs/features/<name>.md` (Playwright's test-agent convention) naming it.
 *
 * Every `####` block under `## Planned` must have `Covers:` (`AC-…` or `none`) and
 * `Oracle:`. An expected-result bullet that is a visitor action fails. When a block
 * and a test share a title, the block's steps then expected results must equal that
 * test's `test.step` titles. Numbered scenarios with no block are grandfathered.
 *
 * Placeholders: a `${expr}` in a test and a `<word>` in a spec are both read as one
 * placeholder, so `for ${label} "${value}"` matches `for <param> "<value>"`.
 * Trailing `(\`@smoke\`)` tags and `· AC-…` coverage notes on a spec line are ignored.
 *
 *   npm run spec:check                 # every spec
 *   npm run spec:check -- --feature gyms
 *
 * Exit 1 on any drift. Extra positional arguments (lint-staged passes file names) are ignored.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SPECS_DIR = path.join(ROOT, 'specs', 'features');
const TESTS_DIR = path.join(ROOT, 'tests');
const UNCLAIMED_OK = ['tests/agents/', 'tests/features/_template/'];
const COVERS = /^(?:AC-[A-Z]+-\d+)(?:\s*,\s*AC-[A-Z]+-\d+)*$|^none\b/;
const ACTION =
  /^(?:And|Then|But) the (?:visitor|client) (?:goes|searches|filters|chooses|switches|retries|reloads|clears|opens|follows|reads)\b/;

const args = process.argv.slice(2);
const featureFlagIndex = args.indexOf('--feature');
const onlyFeature = featureFlagIndex >= 0 ? args[featureFlagIndex + 1] : null;

const normalise = title =>
  title
    .replace(/`/g, '')
    .replace(/\$\{[^}]*\}/g, '<x>')
    .replace(/<[^>]+>/g, '<x>')
    .replace(/["']<x>["']/g, '<x>')
    .replace(/\s+/g, ' ')
    .trim();

const walkSpecFiles = dir =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkSpecFiles(full);
    return entry.name.endsWith('.spec.ts') ? [full] : [];
  });

const rel = file => path.relative(ROOT, file).split(path.sep).join('/');

function sectionBody(md, heading) {
  const start = md.search(new RegExp(`^## ${heading}\\b.*$`, 'm'));
  if (start === -1) return '';
  const after = md.slice(md.indexOf('\n', start) + 1);
  const next = after.search(/^## /m);
  return next === -1 ? after : after.slice(0, next);
}

function scenarioTitles(md) {
  const section = sectionBody(md, 'Scenarios');
  const titles = [];
  for (const line of section.split('\n')) {
    const m = line.match(/^\d+\.\s+(.+)$/);
    if (!m) continue;
    titles.push(
      m[1]
        .replace(/\s*\(`@[^)]*\)/g, '')
        .replace(/\s*·.*$/, '')
        .trim(),
    );
  }
  return titles;
}

function plannedBlocks(md) {
  const section = sectionBody(md, 'Planned');
  return section
    .split(/^#### /m)
    .slice(1)
    .map(chunk => {
      const breakAt = chunk.indexOf('\n');
      const title = (breakAt === -1 ? chunk : chunk.slice(0, breakAt)).trim();
      const body = breakAt === -1 ? '' : chunk.slice(breakAt + 1);
      const covers = body.match(/^- Covers:\s*(.*)$/m)?.[1]?.trim() ?? null;
      const oracle = body.match(/^- Oracle:\s*(.*)$/m)?.[1]?.trim() ?? null;
      const steps = [...(body.split(/^- Expected results:\s*$/m)[0] ?? '').matchAll(/^\s+\d+\.\s+(.+)$/gm)].map(m =>
        m[1].trim(),
      );
      const expectedSection = body.split(/^- Expected results:\s*$/m)[1]?.split(/^- [A-Za-z]/)[0] ?? '';
      const expected = [...expectedSection.matchAll(/^\s+- (.+)$/gm)].map(m => m[1].trim());
      return { title, covers, oracle, steps, expected };
    });
}

function readSpec(file) {
  const md = fs.readFileSync(file, 'utf8');
  const sliceLine = md.match(/^\*\*Slice\*\*:(.*)$/m);
  const slice = sliceLine?.[1].match(/`(tests\/[^`]+)`/)?.[1] ?? null;
  return { slice, titles: scenarioTitles(md), blocks: plannedBlocks(md) };
}

function readTests(files) {
  const tests = [];
  const dynamic = [];
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    const headers = [...src.matchAll(/\btest\(\s*(['"`])([\s\S]+?)\1/g)];
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      const end = i + 1 < headers.length ? headers[i + 1].index : src.length;
      const body = src.slice(header.index + header[0].length, end);
      const steps = [...body.matchAll(/test\.step\(\s*(['"`])([\s\S]+?)\1/g)].map(m =>
        m[2].replace(/\s+/g, ' ').trim(),
      );
      tests.push({ title: header[2].replace(/\s+/g, ' ').trim(), steps, file: rel(file) });
    }
    for (const m of src.matchAll(/\btest\(\s*([A-Za-z_$][\w$.]*)\s*,/g)) dynamic.push(`${rel(file)}: test(${m[1]}, …)`);
  }
  return { tests, dynamic };
}

function blockProblems(blocks, tests) {
  const problems = [];
  const seen = new Set();
  const byTitle = new Map(tests.map(test => [normalise(test.title), test]));
  for (const block of blocks) {
    const key = normalise(block.title);
    if (seen.has(key)) problems.push(`planned block listed twice: "${block.title}"`);
    seen.add(key);
    if (!block.covers) problems.push(`planned block has no Covers: "${block.title}"`);
    else if (!COVERS.test(block.covers))
      problems.push(`Covers must be AC-… or none: "${block.title}" (${block.covers})`);
    if (!block.oracle) problems.push(`planned block has no Oracle: "${block.title}"`);
    for (const line of block.expected) {
      if (ACTION.test(line))
        problems.push(`expected result is an action, so it belongs in Steps: "${block.title}" — ${line}`);
    }
    const test = byTitle.get(key);
    if (!test) continue;
    const wanted = [...block.steps, ...block.expected];
    const got = test.steps;
    const same =
      wanted.length === got.length && wanted.every((line, index) => normalise(line) === normalise(got[index]));
    if (!same) {
      problems.push(
        `steps differ from ${test.file}: "${block.title}"\n      spec: ${wanted.join(' | ') || '(none)'}\n      test: ${got.join(' | ') || '(none)'}`,
      );
    }
  }
  return problems;
}

const specFiles = fs
  .readdirSync(SPECS_DIR)
  .filter(f => f.endsWith('.md') && (!onlyFeature || f === `${onlyFeature}.md`))
  .map(f => path.join(SPECS_DIR, f));

if (onlyFeature && specFiles.length === 0) {
  console.error(`spec:check: no spec file specs/features/${onlyFeature}.md`);
  process.exit(1);
}

const allTestFiles = walkSpecFiles(TESTS_DIR);
const claimed = new Map();
let failures = 0;

for (const specFile of specFiles) {
  const name = path.basename(specFile, '.md');
  const { slice, titles: specTitles, blocks } = readSpec(specFile);
  const problems = [];

  if (!slice) {
    problems.push('no `**Slice**:` line with a `tests/...` path');
  } else {
    const sliceAbs = path.join(ROOT, slice);
    const files = fs.existsSync(sliceAbs)
      ? fs.statSync(sliceAbs).isDirectory()
        ? allTestFiles.filter(f => rel(f).startsWith(slice.replace(/\/?$/, '/')))
        : [sliceAbs]
      : [];
    if (files.length === 0) problems.push(`slice \`${slice}\` has no *.spec.ts files`);
    for (const f of files) {
      const owner = claimed.get(f);
      if (owner && owner !== name) problems.push(`${rel(f)} is also claimed by specs/features/${owner}.md`);
      claimed.set(f, name);
      const firstLine = fs.readFileSync(f, 'utf8').split('\n', 1)[0];
      const expected = `// spec: specs/features/${name}.md`;
      if (firstLine.trim() !== expected)
        problems.push(`${rel(f)} must start with \`${expected}\` (found: ${firstLine.trim() || 'empty line'})`);
    }

    const { tests, dynamic } = readTests(files);
    for (const d of dynamic) problems.push(`title is a variable, so it cannot be checked: ${d}`);

    const specSet = new Map(specTitles.map(t => [normalise(t), t]));
    const testSet = new Map(tests.map(t => [normalise(t.title), t.title]));
    const seen = new Set();
    for (const t of specTitles) {
      const key = normalise(t);
      if (seen.has(key)) problems.push(`listed twice in the spec: "${t}"`);
      seen.add(key);
    }
    for (const [key, title] of testSet) if (!specSet.has(key)) problems.push(`test has no spec title: "${title}"`);
    for (const [key, title] of specSet) if (!testSet.has(key)) problems.push(`spec title has no test: "${title}"`);
    problems.push(...blockProblems(blocks, tests));
  }

  if (problems.length === 0) {
    console.log(`✓ ${name}: ${specTitles.length} scenarios match ${slice}`);
  } else {
    failures += problems.length;
    console.log(`✗ specs/features/${name}.md`);
    for (const p of problems) console.log(`    ${p}`);
  }
}

if (!onlyFeature) {
  const unclaimed = allTestFiles
    .map(rel)
    .filter(f => !claimed.has(path.join(ROOT, f)) && !UNCLAIMED_OK.some(prefix => f.startsWith(prefix)));
  if (unclaimed.length > 0) {
    failures += unclaimed.length;
    console.log('✗ spec files no spec claims (add a `**Slice**:` line to a spec in specs/features/):');
    for (const f of unclaimed) console.log(`    ${f}`);
  }
}

if (failures > 0) {
  console.log(`\nspec:check: ${failures} problem${failures === 1 ? '' : 's'}. See specs/templates/README.md.`);
  process.exit(1);
}
console.log('\nspec:check: specs and tests agree.');
