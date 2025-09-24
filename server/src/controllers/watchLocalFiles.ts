import { Request, Response } from "express";
import { getCaseFolders } from "../utils/watchLogic.js";
import dotenv from "dotenv";
dotenv.config();

// Fixed root directory
// const ROOT_DIR = 'C:\Users\Tooth Sketch\Desktop\Local test';
const ROOT_DIR = process.env.ROOT_FOLDER
// const ROOT_DIR = "Z:/";

console.log("Root die : ",ROOT_DIR)

// Controller
export const getCaseFoldersController = (req: Request, res: Response) => {
  try {
    const folders = getCaseFolders(ROOT_DIR || "");
    res.json(folders);
  } catch (err: any) {
    console.error("Error reading case folders:", err.message);
    res
      .status(500)
      .json({ error: "Failed to read folders", details: err.message });
  }
};
