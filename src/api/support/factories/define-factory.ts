export type FactoryOverrides<TOutput> = Readonly<Partial<TOutput>>;

export type Factory<TInput, TOutput> = Readonly<{
  build: (input: TInput, overrides?: FactoryOverrides<TOutput>) => TOutput;
  buildMany: (
    input: TInput,
    count: number,
    overrides?: FactoryOverrides<TOutput> | ((index: number) => FactoryOverrides<TOutput>),
  ) => TOutput[];
}>;

export type FactoryDefinition<TInput, TOutput> = Readonly<{
  defaults: (input: TInput) => TOutput;
}>;

export function defineFactory<TInput, TOutput extends object>(
  definition: FactoryDefinition<TInput, TOutput>,
): Factory<TInput, TOutput> {
  const build = (input: TInput, overrides?: FactoryOverrides<TOutput>): TOutput => ({
    ...definition.defaults(input),
    ...overrides,
  });

  const buildMany: Factory<TInput, TOutput>['buildMany'] = (input, count, overrides) =>
    Array.from({ length: count }, (_, index) => {
      const resolved = typeof overrides === 'function' ? overrides(index) : overrides;
      return build(input, resolved);
    });

  return { build, buildMany };
}
