import { type ClassCategory, type GymDto } from '@api/features/gyms/gyms.types';
import type { GymCard } from './gyms.types';

const CLASS_CATEGORY_LABELS: Partial<Record<ClassCategory, string>> = {
  BJJGiAllLevels: 'BJJ Gi (All Levels)',
  BJJNoGiAllLevels: 'BJJ No-Gi (All Levels)',
  KidsBJJ: 'Kids BJJ',
  WomensOnly: "Women's Only",
  Wrestling: 'Wrestling',
};

function classLabel(category: ClassCategory): string {
  const label = CLASS_CATEGORY_LABELS[category];
  if (!label) throw new Error(`No UI label mapped for class category '${category}' — add it to CLASS_CATEGORY_LABELS`);
  return label;
}

export function gymCardFromDto(gym: GymDto): GymCard {
  return {
    name: gym.name,
    status: gym.status,
    county: `${gym.county} County`,
    classes: gym.offeredClasses.map(classLabel),
  };
}
