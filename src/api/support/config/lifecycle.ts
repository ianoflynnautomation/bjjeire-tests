import type { StartedMongo } from '../db/testcontainers';

let startedMongo: StartedMongo | undefined;

export function setStartedMongo(mongo: StartedMongo): void {
  startedMongo = mongo;
}

export function getStartedMongo(): StartedMongo | undefined {
  return startedMongo;
}

export function clearLifecycle(): void {
  startedMongo = undefined;
}
