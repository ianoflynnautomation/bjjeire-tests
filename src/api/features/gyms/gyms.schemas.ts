import { z } from 'zod';
import {
  baseApiEntityFields,
  locationSchema,
  paginatedResponseSchema,
  schemaFor,
  socialMediaSchema,
} from '@api/support';
import type { GymId } from '@shared/types';
import { ClassCategory, GymStatus, type GymDto } from './gyms.types';

export const gymDtoSchema = schemaFor<GymDto>(
  z.object({
    ...baseApiEntityFields<GymId>(),
    name: z.string(),
    description: z.string().nullable().optional(),
    status: z.enum(GymStatus),
    county: z.string(),
    affiliation: z.object({ name: z.string(), website: z.string().nullable().optional() }).nullable().optional(),
    trialOffer: z.object({
      isAvailable: z.boolean(),
      freeClasses: z.number().nullable().optional(),
      freeDays: z.number().nullable().optional(),
      notes: z.string().nullable().optional(),
    }),
    location: locationSchema,
    socialMedia: socialMediaSchema,
    offeredClasses: z.array(z.enum(ClassCategory)),
    website: z.string().nullable().optional(),
    timetableUrl: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    thumbnailUrl: z.string().nullable().optional(),
  }),
);

export const gymsPageSchema = paginatedResponseSchema(gymDtoSchema);
