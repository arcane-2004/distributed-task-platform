import { JobType } from "../enums/JobType.js";
import { JobHandler } from "./JobHandler.js";

export class HandlerRegistry {

    private readonly handlers = new Map<JobType, JobHandler>();

    register(jobType: JobType, handler: JobHandler): void {
        this.handlers.set(jobType, handler);
    }

    get(jobType: JobType): JobHandler {
        const handler = this.handlers.get(jobType);

        if (!handler) {
            throw new Error(
                `No handler registered for ${jobType}`
            );
        }

        return handler;
    }

}