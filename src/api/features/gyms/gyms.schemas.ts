import { openApiPageSchema, openApiSchema } from '@api/support';
import { zGymDto, zPagedResponseGymDto } from '@api/generated/zod.gen';
import type { GymDto } from './gyms.types';

export const gymsPageSchema = openApiPageSchema<GymDto>(zPagedResponseGymDto);
export const gymSchema = openApiSchema<GymDto>(zGymDto);
