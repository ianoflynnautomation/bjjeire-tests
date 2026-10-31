#!/usr/bin/env node
// Golden-task evals for the agents in .claude/agents/.
//
//   npm run evals:agents -- [--tier fast|slow|all] [--task id,id] [--repeat n] [--model m] [--keep]
//   npm run evals:agents -- --self-test        # free: validates the graders, runs no agent
//   --auth login drops ANTHROPIC_API_KEY for the agent runs so `claude` uses its own login.
//
// Each task (evals/tasks/<id>.json) runs in a throwaway copy of the current working tree
// (uncommitted agents, skills and hooks included), committed as a baseline. The task's
// setup plants a known defect and is committed too, so the diff afterwards is the agent's
// work alone. The named agent runs headless (`claude -p --agent`) with a fixed tool
// allowlist and a budget cap. Deterministic checks grade the result. A run passes when
// every critical check passes. Results land in evals/results/ (gitignored) and are
// compared with the previous run.
//
// Needs the app reachable (local or docker; see AGENTS.md). Each task is billed API usage.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';

const ROOT = process.cwd();
const TASK_DIR = path.join(ROOT, 'evals', 'tasks');
const RESULT_DIR = path.join(ROOT, 'evals', 'results');
const COPY_EXCLUDES = [
  'node_modules',
  '.git',
  'test-results',
  'playwright-report',
  'blob-report',
  'playwright/.cache',
  '.playwright-cli',
  'evals/results',
];
// What any agent in .claude/agents/ may run. Calls outside it are denied and show up
// as permission_denials in the result, so a gap here is visible, not silent.
const ALLOWED_TOOLS = [
  'Read',
  'Edit',
  'Write',
  'Glob',
  'Grep',
  'Bash(npx playwright:*)',
  'Bash(PLAYWRIGHT_HTML_OPEN=never npx playwright:*)',
  'Bash(PW_AGENT_SEED=true:*)',
  'Bash(PW_MUTANT=:*)',
  'Bash(SQUASH_TM_MODE=dry-run npm run squash:sync)',
  'Bash(npm run:*)',
  'Bash(npx eslint:*)',
  'Bash(npx prettier:*)',
  'Bash(git diff:*)',
  'Bash(git show:*)',
  'Bash(git log:*)',
  'Bash(git status:*)',
  'Bash(curl:*)',
  'Bash(ls:*)',
  'Bash(cat:*)',
  'Bash(grep:*)',
  'Bash(find:*)',
  'Bash(head:*)',
  'Bash(tail:*)',
  'Bash(wc:*)',
  'Bash(unzip:*)',
  'Bash(jq:*)',
  'Bash(kill:*)',
  'Bash(pkill -f:*)',
  'Bash(mkdir:*)',
  'mcp__playwright-test',
];

const { values: args } = parseArgs({
  options: {
    tier: { type: 'string', default: 'fast' },
    task: { type: 'string' },
    repeat: { type: 'string', default: '1' },
    model: { type: 'string' },
    keep: { type: 'boolean', default: false },
    'self-test': { type: 'boolean', default: false },
    auth: { type: 'string', default: 'env' },
  },
});

const sh = (cmd, opts = {}) =>
  spawnSync('bash', ['-c', cmd], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts });

const globToRegExp = glob =>
  new RegExp(
    `^${glob
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*\//g, '\u0000')
      .replace(/\*\*/g, '\u0001')
      .replace(/\*/g, '[^/]*')
      .replace(/\u0000/g, '(.*/)?')
      .replace(/\u0001/g, '.*')}$`,
  );
const matchesAny = (file, globs) => globs.some(g => globToRegExp(g).test(file));

function loadTasks() {
  const all = readdirSync(TASK_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(readFileSync(path.join(TASK_DIR, f), 'utf8')));
  if (args.task) {
    const ids = new Set(args.task.split(','));
    const picked = all.filter(t => ids.has(t.id));
    const missing = [...ids].filter(id => !picked.some(t => t.id === id));
    if (missing.length) throw new Error(`unknown task(s): ${missing.join(', ')}`);
    return picked;
  }
  return all.filter(t => args.tier === 'all' || t.tier === args.tier);
}

function appIsUp() {
  const env = readFileSync(path.join(ROOT, '.env'), 'utf8')
    .match(/^BASE_URL=(.*)$/m)?.[1]
    ?.trim();
  const baseUrl = process.env.BASE_URL ?? env;
  if (!baseUrl) return { ok: false, baseUrl: '(unset)' };
  const res = sh(`curl -s -o /dev/null -w '%{http_code}' --max-time 5 '${baseUrl}/'`);
  return { ok: res.stdout.trim() === '200', baseUrl };
}

function makeSandbox(task) {
  const dir = mkdtempSync(path.join(os.tmpdir(), `bjj-eval-${task.id}-`));
  const excludes = COPY_EXCLUDES.map(e => `--exclude='/${e}'`).join(' ');
  const copy = sh(`rsync -a ${excludes} ./ '${dir}/'`, { cwd: ROOT });
  if (copy.status !== 0) throw new Error(`rsync failed: ${copy.stderr}`);
  sh(`ln -s '${path.join(ROOT, 'node_modules')}' node_modules`, { cwd: dir });
  const git = cmd => {
    const r = sh(`git -c user.name=eval -c user.email=eval@localhost ${cmd}`, { cwd: dir });
    if (r.status !== 0) throw new Error(`git ${cmd}: ${r.stderr}`);
  };
  git('init -q');
  writeFileSync(path.join(dir, '.git', 'info', 'exclude'), 'node_modules\n');
  git('add -A');
  git('commit -qm baseline');

  for (const step of task.setup ?? []) {
    if (step.create) {
      mkdirSync(path.dirname(path.join(dir, step.create)), { recursive: true });
      writeFileSync(path.join(dir, step.create), step.content);
    } else if (step.delete) {
      rmSync(path.join(dir, step.delete), { force: true });
    } else {
      const file = path.join(dir, step.file);
      const text = readFileSync(file, 'utf8');
      if (!text.includes(step.find)) throw new Error(`setup: '${step.find.slice(0, 40)}…' not in ${step.file}`);
      writeFileSync(file, text.replace(step.find, step.replace));
    }
  }
  git('add -A');
  git('commit -qm setup --allow-empty');
  return dir;
}

function agentEnv(task) {
  const env = { ...process.env, ...(task.env ?? {}) };
  delete env.CLAUDECODE;
  if (args.auth === 'login') delete env.ANTHROPIC_API_KEY;
  return env;
}

const AUTH_ERROR = /invalid api key|authentication|not logged in|please run \/login|credit balance/i;

function runAgent(task, dir) {
  const cli = [
    '-p',
    task.prompt,
    '--agent',
    task.agent,
    '--output-format',
    'json',
    '--permission-mode',
    'acceptEdits',
    '--allowedTools',
    ...ALLOWED_TOOLS,
    '--max-budget-usd',
    String(task.budgetUsd ?? 3),
    '--no-session-persistence',
    '--setting-sources',
    'project',
    ...(task.mcp ? ['--mcp-config', '.mcp.json', '--strict-mcp-config'] : []),
    ...(args.model ? ['--model', args.model] : []),
  ];
  const env = agentEnv(task);
  const started = Date.now();
  const res = spawnSync('claude', cli, {
    cwd: dir,
    env,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    timeout: (task.timeoutMin ?? 20) * 60_000,
  });
  let out = {};
  try {
    out = JSON.parse(res.stdout);
  } catch {
    out = { result: res.stdout, is_error: true, subtype: res.error ? String(res.error) : 'unparseable output' };
  }
  return {
    output: out.result ?? '',
    error: out.is_error ? String(out.result || out.subtype || 'error').slice(0, 160) : undefined,
    costUsd: out.total_cost_usd ?? 0,
    turns: out.num_turns ?? 0,
    durationS: Math.round((Date.now() - started) / 1000),
    denials: (out.permission_denials ?? []).map(d => `${d.tool_name}: ${JSON.stringify(d.tool_input).slice(0, 120)}`),
  };
}

function changedFiles(dir) {
  const tracked = sh('git diff --name-only HEAD', { cwd: dir }).stdout;
  const untracked = sh('git ls-files --others --exclude-standard', { cwd: dir }).stdout;
  return [...new Set(`${tracked}\n${untracked}`.split('\n').filter(Boolean))].filter(
    f => !f.startsWith('.playwright-cli/') && !f.startsWith('test-results/') && !f.startsWith('playwright/'),
  );
}

function section(markdown, heading) {
  const lines = markdown.split('\n');
  const start = lines.findIndex(l => new RegExp(`^#{1,6}\\s+${heading}\\b`, 'i').test(l));
  if (start < 0) return '';
  const level = lines[start].match(/^#+/)[0].length;
  const end = lines.findIndex((l, i) => i > start && new RegExp(`^#{1,${level}}\\s`).test(l));
  return lines.slice(start + 1, end < 0 ? undefined : end).join('\n');
}

function grade(task, dir, run) {
  const changed = changedFiles(dir);
  const read = f => (existsSync(path.join(dir, f)) ? readFileSync(path.join(dir, f), 'utf8') : '');
  const matching = glob => changed.filter(f => matchesAny(f, [glob]));
  const env = agentEnv(task);

  return task.checks.map(check => {
    const re = check.pattern ? new RegExp(check.pattern, check.flags ?? '') : undefined;
    let pass = false;
    let detail = '';
    switch (check.type) {
      case 'changed_only_within': {
        const outside = changed.filter(f => !matchesAny(f, check.allow));
        pass = outside.length === 0;
        detail = outside.join(', ');
        break;
      }
      case 'unchanged': {
        const touched = changed.filter(f => matchesAny(f, check.paths));
        pass = touched.length === 0;
        detail = touched.join(', ');
        break;
      }
      case 'file_matches':
        pass = re.test(read(check.path));
        break;
      case 'file_not_matches':
        pass = !re.test(read(check.path));
        break;
      case 'new_file_matches': {
        const files = matching(check.glob);
        pass = files.some(f => re.test(read(f)));
        detail = files.join(', ') || 'no matching changed file';
        break;
      }
      case 'section_matches': {
        const files = matching(check.glob);
        pass = files.some(f => re.test(section(read(f), check.heading)));
        detail = files.join(', ') || 'no matching changed file';
        break;
      }
      case 'diff_lacks': {
        const added = sh('git diff HEAD --unified=0', { cwd: dir })
          .stdout.split('\n')
          .filter(l => l.startsWith('+') && !l.startsWith('+++'))
          .join('\n');
        const untracked = sh('git ls-files --others --exclude-standard', { cwd: dir })
          .stdout.split('\n')
          .filter(Boolean)
          .map(read)
          .join('\n');
        const hit = `${added}\n${untracked}`.match(re);
        pass = !hit;
        detail = hit?.[0] ?? '';
        break;
      }
      case 'command': {
        const r = sh(check.run, { cwd: dir, env, timeout: 10 * 60_000 });
        pass = r.status === (check.expectExit ?? 0);
        detail = pass ? '' : `${r.stdout}${r.stderr}`.trim().split('\n').slice(-5).join(' / ');
        break;
      }
      case 'command_output_matches': {
        const r = sh(check.run, { cwd: dir, env, timeout: 2 * 60_000 });
        pass = re.test(`${r.stdout}${r.stderr}`);
        break;
      }
      case 'output_matches':
        pass = re.test(run.output);
        break;
      default:
        detail = `unknown check type ${check.type}`;
    }
    return { name: check.name, critical: check.critical !== false, pass, ...(detail ? { detail } : {}) };
  });
}

function previousResults() {
  if (!existsSync(RESULT_DIR)) return undefined;
  const last = readdirSync(RESULT_DIR)
    .filter(f => f.endsWith('.json'))
    .sort()
    .pop();
  return last ? JSON.parse(readFileSync(path.join(RESULT_DIR, last), 'utf8')) : undefined;
}

// Grader check without an agent: the planted state must fail at least one critical
// check (the task is not trivially green), and the task's known-good answer, if it has
// one, must pass every critical check.
function selfTest(task) {
  const planted = makeSandbox(task);
  const unfixed = grade(task, planted, { output: '' });
  const failsUnfixed = unfixed.some(c => c.critical && !c.pass);
  rmSync(planted, { recursive: true, force: true });
  if (!task.selfTest) return { failsUnfixed, solved: undefined, failing: [] };

  const dir = makeSandbox(task);
  if (task.selfTest.revertSetup) sh('git revert --no-commit HEAD', { cwd: dir });
  const solved = grade(task, dir, { output: task.selfTest.output ?? '' });
  rmSync(dir, { recursive: true, force: true });
  const failing = solved.filter(c => c.critical && !c.pass).map(c => (c.detail ? `${c.name} (${c.detail})` : c.name));
  return { failsUnfixed, solved: failing.length === 0, failing };
}

const tasks = loadTasks();
if (tasks.length === 0) {
  console.error('no tasks selected');
  process.exit(1);
}
const app = appIsUp();
if (!app.ok) {
  console.error(`app not reachable at ${app.baseUrl}; start it first (AGENTS.md)`);
  process.exit(1);
}
if (args['self-test']) {
  let ok = true;
  for (const task of tasks) {
    const r = selfTest(task);
    const good = r.failsUnfixed && r.solved !== false;
    ok &&= good;
    const solved =
      r.solved === undefined
        ? 'no reference answer'
        : r.solved
          ? 'reference passes'
          : `reference fails: ${r.failing.join(', ')}`;
    console.log(
      `${good ? 'ok  ' : 'BAD '} ${task.id}: ${r.failsUnfixed ? 'planted state fails' : 'planted state PASSES'} · ${solved}`,
    );
  }
  process.exit(ok ? 0 : 1);
}
const repeat = Number(args.repeat);
const previous = previousResults();
const runs = [];

for (const task of tasks) {
  for (let attempt = 1; attempt <= repeat; attempt += 1) {
    process.stdout.write(`${task.id} [${attempt}/${repeat}] … `);
    const dir = makeSandbox(task);
    const run = runAgent(task, dir);
    const checks = grade(task, dir, run);
    const pass = !run.error && checks.every(c => c.pass || !c.critical);
    runs.push({ id: task.id, agent: task.agent, attempt, pass, ...run, checks, sandbox: dir });
    console.log(
      `${pass ? 'PASS' : 'FAIL'}  $${run.costUsd.toFixed(2)} · ${run.turns} turns · ${run.durationS}s` +
        (run.error ? ` · ${run.error}` : ''),
    );
    for (const c of checks.filter(c => !c.pass)) {
      console.log(`    ${c.critical ? '✗' : '·'} ${c.name}${c.detail ? `: ${c.detail}` : ''}`);
    }
    if (run.error && AUTH_ERROR.test(run.error)) {
      console.error(`stopping: the agent could not authenticate (${run.error}). Try --auth login.`);
      process.exit(2);
    }
    if (run.denials.length) console.log(`    denied: ${run.denials.join(' | ')}`);
    if (pass && !args.keep) rmSync(dir, { recursive: true, force: true });
    else console.log(`    sandbox kept: ${dir}`);
  }
}

const byTask = tasks.map(t => {
  const mine = runs.filter(r => r.id === t.id);
  const passed = mine.filter(r => r.pass).length;
  const before = previous?.summary.find(s => s.id === t.id);
  return {
    id: t.id,
    agent: t.agent,
    passRate: passed / mine.length,
    costUsd: mine.reduce((n, r) => n + r.costUsd, 0) / mine.length,
    turns: mine.reduce((n, r) => n + r.turns, 0) / mine.length,
    previousPassRate: before?.passRate,
  };
});

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
mkdirSync(RESULT_DIR, { recursive: true });
const record = {
  stamp,
  model: args.model ?? 'agent default',
  appBaseUrl: app.baseUrl,
  summary: byTask,
  runs: runs.map(({ output, ...r }) => ({ ...r, output: output.slice(0, 4000) })),
};
writeFileSync(path.join(RESULT_DIR, `${stamp}.json`), `${JSON.stringify(record, null, 2)}\n`);

const pct = n => (n === undefined ? '—' : `${Math.round(n * 100)}%`);
const md = [
  `# Agent evals ${stamp}`,
  '',
  `Model: ${record.model} · app: ${app.baseUrl} · repeat: ${repeat}`,
  '',
  '| Task | Agent | Pass | Previous | Avg cost | Avg turns |',
  '| --- | --- | --- | --- | --- | --- |',
  ...byTask.map(
    s =>
      `| ${s.id} | ${s.agent} | ${pct(s.passRate)} | ${pct(s.previousPassRate)} | $${s.costUsd.toFixed(2)} | ${Math.round(s.turns)} |`,
  ),
  '',
].join('\n');
writeFileSync(path.join(RESULT_DIR, `${stamp}.md`), md);
console.log(`\n${md}`);
const regressed = byTask.filter(s => s.previousPassRate !== undefined && s.passRate < s.previousPassRate);
if (regressed.length) console.log(`REGRESSED: ${regressed.map(s => s.id).join(', ')}`);
process.exit(byTask.every(s => s.passRate === 1) ? 0 : 1);
