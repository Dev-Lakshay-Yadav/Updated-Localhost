import { Request, Response } from "express";
import { promises as fs } from "fs";
import path from "path";

export const uploadToBox = async (req: Request, res: Response) => {
  try {
    // 📥 Get folder path from request body (or query/params if you prefer)
    const { folderPath } = req.body;

    if (!folderPath) {
      return res.status(400).json({ message: "Folder path is required" });
    }


    const files = await getFilesInFolder(folderPath);

    // ✅ Log the received folder path
    console.log("files inside : ", files);

    // send back response
    res.status(200).json({ message: "Folder path received", folderPath });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};





export const getFilesInFolder = async (folderPath: string): Promise<string[]> => {
  try {
    // ✅ Read directory contents
    const entries = await fs.readdir(folderPath, { withFileTypes: true });

    // ✅ Filter out only files (ignore subfolders)
    const files = entries
      .filter((entry) => entry.isFile())
      .map((file) => path.join(folderPath, file.name));

    return files;
  } catch (error: any) {
    console.error("Error reading folder:", error.message);
    throw new Error("Unable to read folder");
  }
};