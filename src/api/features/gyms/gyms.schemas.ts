import type { ZodType } from 'zod';
import { openApiPageSchema } from '@api/generated/wire';
import { zPagedResponseGymDto } from '@api/generated/zod.gen';
import type { PaginatedResponse } from '@api/support';
import type { GymDto } from './gyms.types';

export const gymsPageSchema = openApiPageSchema(zPagedResponseGymDto) as ZodType<PaginatedResponse<GymDto>>;
