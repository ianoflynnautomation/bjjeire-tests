export type TemplateEntity = Readonly<{
  name: string;
}>;

export function createTemplateEntity(overrides: Partial<TemplateEntity> = {}): TemplateEntity {
  return {
    name: 'template-entity',
    ...overrides,
  };
}
