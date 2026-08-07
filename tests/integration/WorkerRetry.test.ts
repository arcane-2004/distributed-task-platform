import { Redis } from "ioredis";

import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { QueueEngine } from "../../shared/queue-engine/engine/QueueEngine.js";
import { Worker } from "../../shared/queue-engine/worker/Worker.js";
import { HandlerRegistry } from "../../shared/queue-engine/handlers/HandlerRegistry.js";
import { JobType } from "../../shared/queue-engine/enums/JobType.js";
import { JobPriority } from "../../shared/queue-engine/enums/JobPriority.js";
import { FailingJobHandler } from "../../apps/worker/src/handlers/FailingJobHandler.js";
import { JobStatus } from "../../shared/queue-engine/enums/JobStatus.js";

describe("Worker Retry", () => {

    let redis: Redis;
    let queueEngine: QueueEngine;
    let registry: HandlerRegistry;
    let worker: Worker;

    beforeEach(async () => {

        redis = new Redis();

        queueEngine = new QueueEngine(
            redis,
            "test-retry-queue"
        );

        registry = new HandlerRegistry();

        registry.register(
            JobType.TEST_FAILURE,
            new FailingJobHandler()
        );

        worker = new Worker(
            queueEngine,
            registry,
            100,
            10
        );
    });

    it("should retry a failed job", async () => {

        const job = await queueEngine.submit({
            type: JobType.TEST_FAILURE,
            payload: {
                message: "retry test"
            },
            priority: JobPriority.NORMAL,
            maxAttempts: 3
        });

        await worker.processOneJob();
        const updatedJob = await queueEngine.getJob(job.id);

        expect(updatedJob).not.toBeNull();
        expect(updatedJob?.attempts).toBe(1);
    });

    it("should increment attempts across retries", async () => {

        const job = await queueEngine.submit({
            type: JobType.TEST_FAILURE,
            payload: {
                message: "multiple retry test"
            },
            priority: JobPriority.NORMAL,
            maxAttempts: 3
        });

        // First attempt
        await worker.processOneJob();

        let updatedJob = await queueEngine.getJob(job.id);

        expect(updatedJob).not.toBeNull();
        expect(updatedJob?.attempts).toBe(1);

        // Second attempt
        await worker.processOneJob();

        updatedJob = await queueEngine.getJob(job.id);

        expect(updatedJob).not.toBeNull();
        expect(updatedJob?.attempts).toBe(2);
    });

    it("should stop retrying after maxAttempts", async () => {

        const job = await queueEngine.submit({
            type: JobType.TEST_FAILURE,
            payload: {
                message: "max attempts test"
            },
            priority: JobPriority.NORMAL,
            maxAttempts: 3
        });

        // Attempt 1
        await worker.processOneJob();

        let updatedJob = await queueEngine.getJob(job.id);

        expect(updatedJob?.attempts).toBe(1);

        // Attempt 2
        await worker.processOneJob();

        updatedJob = await queueEngine.getJob(job.id);

        expect(updatedJob?.attempts).toBe(2);

        // Attempt 3
        await worker.processOneJob();

        updatedJob = await queueEngine.getJob(job.id);

        expect(updatedJob?.attempts).toBe(3);
        expect(updatedJob?.status).toBe(JobStatus.FAILED);

        const nextJobId = await queueEngine.getNextJobId();

        expect(nextJobId).toBeNull();

    });

    afterEach(async () => {
        await redis.flushdb();
        await redis.quit();
    });

});