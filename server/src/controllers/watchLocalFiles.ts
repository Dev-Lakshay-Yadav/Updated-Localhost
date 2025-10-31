import { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import {
  dateFoldersUtil,
  getLiveCases,
  getRedesignCases,
  getTokenFoldersUtil,
} from "../utils/watchLogic.js";
dotenv.config();
import fs from "fs";

const ROOT_DIR = process.env.ROOT_FOLDER || "";

// filter out the date folders
export const getAllCasesData = async (req: Request, res: Response) => {
  try {
    const allDates = dateFoldersUtil(ROOT_DIR);
    const finalData: Record<string, any> = {};

    // Run all date-level traversals in parallel
    await Promise.all(
      allDates.map(async (activeDate) => {
        const datePath = path.join(ROOT_DIR, activeDate);
        try {
          await fs.promises.access(datePath); // ensures folder exists
        } catch {
          return; // skip if missing
        }

        const tokens = getTokenFoldersUtil(datePath);
        const tokenData: Record<string, any> = {};

        // Process all tokens concurrently
        await Promise.all(
          tokens.map(async (activeToken) => {
            const tokenPath = path.join(datePath, activeToken);
            try {
              let caseDetail: any = {};

              if (activeToken.toUpperCase() === "REDESIGN") {
                caseDetail = await getRedesignCases(tokenPath);
              } else if (activeToken.length === 2) {
                const livePath = path.join(tokenPath, "EXPORT - External");
                try {
                  await fs.promises.access(livePath);
                  caseDetail = await getLiveCases(livePath);
                } catch {
                  // livePath not found, skip
                }
              }

              tokenData[activeToken] = caseDetail;
            } catch (err: any) {
              console.error(
                `Error reading token ${activeToken} in ${activeDate}:`,
                err.message
              );
              tokenData[activeToken] = { error: err.message };
            }
          })
        );

        finalData[activeDate] = tokenData;
      })
    );

    res.json(finalData);
  } catch (err: any) {
    console.error("❌ Error reading case folders:", err.message);
    res.status(500).json({
      error: "Failed to read folders",
      details: err.message,
    });
  }
};
