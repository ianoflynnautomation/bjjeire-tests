export type BjjEventCard = Readonly<{
  name: string;
  type: string;
  county: string;
  pricing: string | null;
  schedule: string | null;
  /** Session lines without their leading date (dates are relative to seed time). */
  sessions: readonly string[];
  address: string | null;
  mapUrl: string | null;
  organiserUrl: string | null;
  moreInfoUrl: string | null;
}>;
