import { Redis } from "ioredis";

import {
    beforeEach,
    afterEach,
    describe,
    expect,
    it
} from "vitest";

import { QueueEngine } from "../../shared/queue-engine/engine/QueueEngine.js";
import { Worker } from "../../shared/queue-engine/worker/Worker.js";
import { HandlerRegistry } from "../../shared/queue-engine/handlers/HandlerRegistry.js";
import { JobType } from "../../shared/queue-engine/enums/JobType.js";
import { JobPriority } from "../../shared/queue-engine/enums/JobPriority.js";
import { FailingJobHandler } from "../../apps/worker/src/handlers/FailingJobHandler.js";
import { FlakyJobHandler } from "../../apps/worker/src/handlers/FlakyJobHandler.js";
import { JobStatus } from "../../shared/queue-engine/enums/JobStatus.js";
import { CancellationTestHandler } from "../fixtures/CancellationTestHandler.js";

describe("Worker Cancellation", () => {

    let redis: Redis;
    let queueEngine: QueueEngine;
    let registry: HandlerRegistry;
    let worker: Worker;
    let cancellationHandler: CancellationTestHandler;

    beforeEach(async () => {

        redis = new Redis({
            db: 2
        });

        queueEngine = new QueueEngine(
            redis,
            "test-retry-queue"
        );

        registry = new HandlerRegistry();

        registry.register(
            JobType.TEST_FAILURE,
            new FailingJobHandler()
        );

        cancellationHandler = new CancellationTestHandler();

        registry.register(
            JobType.FLAKY_TEST,
            cancellationHandler
        );

        worker = new Worker(
            queueEngine,
            registry,
            100,
            10
        );
    });

    it("should cancel a queued job", async () => {

        const job = await queueEngine.submit({
            type: JobType.FLAKY_TEST,
            payload: {
                message: "cancellation test"
            },
            priority: JobPriority.NORMAL,
            maxAttempts: 3
        });

        const queuedJob = await queueEngine.getJob(job.id);

        expect(queuedJob).not.toBeNull();
        expect(queuedJob?.status).toBe(JobStatus.QUEUED);

        await queueEngine.cancelJob(job.id);

        const cancelledJob = await queueEngine.getJob(job.id);

        expect(cancelledJob).not.toBeNull();
        expect(cancelledJob?.status).toBe(JobStatus.CANCELLED);

        const nextJobId = await queueEngine.getNextJobId();

        expect(nextJobId).toBeNull();
    });

    it("should not execute a cancelled job", async () => {

        const job = await queueEngine.submit({
            type: JobType.FLAKY_TEST,
            payload: {
                message: "cancelled execution test"
            },
            priority: JobPriority.NORMAL,
            maxAttempts: 3
        });

        await queueEngine.cancelJob(job.id);

        await worker.processOneJob();

        expect(cancellationHandler.executed).toBe(false);

        const cancelledJob = await queueEngine.getJob(job.id);

        expect(cancelledJob).not.toBeNull();
        expect(cancelledJob?.status).toBe(JobStatus.CANCELLED);
    });

    it("should not execute a job cancelled after worker reads it", async () => {

        const handler = new CancellationTestHandler();

        registry = new HandlerRegistry();

        registry.register(
            JobType.FLAKY_TEST,
            handler
        );

        const job = await queueEngine.submit({
            type: JobType.FLAKY_TEST,
            payload: {
                message: "race condition test"
            },
            priority: JobPriority.NORMAL,
            maxAttempts: 3
        });

        const originalGetJob = queueEngine.getJob.bind(queueEngine);

        let firstRead = true;

        queueEngine.getJob = async (jobId: string) => {

            const currentJob = await originalGetJob(jobId);

            if (firstRead && currentJob) {

                firstRead = false;

                await queueEngine.cancelJob(jobId);

                return currentJob;
            }

            return currentJob;
        };

        await worker.processOneJob();

        expect(handler.executed).toBe(false);

        const finalJob = await originalGetJob(job.id);

        expect(finalJob).not.toBeNull();
        expect(finalJob?.status).toBe(JobStatus.CANCELLED);
    });

    afterEach(async () => {
        await redis.flushdb();
        await redis.quit();
    });

});

