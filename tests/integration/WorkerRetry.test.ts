import { Redis } from "ioredis";

import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { QueueEngine } from "../../shared/queue-engine/engine/QueueEngine.js";
import { Worker } from "../../shared/queue-engine/worker/Worker.js";
import { HandlerRegistry } from "../../shared/queue-engine/handlers/HandlerRegistry.js";
import { JobType } from "../../shared/queue-engine/enums/JobType.js";
import { JobPriority } from "../../shared/queue-engine/enums/JobPriority.js";
import { FailingJobHandler } from "../../apps/worker/src/handlers/FailingJobHandler.js";

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

    afterEach(async () => {
        await redis.flushdb();
        await redis.quit();
    });

});