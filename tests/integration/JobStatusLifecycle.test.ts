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
            db: 3
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
    it("should transition a job from QUEUED to RUNNING to COMPLETED", async () => {

        const job = await queueEngine.submit({
            type: JobType.FLAKY_TEST,
            payload: {
                message: "lifecycle test"
            },
            priority: JobPriority.NORMAL,
            maxAttempts: 3
        });

        const queuedJob = await queueEngine.getJob(job.id);

        expect(queuedJob).not.toBeNull();
        expect(queuedJob?.status).toBe(JobStatus.QUEUED);

        await worker.processOneJob();

        const completedJob = await queueEngine.getJob(job.id);

        expect(completedJob).not.toBeNull();
        expect(completedJob?.status).toBe(JobStatus.COMPLETED);
        expect(completedJob?.startedAt).toBeDefined();
        expect(completedJob?.completedAt).toBeDefined();
    });

    it("should transition a queued job to CANCELLED", async () => {

        const job = await queueEngine.submit({
            type: JobType.FLAKY_TEST,
            payload: {
                message: "cancellation lifecycle test"
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

        expect(cancelledJob?.startedAt).toBeUndefined();
        expect(cancelledJob?.completedAt).toBeUndefined();
    });

    it("should not cancel a running job", async () => {

        const job = await queueEngine.submit({
            type: JobType.FLAKY_TEST,
            payload: {
                message: "running cancellation test"
            },
            priority: JobPriority.NORMAL,
            maxAttempts: 3
        });

        await queueEngine.updateJob(job.id, {
            status: JobStatus.RUNNING,
            startedAt: new Date(),
            updatedAt: new Date()
        });

        await expect(
            queueEngine.cancelJob(job.id)
        ).rejects.toThrow(
            `Job ${job.id} cannot be cancelled because its status is ${JobStatus.RUNNING}`
        );

        const updatedJob = await queueEngine.getJob(job.id);

        expect(updatedJob).not.toBeNull();
        expect(updatedJob?.status).toBe(JobStatus.RUNNING);
    });

    it("should not cancel a completed job", async () => {

        const job = await queueEngine.submit({
            type: JobType.FLAKY_TEST,
            payload: {
                message: "completed cancellation test"
            },
            priority: JobPriority.NORMAL,
            maxAttempts: 3
        });

        await worker.processOneJob();

        const completedJob = await queueEngine.getJob(job.id);

        expect(completedJob).not.toBeNull();
        expect(completedJob?.status).toBe(JobStatus.COMPLETED);

        await expect(
            queueEngine.cancelJob(job.id)
        ).rejects.toThrow(
            `Job ${job.id} cannot be cancelled because its status is ${JobStatus.COMPLETED}`
        );

        const finalJob = await queueEngine.getJob(job.id);

        expect(finalJob).not.toBeNull();
        expect(finalJob?.status).toBe(JobStatus.COMPLETED);
    });

    it("should not cancel a failed job", async () => {

        const job = await queueEngine.submit({
            type: JobType.TEST_FAILURE,
            payload: {
                message: "failed cancellation test"
            },
            priority: JobPriority.NORMAL,
            maxAttempts: 1
        });

        await worker.processOneJob();

        const failedJob = await queueEngine.getJob(job.id);

        expect(failedJob).not.toBeNull();
        expect(failedJob?.status).toBe(JobStatus.FAILED);

        await expect(
            queueEngine.cancelJob(job.id)
        ).rejects.toThrow(
            `Job ${job.id} cannot be cancelled because its status is ${JobStatus.FAILED}`
        );

        const finalJob = await queueEngine.getJob(job.id);

        expect(finalJob).not.toBeNull();
        expect(finalJob?.status).toBe(JobStatus.FAILED);
    });

    it("should not cancel an already cancelled job", async () => {

        const job = await queueEngine.submit({
            type: JobType.FLAKY_TEST,
            payload: {
                message: "already cancelled test"
            },
            priority: JobPriority.NORMAL,
            maxAttempts: 3
        });

        await queueEngine.cancelJob(job.id);

        const cancelledJob = await queueEngine.getJob(job.id);

        expect(cancelledJob).not.toBeNull();
        expect(cancelledJob?.status).toBe(JobStatus.CANCELLED);

        await expect(
            queueEngine.cancelJob(job.id)
        ).rejects.toThrow(
            `Job ${job.id} cannot be cancelled because its status is ${JobStatus.CANCELLED}`
        );

        const finalJob = await queueEngine.getJob(job.id);

        expect(finalJob).not.toBeNull();
        expect(finalJob?.status).toBe(JobStatus.CANCELLED);
    });

    it("should not cancel a permanently failed job", async () => {

        const job = await queueEngine.submit({
            type: JobType.TEST_FAILURE,
            payload: {
                message: "permanent failure cancellation test"
            },
            priority: JobPriority.NORMAL,
            maxAttempts: 3
        });

        await queueEngine.updateJob(job.id, {
            status: JobStatus.PERMANENT_FAILURE,
            error: "Permanent failure",
            updatedAt: new Date()
        });

        const failedJob = await queueEngine.getJob(job.id);

        expect(failedJob).not.toBeNull();
        expect(failedJob?.status).toBe(JobStatus.PERMANENT_FAILURE);

        await expect(
            queueEngine.cancelJob(job.id)
        ).rejects.toThrow(
            `Job ${job.id} cannot be cancelled because its status is ${JobStatus.PERMANENT_FAILURE}`
        );

        const finalJob = await queueEngine.getJob(job.id);

        expect(finalJob).not.toBeNull();
        expect(finalJob?.status).toBe(JobStatus.PERMANENT_FAILURE);
    });

    it("should reject cancellation of a non-existent job", async () => {

        const nonExistentJobId = "non-existent-job-id";

        await expect(
            queueEngine.cancelJob(nonExistentJobId)
        ).rejects.toThrow(
            `Job ${nonExistentJobId} not found`
        );
    });

    afterEach(async () => {
        await redis.flushdb();
        await redis.quit();
    });

});

