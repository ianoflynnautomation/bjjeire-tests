import type { StoreDto } from '@api/features/stores/stores.types';
import type { StoreCard } from './stores.types';

export function storeCardFromDto(store: StoreDto): StoreCard {
  return {
    name: store.name,
    description: store.description ?? null,
  };
}
