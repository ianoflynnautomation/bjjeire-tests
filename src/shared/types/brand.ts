export type Brand<T, B extends string> = T & { readonly __brand: B };

export type RunId = Brand<string, 'RunId'>;
export type EntityId = Brand<string, 'EntityId'>;

export type EventId = Brand<string, 'EventId'>;
export type GymId = Brand<string, 'GymId'>;
export type CompetitionId = Brand<string, 'CompetitionId'>;
export type StoreId = Brand<string, 'StoreId'>;

export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};
