import { resolveRunId } from '@shared/config/run-id';

/** `resolveRunId` stamps this when no CI id exists. It is unique per process, so shards must not use it. */
const AUTO_LOCAL_STAMP = /^local-\d+$/;

export type RunEnvironment = Readonly<{
  name: string;
  /** True when neither `SQUASH_TM_ENVIRONMENT` nor `APP_ENV` was set, so the name is the fallback `local`. */
  assumedLocal: boolean;
}>;

/**
 * Id shared by every job of one CI run, so an unset iteration name does not
 * create one Squash iteration per shard. A `local-<timestamp>` stamp from
 * `resolveRunId` is ignored when a real CI id exists. An id someone set in
 * `TEST_RUN_ID` is kept.
 */
export function squashRunId(env: NodeJS.ProcessEnv = process.env): string {
  const explicit = nonBlank(env['TEST_RUN_ID']);
  if (explicit !== undefined && !AUTO_LOCAL_STAMP.test(explicit)) return explicit;
  return sharedCiRunId(env) ?? resolveRunId();
}

/**
 * GitHub's run id matches `resolveRunId`. The others cover hosts that do not
 * set `GITHUB_RUN_ID`: Azure Pipelines, GitLab, Jenkins, Buildkite, CircleCI.
 */
export function sharedCiRunId(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const github = nonBlank(env['GITHUB_RUN_ID']);
  if (github !== undefined) return `${github}-${nonBlank(env['GITHUB_RUN_ATTEMPT']) ?? '1'}`;
  const azure = nonBlank(env['BUILD_BUILDID']);
  if (azure !== undefined) return `azure-${azure}`;
  const gitlab = nonBlank(env['CI_PIPELINE_ID']);
  if (gitlab !== undefined) return `gitlab-${gitlab}`;
  const jenkins = nonBlank(env['BUILD_TAG']);
  if (jenkins !== undefined) return jenkins;
  const buildkite = nonBlank(env['BUILDKITE_BUILD_ID']);
  if (buildkite !== undefined) return `buildkite-${buildkite}`;
  const circle = nonBlank(env['CIRCLE_WORKFLOW_ID']);
  if (circle !== undefined) return `circle-${circle}`;
  return undefined;
}

/** `SQUASH_TM_ENVIRONMENT`, then this suite's `APP_ENV`, then `local`. */
export function runEnvironment(env: NodeJS.ProcessEnv = process.env): RunEnvironment {
  const named = nonBlank(env['SQUASH_TM_ENVIRONMENT']) ?? nonBlank(env['APP_ENV']);
  if (named !== undefined) return { name: named, assumedLocal: false };
  return { name: 'local', assumedLocal: true };
}

function nonBlank(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed === '' || trimmed === undefined ? undefined : trimmed;
}
