import { defineFactory } from '@api/support/factories';

export type TemplateEntity = Readonly<{
  name: string;
}>;

const templateEntityFactory = defineFactory<undefined, TemplateEntity>({
  defaults: () => ({
    name: 'template-entity',
  }),
});

export const createTemplateEntity = (overrides?: Partial<TemplateEntity>): TemplateEntity =>
  templateEntityFactory.build(undefined, overrides);
