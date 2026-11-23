import type { StoreDto } from '@api/features/stores/stores.types';
import type { StoreId } from '@shared/types';
import { partialNameOf } from '../common/testdata/seeded/partial-name';

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

/** Published, with no description and no logo. The seed holds nulls; the API omits them, so the fixture leaves both out. */
export const SEEDED_STORE_BURREN_MATS: StoreDto = {
  id: storeId('acce77500000000000000005'),
  name: 'Burren Mats',
  websiteUrl: 'https://burren-mats.example.ie/',
  isActive: true,
};

/** Unpublished (`isActive: false`): the directory must never list it, so it stays out of `SEEDED_STORES_BY_NAME`. */
export const SEEDED_STORE_FASTNET_GRAPPLING_CO: StoreDto = {
  id: storeId('acce77500000000000000004'),
  name: 'Fastnet Grappling Co',
  description: 'Acceptance-test fixture store. Unpublished: the directory must never list it (#4001).',
  websiteUrl: 'https://fastnet-grappling-co.example.ie/',
  isActive: false,
};

export const SEEDED_STORES_BY_NAME: readonly StoreDto[] = [
  SEEDED_STORE_ARAN_FIGHT_GEAR,
  SEEDED_STORE_BURREN_MATS,
  SEEDED_STORE_CELTIC_GRAPPLING_SUPPLY,
  SEEDED_STORE_EMERALD_KIMONOS,
];

type SeededProduct = Readonly<{ slug: string; name: string; priceCents: number; currency: string }>;

/** The merch catalogue seed, in catalogue order (kind: rashguard, shorts, t-shirt). The environment may hold more products. */
export const SEEDED_PRODUCT_HARP_RASHGUARD: SeededProduct = {
  slug: 'harp-rashguard',
  name: 'Harp Rashguard',
  priceCents: 4500,
  currency: 'EUR',
};
export const SEEDED_PRODUCT_COMPETITION_SHORTS: SeededProduct = {
  slug: 'competition-shorts',
  name: 'Competition Shorts',
  priceCents: 3500,
  currency: 'EUR',
};
export const SEEDED_PRODUCT_LOGO_T_SHIRT: SeededProduct = {
  slug: 'logo-t-shirt',
  name: 'Logo T-Shirt',
  priceCents: 2500,
  currency: 'EUR',
};

export const SEEDED_PRODUCTS_BY_CATALOGUE_ORDER: readonly SeededProduct[] = [
  SEEDED_PRODUCT_HARP_RASHGUARD,
  SEEDED_PRODUCT_COMPETITION_SHORTS,
  SEEDED_PRODUCT_LOGO_T_SHIRT,
];

/** The seeded rashguard as a visitor reads it: price as displayed (oracle: the seed, 4500 cents) and its four sizes. */
export const SEEDED_RASHGUARD = {
  name: SEEDED_PRODUCT_HARP_RASHGUARD.name,
  displayPrice: '€45.00',
  sizes: ['S', 'M', 'L', 'XL'],
} as const;
