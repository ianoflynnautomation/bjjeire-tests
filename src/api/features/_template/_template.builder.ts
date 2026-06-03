import { Builder, type IBuilder } from 'builder-pattern';
import type { RunId } from '@shared/types';

export type TemplateEntity = Readonly<{
  name: string;
}>;

export function defaultTemplatePayload(_runId: RunId): TemplateEntity {
  return {
    name: 'template-entity',
  };
}

export function aTemplateEntity(runId: RunId): IBuilder<TemplateEntity> {
  return Builder<TemplateEntity>(defaultTemplatePayload(runId));
}

export function createTemplateEntity(runId: RunId, overrides: Partial<TemplateEntity> = {}): TemplateEntity {
  return Builder<TemplateEntity>(defaultTemplatePayload(runId), overrides).build();
}
