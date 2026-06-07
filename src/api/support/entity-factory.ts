import { ObjectId } from 'mongodb';
import type { EntityId } from '@shared/types';

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function createEntityId<TId extends string = EntityId>(): TId {
  return new ObjectId().toHexString() as TId;
}
