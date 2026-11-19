#!/usr/bin/env node
// PreToolUse guard for file edits across all agents and harnesses:
//   1. Blocks edits to generated, baseline, auth, env, or report artifacts.
//   2. Blocks adding flake/shortcut patterns or Playwright slice anti-patterns.
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';

const PROTECTED = [
  { re: /^src\/api\/generated\//, why: 'generated from OpenAPI; run `npm run gen:api-schemas`' },
  { re: /\/__(screenshots|aria)__\//, why: 'snapshot baseline; regenerate with /update-snapshots' },
  { re: /^\.github\/workflows\/.*\.lock\.yml$/, why: 'compiled workflow; edit the .md source and run `gh aw compile`' },
  { re: /^playwright\/\.auth\//, why: 'auth state cache; delete to force fresh sign-in, never write' },
  { re: /^\.env(?!.*\.example$)/, why: 'local env/secrets; update manually' },
  { re: /^(test-results|playwright-report|blob-report)\//, why: 'test output artifact, not source' },
];

const CODE_FILE = /^(tests|src)\/.*\.(ts|mts|js|mjs)$/;

const FORBIDDEN = [
  { label: '@quarantine', re: /@quarantine/g, why: 'quarantine is a human decision; recommend it to the user' },
  { label: '.fixme(', re: /\.fixme\s*\(/g, why: 'fix the test or file an app issue instead of parking it' },
  { label: '.skip(', re: /\.skip\s*\(/g, why: 'skipping is a human decision; recommend it to the user' },
  { label: '.only(', re: /\.only\s*\(/g, why: 'remove focused test markers before finishing' },
  {
    label: 'waitForTimeout(',
    re: /waitForTimeout\s*\(/g,
    why: 'wait on a web-first assertion or UI state, not a fixed delay',
  },
  { label: 'networkidle', re: /networkidle/g, why: 'wait on a specific route/element instead of networkidle' },
  { label: 'force: true', re: /force:\s*true/g, why: 'avoid force: true; fix actionability/waiting instead' },
  {
    label: 'large timeout (>= 30s)',
    re: /\btimeout\s*:\s*(30000|[4-9]\d{4}|\d{6,})\b/g,
    why: 'fix slow selectors or web-first waits instead of inflating timeouts',
  },
];

const deny = reason => {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: `${reason} (blocked by .claude/hooks/guard-edit.mjs)`,
      },
    }),
  );
  process.exit(0);
};

const countMatches = (text, re) => {
  const flags = re.flags.includes('g') ? re.flags : `${re.flags}g`;
  return (text.match(new RegExp(re.source, flags)) ?? []).length;
};

function computeNextContent(currentText, toolName, toolInput) {
  if (toolName === 'Write' || toolName === 'write') {
    return String(toolInput.content ?? toolInput.contents ?? '');
  }
  const edits = toolName === 'MultiEdit' ? (toolInput.edits ?? []) : [toolInput];
  let next = currentText;
  for (const edit of edits) {
    const oldStr = edit?.old_string;
    const newStr = edit?.new_string;
    if (typeof oldStr === 'string' && typeof newStr === 'string') {
      next = next.includes(oldStr) ? next.replace(oldStr, newStr) : `${next}\n${newStr}`;
    } else if (typeof newStr === 'string') {
      next = `${next}\n${newStr}`;
    }
  }
  return next;
}

let input;
try {
  input = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}

const toolName = input.tool_name ?? input.toolName ?? '';
const toolInput = input.tool_input ?? input.toolInput ?? {};
const rawPath = toolInput.file_path ?? toolInput.path ?? toolInput.notebook_path;
if (typeof rawPath !== 'string') process.exit(0);

const root = realpathSync(process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd());
const absPath = path.resolve(root, rawPath);
const parentDir = path.dirname(absPath);
const realParent = existsSync(parentDir) ? realpathSync(parentDir) : parentDir;
const realPath = path.join(realParent, path.basename(absPath));
const rel = path.relative(root, realPath).split(path.sep).join('/');

if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) process.exit(0);

const protectedMatch = PROTECTED.find(({ re }) => re.test(rel));
if (protectedMatch) {
  deny(`Do not edit ${rel}: ${protectedMatch.why}.`);
}

if (!CODE_FILE.test(rel)) process.exit(0);

if (input.toolInputTruncated === true) {
  deny(`Edit to ${rel} was truncated before inspection; split into smaller changes.`);
}

const beforeText = existsSync(realPath) ? readFileSync(realPath, 'utf8') : '';
const afterText = computeNextContent(beforeText, toolName, toolInput);

const added = FORBIDDEN.find(({ re }) => countMatches(afterText, re) > countMatches(beforeText, re));
if (added) {
  deny(`Adding \`${added.label}\` to ${rel}: ${added.why}.`);
}

// Disallow bare page.goto() outside snapshot specs (named *.snapshot.acceptance.spec.ts) and
// the navigation helpers in src/ui/support/ that implement gotoRoute/gotoAppShell.
const gotoAllowed = /\.snapshot\.(acceptance\.)?spec\.[cm]?[jt]s$/.test(rel) || rel.startsWith('src/ui/support/');
if (!gotoAllowed && countMatches(afterText, /\bpage\.goto\s*\(/g) > countMatches(beforeText, /\bpage\.goto\s*\(/g)) {
  deny(`Avoid bare \`page.goto(\` in ${rel}; use \`gotoRoute\` or \`gotoAppShell\` from @ui/support.`);
}

// Enforce feature-slice isolation. A slice is tests/features/<f>/, src/ui/pages/<f>/ and
// src/api/features/<f>/; it must not import another slice, by relative path or by alias.
// Shared folders (common, sections, support, _template) are not slices.
const SHARED_SLICES = new Set(['common', 'sections', 'support', '_template']);
const sliceOf = relPath =>
  relPath.match(/^(?:tests\/features|src\/ui\/pages|src\/api\/features)\/([^/]+)\//)?.[1] ?? null;
const currentSlice = sliceOf(rel);
if (currentSlice && !SHARED_SLICES.has(currentSlice)) {
  const ALIASES = { '@ui/': 'src/ui/', '@api/': 'src/api/', '@shared/': 'src/shared/' };
  const importedSlices = text => {
    const slices = [];
    for (const [, spec] of text.matchAll(/(?:from\s+|import\s*\(\s*|require\s*\(\s*)['"]([^'"]+)['"]/g)) {
      let target = null;
      if (spec.startsWith('.')) {
        target = path.posix.normalize(path.posix.join(path.posix.dirname(rel), spec));
      } else {
        const alias = Object.keys(ALIASES).find(a => spec.startsWith(a));
        if (alias) target = ALIASES[alias] + spec.slice(alias.length);
      }
      const slice = target ? sliceOf(`${target}/`) : null;
      if (slice && slice !== currentSlice && !SHARED_SLICES.has(slice)) slices.push(slice);
    }
    return slices;
  };
  const before = importedSlices(beforeText);
  const added = importedSlices(afterText).find(s => before.filter(b => b === s).length === 0);
  if (added) {
    deny(`Feature slice \`${currentSlice}\` must not import the \`${added}\` slice.`);
  }
}
