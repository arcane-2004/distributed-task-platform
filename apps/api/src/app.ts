import express, {Express} from "express";
import cors from "cors";
import jobsRouter from "./routes/jobs.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app: Express = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Check Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Distributed Task Processing API is running 🚀",
  });
});


app.use("/jobs", jobsRouter);


// -----/ register error handler /---------
app.use(errorHandler);

export default app;