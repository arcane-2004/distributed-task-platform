import Redis from "ioredis";

export async function deleteKeys(
    redis: Redis,
    ...keys: string[]
): Promise<void> {

    if (keys.length === 0) {
        return;
    }

    await redis.del(...keys);

}