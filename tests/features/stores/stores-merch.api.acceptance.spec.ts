// spec: specs/features/shop.md
// seed: tests/agents/seed.spec.ts
import { faker } from '@faker-js/faker';
import { test, expect } from '@api/fixtures';
import { productSchema, productsPageSchema } from '@api/features/stores/products.schemas';
import { getProductBySlug, getProducts } from '@api/features/stores/products.service';
import {
  API_ROUTES,
  expectListingToInclude,
  expectProblem,
  expectRelativeOrder,
  ProblemType,
  resourcePath,
  ValidationErrorCode,
} from '@api/support';
import { squash } from '@squash/annotations';
import { OUT_OF_RANGE_PAGING_VALUES } from '../common/testdata/invalid-values';
import { merchSwitchedOnGiven } from './merch-switched-on';
import { SEEDED_PRODUCT_HARP_RASHGUARD, SEEDED_PRODUCTS_BY_CATALOGUE_ORDER } from './seeded';

// The environment's own auth is switched off so the calls under test are anonymous. Only the create call sends a body
// (a unique slug, so a bypass could not poison a later run); the other calls send none. Create is the contract's
// `POST /product/admin`.
const ADMIN_PRODUCTS = `${API_ROUTES.products}/admin`;

const SHOP_ADMIN_ACTIONS = [
  { action: "listing the organiser's products", call: () => ({ method: 'GET', path: ADMIN_PRODUCTS }) },
  {
    action: 'creating a product',
    call: () => ({
      method: 'POST',
      path: ADMIN_PRODUCTS,
      data: {
        slug: `pw-refused-${faker.string.alphanumeric({ length: 10, casing: 'lower' })}`,
        name: 'PW Refused Product',
        kind: 'T_SHIRT',
        description: 'Never created',
        priceCents: 1000,
        sizes: [{ id: 'M', available: 1 }],
      },
    }),
  },
  {
    action: 'publishing a product',
    call: (id: string) => ({ method: 'POST', path: `${resourcePath(ADMIN_PRODUCTS, id)}/publish` }),
  },
] as const;

const FULL_PAGE_SIZE = 100;
const PHOTO_HASH_LENGTH = 64;

const MISSING_RESOURCES = [
  {
    resource: 'a product',
    path: () =>
      resourcePath(
        API_ROUTES.products,
        `no-such-product-${faker.string.alphanumeric({ length: 12, casing: 'lower' })}`,
      ),
  },
  { resource: 'a photo', path: () => resourcePath(API_ROUTES.productPhotos, '0'.repeat(PHOTO_HASH_LENGTH)) },
] as const;

test.describe('Merch API acceptance', { tag: ['@stores', '@api', '@merch-on', '@squash'] }, () => {
  const merchSwitchedOn = merchSwitchedOnGiven();

  test(
    'client should receive the merch catalogue ordered by kind and then name',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ request }) => {
      await test.step('Given the merch shop is switched on', merchSwitchedOn);

      const { data } = await test.step('When a client requests the merch catalogue', () =>
        getProducts(request, productsPageSchema, { page: 1, pageSize: FULL_PAGE_SIZE }));

      await test.step('Then the seeded rashguard is listed before the seeded shorts', () => {
        expectRelativeOrder(
          data,
          product => product.slug,
          SEEDED_PRODUCTS_BY_CATALOGUE_ORDER.slice(0, 2).map(product => product.slug),
        );
      });

      await test.step('And the seeded shorts are listed before the seeded t-shirt', () => {
        expectRelativeOrder(
          data,
          product => product.slug,
          SEEDED_PRODUCTS_BY_CATALOGUE_ORDER.slice(1).map(product => product.slug),
        );
      });

      await test.step('And each seeded product carries its price in cents and its currency', () => {
        expectListingToInclude(
          data,
          'slug',
          SEEDED_PRODUCTS_BY_CATALOGUE_ORDER.map(({ slug, priceCents, currency }) => ({ slug, priceCents, currency })),
        );
      });
    },
  );

  for (const { param, field, value } of OUT_OF_RANGE_PAGING_VALUES) {
    test(
      `client should get a validation error on ${param} when ${param} ${value} is out of range for the merch catalogue`,
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ request }) => {
        await test.step('Given the merch shop is switched on', merchSwitchedOn);

        const response = await test.step(`When a client requests the merch catalogue with ${param} ${value}`, () =>
          request.get(API_ROUTES.products, { params: { [param]: value } }));

        await test.step(`Then the request is rejected because ${param} is out of range`, async () => {
          const problem = await expectProblem(response, 400, ProblemType.Validation);
          expect(problem.errors).toContainEqual(
            expect.objectContaining({ field, errorCode: ValidationErrorCode.ValueOutOfRange }),
          );
        });
      },
    );
  }

  for (const { resource, path } of MISSING_RESOURCES) {
    test(
      `client should get not found for ${resource} that does not exist`,
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ request }) => {
        await test.step('Given the merch shop is switched on', merchSwitchedOn);

        const response = await test.step(`When a client requests ${resource} that does not exist`, () =>
          request.get(path()));

        const problem = await test.step('Then the response is a not-found problem document', () =>
          expectProblem(response, 404, ProblemType.NotFound));

        await test.step('And it carries a trace id', () => {
          expect(problem.traceId).toBeTruthy();
        });
      },
    );
  }

  test.describe('without signing in', () => {
    test.use({ requestAuth: 'none' });

    for (const { action, call } of SHOP_ADMIN_ACTIONS) {
      test(
        `client should be refused ${action} in the shop admin without signing in`,
        {
          tag: '@acceptance',
          annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'security', type: 'regression' }),
        },
        async ({ request, extraHTTPHeaders }) => {
          await test.step('Given the merch shop is switched on', () => {
            merchSwitchedOn();
            expect(Object.keys(extraHTTPHeaders ?? {}).map(name => name.toLowerCase())).not.toContain('authorization');
          });

          const rashguard = await test.step('And the seeded rashguard is published', async () => {
            const product = await getProductBySlug(request, productSchema, SEEDED_PRODUCT_HARP_RASHGUARD.slug);
            expect(product.id).toBeTruthy();
            return product;
          });

          const response = await test.step(`When a client asks for ${action} without a token`, () => {
            const { method, path, ...rest } = call(rashguard.id);
            return request.fetch(path, { method, ...rest });
          });

          await test.step('Then the response is an unauthorised problem document', async () => {
            await expectProblem(response, 401, ProblemType.Unauthorized);
          });
        },
      );
    }
  });
});
