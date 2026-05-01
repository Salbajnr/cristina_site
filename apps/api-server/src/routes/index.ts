import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import categoriesRouter from "./categories";
import contentRouter from "./content";
import purchasesRouter from "./purchases";
import creatorRouter from "./creator";
import inquiriesRouter from "./inquiries";
import postsRouter from "./posts";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profileRouter);
router.use(categoriesRouter);
router.use(contentRouter);
router.use(purchasesRouter);
router.use(creatorRouter);
router.use(inquiriesRouter);
router.use(postsRouter);

export default router;

