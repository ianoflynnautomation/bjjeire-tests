export type GymCard = Readonly<{
  name: string;
  status: string | null;
  county: string;
  classes: string[];
}>;
