import { createApiProjects } from './src/api/config/playwright';
import { createUiProjects } from './src/ui/config/playwright';
import { createBaseConfig } from './src/shared/config/playwright';

export default createBaseConfig({
  projects: [...createApiProjects(), ...createUiProjects()],
});
