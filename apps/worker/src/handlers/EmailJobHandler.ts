import { JobHandler } from "../../../../shared/queue-engine/handlers/JobHandler.js";
import { Job } from "../../../../shared/queue-engine/models/Job.js";

export class EmailJobHandler implements JobHandler {

    async execute(
        job: Job
    ): Promise<void> {

        console.log("Processing EMAIL job:");
        console.log(job);

    }

}