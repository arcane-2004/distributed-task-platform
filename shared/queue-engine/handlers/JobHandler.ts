import { Job } from "../models/Job.js";

export interface JobHandler {

    execute(
        job: Job
    ): Promise<void>;

}