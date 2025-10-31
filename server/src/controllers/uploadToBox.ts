import { Request, Response } from "express";
import axios from "axios";
import { handleBoxUpload } from "../utils/fileUpload.js";
import path from "path";
import { promises as fs } from "fs";

const ROOT_DIR = process.env.ROOT_FOLDER || "";

export const uploadLiveCases = async (req: Request, res: Response) => {
  try {
    const cases = req.body.cases;

    if (!Array.isArray(cases) || cases.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No cases provided or invalid format",
      });
    }

    const portalUrl = process.env.PORTAL_URL;
    if (!portalUrl) {
      return res.status(500).json({
        success: false,
        message: "Portal URL not configured",
      });
    }

    const results: any[] = [];

    for (const c of cases) {
      const { activeDate, caseId, caseOwner, patientName } = c;

      if (!caseId || !activeDate || !caseOwner) {
        results.push({
          caseId,
          patientName,
          status: "failed",
          error: "Missing required fields",
        });
        continue;
      }

      const patientFolderName = patientName || caseOwner;
      const userToken = caseId.substring(0, 2);

      try {
        // --- Fetch Box IDs ---
        const { data } = await axios.get(
          `${portalUrl}/api/localUploader/fetchBoxIds/${caseId}`
        );
        const caseFolderId = data.caseFolderId;
        if (!caseFolderId)
          throw new Error("Missing caseFolderId in portal response");

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
        const files = await getFilesInFolder(folderPath);
        if (!files || files.length === 0) {
          results.push({
            caseId,
            patientName,
            status: "failed",
            error: "No files found in local folder",
          });
          continue;
        }

        // --- Upload files to Box ---
        const summary = await handleBoxUpload(
          caseId,
          userToken,
          patientFolderName,
          caseFolderId,
          files
        );

        // --- Mark upload completion ---
        try {
          const newFolderPath = path.join(folderPath, "AAA -- U");
          await fs.mkdir(newFolderPath, { recursive: true });
        } catch (err: any) {
          console.warn(
            `⚠️ Failed to create completion folder for ${caseId}:`,
            err.message
          );
        }

        // --- Notify portal ---
        try {
          await axios.post(
            `${portalUrl}/api/localUploader/upload-details`,
            summary
          );
        } catch (err: any) {
          console.error(
            `❌ Failed to notify portal for ${caseId}:`,
            err.message
          );
        }

        results.push({
          caseId,
          patientName,
          status: "uploaded",
          summary,
        });
      } catch (err: any) {
        console.error(`💥 Error uploading ${caseId}:`, err.message);
        results.push({
          caseId,
          patientName,
          status: "failed",
          error: err.message,
        });
      }
    }

    // --- Return all results ---
    return res.status(200).json({
      success: true,
      message: `Processed ${cases.length} cases`,
      results,
    });
  } catch (error: any) {
    console.error("💥 Unexpected error in uploadLiveCases:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unexpected error during bulk case upload",
      error: error.message,
    });
  }
};

export const uploadRedesignCases = async (req: Request, res: Response) => {
  try {
    const { cases } = req.body;

    if (!Array.isArray(cases) || cases.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Expected a non-empty array of cases.",
      });
    }

    const results: any[] = [];

    for (const item of cases) {
      const {
        activeDate,
        caseId,
        caseOwner,
        patientName,
        attempt,
        priority,
        key,
      } = item;

      // Validate
      if (
        !activeDate ||
        !caseId ||
        !caseOwner ||
        !patientName ||
        !attempt ||
        !priority
      ) {
        results.push({
          key,
          success: false,
          message: "Missing required fields.",
        });
        continue;
      }

      const patientFolderName = patientName;
      const userToken = caseId.substring(0, 2);

      try {
        // Step 2: Fetch Box IDs
        const { data } = await axios.get(
          `${process.env.PORTAL_URL}/api/localUploader/fetchBoxIds/${caseId}`
        );
        const caseFolderId = data.caseFolderId;
        if (!caseFolderId)
          throw new Error("Box caseFolderId missing in response");

        // Step 3: Build folder paths
        const folderPath = `${ROOT_DIR}/${activeDate}/REDESIGN/RD-${attempt}-${caseId} -- ${caseOwner}-${priority}/TS_Uploads/${patientName}`;
        const previewPath = path.join(folderPath, "Previews");
        const downloadPath = path.join(folderPath, "Downloads");

        // Step 4: Collect files
        const [previewFiles, downloadFiles] = await Promise.all([
          getFilesInFolder(previewPath).catch(() => []),
          getFilesInFolder(downloadPath).catch(() => []),
        ]);

        const allFiles = [...previewFiles, ...downloadFiles];
        if (allFiles.length === 0) {
          console.warn(`⚠️ No files found for ${caseId}/${patientName}`);
        }

        // Step 5: Upload to Box
        const summary = await handleBoxUpload(
          caseId,
          userToken,
          patientFolderName,
          caseFolderId,
          allFiles
        );

        // Step 6: Mark upload locally
        const newFolderPath = path.join(folderPath, "AAA -- U");
        await fs.mkdir(newFolderPath, { recursive: true });

        // Step 7: Notify portal
        await axios.post(
          `${process.env.PORTAL_URL}/api/localUploader/upload-details`,
          summary
        );

        results.push({
          key,
          success: true,
          message: "Uploaded successfully",
          summary,
        });
      } catch (err: any) {
        console.error(`❌ Upload failed for ${caseId}:`, err.message);
        results.push({
          key,
          success: false,
          message: err.message,
        });
      }
    }

    // ✅ Return consolidated results
    return res.status(200).json({
      success: true,
      total: results.length,
      results,
    });
  } catch (err: any) {
    console.error("💥 Unexpected bulk upload error:", err);
    return res.status(500).json({
      success: false,
      message: "Unexpected server error occurred during bulk upload.",
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
