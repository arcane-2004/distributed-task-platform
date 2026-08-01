import { JobPriority } from "../../../shared/queue-engine/enums/JobPriority.js";
import { JobStatus } from "../../../shared/queue-engine/enums/JobStatus.js";
import { JobType } from "../../../shared/queue-engine/enums/JobType.js";
import { Job } from "../../../shared/queue-engine/models/Job.js";

export function createTestJob(
    overrides: Partial<Job> = {}
): Job {

    return {

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

        updatedAt: new Date(),

        ...overrides

    };

}