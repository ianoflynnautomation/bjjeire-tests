export type Brand<T, B extends string> = T & { readonly __brand: B };

export type RunId = Brand<string, 'RunId'>;

export type EventId = Brand<string, 'EventId'>;
export type GymId = Brand<string, 'GymId'>;
export type CompetitionId = Brand<string, 'CompetitionId'>;
export type StoreId = Brand<string, 'StoreId'>;
