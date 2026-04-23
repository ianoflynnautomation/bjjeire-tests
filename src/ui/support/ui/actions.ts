import type { Page, Response } from '@playwright/test';
import type { GotoOptions } from '@ui/support/types';
import { LOADSTATE } from '@shared/config';

export async function gotoURL(
  page: Page,
  path: string,
  options: GotoOptions = { waitUntil: LOADSTATE },
): Promise<Response | null> {
  return page.goto(path, options);
}
