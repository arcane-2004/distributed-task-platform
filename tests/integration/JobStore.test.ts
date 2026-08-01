import { beforeEach, afterAll, describe, expect, it } from "vitest";
import Redis from "ioredis";
import { Job } from "../../shared/queue-engine/models/Job.js";
import { JobStore } from "../../shared/queue-engine/stores/JobStore.js";
import { RedisKeys } from "../../shared/queue-engine/keys/RedisKeys.js";
import { JobType } from "../../shared/queue-engine/enums/JobType.js";
import { JobStatus } from "../../shared/queue-engine/enums/JobStatus.js";
import { JobPriority } from "../../shared/queue-engine/enums/JobPriority.js";


const redis = new Redis();

const jobStore = new JobStore(redis);

const job: Job = {

    id: "job-1",

    type: JobType.EMAIL,

    queue: "default",

    payload: {
        to: "test@example.com"
    },

    status: JobStatus.QUEUED,

    priority: JobPriority.NORMAL,

    attempts: 0,

    maxAttempts: 3,

    progress: 0,

    createdAt: new Date(),

    updatedAt: new Date()

};

beforeEach(async () => {

    await redis.del(
        RedisKeys.job(job.id)
    );

});

describe("JobStore", () => {

    it("should create a job", async () => {

        await jobStore.create(job);

        expect(
            await jobStore.exists(job.id)
        ).toBe(true);

    });

    it("should find a job by id", async () => {

        await jobStore.create(job);

        const raw = await redis.hgetall(
            RedisKeys.job(job.id)
        );

        console.log(raw);

        const foundJob = await jobStore.findById(job.id);

        expect(foundJob).not.toBeNull();

        expect(foundJob?.id).toBe(job.id);

        expect(foundJob?.type).toBe(job.type);

        expect(foundJob?.queue).toBe(job.queue);

        expect(foundJob?.payload).toEqual(job.payload);

        expect(foundJob?.status).toBe(job.status);

        expect(foundJob?.priority).toBe(job.priority);

        expect(foundJob?.attempts).toBe(job.attempts);

        expect(foundJob?.maxAttempts).toBe(job.maxAttempts);

        expect(foundJob?.progress).toBe(job.progress);

    });

    it("should update a job", async () => {

        await jobStore.create(job);

        job.status = JobStatus.RUNNING;
        job.progress = 50;

        await jobStore.update(job.id, job);

        const updatedJob = await jobStore.findById(job.id);

        expect(updatedJob).not.toBeNull();

        expect(updatedJob?.status).toBe(JobStatus.RUNNING);
        expect(updatedJob?.progress).toBe(50);

    });

    it("should delete a job", async () => {

        await jobStore.create(job);

        expect(
            await jobStore.exists(job.id)
        ).toBe(true);

        await jobStore.delete(job.id);

        expect(
            await jobStore.exists(job.id)
        ).toBe(false);

    });

});

afterAll(async () => {

    await redis.quit();

});