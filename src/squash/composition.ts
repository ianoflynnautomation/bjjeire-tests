import { ConfigError } from '@shared/config/config-errors';
import { readEnv } from '@shared/config/process-env';
import { resolveRunId } from '@shared/config/run-id';
import { ExecutionContextResolver } from './application/execution-context-resolver';
import { FolderPathResolver } from './application/folder-path-resolver';
import type { Logger, RunInfo, SquashStrategy, TestSelection } from './application/ports';
import { ResultAggregator } from './application/result-aggregator';
import { ResultPublisher } from './application/result-publisher';
import { DryRunStrategy, RemoteStrategy } from './application/strategies';
import { TestCaseSynchronizer } from './application/test-case-synchronizer';
import { TestSelector } from './application/test-selector';
import { loadSquashConfig, type SquashConfig, type SquashConnection } from './infrastructure/config';
import { SquashMode } from './infrastructure/config-schema';
import { ConsoleLogger } from './infrastructure/logger';
import { PlaywrightTestParser } from './infrastructure/playwright-test-parser';
import { RetryingSquashClient } from './infrastructure/retrying-squash-client';
import { FetchSquashClient } from './infrastructure/squash-client';
import { HttpExecutionRepository } from './infrastructure/squash-execution-repository';
import { HttpFolderTree } from './infrastructure/squash-folder-tree';
import { HttpTestCaseRepository } from './infrastructure/squash-test-case-repository';

/**
 * Composition root: the only place that knows concrete classes. Everything
 * else receives its collaborators through its constructor.
 */

/** Everything that talks to one Squash project, built once per process. */
type SquashServices = Readonly<{
  testCases: HttpTestCaseRepository;
  executions: HttpExecutionRepository;
  testCaseFolders: FolderPathResolver;
  campaignFolders: FolderPathResolver;
}>;

function connect(connection: SquashConnection, logger: Logger): SquashServices {
  const { baseUrl, token, timeoutMs, retry, projectId } = connection;
  const client = new RetryingSquashClient(new FetchSquashClient({ baseUrl, token, timeoutMs }), logger, retry);
  const campaignTree = new HttpFolderTree(client, projectId, 'campaign');
  return {
    testCases: new HttpTestCaseRepository(client, { projectId }),
    executions: new HttpExecutionRepository(client, campaignTree),
    testCaseFolders: new FolderPathResolver(new HttpFolderTree(client, projectId, 'test-case')),
    campaignFolders: new FolderPathResolver(campaignTree),
  };
}

/** The loader guarantees a connection in publish mode and for selections; this keeps that invariant explicit. */
function requireServices(config: SquashConfig, logger: Logger): SquashServices {
  if (!config.connection) throw new ConfigError('No Squash TM connection is configured (url, projectId, credentials).');
  return connect(config.connection, logger);
}

/** Strategy factory: the execution context picks dry-run (local) or remote (CI) behaviour. */
function createSquashStrategy(config: SquashConfig, logger: Logger): SquashStrategy {
  switch (config.mode) {
    case SquashMode.DryRun:
      return new DryRunStrategy(logger);
    case SquashMode.Publish: {
      const services = requireServices(config, logger);
      const synchronizer = new TestCaseSynchronizer(
        services.testCases,
        services.testCaseFolders,
        config.placement,
        logger,
      );
      const context = new ExecutionContextResolver(services.executions, services.campaignFolders, logger);
      const publisher = config.target
        ? new ResultPublisher(services.executions, context, config.target, logger)
        : undefined;
      return new RemoteStrategy(synchronizer, publisher);
    }
  }
}

function createLogger(config: SquashConfig): Logger {
  const logger = new ConsoleLogger(config.logLevel);
  const sources = [...config.provenance].filter(([, source]) => source !== 'default');
  if (sources.length > 0) logger.debug(`Settings: ${sources.map(([key, source]) => `${key} (${source})`).join(', ')}`);
  return logger;
}

export type SyncReporterDependencies = Readonly<{
  strategy: SquashStrategy;
  parser: PlaywrightTestParser;
  logger: Logger;
  failOnError: boolean;
}>;

export type ResultsReporterDependencies = SyncReporterDependencies &
  Readonly<{
    aggregator: ResultAggregator;
    run: RunInfo;
  }>;

export type SelectReporterDependencies = Readonly<{
  selector: TestSelector;
  selection: TestSelection;
  parser: PlaywrightTestParser;
  logger: Logger;
  /** Where the `--test-list` file is written. */
  outputPath: string;
}>;

export function createSyncReporterDependencies(config = loadSquashConfig()): SyncReporterDependencies {
  const logger = createLogger(config);
  return {
    strategy: createSquashStrategy(config, logger),
    parser: new PlaywrightTestParser(config.tag),
    logger,
    failOnError: config.failOnError,
  };
}

/** Fails at startup, not after a full suite run, when results have nowhere to go. */
export function createResultsReporterDependencies(config = loadSquashConfig()): ResultsReporterDependencies {
  if (config.mode === SquashMode.Publish && !config.target) {
    throw new ConfigError(
      'Publishing results needs a target: testSuiteId, iterationId, campaignId or campaign ' +
        '(config file, SQUASH_TM_* env var, or --squash-* flag).',
    );
  }
  return { ...createSyncReporterDependencies(config), aggregator: new ResultAggregator(), run: currentRun() };
}

/** `undefined` when no selection is configured: the run is not filtered. */
export function createSelectReporterDependencies(config = loadSquashConfig()): SelectReporterDependencies | undefined {
  const { selection } = config;
  if (!selection) return undefined;
  const logger = createLogger(config);
  const services = requireServices(config, logger);
  return {
    selector: new TestSelector(services.testCases, services.executions, logger),
    selection,
    parser: new PlaywrightTestParser(config.tag),
    logger,
    outputPath: readEnv('SQUASH_TM_TEST_LIST') ?? 'playwright/.cache/squash-test-list.txt',
  };
}

function currentRun(): RunInfo {
  const id = resolveRunId();
  const environment = readEnv('APP_ENV') ?? 'local';
  const ciRun = ciRunUrl();
  return {
    id,
    name: `Playwright ${environment} ${id}`,
    description: ciRun
      ? `Playwright run ${id} against ${environment}: ${ciRun}`
      : `Playwright run ${id} against ${environment}`,
  };
}

function ciRunUrl(): string | undefined {
  const server = readEnv('GITHUB_SERVER_URL');
  const repo = readEnv('GITHUB_REPOSITORY');
  const runId = readEnv('GITHUB_RUN_ID');
  return server && repo && runId ? `${server}/${repo}/actions/runs/${runId}` : undefined;
}
