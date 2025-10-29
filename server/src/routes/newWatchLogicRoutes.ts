import { Router } from "express";
import {
  getCaseFolders,
  getTokenFolders,
  getDateFolders,
} from "../controllers/newWatchLogic.js";

const router = Router();

router.get("/cases/date", getDateFolders);
router.get("/cases/tokens/:activeDate", getTokenFolders);
router.post("/cases/case-data", getCaseFolders);

export default router;
