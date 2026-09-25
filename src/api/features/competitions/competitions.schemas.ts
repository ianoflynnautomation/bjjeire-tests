import type { ZodType } from 'zod';
import { openApiPageSchema } from '@api/generated/wire';
import { zPagedResponseCompetitionDto } from '@api/generated/zod.gen';
import type { PaginatedResponse } from '@api/support';
import type { CompetitionDto } from './competitions.types';

export const competitionsPageSchema = openApiPageSchema(zPagedResponseCompetitionDto) as ZodType<
  PaginatedResponse<CompetitionDto>
>;
