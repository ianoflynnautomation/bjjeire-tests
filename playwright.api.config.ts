import { createBaseConfig, createApiProjects } from './src/core/config/playwright';

export default createBaseConfig({
  projects: createApiProjects(),
});
