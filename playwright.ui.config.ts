import { createBaseConfig, createUiProjects } from './src/shared/config/playwright';

export default createBaseConfig({
  projects: createUiProjects(),
});
