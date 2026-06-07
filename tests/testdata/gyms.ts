import { GymStatus } from '@api/features/gyms/gyms.types';
import type { GymCard } from '@ui/pages/gyms/gyms.card.page';

export const EXPECTED_GYM_BJJ_CORK_CARD: GymCard = {
  name: 'BJJ Cork',
  status: GymStatus.Active,
  county: 'Cork County',
  classes: ['BJJ Gi (All Levels)', 'BJJ No-Gi (All Levels)'],
} as const;

export const EXPECTED_GYM_BJJ_CORK_PARTIAL = 'BJJ C';
