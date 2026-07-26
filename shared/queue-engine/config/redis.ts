import Redis from "ioredis";

const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD || undefined,
});

redis.on("connect", () => {
    console.log("Redis Connected");
});

redis.on("ready", () => {
    console.log("Redis ready");
});

redis.on("error", (err) => {
    console.error(err);
});

redis.on("close", () => {
    console.log("Redis connection closed");
});

redis.on("reconnecting", () => {
    console.log("Reconnecting...");
});

export default redis;

