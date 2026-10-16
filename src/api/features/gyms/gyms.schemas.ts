import { openApiPageSchema } from '@api/generated/wire';
import { zPagedResponseGymDto } from '@api/generated/zod.gen';
import type { GymDto } from './gyms.types';

export const gymsPageSchema = openApiPageSchema<GymDto>(zPagedResponseGymDto);
