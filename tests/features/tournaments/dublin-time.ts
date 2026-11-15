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

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/** `2 June 2035` for a `YYYY-MM-DD` day: a day carries no time zone, so it is read as written. */
export function longDay(day: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(day);
  const month = match ? MONTHS[Number(match[2]) - 1] : undefined;
  if (!match || !month) throw new Error(`Not a day: '${day}'`);
  return `${Number(match[3])} ${month} ${match[1]}`;
}
