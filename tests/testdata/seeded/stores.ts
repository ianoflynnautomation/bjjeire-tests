import type { StoreDto } from '@api/features/stores/stores.types';
import type { StoreId } from '@shared/types';
import { partialNameOf } from './partial-name';

const storeId = (id: string): StoreId => id as StoreId;

export const SEEDED_STORE_ARAN_FIGHT_GEAR: StoreDto = {
  id: storeId('acce77500000000000000001'),
  name: 'Aran Fight Gear',
  description: 'Acceptance-test fixture store.',
  websiteUrl: 'https://aran-fight-gear.example.ie/',
  isActive: true,
};

export const SEEDED_STORE_ARAN_FIGHT_GEAR_PARTIAL_NAME = partialNameOf(SEEDED_STORE_ARAN_FIGHT_GEAR, 'Aran Fight');

export const SEEDED_STORE_CELTIC_GRAPPLING_SUPPLY: StoreDto = {
  id: storeId('acce77500000000000000002'),
  name: 'Celtic Grappling Supply',
  description: 'Acceptance-test fixture store.',
  websiteUrl: 'https://celtic-grappling-supply.example.ie/',
  isActive: true,
};

export const SEEDED_STORE_EMERALD_KIMONOS: StoreDto = {
  id: storeId('acce77500000000000000003'),
  name: 'Emerald Kimonos',
  description: 'Acceptance-test fixture store.',
  websiteUrl: 'https://emerald-kimonos.example.ie/',
  isActive: true,
};

export const SEEDED_STORES_BY_NAME: readonly StoreDto[] = [
  SEEDED_STORE_ARAN_FIGHT_GEAR,
  SEEDED_STORE_CELTIC_GRAPPLING_SUPPLY,
  SEEDED_STORE_EMERALD_KIMONOS,
];
