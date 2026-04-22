import {
  MongoClient,
  type Db,
  type Collection,
  type Document,
  type Filter,
  type OptionalUnlessRequiredId,
} from 'mongodb';
import { env } from '@api/support/config';
import type { RunId } from '@api/support/types';

export type MongoConfig = {
  readonly url?: string;
  readonly dbName?: string;
};

export type MongoHandle = {
  readonly client: MongoClient;
  readonly db: Db;
  readonly collection: <T extends Document>(name: string) => Collection<T>;
  readonly close: () => Promise<void>;
};

export type TaggedDoc<T> = T & { __runId: RunId };

export async function connectMongo(config: MongoConfig = {}): Promise<MongoHandle> {
  const url = config.url ?? env.mongoUrl;
  const dbName = config.dbName ?? env.mongoDb;
  const client = new MongoClient(url);
  await client.connect();
  const db = client.db(dbName);
  return {
    client,
    db,
    collection: <T extends Document>(name: string) => db.collection<T>(name),
    close: () => client.close(),
  };
}

export async function seedCollection<T extends Document>(
  db: Db,
  collection: string,
  runId: RunId,
  docs: readonly T[],
): Promise<TaggedDoc<T>[]> {
  if (docs.length === 0) return [];
  const tagged = docs.map(doc => ({ ...doc, __runId: runId })) as TaggedDoc<T>[];
  await db.collection<Document>(collection).insertMany(tagged as unknown as OptionalUnlessRequiredId<Document>[]);
  return tagged;
}

export async function cleanupByRunId(db: Db, runId: RunId, collections: readonly string[]): Promise<void> {
  const filter: Filter<Document> = { __runId: runId };
  await Promise.all(collections.map(name => db.collection(name).deleteMany(filter)));
}

export async function findOne<T extends Document>(db: Db, collection: string, filter: Filter<T>): Promise<T | null> {
  return (await db.collection<T>(collection).findOne(filter)) as T | null;
}

export async function countByRunId(db: Db, collection: string, runId: RunId): Promise<number> {
  return db.collection(collection).countDocuments({ __runId: runId });
}
