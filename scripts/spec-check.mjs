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
 * Placeholders: a `${expr}` in a test title and a `<word>` in a spec title are both
 * read as one placeholder, so `for ${label} "${value}"` matches `for <param> "<value>"`.
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

function readSpec(file) {
  const md = fs.readFileSync(file, 'utf8');
  const sliceLine = md.match(/^\*\*Slice\*\*:(.*)$/m);
  const slice = sliceLine?.[1].match(/`(tests\/[^`]+)`/)?.[1] ?? null;
  const section = md.match(/^## Scenarios[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m)?.[1] ?? '';
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
  return { slice, titles };
}

function readTests(files) {
  const titles = [];
  const dynamic = [];
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(/\btest\(\s*(['"`])([\s\S]+?)\1\s*,/g)) titles.push(m[2].replace(/\s+/g, ' '));
    for (const m of src.matchAll(/\btest\(\s*([A-Za-z_$][\w$.]*)\s*,/g)) dynamic.push(`${rel(file)}: test(${m[1]}, …)`);
  }
  return { titles, dynamic };
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
  const { slice, titles: specTitles } = readSpec(specFile);
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

    const { titles: testTitles, dynamic } = readTests(files);
    for (const d of dynamic) problems.push(`title is a variable, so it cannot be checked: ${d}`);

    const specSet = new Map(specTitles.map(t => [normalise(t), t]));
    const testSet = new Map(testTitles.map(t => [normalise(t), t]));
    const seen = new Set();
    for (const t of specTitles) {
      const key = normalise(t);
      if (seen.has(key)) problems.push(`listed twice in the spec: "${t}"`);
      seen.add(key);
    }
    for (const [key, title] of testSet) if (!specSet.has(key)) problems.push(`test has no spec title: "${title}"`);
    for (const [key, title] of specSet) if (!testSet.has(key)) problems.push(`spec title has no test: "${title}"`);
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
  console.log(
    `\nspec:check: ${failures} problem${failures === 1 ? '' : 's'}. The numbered titles in specs/features/*.md must match the test titles; see docs/spec-guide.md.`,
  );
  process.exit(1);
}
console.log('\nspec:check: specs and tests agree.');
