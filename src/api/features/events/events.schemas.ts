import { z } from 'zod';
import {
  baseApiEntityFields,
  locationSchema,
  paginatedResponseSchema,
  schemaFor,
  socialMediaSchema,
} from '@api/support';
import type { EventId } from '@shared/types';
import {
  BjjEventType,
  EventStatus,
  PricingType,
  ScheduleKind,
  type BjjEventDto,
} from './events.types';

const bjjEventSessionSchema = z.object({
  date: z.string().nullable().optional(),
  day: z.string().nullable().optional(),
  startTime: z.string(),
  endTime: z.string(),
  title: z.string().nullable().optional(),
  types: z.array(z.enum(BjjEventType)).nullable().optional(),
});

const bjjEventPricingOptionSchema = z.object({
  type: z.enum(PricingType),
  label: z.string().nullable().optional(),
  appliesToTypes: z.array(z.enum(BjjEventType)).nullable().optional(),
  amount: z.number(),
  durationDays: z.number().nullable().optional(),
  currency: z.string(),
});

export const bjjEventDtoSchema = schemaFor<BjjEventDto>(
  z.object({
    ...baseApiEntityFields<EventId>(),
    name: z.string(),
    description: z.string().nullable().optional(),
    types: z.array(z.enum(BjjEventType)),
    organiser: z.object({ name: z.string(), website: z.string() }),
    status: z.enum(EventStatus),
    statusReason: z.string().nullable().optional(),
    socialMedia: socialMediaSchema,
    county: z.string(),
    location: locationSchema,
    schedule: z.object({
      kind: z.enum(ScheduleKind),
      startDate: z.string().nullable().optional(),
      endDate: z.string().nullable().optional(),
      sessions: z.array(bjjEventSessionSchema),
    }),
    pricingOptions: z.array(bjjEventPricingOptionSchema),
    eventUrl: z.string(),
    imageUrl: z.string(),
  }),
);

export const bjjEventsPageSchema = paginatedResponseSchema(bjjEventDtoSchema);
