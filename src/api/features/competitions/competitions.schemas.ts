import { openApiPageSchema } from '@api/generated/wire';
import { zPagedResponseCompetitionDto } from '@api/generated/zod.gen';
import type { CompetitionDto } from './competitions.types';

export const competitionsPageSchema = openApiPageSchema<CompetitionDto>(zPagedResponseCompetitionDto);
