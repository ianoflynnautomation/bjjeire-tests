#!/usr/bin/env node
// PreToolUse: enforces what each agent may touch, so "read-only" and "only writes its
// report" are not just instructions. It lives in project settings because hooks in agent
// frontmatter did not fire in headless runs; the hook input names the running agent.
//   - WRITE_SCOPE: the agent's Edit / MultiEdit / Write stay under one folder.
//   - READ_ONLY_BASH: the agent's Bash is limited to commands that read. Anything not
//     provably read-only is denied, so a quoted metacharacter can be a false denial.
// Bash writes by the WRITE_SCOPE agents are not covered; their evals check those.
import { readFileSync } from 'node:fs';
import path from 'node:path';

const WRITE_SCOPE = {
  'playwright-test-planner': 'specs/',
  'playwright-exploratory-tester': 'specs/exploration/',
  'playwright-mutation-auditor': 'specs/mutation/',
};
const READ_ONLY_BASH = new Set(['playwright-test-reviewer']);

const UNSAFE = /[;&>`\n]|\$\(|--output|--fix\b|--update-snapshots/;
const READ_ONLY = [
  /^git (status|diff|log|show|ls-files|rev-parse|merge-base|blame)\b/,
  /^npm run (lint|typecheck)$/,
  /^npx tsc --noEmit\b/,
  /^npx eslint\b/,
  /^(PLAYWRIGHT_HTML_OPEN=never )?npx playwright test\b.*--list\b/,
  /^(head|tail|wc|sort|uniq|cut|grep|rg|ls|cat)\b/,
];

const deny = reason => {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: `${reason} (blocked by .claude/hooks/agent-scope.mjs)`,
      },
    }),
  );
  process.exit(0);
};

const input = JSON.parse(readFileSync(0, 'utf8'));
const agent = input.agent_type;
const toolInput = input.tool_input ?? {};

if (input.tool_name === 'Bash') {
  if (!READ_ONLY_BASH.has(agent) || typeof toolInput.command !== 'string') process.exit(0);
  const stages = toolInput.command.split('|').map(stage => stage.trim());
  const allowed = !UNSAFE.test(toolInput.command) && stages.every(stage => READ_ONLY.some(re => re.test(stage)));
  if (!allowed) deny(`${agent} is read-only and this command is not on its allowlist. Use a single read command.`);
  process.exit(0);
}

const scope = WRITE_SCOPE[agent];
if (!scope || typeof toolInput.file_path !== 'string') process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();
const rel = path.relative(root, path.resolve(root, toolInput.file_path)).split(path.sep).join('/');
if (!rel.startsWith(scope)) deny(`${agent} may only write under ${scope}, not ${rel}.`);
