import { createUiProjects } from './src/ui/config/playwright';
import { createBaseConfig } from './src/shared/config/playwright';

export default createBaseConfig({
  projects: createUiProjects(),
});
