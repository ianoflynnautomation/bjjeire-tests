import { z } from 'zod';
import {
  baseApiEntityFields,
  locationSchema,
  paginatedResponseSchema,
  schemaFor,
  socialMediaSchema,
} from '@api/support';
import type { EventId } from '@shared/types';
import { BjjEventType, EventStatus, PricingType, type BjjEventDto } from './events.types';

export const bjjEventDtoSchema = schemaFor<BjjEventDto>(
  z.object({
    ...baseApiEntityFields<EventId>(),
    name: z.string(),
    description: z.string().nullable().optional(),
    type: z.enum(BjjEventType),
    organiser: z.object({ name: z.string(), website: z.string() }),
    status: z.enum(EventStatus),
    statusReason: z.string().nullable().optional(),
    socialMedia: socialMediaSchema,
    county: z.string(),
    location: locationSchema,
    schedule: z.object({
      startDate: z.string().nullable().optional(),
      endDate: z.string().nullable().optional(),
      hours: z.array(z.object({ day: z.string(), openTime: z.string(), closeTime: z.string() })),
    }),
    pricing: z.object({
      type: z.enum(PricingType),
      amount: z.number(),
      durationDays: z.number().nullable().optional(),
      currency: z.string(),
    }),
    eventUrl: z.string(),
    imageUrl: z.string(),
  }),
);

export const bjjEventsPageSchema = paginatedResponseSchema(bjjEventDtoSchema);
