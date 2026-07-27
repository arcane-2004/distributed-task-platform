export class RedisKeys {

    static job(jobId: string): string {
        return `job:${jobId}`;
    }

    static queue(queueName: string): string {
        return `queue:${queueName}`;
    }

    static processing(queueName: string): string {
        return `processing:${queueName}`;
    }

    static scheduled(queueName: string): string {
        return `scheduled:${queueName}`;
    }

    static failed(queueName: string): string {
        return `failed:${queueName}`;
    }

    static completed(queueName: string): string {
        return `completed:${queueName}`;
    }

    static worker(workerId: string): string {
        return `worker:${workerId}`;
    }

    static lock(jobId: string): string {
        return `lock:${jobId}`;
    }

}