import type { ZodType } from 'zod';
import { openApiPageSchema } from '@api/generated/wire';
import { zPagedResponseBjjEventDto } from '@api/generated/zod.gen';
import type { PaginatedResponse } from '@api/support';
import type { BjjEventDto } from './events.types';

export const bjjEventsPageSchema = openApiPageSchema(zPagedResponseBjjEventDto) as ZodType<
  PaginatedResponse<BjjEventDto>
>;
