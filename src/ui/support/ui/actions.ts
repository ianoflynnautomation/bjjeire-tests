import type { Page, Response } from '@playwright/test';
import { LOADSTATE } from '@shared/config';

type GotoOptions = Parameters<Page['goto']>[1];

export async function gotoURL(
  page: Page,
  path: string,
  options: GotoOptions = { waitUntil: LOADSTATE },
): Promise<Response | null> {
  return page.goto(path, options);
}
