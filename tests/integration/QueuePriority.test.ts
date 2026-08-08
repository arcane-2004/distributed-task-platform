import { Redis } from "ioredis";

import {
    beforeEach,
    afterEach,
    describe,
    expect,
    it
} from "vitest";

import { QueueEngine } from "../../shared/queue-engine/engine/QueueEngine.js";
import { JobPriority } from "../../shared/queue-engine/enums/JobPriority.js";
import { JobType } from "../../shared/queue-engine/enums/JobType.js";

describe("Queue Priority", () => {

    let redis: Redis;
    let queueEngine: QueueEngine;

    beforeEach(async () => {

        redis = new Redis();

        queueEngine = new QueueEngine(
            redis,
            "test-priority-queue"
        );
    });

    afterEach(async () => {

        await redis.flushdb();
        await redis.quit();
    });

    it("should process HIGH priority job before NORMAL and LOW", async () => {

        const lowJob = await queueEngine.submit({
            type: JobType.EMAIL,
            payload: {
                message: "low"
            },
            priority: JobPriority.LOW
        });

        const normalJob = await queueEngine.submit({
            type: JobType.EMAIL,
            payload: {
                message: "normal"
            },
            priority: JobPriority.NORMAL
        });

        const highJob = await queueEngine.submit({
            type: JobType.EMAIL,
            payload: {
                message: "high"
            },
            priority: JobPriority.HIGH
        });

        const firstJobId = await queueEngine.getNextJobId();

        expect(firstJobId).toBe(highJob.id);

        const secondJobId = await queueEngine.getNextJobId();

        expect(secondJobId).toBe(normalJob.id);

        const thirdJobId = await queueEngine.getNextJobId();

        expect(thirdJobId).toBe(lowJob.id);
    });


    it("should preserve FIFO order for jobs with the same priority", async () => {

        const firstJob = await queueEngine.submit({
            type: JobType.EMAIL,
            payload: {
                message: "first"
            },
            priority: JobPriority.HIGH
        });

        const secondJob = await queueEngine.submit({
            type: JobType.EMAIL,
            payload: {
                message: "second"
            },
            priority: JobPriority.HIGH
        });

        const thirdJob = await queueEngine.submit({
            type: JobType.EMAIL,
            payload: {
                message: "third"
            },
            priority: JobPriority.HIGH
        });

        const firstJobId = await queueEngine.getNextJobId();

        expect(firstJobId).toBe(firstJob.id);

        const secondJobId = await queueEngine.getNextJobId();

        expect(secondJobId).toBe(secondJob.id);

        const thirdJobId = await queueEngine.getNextJobId();

        expect(thirdJobId).toBe(thirdJob.id);
    });


    it("should skip jobs that are not QUEUED", async () => {

        const lowJob = await queueEngine.submit({
            type: JobType.EMAIL,
            payload: {
                message: "low"
            },
            priority: JobPriority.LOW
        });

        const highJob = await queueEngine.submit({
            type: JobType.EMAIL,
            payload: {
                message: "high"
            },
            priority: JobPriority.HIGH
        });

        await queueEngine.updateJob(
            highJob.id,
            {
                status: "RUNNING" as any
            }
        );

        const nextJobId = await queueEngine.getNextJobId();

        expect(nextJobId).toBe(lowJob.id);
    });
});