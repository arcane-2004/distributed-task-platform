import { QueueEngine } from "../engine/QueueEngine.js";
import { JobStatus } from "../enums/JobStatus.js";
import { HandlerRegistry } from "../handlers/HandlerRegistry.js";

export class Worker {

    private running = false;


    private async sleep(
        ms: number
    ): Promise<void> {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }

    constructor(
        private readonly queueEngine: QueueEngine,
        private readonly registry: HandlerRegistry,
        private readonly pollingIntervalMs = 1000,
    ) { }

    // ========/ processing one job only /=========
    async processOneJob(): Promise<void> {

        const jobId = await this.queueEngine.getNextJobId();

        if (!jobId) {
            return;
        }

        const job = await this.queueEngine.getJob(jobId);

        if (!job) {
            return;
        }


        const now = new Date();

        await this.queueEngine.updateJob(job.id, {
            status: job.status,
            startedAt: job.startedAt,
            updatedAt: job.updatedAt
        });

        try {
            job.status = JobStatus.RUNNING;
            job.startedAt = now;
            job.updatedAt = now;

            const handler = this.registry.get(job.type);  // ----- getting handler ------


            await handler.execute(
                job,
                async (progress: number) => {
                    await this.queueEngine.updateProgress(
                        job.id,
                        progress
                    );
                }
            );
            
            await this.queueEngine.updateJob(
                job.id,
                {
                    status: JobStatus.COMPLETED,
                    completedAt: new Date(),
                    updatedAt: new Date()
                }
            );

        } catch (error) {
            await this.queueEngine.updateJob(
                job.id,
                {
                    status: JobStatus.FAILED,
                    error: error instanceof Error
                        ? error.message
                        : "Unknown error",
                    updatedAt: new Date()
                }
            );
        }

    }

    // -------/ start method /--------
    async start(): Promise<void> {

        if (this.running) {
            return;
        }

        this.running = true;

        while (this.running) {
            await this.processOneJob();

            await this.sleep(this.pollingIntervalMs);
        }

    }

    stop(): void {
        this.running = false;
    }
}