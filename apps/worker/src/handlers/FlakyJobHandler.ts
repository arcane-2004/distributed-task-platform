import { Job } from "../../../../shared/queue-engine/models/Job.js";
import { JobHandler } from "../../../../shared/queue-engine/handlers/JobHandler.js";

export class FlakyJobHandler implements JobHandler {

    private attempts = 0;

    constructor(
        private readonly failuresBeforeSuccess: number
    ) {}

    async execute(
        job: Job,
        updateProgress: (progress: number) => Promise<void>
    ): Promise<void> {

        this.attempts++;

        await updateProgress(10);

        if (this.attempts <= this.failuresBeforeSuccess) {
            throw new Error(
                `Temporary failure on attempt ${this.attempts}`
            );
        }

        await updateProgress(100);
    }
}