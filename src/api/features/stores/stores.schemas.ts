import type { ZodType } from 'zod';
import { openApiPageSchema } from '@api/generated/wire';
import { zPagedResponseStoreDto } from '@api/generated/zod.gen';
import type { PaginatedResponse } from '@api/support';
import type { StoreDto } from './stores.types';

export const storesPageSchema = openApiPageSchema(zPagedResponseStoreDto) as ZodType<PaginatedResponse<StoreDto>>;
