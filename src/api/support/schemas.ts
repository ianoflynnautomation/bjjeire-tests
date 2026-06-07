import { z } from 'zod';

export const featureFlagMapSchema = z.record(z.string(), z.boolean());

export const problemDetailsSchema = z
  .object({
    type: z.string().optional(),
    title: z.string().optional(),
    status: z.number().optional(),
    detail: z.string().optional(),
    instance: z.string().optional(),
  })
  .loose();

export type FeatureFlagMap = z.infer<typeof featureFlagMapSchema>;
export type ProblemDetails = z.infer<typeof problemDetailsSchema>;
