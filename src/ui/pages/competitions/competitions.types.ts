export type CompetitionCard = Readonly<{
  name: string;
  organisation: string | null;
  date: string | null;
  description: string | null;
  tags: string[];
}>;
