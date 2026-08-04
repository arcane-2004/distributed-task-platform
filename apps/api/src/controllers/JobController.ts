import { Request, Response } from "express";

import { QueueService } from "../services/QueueService.js";

export class JobController {

    constructor(
        private readonly queueService = new QueueService()
    ) {}

    async submitJob(
        req: Request,
        res: Response
    ): Promise<void> {

        const job = await this.queueService.submitJob(
            req.body
        );

        res.status(201).json({
            id: job.id,
            status: job.status
        });

    }

}