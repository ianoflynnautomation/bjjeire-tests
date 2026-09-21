import { type Locator, type Page } from '@playwright/test';
import { ENTRA_COPY } from './microsoft.login.constants';

export const emailInput = (page: Page): Locator =>
  page
    .getByRole('textbox', { name: ENTRA_COPY.emailField })
    .or(page.getByPlaceholder(ENTRA_COPY.emailField))
    .or(page.locator('input[name="loginfmt"]'));

export const passwordInput = (page: Page): Locator =>
  page
    .getByLabel(ENTRA_COPY.passwordField)
    .or(page.getByRole('textbox', { name: ENTRA_COPY.passwordField }))
    .or(page.locator('input[name="passwd"], input[type="password"]'));

export const primaryButton = (page: Page): Locator =>
  page
    .getByRole('button', { name: ENTRA_COPY.nextOrSignIn })
    .or(page.getByTestId('primaryButton'))
    .or(page.locator('#idSIButton9'));

export const otherWaysToSignIn = (page: Page): Locator => page.getByRole('button', { name: ENTRA_COPY.otherWays });

export const useYourPassword = (page: Page): Locator => page.getByRole('button', { name: ENTRA_COPY.usePassword });

export const staySignedInPrompt = (page: Page): Locator => page.getByText(ENTRA_COPY.staySignedIn);

export const staySignedInYes = (page: Page): Locator =>
  page.getByRole('button', { name: ENTRA_COPY.kmsiYes }).or(page.getByTestId('primaryButton'));

export const staySignedInNo = (page: Page): Locator =>
  page
    .getByRole('button', { name: ENTRA_COPY.kmsiNo })
    .or(page.getByTestId('secondaryButton'))
    .or(page.locator('#idBtn_Back'));

export const useAnotherAccount = (page: Page): Locator =>
  page
    .getByRole('button', { name: ENTRA_COPY.useAnotherAccount })
    .or(page.getByRole('link', { name: ENTRA_COPY.useAnotherAccount }));

export const accountTile = (page: Page, username: string): Locator =>
  page.getByRole('button', { name: username }).or(page.getByText(username, { exact: true }));

export const permissionsPrompt = (page: Page): Locator => page.getByText(ENTRA_COPY.permissionsRequested);

export const acceptConsent = (page: Page): Locator => page.getByRole('button', { name: ENTRA_COPY.accept });

export const entraError = (page: Page): Locator =>
  page.getByRole('alert').or(page.locator('#usernameError, #passwordError, #errorText'));
