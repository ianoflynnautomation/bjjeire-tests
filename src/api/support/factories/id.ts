import { ObjectId } from 'mongodb';
import type { EntityId } from '@api/support/types';

export function createEntityId(): EntityId {
  return new ObjectId().toHexString() as EntityId;
}
