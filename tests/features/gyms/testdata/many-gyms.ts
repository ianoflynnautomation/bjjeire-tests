import { type GymDto } from '@api/features/gyms/gyms.types';
import type { County } from '@api/support';
import type { GymId } from '@shared/types';
import { SEEDED_GYM_LIFFEY_GRAPPLING } from '../seeded';

const HEX = 16;
const ID_SUFFIX_LENGTH = 4;

/** `total` distinct gyms in one county, named `<county> Gym <n>` so a page's contents are obvious. */
export function manyGymsIn(county: County, total: number): GymDto[] {
  return Array.from({ length: total }, (_, i): GymDto => {
    const suffix = (county.length * HEX * HEX + i).toString(HEX).padStart(ID_SUFFIX_LENGTH, '0');
    return {
      ...SEEDED_GYM_LIFFEY_GRAPPLING,
      id: `acce77e0000000000000${suffix}` as GymId,
      name: `${county} Gym ${String(i + 1).padStart(2, '0')}`,
      county,
    };
  });
}
