import { openApiPageSchema } from '@api/support';
import { zPagedResponseCompetitionDto } from '@api/generated/zod.gen';
import type { CompetitionDto } from './competitions.types';

export const competitionsPageSchema = openApiPageSchema<CompetitionDto>(zPagedResponseCompetitionDto);
