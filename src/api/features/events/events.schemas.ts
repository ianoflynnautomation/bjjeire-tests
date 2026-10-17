import { openApiPageSchema, openApiSchema } from '@api/support';
import { zBjjEventDto, zPagedResponseBjjEventDto } from '@api/generated/zod.gen';
import type { BjjEventDto } from './events.types';

export const bjjEventsPageSchema = openApiPageSchema<BjjEventDto>(zPagedResponseBjjEventDto);
export const bjjEventSchema = openApiSchema<BjjEventDto>(zBjjEventDto);
