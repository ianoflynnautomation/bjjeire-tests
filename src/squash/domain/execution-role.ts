/**
 * What an execution row is for. The marker is written into the comment, because
 * the execution list does not return comments and a later publish has to tell
 * a release row from the test case's execution.
 */
export const ExecutionRole = {
  TestCase: 'test-case',
  Release: 'release',
} as const;

export type ExecutionRole = (typeof ExecutionRole)[keyof typeof ExecutionRole];

const RELEASE_MARKER = '<strong>Release execution</strong>';
const TEST_CASE_MARKER = '<strong>Test case execution</strong>';

/** The comment fragment that identifies `role`. Error text cannot forge it: it is HTML-escaped. */
export function executionMarker(role: ExecutionRole): string {
  return role === ExecutionRole.Release ? RELEASE_MARKER : TEST_CASE_MARKER;
}

/**
 * A comment without the release marker is the test case's execution. That
 * includes rows written before markers existed.
 */
export function executionRoleOf(comment: string): ExecutionRole {
  return comment.includes(RELEASE_MARKER) ? ExecutionRole.Release : ExecutionRole.TestCase;
}
