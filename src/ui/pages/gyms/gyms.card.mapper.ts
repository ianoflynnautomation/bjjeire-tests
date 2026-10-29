import { ClassCategory, GymStatus, type GymDto } from '@api/features/gyms/gyms.types';
import type { GymCard, GymCardLinks } from './gyms.types';

/** Visible chip text from `bjjeire-app` `uiContent.gyms.classCategoryLabels`. Chips are not uppercased. */
const CLASS_CATEGORY_LABELS: Record<ClassCategory, string> = {
  [ClassCategory.Uncategorized]: 'Uncategorized',
  [ClassCategory.BJJGiAllLevels]: 'BJJ Gi (All Levels)',
  [ClassCategory.BJJNoGiAllLevels]: 'BJJ No-Gi (All Levels)',
  [ClassCategory.WomensOnly]: "Women's Only",
  [ClassCategory.Wrestling]: 'Wrestling',
  [ClassCategory.MuayThai]: 'Muay Thai',
  [ClassCategory.Boxing]: 'Boxing',
  [ClassCategory.StrengthTraining]: 'Strength Training',
  [ClassCategory.YogaOrPilates]: 'Yoga/Pilates',
  [ClassCategory.KidsBJJ]: 'Kids BJJ',
  [ClassCategory.BJJGiFundamentals]: 'BJJ Gi (Fundamentals)',
  [ClassCategory.BJJGiAdvanced]: 'BJJ Gi (Advanced)',
  [ClassCategory.BJJNoGiFundamentals]: 'BJJ No-Gi (Fundamentals)',
  [ClassCategory.BJJNoGiAdvanced]: 'BJJ No-Gi (Advanced)',
  [ClassCategory.CompetitionTraining]: 'Competition Training',
  [ClassCategory.ProTraining]: 'Pro Training',
  [ClassCategory.Other]: 'Other',
};

const STATUS_BADGE_LABELS: Record<GymStatus, string> = {
  [GymStatus.Active]: 'ACTIVE',
  [GymStatus.PendingApproval]: 'PENDING APPROVAL',
  [GymStatus.TemporarilyClosed]: 'TEMPORARILY CLOSED',
  [GymStatus.PermanentlyClosed]: 'PERMANENTLY CLOSED',
  [GymStatus.OpeningSoon]: 'OPENING SOON',
  [GymStatus.Draft]: 'DRAFT',
  [GymStatus.Rejected]: 'REJECTED',
};

export function gymCardFromDto(gym: GymDto): GymCard {
  return {
    name: gym.name,
    status: STATUS_BADGE_LABELS[gym.status],
    county: `${gym.county} County`,
    classes: gym.offeredClasses.map(category => CLASS_CATEGORY_LABELS[category]),
  };
}

export function gymCardLinksFromDto(gym: GymDto): GymCardLinks {
  if (!gym.website) {
    throw new Error(`Gym '${gym.name}' has no website, so its card has no website link to assert`);
  }
  const { latitude, longitude } = gym.location.coordinates;
  return {
    name: gym.name,
    website: gym.website,
    map: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
  };
}
