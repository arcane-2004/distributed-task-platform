import dotenv from "dotenv";
import app from "./app.js";
import { redis } from "./config/redis.js";

dotenv.config();

const PORT = process.env.PORT ;

await redis.ping();

console.log("Redis ping successful");

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
});

