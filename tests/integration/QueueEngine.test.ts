import { beforeEach, afterAll, describe, expect, it } from "vitest";

import { redis } from "../helpers/redis.js";
import { deleteKeys } from "../helpers/cleanup.js";
import { createTestJob } from "../helpers/factories/jobFactory.js";

import { Queue } from "../../shared/queue-engine/queue/Queue.js";
import { JobStore } from "../../shared/queue-engine/stores/JobStore.js";
import { QueueEngine } from "../../shared/queue-engine/engine/QueueEngine.js";

import { RedisKeys } from "../../shared/queue-engine/keys/RedisKeys.js";
import { SubmitJobRequest } from "../../shared/queue-engine/models/SubmitJobRequest.js";
import { JobType } from "../../shared/queue-engine/enums/JobType.js";
import { JobStatus } from "../../shared/queue-engine/enums/JobStatus.js";

const queue = new Queue(
    redis,
    "default"
);

const jobStore = new JobStore(
    redis
);

const queueEngine = new QueueEngine(
    redis,
    "default"
);

const job = createTestJob();

beforeEach(async () => {

    await deleteKeys(
        redis,
        RedisKeys.job(job.id),
        RedisKeys.queue(job.queue)
    );

});

const request: SubmitJobRequest = {
    type: JobType.EMAIL,

    payload: {
        to: "test@example.com"
    }
};

describe("QueueEngine", () => {

    it("should submit a job", async () => {

        const job = await queueEngine.submit(request);

        const storedJob = await jobStore.findById(job.id);

        expect(storedJob).not.toBeNull();

        expect(storedJob?.id).toBe(job.id);

        expect(await queue.peek()).toBe(job.id);

    });


    it("should get a submitted job", async () => {

        const request: SubmitJobRequest = {
            type: JobType.EMAIL,
            payload: {
                to: "test@example.com"
            }
        };

        const submittedJob = await queueEngine.submit(request);

        const retrievedJob = await queueEngine.getJob(submittedJob.id);

        expect(retrievedJob).not.toBeNull();

        expect(retrievedJob?.id).toBe(submittedJob.id);
        expect(retrievedJob?.type).toBe(submittedJob.type);
        expect(retrievedJob?.status).toBe(JobStatus.QUEUED);
        expect(retrievedJob?.payload).toEqual(submittedJob.payload);

    });

    it("should return job ids in FIFO order", async () => {

        const request1: SubmitJobRequest = {
            type: JobType.EMAIL,
            payload: {
                to: "user1@example.com"
            }
        };

        const request2: SubmitJobRequest = {
            type: JobType.EMAIL,
            payload: {
                to: "user2@example.com"
            }
        };

        const job1 = await queueEngine.submit(request1);
        const job2 = await queueEngine.submit(request2);

        expect(await queueEngine.getNextJobId())
            .toBe(job1.id);

        expect(await queueEngine.getNextJobId())
            .toBe(job2.id);

        expect(await queueEngine.getNextJobId())
            .toBeNull();

    });

    // -------/ verify update() /------
    it("should update a submitted job", async () => {

        const request: SubmitJobRequest = {
            type: JobType.EMAIL,
            payload: {
                to: "test@example.com"
            }
        };

        const job = await queueEngine.submit(request);

        await queueEngine.updateJob(job.id, {
            status: JobStatus.RUNNING,
            progress: 40,
        });

        const updatedJob = await queueEngine.getJob(job.id);

        expect(updatedJob).not.toBeNull();

        expect(updatedJob?.status)
            .toBe(JobStatus.RUNNING);

        expect(updatedJob?.progress)
            .toBe(40);

    });

})


