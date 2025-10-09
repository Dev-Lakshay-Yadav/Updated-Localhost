import { Request, Response } from "express";
import { promises as fs } from "fs";
import path from "path";
import { handleBoxUpload } from "../utils/fileUpload.js";
import axios from "axios";

export const uploadToBox = async (req: Request, res: Response) => {
  try {
    const { folderPath, userId } = req.body;

    if (!folderPath) {
      return res.status(400).json({ message: "Folder path is required" });
    }

    const lastFolder = folderPath.split(/[/\\]/).pop() || "";
    const caseIdMatch = lastFolder.match(/([A-Z]{2}\d+)/);
    const caseId = caseIdMatch ? caseIdMatch[1] : "";

    const patientNameMatch = lastFolder.split("--")[1];
    const patientFolderName = patientNameMatch ? patientNameMatch.trim() : "";

    const userToken = caseId.substring(0, 2);

    const { data } = await axios.get(
      `${process.env.PORTAL_URL}/api/localUploader/fetchBoxIds/${caseId}`
    );

    const { tokenFolderId, caseFolderId } = data;

    const files = await getFilesInFolder(folderPath);

    const summary = await handleBoxUpload(
      caseId,
      userToken,
      patientFolderName,
      tokenFolderId,
      caseFolderId,
      files
    );

    const newFolderPath = path.join(folderPath, "AAA -- U");
    await fs.mkdir(newFolderPath, { recursive: true });

    await axios.post(
      `${process.env.PORTAL_URL}/api/localUploader/upload-details`,
      summary
    );

    res
      .status(200)
      .json({ message: "Case files uploaded successfully", summary });
  } catch (error: any) {
    console.error("Error in uploadToBox:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const getFilesInFolder = async (
  folderPath: string
): Promise<string[]> => {
  try {
    const entries = await fs.readdir(folderPath, { withFileTypes: true });

    const files: string[] = [];

    for (const entry of entries) {
      if (entry.isFile()) {
        files.push(path.join(folderPath, entry.name));
      }
      // 👇 skip subfolders, no recursion
    }

    return files;
  } catch (error: any) {
    console.error("Error reading folder:", error.message);
    throw new Error("Unable to read folder");
  }
};
