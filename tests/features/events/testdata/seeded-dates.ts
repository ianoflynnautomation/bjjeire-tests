import { gapMatchesSeed, type RenderedDateRange } from '@ui/pages/events/events.dates';
import { SEEDED_EVENT_SCHEDULE_OFFSETS } from '../seeded';

/**
 * Compares the dates shown for the seeded dated events (by event name) with the seeded offsets: how many
 * days each event runs, and how far apart the events start. Returns what disagrees, empty when all agree.
 * An event with no shown dates is reported, so a missing card or popup cannot pass.
 */
export function seededDateProblems(shown: ReadonlyMap<string, RenderedDateRange>): string[] {
  const problems: string[] = [];
  const [first, ...others] = SEEDED_EVENT_SCHEDULE_OFFSETS;
  const firstRange = first && shown.get(first.event.name);
  for (const { event, startOffsetDays, endOffsetDays } of SEEDED_EVENT_SCHEDULE_OFFSETS) {
    const range = shown.get(event.name);
    if (!range) {
      problems.push(`no dates shown for ${event.name}`);
      continue;
    }
    const renderedDays = range.end - range.start;
    const seededDays = endOffsetDays - startOffsetDays;
    if (!gapMatchesSeed(renderedDays, seededDays, { from: range.start, to: range.end }))
      problems.push(`${event.name} runs ${renderedDays} days, seeded ${seededDays}`);
  }
  if (first && firstRange)
    for (const { event, startOffsetDays } of others) {
      const range = shown.get(event.name);
      if (!range) continue;
      const rendered = range.start - firstRange.start;
      const seeded = startOffsetDays - first.startOffsetDays;
      if (!gapMatchesSeed(rendered, seeded, { from: firstRange.start, to: range.start }))
        problems.push(`${event.name} starts ${rendered} days after ${first.event.name}, seeded ${seeded}`);
    }
  return problems;
}
