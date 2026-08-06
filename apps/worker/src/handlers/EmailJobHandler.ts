import { JobHandler } from "../../../../shared/queue-engine/handlers/JobHandler.js";
import { Job } from "../../../../shared/queue-engine/models/Job.js";

interface EmailPayload {
    to: string;
    subject: string;
    body: string;
}
export class EmailJobHandler implements JobHandler {

    private async sleep(
        ms: number
    ): Promise<void> {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }

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

        await this.sleep(3000);

        console.log("Connecting to email provider...");

        await this.sleep(2000);

        console.log("Email sent successfully.");

    }

}