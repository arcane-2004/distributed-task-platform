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
import { JobPriority } from "../../shared/queue-engine/enums/JobPriority.js";
import { JobStatus } from "../../shared/queue-engine/enums/JobStatus.js";
import { JobType } from "../../shared/queue-engine/enums/JobType.js";
import { JobHandler } from "../../shared/queue-engine/handlers/JobHandler.js";


class PriorityTestHandler implements JobHandler {

    public readonly executedJobs: string[] = [];

    async execute(
        job: any,
        _updateProgress: (progress: number) => Promise<void>
    ): Promise<void> {

        this.executedJobs.push(job.id);
    }
}


describe("Worker Priority", () => {

    let redis: Redis;
    let queueEngine: QueueEngine;
    let registry: HandlerRegistry;
    let worker: Worker;

    beforeEach(async () => {

        redis = new Redis({
            db:5
        });

        queueEngine = new QueueEngine(
            redis,
            "test-worker-priority"
        );

        registry = new HandlerRegistry();

        worker = new Worker(
            queueEngine,
            registry,
            10,
            10
        );
    });


    afterEach(async () => {

        await redis.flushdb();
        await redis.quit();
    });


    it("should process HIGH priority job before LOW priority job", async () => {

        const handler = new PriorityTestHandler();

        registry.register(
            JobType.EMAIL,
            handler
        );


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


        await worker.processOneJob();

        expect(handler.executedJobs[0]).toBe(highJob.id);

        const highUpdatedJob =
            await queueEngine.getJob(highJob.id);

        expect(highUpdatedJob?.status)
            .toBe(JobStatus.COMPLETED);


        await worker.processOneJob();

        expect(handler.executedJobs[1]).toBe(lowJob.id);

        const lowUpdatedJob =
            await queueEngine.getJob(lowJob.id);

        expect(lowUpdatedJob?.status)
            .toBe(JobStatus.COMPLETED);
    });


    it("should preserve FIFO order for same priority jobs", async () => {

        const handler = new PriorityTestHandler();

        registry.register(
            JobType.EMAIL,
            handler
        );


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


        await worker.processOneJob();

        await worker.processOneJob();


        expect(handler.executedJobs).toEqual([
            firstJob.id,
            secondJob.id
        ]);


        const firstUpdatedJob =
            await queueEngine.getJob(firstJob.id);

        const secondUpdatedJob =
            await queueEngine.getJob(secondJob.id);


        expect(firstUpdatedJob?.status)
            .toBe(JobStatus.COMPLETED);

        expect(secondUpdatedJob?.status)
            .toBe(JobStatus.COMPLETED);
    });
});