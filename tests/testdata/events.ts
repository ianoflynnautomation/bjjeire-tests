import type { BjjEventCard } from '@ui/features/events/event-card.screen';
import { partialName } from './strings';

export const SEEDED_EVENT_ADCC: BjjEventCard = {
  name: 'ADCC Irish Cup Championship 2026',
  type: '',
  county: '',
  pricing: '',
  schedule: '',
};

export const SEEDED_EVENT_ADCC_PARTIAL = partialName(SEEDED_EVENT_ADCC.name);
