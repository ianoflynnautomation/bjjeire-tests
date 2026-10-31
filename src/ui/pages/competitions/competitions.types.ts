export type CompetitionCard = Readonly<{
  name: string;
  organisation: string | null;
  date: string | null;
  description: string | null;
  tags: string[];
}>;

export type CompetitionCardLinks = Readonly<{
  name: string;
  website: string;
  registration: string;
}>;
