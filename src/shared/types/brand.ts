export type Brand<T, B extends string> = T & { readonly __brand: B };

export type RunId = Brand<string, 'RunId'>;
export type EntityId = Brand<string, 'EntityId'>;

export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};
