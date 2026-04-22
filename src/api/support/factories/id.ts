import { randomUUID } from 'node:crypto';
import { ObjectId } from 'mongodb';
import type { EntityId, RunId } from '@api/support/types';

const WORKER_RUN_ID: RunId = createRunId();

export function createRunId(): RunId {
  const stamp = Date.now().toString(36);
  const rand = randomUUID().replace(/-/g, '').slice(0, 8);
  return `run_${stamp}_${rand}` as RunId;
}

export function workerRunId(): RunId {
  return WORKER_RUN_ID;
}

export function createEntityId(): EntityId {
  return new ObjectId().toHexString() as EntityId;
}

export function createTestRunId(testTitle: string, workerIndex: number): RunId {
  const slug = testTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
  const rand = randomUUID().replace(/-/g, '').slice(0, 6);
  return `run_w${workerIndex}_${slug}_${rand}` as RunId;
}
