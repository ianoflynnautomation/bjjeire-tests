import { createApiProjects, createBaseConfig } from './src/shared/config/playwright';

export default createBaseConfig({
  projects: createApiProjects(),
});
