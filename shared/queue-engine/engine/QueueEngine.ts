import { Redis } from "ioredis";
import { v4 as uuidv4 } from "uuid";

import { JobStore } from "../stores/JobStore.js";
import { Queue } from "../queue/Queue.js";
import { JobPriority } from "../enums/JobPriority.js";
import { JobStatus } from "../enums/JobStatus.js";

import { Job } from "../models/Job.js";
import { SubmitJobRequest } from "../models/SubmitJobRequest.js";
import { getPriorityValue } from "../utils/PriorityUtils.js";




export class QueueEngine {

    private readonly jobStore: JobStore;

    private readonly queue: Queue;

    constructor(
        private readonly redis: Redis,
        private readonly queueName: string
    ) {
        this.jobStore = new JobStore(redis);

        this.queue = new Queue(
            redis,
            queueName
        );
    }

    // ---/ submit /-----
    async submit(
        request: SubmitJobRequest
    ): Promise<Job> {
        const now = new Date();

        const job: Job = {
            id: uuidv4(),

            type: request.type,

            queue: this.queueName,

            payload: request.payload,

            status: JobStatus.QUEUED,

            priority: request.priority ?? JobPriority.NORMAL,

            attempts: 0,

            maxAttempts: request.maxAttempts ?? 3,

            progress: 0,

            createdAt: now,

            updatedAt: now
        };
        await this.jobStore.create(job);

        await this.queue.enqueue(job.id);

        return job;
    }

    // ----/ getJob ---/
    async getJob(
        jobId: string
    ): Promise<Job | null> {
        return await this.jobStore.findById(jobId);
    }

    // -----/ next job /-------
    async getNextJobId(): Promise<string | null> {

        const jobIds = await this.queue.getAll();

        if (jobIds.length === 0) {
            return null;
        }

        let selectedJobId: string | null = null;
        let highestPriority = -1;

        for (const jobId of jobIds) {

            const job = await this.getJob(jobId);

            if (!job) {
                continue;
            }

            if (job.status !== JobStatus.QUEUED) {
                continue;
            }

            const priority = getPriorityValue(job.priority);

            if (priority > highestPriority) {
                highestPriority = priority;
                selectedJobId = job.id;
            }
        }

        if (!selectedJobId) {
            return null;
        }

        await this.queue.remove(selectedJobId);

        return selectedJobId;
    }

    // -------/ update job /-------
    async updateJob(
        jobId: string,
        updates: Partial<Job>
    ): Promise<void> {
        await this.jobStore.update(jobId, updates);
    }

    // --------/ update progress /--------
    async updateProgress(
        jobId: string,
        progress: number
    ): Promise<void> {

        if (progress < 0 || progress > 100) {
            throw new Error(
                "Progress must be between 0 and 100"
            );
        }

        await this.jobStore.update(
            jobId,
            {
                progress,
                updatedAt: new Date()
            }
        );
    }

    // -----/ enqueue job /--------
    async enqueueJob(
        jobId: string
    ): Promise<void> {
        await this.queue.enqueue(jobId);
    }

    // ------/ remove job /-------
    async removeFromQueue(jobId: string): Promise<void> {
        await this.queue.remove(jobId);
    }

    // -----/ cancle job ------/
    async cancelJob(jobId: string): Promise<void> {

        const job = await this.getJob(jobId);

        if (!job) {
            throw new Error(
                `Job ${jobId} not found`
            );
        }

        if (job.status !== JobStatus.QUEUED) {
            throw new Error(
                `Job ${jobId} cannot be cancelled because its status is ${job.status}`
            );
        }

        await this.updateJob(jobId, {
            status: JobStatus.CANCELLED,
            updatedAt: new Date()
        });

        await this.removeFromQueue(jobId);
    }

}