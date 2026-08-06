import { JobStatus } from "../enums/JobStatus.js";
import { JobPriority } from "../enums/JobPriority.js";
import { JobType } from "../enums/JobType.js";

export interface Job<T = unknown> {
    id: string;

    type: JobType;

    queue: string;

    payload: T;

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