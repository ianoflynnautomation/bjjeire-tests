import type { StartedMongo } from '../db/testcontainers';

type Lifecycle = {
  mongo: StartedMongo | undefined;
};

const state: Lifecycle = {
  mongo: undefined,
};

export function setStartedMongo(mongo: StartedMongo): void {
  state.mongo = mongo;
}

export function getStartedMongo(): StartedMongo | undefined {
  return state.mongo;
}

export function clearLifecycle(): void {
  state.mongo = undefined;
}
