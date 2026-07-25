import { Request, Response } from "express";
import { getHealthStatus } from "../services/health.service.js";

export const getHealth = (req: Request, res: Response) => {
  const data = getHealthStatus();

  res.status(200).json(data);
};