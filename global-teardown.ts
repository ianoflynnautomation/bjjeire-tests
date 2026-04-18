import { clearLifecycle, getStartedMongo } from './src/lib/config/lifecycle';

export default async (): Promise<void> => {
  const mongo = getStartedMongo();
  if (mongo) {
    await mongo.stop();
    console.log('[global-teardown] testcontainers Mongo stopped');
  }
  clearLifecycle();
};
