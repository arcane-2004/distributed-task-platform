import { Job } from "../models/Job.js";
import { RedisJobHash } from "../types/RedisJobHash.js";
import {JobType} from "../enums/JobType.js"
import {JobPriority} from "../enums/JobPriority.js"
import {JobStatus} from "../enums/JobStatus.js"

export class JobMapper {

    static toRedis(job: Job): RedisJobHash {
        return {
            id: job.id,

            type: job.type,

            queue: job.queue,

            payload: JSON.stringify(job.payload),

            status: job.status,

            priority: job.priority,

            attempts: job.attempts.toString(),

            maxAttempts: job.maxAttempts.toString(),

            progress: job.progress.toString(),

            // result: job.result
            //     ? JSON.stringify(job.result)
            //     : undefined,

            result:
                job.result !== undefined
                    ? JSON.stringify(job.result)
                    : undefined,

            error: job.error,

            workerId: job.workerId,

            createdAt: job.createdAt.toISOString(),

            updatedAt: job.updatedAt.toISOString(),

            startedAt: job.startedAt?.toISOString(),

            completedAt: job.completedAt?.toISOString(),
        };
    }

    static fromRedis(hash: RedisJobHash): Job {
        return {
            id: hash.id,

            type: hash.type as JobType,

            queue: hash.queue,

            payload: JSON.parse(hash.payload),

            status: hash.status as JobStatus,

            priority: hash.priority as JobPriority,

            attempts: Number(hash.attempts),

            maxAttempts: Number(hash.maxAttempts),

            progress: Number(hash.progress),

            result:
                hash.result
                    ? JSON.parse(hash.result)
                    : undefined,

            error: hash.error,

            workerId: hash.workerId,

            createdAt: new Date(hash.createdAt),

            updatedAt: new Date(hash.updatedAt),

            startedAt: hash.startedAt
                ? new Date(hash.startedAt)
                : undefined,

            completedAt: hash.completedAt
                ? new Date(hash.completedAt)
                : undefined,
        };
    }

}