import Redis from "ioredis";
import { RedisKeys } from "../keys/RedisKeys.js";
import { Job } from "../models/Job.js";
import { JobMapper } from "../mappers/JobMapper.js";
import { RedisJobHash } from "../types/RedisJobHash.js";

export class JobStore {
    private toRedisJobHash(
        hash: Record<string, string>
    ): RedisJobHash {
        return hash as unknown as RedisJobHash;
    }

    constructor(
        private readonly redis: Redis
    ) {}

    private getKey(jobId: string): string {
        return RedisKeys.job(jobId);
    }

    async exists(jobId: string): Promise<boolean> {
        const key = this.getKey(jobId);

        const exists = await this.redis.exists(key);

        return exists === 1;
    }



    async create(job: Job): Promise<void> {
        if (await this.exists(job.id)) {
            throw new Error(`Job ${job.id} already exists`);
        }

        const key = this.getKey(job.id);

        const redisJob = JobMapper.toRedis(job);

        await this.redis.hset(key, redisJob);
    }
    
    async findById(jobId: string): Promise<Job | null> {
        const key = this.getKey(jobId);

        const redisJob = await this.redis.hgetall(key);

        if (Object.keys(redisJob).length === 0) {
            return null;
        }

        return JobMapper.fromRedis(
            this.toRedisJobHash(redisJob)
        );
    }

    async update(
        jobId: string,
        updates: Partial<Job>
    ): Promise<void> {

        const existingJob = await this.findById(jobId);

        if (!existingJob) {
            throw new Error(`Job ${jobId} not found`);
        }

        const updatedJob: Job = {
            ...existingJob,
            ...updates,
            updatedAt: new Date(),
        };

        const redisJob = JobMapper.toRedis(updatedJob);

        await this.redis.hset(
            this.getKey(jobId),
            redisJob
        );
    }

    async delete(jobId: string): Promise<void> {
        const key = this.getKey(jobId);

        await this.redis.del(key);
    }
    
}





