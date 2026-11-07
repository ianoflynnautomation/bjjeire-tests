import { BjjEventType } from '@api/features/events/events.types';
import {
  SEEDED_EVENT_ATLANTIC_COAST_CAMP,
  SEEDED_EVENT_DUBLIN_NO_GI_SEMINAR,
  SEEDED_EVENT_TRIBES_NO_GI_CAMP,
  SEEDED_UPCOMING_EVENTS,
} from '../seeded';
import { pinsFor, type Pin } from './unmapped-location';

export type MapView = Readonly<{ label: string; query: string; pins: readonly Pin[] }>;

/** Two camps in different counties: one response holding two places, so a swapped coordinate changes a link. */
const CAMP_VIEW_EVENTS = [SEEDED_EVENT_TRIBES_NO_GI_CAMP, SEEDED_EVENT_ATLANTIC_COAST_CAMP];

/**
 * The narrowed map views that together show every seeded pin once: the Camp view, then one view per county for
 * the remaining pins (each is on the map whatever else a full dataset holds). Throws if a pin is in two views
 * or one is left out, so the list cannot drift from the seeded events.
 */
export function seededMapViews(): MapView[] {
  const allPins = pinsFor([...SEEDED_UPCOMING_EVENTS, SEEDED_EVENT_DUBLIN_NO_GI_SEMINAR]);
  const campVenues = new Set(pinsFor(CAMP_VIEW_EVENTS).map(pin => pin.venue));
  const campPins = allPins.filter(pin => campVenues.has(pin.venue));
  const views: MapView[] = [{ label: 'camps', query: `types=${BjjEventType.Camp}`, pins: campPins }];
  const byCounty = new Map<string, Pin[]>();
  for (const pin of allPins.filter(candidate => !campVenues.has(candidate.venue))) {
    const county = pin.events[0].county;
    byCounty.set(county, [...(byCounty.get(county) ?? []), pin]);
  }
  for (const [county, pins] of byCounty) views.push({ label: county, query: `county=${county}`, pins });

  const covered = views.flatMap(view => view.pins.map(pin => pin.venue));
  if (new Set(covered).size !== covered.length) throw new Error(`A pin is in two map views: ${covered.join(', ')}`);
  if (covered.length !== allPins.length) throw new Error('Some seeded pins are in no map view');
  return views;
}
