import { z } from 'zod';
import { expectSchema } from '@api/support';

const registrationWindowSchema = z.object({
  registrationOpensAt: z.iso.datetime({ offset: true }),
  registrationClosesAt: z.iso.datetime({ offset: true }),
});

export type RegistrationWindow = z.infer<typeof registrationWindowSchema>;

/**
 * The seeded tournament's registration instants from an API response body. The seed sets them relative
 * to the seed run, so tests read them at run time. Offset-less local times are refused, so the oracle cannot shift.
 */
export function registrationWindowFrom(body: unknown): RegistrationWindow {
  return expectSchema(registrationWindowSchema, body);
}
