import express, {Express} from "express";
import cors from "cors";
import routes from "./routes/index.js";

const app: Express = express();

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

app.use("/api", routes);

export default app;