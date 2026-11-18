#!/usr/bin/env node
// PreToolUse: enforces what each agent may touch, so "read-only" and "only writes its
// report" are not just instructions. It lives in project settings because hooks in agent
// frontmatter did not fire in headless runs; the hook input names the running agent.
//   - WRITE_SCOPE: the agent's edits stay under one folder. Claude names the tools
//     Edit / MultiEdit / Write. Grok names them search_replace / write.
//   - READ_ONLY_BASH: the reviewer's shell is limited to commands that read.
//     Claude names it Bash. Grok names it run_terminal_command.
//   - DENY_WRITES: the reviewer may not edit, on either harness.
// Shell writes by the WRITE_SCOPE agents are not covered; review catches those.
// Grok sends subagentType. Claude sends agent_type. Both are read.
import { readFileSync } from 'node:fs';
import path from 'node:path';

const WRITE_SCOPE = {
  'playwright-test-planner': 'specs/',
  'playwright-exploratory-tester': 'specs/exploration/',
  'playwright-mutation-auditor': 'specs/mutation/',
};
const READ_ONLY_BASH = new Set(['playwright-test-reviewer']);
const DENY_WRITES = new Set(['playwright-test-reviewer']);
const SHELL_TOOLS = new Set(['Bash', 'run_terminal_command', 'Shell']);
const WRITE_TOOLS = new Set(['Edit', 'MultiEdit', 'Write', 'search_replace', 'write', 'NotebookEdit', 'StrReplace']);

const UNSAFE = /[;&>`\n]|\$\(|--output|--fix\b|--update-snapshots/;
const READ_ONLY = [
  /^git (status|diff|log|show|ls-files|rev-parse|merge-base|blame)\b/,
  /^npm run (lint|typecheck|spec:check)\b/,
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
// Claude sends agent_type and Bash/Edit/Write. Grok sends subagentType and
// run_terminal_command/search_replace/write. Both names are accepted.
const agent = input.agent_type ?? input.subagentType ?? input.agentType;
const toolName = input.tool_name ?? input.toolName ?? '';
const toolInput = input.tool_input ?? input.toolInput ?? {};
const filePath = toolInput.file_path ?? toolInput.path;

if (SHELL_TOOLS.has(toolName)) {
  if (!READ_ONLY_BASH.has(agent) || typeof toolInput.command !== 'string') process.exit(0);
  const stages = toolInput.command.split('|').map(stage => stage.trim());
  const allowed = !UNSAFE.test(toolInput.command) && stages.every(stage => READ_ONLY.some(re => re.test(stage)));
  if (!allowed) deny(`${agent} is read-only and this command is not on its allowlist. Use a single read command.`);
  process.exit(0);
}

if (!WRITE_TOOLS.has(toolName) || typeof filePath !== 'string') process.exit(0);
if (DENY_WRITES.has(agent)) deny(`${agent} is read-only and may not edit files.`);

const scope = WRITE_SCOPE[agent];
if (!scope) process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();
const rel = path.relative(root, path.resolve(root, filePath)).split(path.sep).join('/');
if (!rel.startsWith(scope)) deny(`${agent} may only write under ${scope}, not ${rel}.`);
