import { beforeEach, afterAll, describe, expect, it } from "vitest";
import Redis from "ioredis";

import { Queue } from "../../shared/queue-engine/queue/Queue.js";
import { RedisKeys } from "../../shared/queue-engine/keys/RedisKeys.js";

const redis = new Redis();

const queue = new Queue(
    redis,
    "test-queue"
);

beforeEach(async () => {
    await redis.del(
        RedisKeys.queue("test-queue")
    );
});

describe("Queue", () => {

    it("should enqueue a job", async () => {

        await queue.enqueue("job-1");

        expect(
            await queue.size()
        ).toBe(1);

    });

    it("should peek the first job without removing it", async () => {
        await queue.enqueue("job-1");

        expect(await queue.peek()).toBe("job-1");

        expect(await queue.size()).toBe(1);
    });

    it("should dequeue the first job", async () => {

        await queue.enqueue("job-1");

        expect(
            await queue.dequeue()
        ).toBe("job-1");

        expect(
            await queue.size()
        ).toBe(0);

    });

    it("should dequeue jobs in FIFO order", async () => {

        await queue.enqueue("job-1");
        await queue.enqueue("job-2");
        await queue.enqueue("job-3");

        expect(await queue.dequeue()).toBe("job-1");
        expect(await queue.dequeue()).toBe("job-2");
        expect(await queue.dequeue()).toBe("job-3");

        expect(await queue.size()).toBe(0);

    });

    it("should be empty when no jobs exist", async () => {

        expect(await queue.isEmpty()).toBe(true);

    });

    it("should not be empty after enqueue", async () => {

        await queue.enqueue("job-1");

        expect(await queue.isEmpty()).toBe(false);

    });

    it("should return null when dequeuing an empty queue", async () => {

        expect(await queue.dequeue()).toBeNull();

    });

});



afterAll(async () => {
    await redis.quit();
});