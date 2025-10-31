import express from "express";
import {
  uploadNormalCase,
  uploadRedesigns,
} from "../controllers/uploadToBox.js";

const router = express.Router();

router.post("/upload/live", uploadNormalCase);
router.post("/upload/redesign", uploadRedesigns);

export default router;
