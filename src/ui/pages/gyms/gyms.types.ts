export type GymCard = Readonly<{
  name: string;
  status: string | null;
  county: string;
  classes: readonly string[];
}>;

export type GymCardLinks = Readonly<{
  name: string;
  website: string;
  map: string;
}>;
