import { Job } from "../models/Job.js";
export interface JobHandler {

    execute(
        job: Job,
        updateProgress: (progress: number) => Promise<void>
    ): Promise<void>;

}