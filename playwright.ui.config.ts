import { createBaseConfig, createUiProjects } from './src/core/config/playwright';

export default createBaseConfig({
  projects: createUiProjects(),
});
