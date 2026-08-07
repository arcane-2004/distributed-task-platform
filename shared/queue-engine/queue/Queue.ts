import {Redis} from "ioredis";
import {RedisKeys } from "../keys/RedisKeys.js";

export class Queue {

    constructor(
        private readonly redis: Redis,
        private readonly queueName: string
    ) {}

    private getQueueKey(): string {
        return RedisKeys.queue(this.queueName);
    }

    async enqueue(jobId: string): Promise<void> {
        await this.redis.rpush(
            this.getQueueKey(),
            jobId
        );
    }

    async dequeue(): Promise<string | null> {
        return await this.redis.lpop(
            this.getQueueKey()
        );
    }

    async peek(): Promise<string | null> {
        return await this.redis.lindex(
            this.getQueueKey(),
            0
        );
    }

    async size(): Promise<number> {
        return await this.redis.llen(
            this.getQueueKey()
        );
    }

    async isEmpty(): Promise<boolean> {
        return (await this.size()) === 0;
    }

}