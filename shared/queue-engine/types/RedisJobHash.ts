export interface RedisJobHash {
    id: string;

    type: string;

    queue: string;

    payload: string;

    status: string;

    priority: string;

    attempts: string;

    maxAttempts: string;

    progress: string;

    result?: string;

    error?: string;

    workerId?: string;

    createdAt: string;

    updatedAt: string;

    queuedAt: string;

    startedAt?: string;

    completedAt?: string;
}