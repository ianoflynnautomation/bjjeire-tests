import type { Page, Response } from '@playwright/test';
import { type GotoOptions } from './types/optional-parameter-types';

export async function goToPage(
  page: Page,
  path: string,
  options: GotoOptions = { waitUntil: LOADSTATE },
): Promise<Response | null> {
  return page.goto(path, options);
}
