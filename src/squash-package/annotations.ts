/**
 * `@squash/annotations` lands here so specs keep their import.
 * The specifier has no `.js` suffix on purpose. TypeScript binds it to the
 * sibling `.d.ts`. Playwright resolves the same specifier to `annotations.js`.
 * A path straight at that `.js` file is untyped, and a path at the `.d.ts`
 * is a file Node will not load from `node_modules`.
 */
export { squash, type SquashFields } from '../../node_modules/@playwright-squash/playwright-squash/dist/annotations';
