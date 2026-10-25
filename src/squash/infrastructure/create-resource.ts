import type { SquashClient } from './squash-client';
import { createdSchema, parseWire } from './rest-schemas';

/** POSTs a resource and returns the id Squash assigned. */
export async function createResource(client: SquashClient, path: string, body?: object): Promise<number> {
  const response = await client.send({ method: 'POST', path, ...(body === undefined ? {} : { body }) });
  return parseWire(createdSchema, response, `POST ${path}`).id;
}
