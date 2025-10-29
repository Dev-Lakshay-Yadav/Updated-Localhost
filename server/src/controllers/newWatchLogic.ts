import { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import {
  dateFoldersUtil,
  getLiveCases,
  getRedesignCases,
  getTokenFoldersUtil,
} from "../utils/newWatchLogic.js";
dotenv.config();

const ROOT_DIR = process.env.ROOT_FOLDER || "";

// filter out the date folders
export const getDateFolders = (req: Request, res: Response) => {
  try {
    const folders = dateFoldersUtil(ROOT_DIR);
    res.json(folders);
  } catch (err: any) {
    console.error("Error reading case folders:", err.message);
    res.status(500).json({
      error: "Failed to read folders",
      details: err.message,
    });
  }
};

// filter out the token folders
export const getTokenFolders = (req: Request, res: Response) => {
  try {
    const {activeDate} = req.params;
    const folders = getTokenFoldersUtil(`${ROOT_DIR}/${activeDate}`);

    if (!folders.length) {
      return res.status(404).json({ message: "No valid folders found" });
    }

    res.json(folders);
  } catch (err: any) {
    console.error("Error reading case folders:", err.message);
    res.status(500).json({
      error: "Failed to read folders",
      details: err.message,
    });
  }
};

// filter out the final case data
export const getCaseFolders = (req: Request, res: Response) => {
  try {
    const {activeDate,activeToken} = req.body
    let result;

    if (activeToken.toUpperCase() === "REDESIGN") {
      const basePath = path.join(`${ROOT_DIR}/${activeDate}`, activeToken);
      result = getRedesignCases(basePath);
    } else if (activeToken.length === 2) {
      const basePath = path.join(`${ROOT_DIR}/${activeDate}`, activeToken, "EXPORT - External");
      result = getLiveCases(basePath);
    } else {
      return res.status(404).json({
        message: "No valid folders found (REDESIGN or LIVE).",
      });
    }

    res.json(result);
  } catch (err: any) {
    console.error("❌ Error reading case folders:", err.message);
    res.status(500).json({
      error: "Failed to read folders",
      details: err.message,
    });
  }
};
