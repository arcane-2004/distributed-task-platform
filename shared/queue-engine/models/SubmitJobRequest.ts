import { JobPriority } from "../enums/JobPriority.js";
import { JobType } from "../enums/JobType.js";

export interface SubmitJobRequest {
    type: JobType;
    payload: Record<string, unknown>;
    priority?: JobPriority;
    maxAttempts?: number;
}