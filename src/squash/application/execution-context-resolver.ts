import type { FolderPathResolver } from './folder-path-resolver';
import type {
  CampaignId,
  CampaignRef,
  ExecutionContext,
  ExecutionRepository,
  ExecutionTargetSpec,
  Logger,
  RunInfo,
} from './ports';

/** Resolved once per run. A missing campaign path, and its iteration, are created. */
export class ExecutionContextResolver {
  private context: Promise<ExecutionContext> | undefined;

  constructor(
    private readonly executions: ExecutionRepository,
    private readonly campaignFolders: FolderPathResolver,
    private readonly logger: Logger,
  ) {}

  resolve(spec: ExecutionTargetSpec, run: RunInfo): Promise<ExecutionContext> {
    this.context ??= this.fromSpec(spec, run);
    return this.context;
  }

  private async fromSpec(spec: ExecutionTargetSpec, run: RunInfo): Promise<ExecutionContext> {
    switch (spec.kind) {
      case 'test-suite': {
        const suite = await this.executions.getTestSuite(spec.testSuiteId);
        return { iterationId: suite.iterationId, label: `test suite "${suite.name}" (${suite.id})` };
      }
      case 'iteration':
        return { iterationId: spec.iterationId, label: `iteration ${spec.iterationId}` };
      case 'campaign': {
        const campaignId = await this.campaignOf(spec.campaign);
        return this.iterationIn(campaignId, campaignLabel(spec.campaign), spec.iteration ?? run.name, run);
      }
    }
  }

  private async iterationIn(
    campaignId: CampaignId,
    campaign: string,
    name: string,
    run: RunInfo,
  ): Promise<ExecutionContext> {
    const existing = (await this.executions.listIterations(campaignId)).find(iteration => iteration.name === name);
    const label = `${campaign} › ${name}`;
    if (existing) return { iterationId: existing.id, label };
    const iterationId = await this.executions.createIteration(campaignId, name, run.description);
    this.logger.info(`Created iteration ${iterationId} "${name}" in campaign ${campaign}.`);
    return { iterationId, label };
  }

  /** `Releases/2.4`: folder `Releases` (created when missing), then campaign `2.4` (likewise). */
  private async campaignOf(ref: CampaignRef): Promise<CampaignId> {
    if ('id' in ref) return ref.id;
    const segments = ref.path.split('/');
    const name = segments.pop() ?? ref.path;
    const folderId = await this.campaignFolders.ensure(segments.join('/'));
    const existing = await this.executions.findCampaign(folderId, name);
    if (existing !== undefined) return existing;
    const campaignId = await this.executions.createCampaign(folderId, name);
    this.logger.info(`Created campaign ${campaignId} "${ref.path}".`);
    return campaignId;
  }
}

function campaignLabel(ref: CampaignRef): string {
  return 'id' in ref ? `campaign ${ref.id}` : `"${ref.path}"`;
}
