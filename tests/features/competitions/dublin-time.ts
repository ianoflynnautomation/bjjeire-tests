// An independent rendering of Irish time for the oracles: built from `formatToParts` on the en-GB locale
// and written here, not the app's formatter. Seeded windows move with the seed run, so tests state them
// as the API's instants shown on the Irish clock.
const DUBLIN = 'Europe/Dublin';

const parts = new Intl.DateTimeFormat('en-GB', {
  timeZone: DUBLIN,
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** `7 November 2026, 06:03` for an ISO instant, as the clock reads in Ireland. */
export function dublinDateTime(iso: string): string {
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) throw new Error(`Not an instant: '${iso}'`);
  const read = Object.fromEntries(parts.formatToParts(instant).map(part => [part.type, part.value]));
  return `${read['day']} ${read['month']} ${read['year']}, ${read['hour']}:${read['minute']}`;
}
