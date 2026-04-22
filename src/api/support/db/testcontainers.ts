import { MongoDBContainer, type StartedMongoDBContainer } from '@testcontainers/mongodb';

export type StartedMongo = {
  readonly container: StartedMongoDBContainer;
  readonly connectionString: string;
  readonly stop: () => Promise<void>;
};

export async function startMongoContainer(image = 'mongo:7.0'): Promise<StartedMongo> {
  const container = await new MongoDBContainer(image).start();
  const connectionString = `${container.getConnectionString()}?directConnection=true`;
  return {
    container,
    connectionString,
    async stop() {
      await container.stop();
    },
  };
}
