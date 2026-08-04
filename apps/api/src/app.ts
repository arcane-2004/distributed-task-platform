import express, {Express} from "express";
import cors from "cors";
import jobsRouter from "./routes/jobs.js";

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

export default app;