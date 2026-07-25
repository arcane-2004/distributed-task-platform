import express from "express";
import cors from "cors";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health Check Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Distributed Task Processing API is running 🚀",
  });
});

export default app;