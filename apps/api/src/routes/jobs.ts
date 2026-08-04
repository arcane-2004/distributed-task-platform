import { Router } from "express";

import { JobController } from "../controllers/JobController.js";

const router:Router = Router();

const jobController = new JobController();

router.post(
    "/",
    jobController.submitJob.bind(jobController)
);

router.get(
    "/:id",
    jobController.getJob.bind(jobController)
);

export default router;