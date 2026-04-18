import type { StartedMongo } from '../db/testcontainers';

type Lifecycle = {
  mongo?: StartedMongo;
};

const state: Lifecycle = {};

export function setStartedMongo(mongo: StartedMongo): void {
  state.mongo = mongo;
}

export function getStartedMongo(): StartedMongo | undefined {
  return state.mongo;
}

export function clearLifecycle(): void {
  state.mongo = undefined;
}
