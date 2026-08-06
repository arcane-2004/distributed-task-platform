import { JobHandler } from "../../../../shared/queue-engine/handlers/JobHandler.js";
import { Job } from "../../../../shared/queue-engine/models/Job.js";

interface EmailPayload {
    to: string;
    subject: string;
    body: string;
}
export class EmailJobHandler implements JobHandler {

    async execute(job: Job<EmailPayload>): Promise<void> {

        const {
            to,
            subject,
            body
        } = job.payload;

        console.log("=================================");
        console.log("Processing Email Job");
        console.log(`Job ID : ${job.id}`);
        console.log(`To     : ${to}`);
        console.log(`Subject: ${subject}`);
        console.log("=================================");

        console.log("Preparing email...");

        console.log("Email prepared successfully.");

    }

}