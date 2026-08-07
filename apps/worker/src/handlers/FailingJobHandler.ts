import { Job } from "../../../../shared/queue-engine/models/Job.js";
import { JobHandler } from "../../../../shared/queue-engine/handlers/JobHandler.js";

export class FailingJobHandler implements JobHandler {

    async execute(
        job: Job,
        updateProgress: (progress: number) => Promise<void>
    ): Promise<void> {

        await updateProgress(10);

        throw new Error(
            "Intentional failure for retry testing."
        );
    }

}