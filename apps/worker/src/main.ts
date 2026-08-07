import {Redis} from "ioredis";
import dotenv from 'dotenv'
import { QueueEngine } from "../../../shared/queue-engine/engine/QueueEngine.js";
import { HandlerRegistry } from "../../../shared/queue-engine/handlers/HandlerRegistry.js";
import { JobType } from "../../../shared/queue-engine/enums/JobType.js";

import { Worker } from "../../../shared/queue-engine/worker/Worker.js";

import { EmailJobHandler } from "./handlers/EmailJobHandler.js";

dotenv.config()
console.log("Starting Worker...");

const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD || undefined,
});

redis.on("connect", () => {
    console.log("Connected to Redis");
});

redis.on("error", (error) => {
    console.error("Redis Error:", error);
});


const queueEngine = new QueueEngine(
    redis,
    "default"
);

console.log("QueueEngine initialized");

const registry = new HandlerRegistry();
console.log("HandlerRegistry initialized");

registry.register(
    JobType.EMAIL,
    new EmailJobHandler()
);



const worker = new Worker(
    queueEngine,
    registry
);

console.log("Worker initialized");

worker.start()
    .catch((error) => {
        console.error("Worker crashed:", error);
        process.exit(1);
    });

console.log("Worker started");