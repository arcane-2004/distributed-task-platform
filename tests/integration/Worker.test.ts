import { beforeEach, afterAll, describe, expect, it } from "vitest";

import { QueueEngine } from "../../shared/queue-engine/engine/QueueEngine";
import { JobType } from "../../shared/queue-engine/enums/JobType.js";
import { HandlerRegistry } from "../../shared/queue-engine/handlers/HandlerRegistry";
import { JobHandler } from "../../shared/queue-engine/handlers/JobHandler.js";
import { Worker } from "../../shared/queue-engine/worker/Worker.js";
import { redis } from "../helpers/redis.js";
import { deleteKeys } from "../helpers/cleanup.js";
import { RedisKeys } from "../../shared/queue-engine/keys/RedisKeys.js";
import { JobStatus } from "../../shared/queue-engine/enums/JobStatus.js";
import { Job } from "../../shared/queue-engine/models/Job.js";

class TestHandler implements JobHandler {

    public executed = false;

    async execute(): Promise<void> {
        this.executed = true;
    }

}

// -------/ faliling handler /----------
class FailingHandler implements JobHandler {

    async execute(job: Job): Promise<void> {
        throw new Error("Email service unavailable");
    }

}

describe("Worker", () => {

    const queueEngine = new QueueEngine(
        redis,
        "default"
    );

    const registry = new HandlerRegistry();
    const handler = new TestHandler();
    
    registry.register(
        JobType.EMAIL,
        handler
    );
    const worker = new Worker(
            queueEngine,
            registry
        );
    

    

    beforeEach(async () => {

        handler.executed = false;
        await deleteKeys(
            redis,
            RedisKeys.queue("default")
        );
    });

    afterAll(async () => {
        await redis.quit();
    });

    it("should process one job successfully", async () => {

        const job = await queueEngine.submit({

            type: JobType.EMAIL,

            payload: {
                to: "test@example.com"
            }

        });

        await worker.processOneJob();

        expect(handler.executed)
            .toBe(true);

        const updatedJob =
            await queueEngine.getJob(job.id);

        expect(updatedJob).not.toBeNull();

        expect(updatedJob?.status)
            .toBe(JobStatus.COMPLETED);

        expect(updatedJob?.completedAt)
            .toBeDefined();

    });

    it("should mark job as FAILED when handler throws", async () => {

        const registry = new HandlerRegistry();

        registry.register(
            JobType.EMAIL,
            new FailingHandler()
        );

        const worker = new Worker(
            queueEngine,
            registry
        );

        const job = await queueEngine.submit({
            type: JobType.EMAIL,
            payload: {
                to: "test@example.com"
            }
        });

        await worker.processOneJob();

        const updatedJob = await queueEngine.getJob(job.id);

        expect(updatedJob).not.toBeNull();

        expect(updatedJob?.status)
            .toBe(JobStatus.FAILED);

        expect(updatedJob?.error)
            .toBe("Email service unavailable");

    });

    it("should do nothing when queue is empty", async () => {

        await expect(
            worker.processOneJob()
        ).resolves.not.toThrow();

        expect(handler.executed)
            .toBe(false);

    });

    it("should mark job as FAILED when no handler is registered", async () => {

        // Fresh registry with NO handlers
        const emptyRegistry = new HandlerRegistry();

        const worker = new Worker(
            queueEngine,
            emptyRegistry
        );

        const job = await queueEngine.submit({
            type: JobType.EMAIL,
            payload: {
                to: "test@example.com"
            }
        });

        // We expect processOneJob() NOT to throw
        await expect(
            worker.processOneJob()
        ).resolves.not.toThrow();

        const updatedJob = await queueEngine.getJob(job.id);

        expect(updatedJob).not.toBeNull();

        expect(updatedJob?.status)
            .toBe(JobStatus.FAILED);

        expect(updatedJob?.error)
            .toBe("No handler registered for EMAIL");

    });

    it("should start processing and stop gracefully", async () => {

        const job = await queueEngine.submit({
            type: JobType.EMAIL,
            payload: {
                to: "test@example.com"
            }
        });

        const workerPromise = worker.start();

        // Give the worker enough time to process one iteration
        await new Promise(resolve => setTimeout(resolve, 1200));

        worker.stop();

        await workerPromise;

        const updatedJob = await queueEngine.getJob(job.id);

        expect(updatedJob?.status)
            .toBe(JobStatus.COMPLETED);

        expect(handler.executed)
            .toBe(true);

    });

});