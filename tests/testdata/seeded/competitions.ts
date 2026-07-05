import type { CompetitionDto } from '@api/features/competitions/competitions.types';
import type { CompetitionId } from '@shared/types';

const competitionId = (id: string): CompetitionId => id as CompetitionId;

export const SEEDED_COMPETITION_ATHLONE_INVITATIONAL: CompetitionDto = {
  id: competitionId('acce77000000000000000001'),
  slug: 'athlone-grappling-invitational',
  name: 'Athlone Grappling Invitational',
  description: 'Midlands gi and no-gi invitational held in Athlone.',
  organisation: 'Athlone Grappling',
  country: 'Ireland',
  websiteUrl: 'https://athlone-grappling.example.ie/invitational',
  registrationUrl: 'https://athlone-grappling.example.ie/invitational/register',
  tags: ['gi', 'no-gi', 'invitational'],
  isActive: true,
};

export const SEEDED_COMPETITION_WICKLOW_NO_GI: CompetitionDto = {
  id: competitionId('acce77000000000000000002'),
  slug: 'wicklow-no-gi-open',
  name: 'Wicklow No-Gi Open',
  description: 'One-day no-gi submission-only open in Wicklow.',
  organisation: 'Wicklow BJJ',
  country: 'Ireland',
  websiteUrl: 'https://wicklowbjj.example.ie/no-gi-open',
  registrationUrl: 'https://wicklowbjj.example.ie/no-gi-open/register',
  tags: ['no-gi', 'submission-only', 'open'],
  isActive: true,
};

export const SEEDED_COMPETITION_SHANNONSIDE_CHAMPIONSHIP: CompetitionDto = {
  id: competitionId('acce77000000000000000003'),
  slug: 'shannonside-bjj-championship',
  name: 'Shannonside BJJ Championship',
  description: 'Regional gi championship along the Shannon.',
  organisation: 'Shannonside Grappling',
  country: 'Ireland',
  websiteUrl: 'https://shannonside-grappling.example.ie/championship',
  registrationUrl: 'https://shannonside-grappling.example.ie/championship/register',
  tags: ['gi', 'championship'],
  isActive: true,
};

export const SEEDED_COMPETITION_DONEGAL_GI_CLASSIC: CompetitionDto = {
  id: competitionId('acce77000000000000000004'),
  slug: 'donegal-winter-gi-classic',
  name: 'Donegal Winter Gi Classic',
  description: 'North-west winter gi tournament in Letterkenny.',
  organisation: 'Donegal BJJ',
  country: 'Ireland',
  websiteUrl: 'https://donegalbjj.example.ie/winter-gi-classic',
  registrationUrl: 'https://donegalbjj.example.ie/winter-gi-classic/register',
  tags: ['gi', 'winter'],
  isActive: true,
};

export const SEEDED_COMPETITION_FINISHED_KERRY_COAST: CompetitionDto = {
  id: competitionId('acce77000000000000000005'),
  slug: 'kerry-coast-open-mat',
  name: 'Kerry Coast Open Mat',
  description:
    'Casual coastal open-mat gathering — already finished, used to prove past competitions are excluded from the published listing.',
  organisation: 'Kerry Coast BJJ',
  country: 'Ireland',
  websiteUrl: 'https://kerrycoastbjj.example.ie/open-mat',
  tags: ['open-mat', 'social'],
  isActive: true,
};

export const SEEDED_COMPETITIONS_BY_START_DATE: readonly CompetitionDto[] = [
  SEEDED_COMPETITION_ATHLONE_INVITATIONAL,
  SEEDED_COMPETITION_WICKLOW_NO_GI,
  SEEDED_COMPETITION_SHANNONSIDE_CHAMPIONSHIP,
  SEEDED_COMPETITION_DONEGAL_GI_CLASSIC,
];
