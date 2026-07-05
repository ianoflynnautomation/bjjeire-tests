import { z } from 'zod';
import { baseApiEntityFields, paginatedResponseSchema, schemaFor } from '@api/support';
import type { CompetitionId } from '@shared/types';
import type { CompetitionDto } from './competitions.types';

export const competitionDtoSchema = schemaFor<CompetitionDto>(
  z.object({
    ...baseApiEntityFields<CompetitionId>(),
    slug: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    organisation: z.string(),
    country: z.string(),
    websiteUrl: z.string(),
    registrationUrl: z.string().nullable().optional(),
    logoUrl: z.string().nullable().optional(),
    tags: z.array(z.string()),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    isActive: z.boolean(),
  }),
);

export const competitionsPageSchema = paginatedResponseSchema(competitionDtoSchema);
