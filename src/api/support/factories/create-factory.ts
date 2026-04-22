export type FactoryOverrides<T> = Partial<T>;

export function createFactory<T extends object>(defaults: T | (() => T), overrides: FactoryOverrides<T> = {}): T {
  const resolvedDefaults = typeof defaults === 'function' ? (defaults as () => T)() : defaults;
  return {
    ...resolvedDefaults,
    ...overrides,
  };
}
