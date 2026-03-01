import { test } from '@fixtures/base-fixtures';
import { users } from '@testdata/users';

test.describe.configure({ mode: 'parallel' });

test.describe('Login @smoke', () => {
  test('successful login displays the Products page @smoke', async ({ loginPage, productsPage }) => {
    await loginPage.navigate();
    await loginPage.login(users.standard.username, users.standard.password);
    await productsPage.verifyIsLoaded();
  });

  test('locked-out user sees an error message @smoke', async ({ loginPage }) => {
    await loginPage.navigate();
    await loginPage.login(users.locked.username, users.locked.password);
    await loginPage.verifyErrorMessage(/locked out/i);
  });

  test('empty credentials show a required-field error @smoke', async ({ loginPage }) => {
    await loginPage.navigate();
    await loginPage.login('', '');
    await loginPage.verifyErrorMessage(/username is required/i);
  });
});
