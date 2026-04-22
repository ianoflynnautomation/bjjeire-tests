import { env } from './src/api/support/config/env';
import { setStartedMongo } from './src/api/support/config/lifecycle';
import { startMongoContainer } from './src/api/support/db/testcontainers';

export default async (): Promise<void> => {
  console.log(`[global-setup] profile=${env.profile} baseUrl=${env.baseUrl} apiUrl=${env.apiUrl}`);

  if (env.profile === 'testcontainers') {
    const mongo = await startMongoContainer();
    process.env.MONGO_URL = mongo.connectionString;
    setStartedMongo(mongo);
    console.log(`[global-setup] testcontainers Mongo started at ${mongo.connectionString}`);
  }
};
