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

    async execute(
        job: Job<EmailPayload>,
        updateProgress: (progress: number) => Promise<void>
    ): Promise<void> {

        const {
            to,
            subject,
            body
        } = job.payload;

        await updateProgress(0);

        console.log("=================================");
        console.log("Processing Email Job");
        console.log(`Job ID : ${job.id}`);
        console.log(`To     : ${to}`);
        console.log(`Subject: ${subject}`);
        console.log("=================================");


        console.log("Preparing email...");
        await this.sleep(1000);
        await updateProgress(25);

        console.log("Connecting to email provider...");
        await this.sleep(2000);
        await updateProgress(50);

        console.log("Sending email...");
        await this.sleep(1000);
        await updateProgress(75);

        console.log("Waiting for confirmation...");
        await this.sleep(1000);

        console.log("Email sent successfully.");
        await updateProgress(100);

    }

}