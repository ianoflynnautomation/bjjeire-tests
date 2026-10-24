export async function forEachConcurrent<T>(
  items: readonly T[],
  limit: number,
  task: (item: T) => Promise<void>,
): Promise<void> {
  // One shared iterator: each worker pulls the next unclaimed item.
  const queue = items.values();
  const worker = async (): Promise<void> => {
    for (const item of queue) await task(item);
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}
