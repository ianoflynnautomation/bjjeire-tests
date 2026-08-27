import { GymStatus, type ClassCategory, type GymDto } from '@api/features/gyms/gyms.types';
import type { GymCard } from './gyms.types';

const CLASS_CATEGORY_LABELS: Partial<Record<ClassCategory, string>> = {
  BJJGiAllLevels: 'BJJ Gi (All Levels)',
  BJJNoGiAllLevels: 'BJJ No-Gi (All Levels)',
  KidsBJJ: 'Kids BJJ',
  WomensOnly: "Women's Only",
  Wrestling: 'Wrestling',
};

// Mirrors frontend getGymStatusLabel, then the badge `uppercase` class.
// Playwright innerText() returns the rendered (uppercased) copy.
const STATUS_BADGE_LABELS: Record<GymStatus, string> = {
  [GymStatus.Active]: 'ACTIVE',
  [GymStatus.PendingApproval]: 'PENDING APPROVAL',
  [GymStatus.TemporarilyClosed]: 'TEMPORARILY CLOSED',
  [GymStatus.PermanentlyClosed]: 'PERMANENTLY CLOSED',
  [GymStatus.OpeningSoon]: 'OPENING SOON',
  [GymStatus.Draft]: 'DRAFT',
  [GymStatus.Rejected]: 'REJECTED',
};

function classLabel(category: ClassCategory): string {
  const label = CLASS_CATEGORY_LABELS[category];
  if (!label) throw new Error(`No UI label mapped for class category '${category}' — add it to CLASS_CATEGORY_LABELS`);
  return label;
}

function statusBadgeLabel(status: GymStatus): string {
  const label = STATUS_BADGE_LABELS[status];
  if (!label) throw new Error(`No UI badge label mapped for gym status '${status}' — add it to STATUS_BADGE_LABELS`);
  return label;
}

export function gymCardFromDto(gym: GymDto): GymCard {
  return {
    name: gym.name,
    status: statusBadgeLabel(gym.status),
    county: `${gym.county} County`,
    classes: gym.offeredClasses.map(classLabel),
  };
}
