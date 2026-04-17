import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import categoriesRouter from "./categories";
import contentRouter from "./content";
import purchasesRouter from "./purchases";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileRouter);
router.use(categoriesRouter);
router.use(contentRouter);
router.use(purchasesRouter);

export default router;
