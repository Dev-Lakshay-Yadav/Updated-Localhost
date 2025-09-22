import { Router } from "express";
import { getCaseFoldersController } from "../controllers/watchLocalFiles.js";

const router = Router();

router.get("/cases", getCaseFoldersController);

export default router;
