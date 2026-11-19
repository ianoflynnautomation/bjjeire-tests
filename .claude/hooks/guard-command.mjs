#!/usr/bin/env node
// PreToolUse guard for shell commands and file reads across all agents:
//   - Blocks git commit / git push.
//   - Blocks obvious production target runs.
//   - Blocks reading secrets/auth caches: .env.<anything> except .env.example (the
//     per-environment files such as .env.dev.local hold credentials) and playwright/.auth/.
//     Plain `.env` stays readable: it holds only APP_ENV and target URLs, and agents
//     resolve BASE_URL from it (`grep '^BASE_URL=' .env`).
import { readFileSync } from 'node:fs';
import path from 'node:path';

const SHELL_TOOLS = new Set(['Bash', 'run_terminal_command', 'Shell']);
const READ_TOOLS = new Set(['Read', 'read_file', 'view_file']);

const BLOCKED_COMMANDS = [
  {
    // Only `git commit`/`git push` in command position (start, or after ; & | ( or a newline,
    // optionally behind VAR=value or `git -C dir`), so text that merely mentions them, such
    // as a heredoc or a grep pattern, is not blocked.
    re: /(?:^|[;&|(\n])\s*(?:[A-Z_][A-Z0-9_]*=\S*\s+)*git(?:\s+-[cC]\s+\S+)*\s+(commit|push)\b/,
    why: 'git commit/push is manual; leave changes in the working tree',
  },
  {
    re: /\b(prod|production)\b.*(--project\b|PW_ENV\b|ENV\b|BASE_URL\b|test:)/i,
    why: 'never run tests against production targets',
  },
  {
    // `.env.<x>` only as a path segment (start, space, quote, `/` or `=` before it), so code
    // searches such as `grep -rn process.env src` are not mistaken for secret reads.
    re: /\b(cat|head|tail|less|more|bat|sed|awk|grep|rg|cp|mv|rm|source)\b[^\n]*((?:^|[\s'"/=])\.env\.(?!example\b)[\w.-]+|playwright\/\.auth\/)/,
    why: 'reading or touching local env secrets or auth state caches is blocked',
  },
];

const SECRET_READ_RE = /(^|[\\/])(\.env\.(?!example$)[^\\/]+$|playwright\/\.auth\/)/;

const deny = reason => {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: `${reason} (blocked by .claude/hooks/guard-command.mjs)`,
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

const toolName = input.tool_name ?? input.toolName ?? '';
const toolInput = input.tool_input ?? input.toolInput ?? {};

if (SHELL_TOOLS.has(toolName) && typeof toolInput.command === 'string') {
  const hit = BLOCKED_COMMANDS.find(({ re }) => re.test(toolInput.command));
  if (hit) deny(hit.why);
  process.exit(0);
}

if (READ_TOOLS.has(toolName)) {
  const rawPath = toolInput.file_path ?? toolInput.path;
  if (typeof rawPath === 'string') {
    const normalized = path.normalize(rawPath).split(path.sep).join('/');
    if (SECRET_READ_RE.test(normalized)) {
      deny(`Reading ${rawPath} is blocked to protect local secrets and auth caches.`);
    }
  }
}
