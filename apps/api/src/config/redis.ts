import dotenv from "dotenv";
dotenv.config();

import {Redis} from "ioredis";

export const redis = new Redis({
    host: process.env.REDIS_HOST || "localhost",

    port: Number(process.env.REDIS_PORT) ,

    password: process.env.REDIS_PASSWORD || undefined,
});

redis.on("connect", () => {
    console.log("✅ Connected to Redis");
});

redis.on("error", (error: any) => {
    console.error("❌ Redis Error:", error);
});