import { describe, it, expect } from "vitest";

import { JobMapper } from "../../shared/queue-engine/mappers/JobMapper.js";
// import { JobStatus } from "../../shared/queue-engine/models/JobStatus.js";
// import { JobPriority } from "../../shared/queue-engine/models/JobPriority.js";
// import { JobType } from "../../shared/queue-engine/models/JobType.js";
import { Job } from "../../shared/queue-engine/models/Job.js";
import { JobType } from "../../shared/queue-engine/enums/JobType.js";
import { JobStatus } from "../../shared/queue-engine/enums/JobStatus.js";
import { JobPriority } from "../../shared/queue-engine/enums/JobPriority.js";

describe("JobMapper", () => {

    it("should convert Job to RedisJobHash", () => {

        const now = new Date();

        const job : Job= {
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
            createdAt: now,
            updatedAt: now
        };

        const redisJob = JobMapper.toRedis(job);

        expect(redisJob.id).toBe(job.id);

        expect(redisJob.type).toBe(job.type);

        expect(redisJob.queue).toBe(job.queue);

        expect(redisJob.payload)
            .toBe(JSON.stringify(job.payload));

        expect(redisJob.status).toBe(job.status);

        expect(redisJob.priority).toBe(job.priority);

        expect(redisJob.attempts).toBe("0");

        expect(redisJob.maxAttempts).toBe("3");

        expect(redisJob.progress).toBe("0");

    });

    it("should convert RedisJobHash to Job", () => {

        const now = new Date().toISOString();

        const redisJob = {
            id: "job-1",
            type: JobType.EMAIL,
            queue: "default",
            payload: JSON.stringify({
                to: "test@example.com"
            }),
            status: JobStatus.QUEUED,
            priority: JobPriority.NORMAL,
            attempts: "0",
            maxAttempts: "3",
            progress: "0",
            createdAt: now,
            updatedAt: now
        };

        const job = JobMapper.fromRedis(redisJob);

        expect(job.id).toBe(redisJob.id);

        expect(job.type).toBe(redisJob.type);

        expect(job.queue).toBe(redisJob.queue);

        expect(job.payload).toEqual({
            to: "test@example.com"
        });

        expect(job.status).toBe(JobStatus.QUEUED);

        expect(job.priority).toBe(JobPriority.NORMAL);

        expect(job.attempts).toBe(0);

        expect(job.maxAttempts).toBe(3);

        expect(job.progress).toBe(0);

        expect(job.createdAt).toEqual(new Date(now));

        expect(job.updatedAt).toEqual(new Date(now));

    });

    // it("should preserve data after round-trip conversion", () => {

    //     const originalJob = /* create Job */

    //     const redisJob = JobMapper.toRedis(originalJob);

    //     const restoredJob = JobMapper.fromRedis(redisJob);

    //     expect(restoredJob).toEqual(originalJob);

    // });

});