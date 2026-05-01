import { Router, type IRouter } from "express";
import healthRouter from "./health";
import energyLogsRouter from "./energyLogs";
import categoriesRouter from "./categories";
import mentorsRouter from "./mentors";
import sessionsRouter from "./sessions";
import majorRecommendationsRouter from "./majorRecommendations";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(energyLogsRouter);
router.use(categoriesRouter);
router.use(mentorsRouter);
router.use(sessionsRouter);
router.use(majorRecommendationsRouter);
router.use(dashboardRouter);

export default router;
