import { openApiPageSchema } from '@api/generated/wire';
import { zPagedResponseBjjEventDto } from '@api/generated/zod.gen';
import type { BjjEventDto } from './events.types';

export const bjjEventsPageSchema = openApiPageSchema<BjjEventDto>(zPagedResponseBjjEventDto);
