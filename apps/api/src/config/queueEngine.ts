import {QueueEngine}  from "../../../../shared/queue-engine/engine/QueueEngine.js";
import { redis } from "./redis.js";

export const queueEngine = new QueueEngine(
    redis,
    "default"
);