import { ObjectId } from 'mongodb';
import type { EntityId } from '@shared/types';

export function createEntityId(): EntityId {
  return new ObjectId().toHexString() as EntityId;
}
