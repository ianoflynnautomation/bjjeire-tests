#!/usr/bin/env node
// PreToolUse: enforces per-agent directory and shell scopes for Claude Code and Grok.
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';

const POLICIES = {
  'playwright-test-reviewer': { write: null, shell: 'readonly' },
  'playwright-test-planner': { write: 'specs/features/', shell: 'none' },
  'playwright-exploratory-tester': { write: 'specs/exploration/', shell: 'playwright-cli' },
  'playwright-mutation-auditor': { write: 'specs/mutation/', shell: 'mutation-audit' },
};

const SHELL_TOOLS = new Set(['Bash', 'run_terminal_command', 'Shell']);
const WRITE_TOOLS = new Set([
  'Edit',
  'MultiEdit',
  'Write',
  'Delete',
  'search_replace',
  'write',
  'delete_file',
  'NotebookEdit',
  'StrReplace',
]);

// Checked against the command with quoted strings blanked out, so a quoted search term,
// regex or JS snippet (`--only 'rotate|drop'`, `run-code "r => ..."`) is not mistaken for
// shell syntax. `-o /dev/null` is allowed: it discards output rather than writing a file.
const UNSAFE_SHELL = /[;&><`\n]|\$\(|--fix\b|--write\b|--update-snapshots|--output|--pre\b|\s-o\b/;
// Secrets and auth caches, matching the settings.json Read denies.
const SECRET_PATH = /\.env\.[^\s'"]*\.local\b|playwright\/\.auth\//;
// Leading `VAR=value` assignments (e.g. PW_AGENT_SEED=true PW_MUTANT=x) are stripped before matching.
const ENV_PREFIX = /^(?:[A-Z_][A-Z0-9_]*=\S*\s+)*/;
const READ_COMMANDS = /^(head|tail|wc|sort|cut|grep|rg|ls|cat)\b|^uniq(\s+-\S+)*$/;
const EXPLORE_SEED = /^npx playwright test\b.*\btests\/agents\/explore\.spec\.ts\b.*--debug=cli\b/;
const SHELL_PROFILES = {
  none: [],
  'playwright-cli': [
    /^npx playwright cli\b/,
    EXPLORE_SEED,
    /^curl -s\b(?!.*\s(-X|--request|-d|--data\S*|-F|--form|-T|--upload-file)\b)/,
    /^gh issue (list|view|create|comment)\b/,
    READ_COMMANDS,
  ],
  'mutation-audit': [
    /^npm run mutation:audit\b/,
    /^npx playwright cli\b/,
    EXPLORE_SEED,
    /^npx playwright test\b/,
    READ_COMMANDS,
  ],
  readonly: [
    /^git (status|diff|log|show|ls-files|rev-parse|merge-base|blame)\b/,
    /^npm run (lint|typecheck|spec:check)\b/,
    /^npx (tsc --noEmit|eslint)\b/,
    /^npx playwright test\b.*\s--list\b/,
    READ_COMMANDS,
  ],
};

const blankQuotes = cmd => cmd.replace(/'[^']*'|"(?:\\.|[^"\\])*"/g, '""');

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

let input;
try {
  input = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}

const agent = input.agent_type ?? input.subagentType ?? input.agentType;
const policy = POLICIES[agent];
if (!policy) process.exit(0);

const toolName = input.tool_name ?? input.toolName ?? '';
const toolInput = input.tool_input ?? input.toolInput ?? {};

if (SHELL_TOOLS.has(toolName)) {
  // Join `\`-continued lines, as the agent procedures write long commands that way.
  const cmd = typeof toolInput.command === 'string' ? toolInput.command.replace(/\\\r?\n\s*/g, ' ').trim() : '';
  const allowlist = SHELL_PROFILES[policy.shell] ?? [];
  if (allowlist.length === 0) {
    deny(`${agent} is not permitted to run shell commands.`);
  }
  if (SECRET_PATH.test(cmd)) {
    deny(`${agent} may not read local secrets or auth caches.`);
  }
  const bare = blankQuotes(cmd).replace(/\s-o \/dev\/null\b/g, '');
  // Split on single pipes only; `||` leaves an empty stage, which no allowlist entry matches.
  const stages = bare.split('|').map(s => s.trim().replace(ENV_PREFIX, ''));
  const ok = Boolean(cmd) && !UNSAFE_SHELL.test(bare) && stages.every(s => allowlist.some(re => re.test(s)));
  if (!ok) {
    deny(`${agent} shell command blocked by '${policy.shell}' policy.`);
  }
  process.exit(0);
}

if (WRITE_TOOLS.has(toolName)) {
  if (!policy.write) {
    deny(`${agent} is read-only and may not modify or delete files.`);
  }

  const paths = [
    toolInput.file_path,
    toolInput.path,
    toolInput.notebook_path,
    ...(Array.isArray(toolInput.edits) ? toolInput.edits.map(e => e?.file_path ?? e?.path) : []),
  ].filter(p => typeof p === 'string');

  if (paths.length === 0) {
    deny(`${agent} write blocked: could not resolve target file path.`);
  }

  const root = realpathSync(process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd());
  const requiredPrefix = policy.write.endsWith('/') ? policy.write : `${policy.write}/`;

  for (const rawPath of paths) {
    const absTarget = path.resolve(root, rawPath);
    const parentDir = path.dirname(absTarget);
    const realParent = existsSync(parentDir) ? realpathSync(parentDir) : parentDir;
    const realTarget = path.join(realParent, path.basename(absTarget));
    const rel = path.relative(root, realTarget).split(path.sep).join('/');

    if (!rel.startsWith(requiredPrefix)) {
      deny(`${agent} may only write under ${requiredPrefix}, not ${rel}.`);
    }
  }
}
