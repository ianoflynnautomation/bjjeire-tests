import { expect } from '@playwright/test';
import { gotoURL } from '../utils/action-utils';
import { BasePage } from './base-page';

export class LoginPage extends BasePage {
  private readonly usernameInput = () =>
    this.page.locator('#user-name').or(this.page.getByPlaceholder('Username', { exact: true }));
  private readonly passwordInput = () =>
    this.page.locator('#password').or(this.page.getByPlaceholder('Password', { exact: true }));
  private readonly loginButton = () => this.page.getByRole('button', { name: 'Login' });
  private readonly errorMessage = () => this.page.locator('[data-test="error"]');

  async navigate(): Promise<void> {
    await gotoURL(this.page, '/');
  }

  async verifyIsLoaded(): Promise<void> {
    await expect(this.page.locator('#user-name')).toBeVisible();
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput().fill(username);
    await this.passwordInput().fill(password);
    await this.loginButton().click();
  }

  async verifyErrorMessage(text: string | RegExp): Promise<void> {
    await expect(this.errorMessage()).toContainText(text);
  }
}
