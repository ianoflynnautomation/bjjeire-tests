import { ObjectId } from 'bson';

export function createEntityId(): string {
  return new ObjectId().toHexString();
}
