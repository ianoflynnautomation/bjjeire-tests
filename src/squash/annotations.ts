import type { TestDetailsAnnotation } from '@playwright/test';

/**
 * A field left out stays as Squash has it. Nature and type accept Squash's
 * default info-list names, or a project-specific code such as
 * `'NAT_CONTRACT_TESTING'`, which Squash validates at sync time.
 */
export type SquashFields = Readonly<{
  weight?: 'low' | 'medium' | 'high' | 'very high';
  status?: 'work in progress' | 'under review' | 'approved' | 'obsolete' | 'to be updated';
  nature?: keyof typeof NATURE_CODES | CustomCode;
  type?: keyof typeof TYPE_CODES | CustomCode;
}>;

/** Any other info-list code; `string & {}` keeps the known values in autocomplete. */
type CustomCode = string & {};

const NATURE_CODES = {
  functional: 'NAT_FUNCTIONAL_TESTING',
  business: 'NAT_BUSINESS_TESTING',
  user: 'NAT_USER_TESTING',
  'non functional': 'NAT_NON_FUNCTIONAL_TESTING',
  performance: 'NAT_PERFORMANCE_TESTING',
  security: 'NAT_SECURITY_TESTING',
  atdd: 'NAT_ATDD',
} as const;

const TYPE_CODES = {
  compliance: 'TYP_COMPLIANCE_TESTING',
  correction: 'TYP_CORRECTION_TESTING',
  evolution: 'TYP_EVOLUTION_TESTING',
  regression: 'TYP_REGRESSION_TESTING',
  'end to end': 'TYP_END_TO_END_TESTING',
  partner: 'TYP_PARTNER_TESTING',
} as const;

function codeOf(codes: Readonly<Record<string, string>>, value: string): string {
  return Object.hasOwn(codes, value) ? (codes[value] ?? value) : value;
}

export function squash(fields: SquashFields): TestDetailsAnnotation[] {
  const values = {
    weight: fields.weight,
    status: fields.status,
    nature: fields.nature === undefined ? undefined : codeOf(NATURE_CODES, fields.nature),
    type: fields.type === undefined ? undefined : codeOf(TYPE_CODES, fields.type),
  };
  return Object.entries(values).flatMap(([field, description]) =>
    description === undefined ? [] : [{ type: `squash:${field}`, description }],
  );
}
