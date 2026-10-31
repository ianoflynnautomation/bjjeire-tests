#!/usr/bin/env node
// PreToolUse guard for Edit / MultiEdit / Write. Turns the AGENTS.md guardrails that
// lint cannot see into hard denials, for the main session and every subagent:
//   1. Generated or recorded files are never hand-edited.
//   2. Test code never gains a quarantine tag, a fixme, or a known flake pattern.
// Pattern checks compare counts before and after, so editing a file that already
// contains a pattern (e.g. QUARANTINE_TAG's definition) is still allowed.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const PROTECTED = [
  { re: /^src\/api\/generated\//, why: 'generated from the OpenAPI contract; run `npm run gen:api-schemas`' },
  { re: /\/__screenshots__\//, why: 'screenshot baselines; regenerate with /update-snapshots on request' },
  { re: /\/__aria__\//, why: 'aria baselines; regenerate with /update-snapshots on request' },
  { re: /^\.github\/workflows\/.*\.lock\.yml$/, why: 'compiled; edit the .md source and run `gh aw compile`' },
  { re: /^playwright\/\.auth\//, why: 'auth caches; delete them to force a fresh sign-in, never write them' },
  { re: /^(test-results|playwright-report|blob-report)\//, why: 'run output, not source' },
];

const CODE_FILE = /^(tests|src)\/.*\.(ts|mts|js|mjs)$/;
const FORBIDDEN = [
  { label: '@quarantine', re: /@quarantine/g, why: 'quarantine is a human decision; recommend it to the user instead' },
  { label: '.fixme(', re: /\.fixme\s*\(/g, why: 'never park a test; fix it or report the app bug' },
  { label: '.only(', re: /\.only\s*\(/g, why: 'focused tests must not be left in the suite' },
  { label: 'waitForTimeout(', re: /waitForTimeout\s*\(/g, why: 'wait on a user-visible condition, not a time' },
  { label: 'networkidle', re: /networkidle/g, why: 'wait on a route anchor or web-first assertion instead' },
  { label: 'force: true', re: /force:\s*true/g, why: 'a forced action hides an actionability bug; fix the wait' },
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

const count = (text, re) => (text.match(re) ?? []).length;

const input = JSON.parse(readFileSync(0, 'utf8'));
const toolInput = input.tool_input ?? {};
const filePath = toolInput.file_path;
if (typeof filePath !== 'string') process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();
const rel = path.relative(root, path.resolve(root, filePath)).split(path.sep).join('/');
if (rel.startsWith('..')) process.exit(0);

const guarded = PROTECTED.find(({ re }) => re.test(rel));
if (guarded) deny(`Do not edit ${rel}: ${guarded.why}.`);

if (!CODE_FILE.test(rel)) process.exit(0);

let before = '';
let after = '';
if (input.tool_name === 'Write') {
  before = existsSync(filePath) ? readFileSync(filePath, 'utf8') : '';
  after = toolInput.content ?? '';
} else {
  const edits = input.tool_name === 'MultiEdit' ? (toolInput.edits ?? []) : [toolInput];
  before = edits.map(e => e.old_string ?? '').join('\n');
  after = edits.map(e => e.new_string ?? '').join('\n');
}

const added = FORBIDDEN.find(({ re }) => count(after, re) > count(before, re));
if (added) deny(`Adding \`${added.label}\` to ${rel}: ${added.why}.`);
