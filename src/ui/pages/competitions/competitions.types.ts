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

export type FeaturedCompetitionExpectation = Readonly<{
  name: string;
  date: string;
  venue: string;
  fee: string;
  divisions: string;
  status: string;
}>;

/** The details a competitor types into the profile form; the labels are the app's, the values are the test's. */
export type ProfileDetails = Readonly<{
  firstName: string;
  lastName: string;
  nationality: string;
  dateOfBirth: string;
  gender: string;
  belt: string;
}>;
