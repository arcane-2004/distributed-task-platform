import { JobStatus } from "../enums/JobStatus";
import { JobPriority } from "../enums/JobPriority";
import { JobType } from "../enums/JobType";

export interface Job {
    id: string;

    type: JobType;

    queue: string;

    payload: unknown;

    status: JobStatus;

    priority: JobPriority;

    attempts: number;

    maxAttempts: number;

    progress: number;

    result?: unknown;

    error?: string;

    workerId?: string;

    createdAt: Date;

    updatedAt: Date;

    startedAt?: Date;

    completedAt?: Date;
}