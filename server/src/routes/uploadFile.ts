import express from "express";
import { uploadToBox } from "../controllers/uploadToBox.js"; // adjust path

const router = express.Router();

// POST /api/upload-to-box
router.post("/upload", uploadToBox);

export default router;
