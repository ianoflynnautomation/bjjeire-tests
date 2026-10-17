import { openApiPageSchema } from '@api/support';
import { zPagedResponseStoreDto } from '@api/generated/zod.gen';
import type { StoreDto } from './stores.types';

export const storesPageSchema = openApiPageSchema<StoreDto>(zPagedResponseStoreDto);
