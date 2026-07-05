import { z } from 'zod';
import { baseApiEntityFields, paginatedResponseSchema, schemaFor } from '@api/support';
import type { StoreId } from '@shared/types';
import type { StoreDto } from './stores.types';

export const storeDtoSchema = schemaFor<StoreDto>(
  z.object({
    ...baseApiEntityFields<StoreId>(),
    name: z.string(),
    description: z.string().nullable().optional(),
    websiteUrl: z.string(),
    logoUrl: z.string().nullable().optional(),
    isActive: z.boolean(),
  }),
);

export const storesPageSchema = paginatedResponseSchema(storeDtoSchema);
