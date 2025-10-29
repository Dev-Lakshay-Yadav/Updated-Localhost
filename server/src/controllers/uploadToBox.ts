import { Request, Response } from "express";
import { promises as fs } from "fs";
import path from "path";
import axios from "axios";
import { handleBoxUpload } from "../utils/fileUpload.js";

export const uploadToBox = async (req: Request, res: Response) => {
  try {
    const { folderPath } = req.body;

    if (!folderPath) {
      return res.status(400).json({ message: "Folder path is required" });
    }

    console.log("📂 Received folderPath:", folderPath);

    if (folderPath.toUpperCase().includes("REDESIGN")) {
      const result = await uploadRedesigns(folderPath);
      return res.status(200).json(result);
    } else {
      const result = await uploadNormalCase(folderPath);
      return res.status(200).json(result);
    }
  } catch (error: any) {
    console.error("❌ Error in uploadToBox:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const uploadRedesigns = async (folderPath: string) => {
  const match = folderPath.match(/([A-Z]{2}\d{5})/);
  const caseId = match ? match[1] : null;

  if (!caseId) {
    throw new Error(`❌ Could not extract caseId from path: ${folderPath}`);
  }

  const userToken = caseId.substring(0, 2);

  const { data } = await axios.get(
    `${process.env.PORTAL_URL}/api/localUploader/fetchBoxIds/${caseId}`
  );

  const { caseFolderId } = data;
  if (!caseFolderId) throw new Error(`❌ No caseFolderId found for ${caseId}`);

  // 🔹 Extract patient folder name (next to "ts_uploads")
  let patientFolderName = null;
  const parts = folderPath.split(/[/\\]/);
  const uploadsIndex = parts.findIndex(
    (part) => part.toLowerCase() === "ts_uploads"
  );
  if (uploadsIndex !== -1) {
    patientFolderName = parts[uploadsIndex + 1] || null;
  }

  if (!patientFolderName) {
    console.warn("⚠️ Could not detect patient folder from path:", folderPath);
  }

  console.log("🧩 Data:", {
    caseId,
    caseFolderId,
    userToken,
    patientFolderName,
  });

  // 🔹 Define subfolders to read from
  const previewPath = path.join(folderPath, "Previews");
  const downloadPath = path.join(folderPath, "Downloads");

  // 🔹 Collect files only from these two subfolders
  let allFiles: any[] = [];
  try {
    const [previewFiles, downloadFiles] = await Promise.all([
      getFilesInFolder(previewPath),
      getFilesInFolder(downloadPath),
    ]);
    allFiles = [...previewFiles, ...downloadFiles];
  } catch (err) {
    console.error("⚠️ Error reading Previews/Downloads:", err);
  }

  if (allFiles.length === 0) {
    console.warn("⚠️ No files found in Previews or Downloads for", folderPath);
  }

  // 🔹 Upload to Box
  const summary = await handleBoxUpload(
    caseId,
    userToken,
    patientFolderName,
    caseFolderId,
    allFiles
  );

  console.log("After upload summary : ",summary)

  // 🔹 Mark upload completion locally
  const newFolderPath = path.join(folderPath, "AAA -- U");
  await fs.mkdir(newFolderPath, { recursive: true });

  // 🔹 Notify portal about upload summary
  await axios.post(
    `${process.env.PORTAL_URL}/api/localUploader/upload-details`,
    summary
  );

  return {
    message: "Case files uploaded successfully",
    summary,
  };
};

export const uploadNormalCase = async (folderPath: string) => {
  try {
    const lastFolder = folderPath.split(/[/\\]/).pop() || "";

    const caseIdMatch = lastFolder.match(/([A-Z]{2}\d+)/);
    const caseId = caseIdMatch ? caseIdMatch[1] : "";

    const patientNameMatch = lastFolder.split("--")[1];
    const patientFolderName = patientNameMatch ? patientNameMatch.trim() : "";

    const userToken = caseId.substring(0, 2);

    console.log(`🧾 CaseID: ${caseId}, Patient: ${patientFolderName}`);

    const { data } = await axios.get(
      `${process.env.PORTAL_URL}/api/localUploader/fetchBoxIds/${caseId}`
    );

    const { caseFolderId } = data;

    const files = await getFilesInFolder(folderPath);

    const summary = await handleBoxUpload(
      caseId,
      userToken,
      patientFolderName,
      caseFolderId,
      files
    );

    // Mark upload completion locally
    const newFolderPath = path.join(folderPath, "AAA -- U");
    await fs.mkdir(newFolderPath, { recursive: true });

    // Send upload summary to portal
    await axios.post(
      `${process.env.PORTAL_URL}/api/localUploader/upload-details`,
      summary
    );

    return {
      message: "Case files uploaded successfully",
      summary,
    };
  } catch (error: any) {
    console.error("❌ Error in uploadNormalCase:", error);
    throw new Error(error.message || "Error during normal case upload");
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
    }

    return files;
  } catch (error: any) {
    console.error("⚠️ Error reading folder:", error.message);
    throw new Error("Unable to read folder");
  }
};

// import { Request, Response } from "express";
// import { promises as fs } from "fs";
// import path from "path";
// import { handleBoxUpload } from "../utils/fileUpload.js";
// import axios from "axios";

// export const uploadToBox = async (req: Request, res: Response) => {
//   try {
//     const { folderPath, userId } = req.body;

//     if (!folderPath) {
//       return res.status(400).json({ message: "Folder path is required" });
//     }

//     const lastFolder = folderPath.split(/[/\\]/).pop() || "";
//     const caseIdMatch = lastFolder.match(/([A-Z]{2}\d+)/);
//     const caseId = caseIdMatch ? caseIdMatch[1] : "";

//     const patientNameMatch = lastFolder.split("--")[1];
//     const patientFolderName = patientNameMatch ? patientNameMatch.trim() : "";

//     const userToken = caseId.substring(0, 2);

//     const { data } = await axios.get(
//       `${process.env.PORTAL_URL}/api/localUploader/fetchBoxIds/${caseId}`
//     );

//     const { tokenFolderId, caseFolderId } = data;

//     const files = await getFilesInFolder(folderPath);

//     const summary = await handleBoxUpload(
//       caseId,
//       userToken,
//       patientFolderName,
//       tokenFolderId,
//       caseFolderId,
//       files
//     );

//     const newFolderPath = path.join(folderPath, "AAA -- U");
//     await fs.mkdir(newFolderPath, { recursive: true });

//     await axios.post(
//       `${process.env.PORTAL_URL}/api/localUploader/upload-details`,
//       summary
//     );

//     res
//       .status(200)
//       .json({ message: "Case files uploaded successfully", summary });
//   } catch (error: any) {
//     console.error("Error in uploadToBox:", error);
//     res.status(500).json({ message: error.message || "Internal server error" });
//   }
// };

// export const getFilesInFolder = async (
//   folderPath: string
// ): Promise<string[]> => {
//   try {
//     const entries = await fs.readdir(folderPath, { withFileTypes: true });

//     const files: string[] = [];

//     for (const entry of entries) {
//       if (entry.isFile()) {
//         files.push(path.join(folderPath, entry.name));
//       }
//       // 👇 skip subfolders, no recursion
//     }

//     return files;
//   } catch (error: any) {
//     console.error("Error reading folder:", error.message);
//     throw new Error("Unable to read folder");
//   }
// };
