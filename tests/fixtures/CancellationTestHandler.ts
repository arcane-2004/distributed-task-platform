import { Job } from "../../shared/queue-engine/models/Job.js";
import { JobHandler } from "../../shared/queue-engine/handlers/JobHandler.js";

export class CancellationTestHandler implements JobHandler {

    public executed = false;

    async execute(
        job: Job,
        updateProgress: (progress: number) => Promise<void>
    ): Promise<void> {

        this.executed = true;

        await updateProgress(100);
    }
}