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

const MS_PER_DAY = 86_400_000;
const MARCH = 2;
const OCTOBER = 9;
const DAYS_IN_LONG_MONTH = 31;

/** A calendar day as a day number (days since 1970-01-01), so gaps are plain subtraction. */
export type DayNumber = number;

export type RenderedDateRange = Readonly<{ start: DayNumber; end: DayNumber }>;

const dayNumber = (year: number, monthIndex: number, day: number): DayNumber =>
  Math.round(Date.UTC(year, monthIndex, day) / MS_PER_DAY);

type DateParts = { day: number; month?: number; year?: number };

const DAY_PATTERN = /^\d{1,2}$/;
const MIN_DAY = 1;

function readParts(text: string, line: string): DateParts {
  const [dayText = '', monthText, yearText] = text.trim().split(/\s+/);
  const day = DAY_PATTERN.test(dayText) ? Number(dayText) : Number.NaN;
  if (!(day >= MIN_DAY && day <= DAYS_IN_LONG_MONTH)) throw new Error(`No day 1 to 31 in "${text}" of "${line}"`);
  let month: number | undefined;
  if (monthText !== undefined) {
    month = MONTHS.indexOf(monthText as (typeof MONTHS)[number]);
    if (month < 0) throw new Error(`Unknown month "${monthText}" in "${line}"`);
  }
  return {
    day,
    ...(month === undefined ? {} : { month }),
    ...(yearText === undefined ? {} : { year: Number(yearText) }),
  };
}

/**
 * Reads the first line of a card's or popup's schedule text: `10 November 2026`, `23–25 November 2026`,
 * `30 November – 2 December 2026` or `7 November 2026 – 4 January 2027`. Later lines (session times) are ignored.
 */
export function parseRenderedDateRange(text: string): RenderedDateRange {
  const firstLine = text.split('\n')[0] ?? '';
  const [startText = '', endText] = firstLine.split(/\s*–\s*/);
  const end = readParts(endText ?? startText, firstLine);
  if (end.month === undefined || end.year === undefined) throw new Error(`No month and year in "${firstLine}"`);
  const start = readParts(startText, firstLine);
  return {
    start: dayNumber(start.year ?? end.year, start.month ?? end.month, start.day),
    end: dayNumber(end.year, end.month, end.day),
  };
}

function lastSundayOf(year: number, monthIndex: number): DayNumber {
  const last = dayNumber(year, monthIndex, DAYS_IN_LONG_MONTH);
  const weekday = new Date(last * MS_PER_DAY).getUTCDay();
  // Sunday is day 0, so the last Sunday is `weekday` days back.
  return last - weekday;
}

/** Which Irish clock changes (last Sunday of March or October) fall between the two days, inclusive. */
function clockChangesBetween(from: DayNumber, to: DayNumber): { march: boolean; october: boolean } {
  const found = { march: false, october: false };
  const fromYear = new Date(from * MS_PER_DAY).getUTCFullYear();
  const toYear = new Date(to * MS_PER_DAY).getUTCFullYear();
  for (let year = fromYear; year <= toYear; year += 1) {
    const march = lastSundayOf(year, MARCH);
    const october = lastSundayOf(year, OCTOBER);
    if (march >= from && march <= to) found.march = true;
    if (october >= from && october <= to) found.october = true;
  }
  return found;
}

/**
 * Whether a forward gap in rendered days (`from` earlier than `to`) is the gap the seeder set. The seeder adds
 * whole 24-hour days to one instant and the app shows the Irish calendar day. Clocks going forward in March can
 * push an instant near midnight into the next day (+1); going back in October into the previous day (-1).
 * Only that signed difference is allowed, and only for a pair of dates that span the change.
 */
export function gapMatchesSeed(
  renderedGap: number,
  seededGap: number,
  between: Readonly<{ from: DayNumber; to: DayNumber }>,
): boolean {
  const difference = renderedGap - seededGap;
  if (difference === 0) return true;
  const changes = clockChangesBetween(between.from, between.to);
  return (difference === 1 && changes.march) || (difference === -1 && changes.october);
}
