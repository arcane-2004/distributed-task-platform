import { Request, Response, NextFunction } from "express";

import { QueueService } from "../services/QueueService.js";

type JobParams = {
    id: string;
};
export class JobController {

    constructor(
        private readonly queueService = new QueueService()
    ) { }

    async submitJob(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {

        try {

            const job = await this.queueService.submitJob(
                req.body
            );

            res.status(201).json({
                id: job.id,
                status: job.status
            });

        } catch (error) {
            next(error);
        }

    }

    async getJob(
        req: Request<JobParams>,
        res: Response,
        next: NextFunction
    ): Promise<void> {

        try {

            const job = await this.queueService.getJob(
                req.params.id
            );

            if (!job) {
                res.status(404).json({
                    message: "Job not found"
                });

                return;
            }

            res.status(200).json(job);

        } catch (error) {
            next(error);
        }

    }

}