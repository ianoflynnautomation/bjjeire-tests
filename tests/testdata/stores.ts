import type { StoreCard } from '@ui/features/stores/store-card.page';
import { partialName } from './strings';

export const SEEDED_STORE_BJJ_CORK: StoreCard = {
  name: 'Wolfhound Fightwear',
  description:
    'Wolfhound Fightwear is an Irish brand with the aim of providing high quality BJJ and MMA apparel to martial arts practitioners at affordable prices with a unique theme that takes inspiration from Celtic mythology and the legendary fighting Irish spirit.',
};

export const SEEDED_STORE_BJJ_CORK_PARTIAL = partialName(SEEDED_STORE_BJJ_CORK.name);
