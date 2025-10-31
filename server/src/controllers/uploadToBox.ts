import { Request, Response } from "express";
import axios from "axios";
import { handleBoxUpload } from "../utils/fileUpload.js";
import path from "path";
import { promises as fs } from "fs";

const ROOT_DIR = process.env.ROOT_FOLDER || "";

export const uploadLiveCases = async (req: Request, res: Response) => {
  try {
    const { activeDate, caseId, caseOwner, patientName } = req.body;

    if (!caseId || !activeDate || !caseOwner) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const patientFolderName = patientName || caseOwner;
    const userToken = caseId.substring(0, 2);
    const portalUrl = process.env.PORTAL_URL;

    if (!portalUrl) {
      return res
        .status(500)
        .json({ success: false, message: "Portal URL not configured" });
    }

    // --- Fetch Box IDs ---
    let caseFolderId;
    try {
      const { data } = await axios.get(
        `${portalUrl}/api/localUploader/fetchBoxIds/${caseId}`
      );
      caseFolderId = data.caseFolderId;
      if (!caseFolderId)
        throw new Error("Missing caseFolderId in portal response");
    } catch (err: any) {
      console.error("❌ Failed to fetch Box IDs:", err.message);
      return res.status(502).json({
        success: false,
        message: "Failed to fetch Box IDs from portal",
        error: err.message,
      });
    }

    // --- Construct paths ---
    const commonPath = path.join(
      ROOT_DIR,
      activeDate,
      userToken,
      "EXPORT - External",
      `${caseId} -- ${caseOwner}`
    );
    const folderPath = patientName
      ? path.join(commonPath, `${caseId} -- ${patientName}`)
      : commonPath;

    // --- Get local files ---
    let files;
    try {
      files = await getFilesInFolder(folderPath);
      if (!files || files.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "No files found in local folder" });
      }
    } catch (err: any) {
      console.error("❌ Failed to read files:", err.message);
      return res.status(500).json({
        success: false,
        message: "Error reading local files",
        error: err.message,
      });
    }

    // --- Upload files to Box ---
    let summary;
    try {
      summary = await handleBoxUpload(
        caseId,
        userToken,
        patientFolderName,
        caseFolderId,
        files
      );
    } catch (err: any) {
      console.error("❌ Failed to upload files to Box:", err.message);
      return res.status(500).json({
        success: false,
        message: "Error uploading files to Box",
        error: err.message,
      });
    }

    // --- Mark upload completion locally ---
    try {
      const newFolderPath = path.join(folderPath, "AAA -- U");
      await fs.mkdir(newFolderPath, { recursive: true });
    } catch (err: any) {
      console.warn("⚠️ Failed to create completion folder:", err.message);
    }

    // --- Notify portal about upload summary ---
    try {
      await axios.post(
        `${portalUrl}/api/localUploader/upload-details`,
        summary
      );
    } catch (err: any) {
      console.error("❌ Failed to notify portal:", err.message);
      // Don’t fail the entire request, just log it
    }

    // --- Success response ---
    return res.status(200).json({
      success: true,
      message: "Case files uploaded successfully",
      summary,
    });
  } catch (error: any) {
    console.error("💥 Unexpected error in uploadLiveCases:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unexpected error during case upload",
      error: error.message,
    });
  }
};

export const uploadRedesignCases = async (req: Request, res: Response) => {
  try {
    const { activeDate, caseId, caseOwner, patientName, attempt, priority } =
      req.body;

    // 🧩 Step 1: Validate input
    if (
      !activeDate ||
      !caseId ||
      !caseOwner ||
      !patientName ||
      !attempt ||
      !priority
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields. Required: activeDate, caseId, caseOwner, patientName, attempt, priority.",
      });
    }

    const patientFolderName = patientName;
    const userToken = caseId.substring(0, 2);

    // 🧩 Step 2: Fetch Box IDs
    let caseFolderId: string;
    try {
      const { data } = await axios.get(
        `${process.env.PORTAL_URL}/api/localUploader/fetchBoxIds/${caseId}`
      );
      caseFolderId = data.caseFolderId;
      if (!caseFolderId)
        throw new Error("Box caseFolderId missing in response");
    } catch (err: any) {
      console.error("❌ Failed to fetch Box IDs:", err.message);
      return res.status(502).json({
        success: false,
        message:
          "Failed to fetch Box folder IDs. Please verify network and caseId.",
        error: err.message,
      });
    }

    // 🧩 Step 3: Build local folder path
    const folderPath = `${ROOT_DIR}/${activeDate}/REDESIGN/RD-${attempt}-${caseId} -- ${caseOwner}-${priority}/TS_Uploads/${patientName}`;
    const previewPath = path.join(folderPath, "Previews");
    const downloadPath = path.join(folderPath, "Downloads");

    // 🧩 Step 4: Collect files from subfolders
    let allFiles: any[] = [];
    try {
      const [previewFiles, downloadFiles] = await Promise.all([
        getFilesInFolder(previewPath).catch(() => []),
        getFilesInFolder(downloadPath).catch(() => []),
      ]);

      allFiles = [...previewFiles, ...downloadFiles];
      if (allFiles.length === 0) {
        console.warn(`⚠️ No files found in: ${previewPath} or ${downloadPath}`);
      }
    } catch (err: any) {
      console.error(
        "⚠️ Error reading Previews/Downloads folders:",
        err.message
      );
      return res.status(500).json({
        success: false,
        message: "Failed to read Previews or Downloads folder.",
        error: err.message,
      });
    }

    // 🧩 Step 5: Upload to Box
    let summary;
    try {
      summary = await handleBoxUpload(
        caseId,
        userToken,
        patientFolderName,
        caseFolderId,
        allFiles
      );
    } catch (err: any) {
      console.error("❌ Box upload failed:", err.message);
      return res.status(500).json({
        success: false,
        message: "Error uploading files to Box.",
        error: err.message,
      });
    }

    console.log("✅ Upload summary:", summary);

    // 🧩 Step 6: Mark upload completion locally
    try {
      const newFolderPath = path.join(folderPath, "AAA -- U");
      await fs.mkdir(newFolderPath, { recursive: true });
    } catch (err: any) {
      console.error(
        "⚠️ Failed to create local completion folder:",
        err.message
      );
    }

    // 🧩 Step 7: Notify portal about upload summary
    try {
      await axios.post(
        `${process.env.PORTAL_URL}/api/localUploader/upload-details`,
        summary
      );
    } catch (err: any) {
      console.error("⚠️ Failed to notify portal:", err.message);
    }

    // ✅ Final response
    return res.status(200).json({
      success: true,
      message: "Case files uploaded successfully.",
      summary,
    });
  } catch (err: any) {
    console.error("💥 Unexpected error in uploadRedesignCases:", err);
    return res.status(500).json({
      success: false,
      message: "Unexpected server error occurred.",
      error: err.message,
    });
  }
};

const getFilesInFolder = async (folderPath: string): Promise<string[]> => {
  try {
    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      if (entry.isFile()) {
        files.push(path.join(folderPath, entry.name));
      }
    }

    return files;
  } catch (error: any) {
    console.error("⚠️ Error reading folder:", error.message);
    throw new Error("Unable to read folder");
  }
};
