import { Redis } from "ioredis";

import { randomUUID } from "crypto";
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { QueueEngine } from "../../shared/queue-engine/engine/QueueEngine.js";
import { Worker } from "../../shared/queue-engine/worker/Worker.js";
import { HandlerRegistry } from "../../shared/queue-engine/handlers/HandlerRegistry.js";
import { JobType } from "../../shared/queue-engine/enums/JobType.js";
import { JobPriority } from "../../shared/queue-engine/enums/JobPriority.js";
import { FailingJobHandler } from "../../apps/worker/src/handlers/FailingJobHandler.js";
import { FlakyJobHandler } from "../../apps/worker/src/handlers/FlakyJobHandler.js";
import { JobStatus } from "../../shared/queue-engine/enums/JobStatus.js";

describe("Worker Retry", () => {

    let redis: Redis;
    let queueEngine: QueueEngine;
    let registry: HandlerRegistry;
    let worker: Worker;

    beforeEach(async () => {

        redis = new Redis({
            db: 1
        });

        queueEngine = new QueueEngine(
            redis,
            `test-retry-queue-${randomUUID()}`
        );

        registry = new HandlerRegistry();

        registry.register(
            JobType.TEST_FAILURE,
            new FailingJobHandler()
        );

        registry.register(
            JobType.FLAKY_TEST,
            new FlakyJobHandler(2)
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

    it("should retry a flaky job until it succeeds", async () => {

        const job = await queueEngine.submit({
            type: JobType.FLAKY_TEST,
            payload: {
                message: "flaky job test"
            },
            priority: JobPriority.NORMAL,
            maxAttempts: 3
        });

        // Attempt 1 → failure
        await worker.processOneJob();

        let updatedJob = await queueEngine.getJob(job.id);

        expect(updatedJob).not.toBeNull();
        expect(updatedJob?.attempts).toBe(1);
        expect(updatedJob?.status).toBe(JobStatus.QUEUED);

        // Attempt 2 → failure
        await worker.processOneJob();

        updatedJob = await queueEngine.getJob(job.id);

        expect(updatedJob).not.toBeNull();
        expect(updatedJob?.attempts).toBe(2);
        expect(updatedJob?.status).toBe(JobStatus.QUEUED);

        // Attempt 3 → success
        await worker.processOneJob();

        updatedJob = await queueEngine.getJob(job.id);

        expect(updatedJob).not.toBeNull();
        expect(updatedJob?.status).toBe(JobStatus.COMPLETED);
        expect(updatedJob?.attempts).toBe(2);
        expect(updatedJob?.progress).toBe(100);
        expect(updatedJob?.error).toBeUndefined();
        expect(updatedJob?.completedAt).toBeDefined();

        const nextJobId = await queueEngine.getNextJobId();

        expect(nextJobId).toBeNull();
    });



    afterEach(async () => {
        await redis.flushdb();
        await redis.quit();
    });

});