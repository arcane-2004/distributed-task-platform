import { SubmitJobRequest } from "../../../../shared/queue-engine/models/SubmitJobRequest.js";
import { Job } from "../../../../shared/queue-engine/models/Job.js";

import { queueEngine } from "../config/queueEngine.js";

export class QueueService {

    async submitJob(
        request: SubmitJobRequest
    ): Promise<Job> {

        return await queueEngine.submit(request);

    }

    async getJob(
        jobId: string
    ): Promise<Job | null> {

        return await queueEngine.getJob(jobId);

    }

}