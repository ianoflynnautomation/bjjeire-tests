import { GymStatus } from '@api/features/gyms/gyms.types';
import type { GymCard } from '@ui/features/gyms/gym-card.screen';

export const SEEDED_GYM_BJJ_CORK: GymCard = {
  name: 'BJJ Cork',
  status: GymStatus.Active.toUpperCase(),
  county: 'Cork County',
  classes: ['BJJ Gi (All Levels)', 'BJJ No-Gi (All Levels)'],
};

export const SEEDED_GYM_BJJ_CORK_PARTIAL = 'BJJ C';
