import { Request, Response } from "express";
import axios from "axios";
import { handleBoxUpload } from "../utils/fileUpload.js";
import path from "path";
import { promises as fs } from "fs";

const ROOT_DIR = process.env.ROOT_FOLDER || "";

export const uploadNormalCase = async (req: Request, res: Response) => {
  try {
    const { activeDate, caseId, caseOwner, patientName } = req.body;

    const patientFolderName = patientName ? patientName : caseOwner;
    const userToken = caseId.substring(0, 2);
    const { data } = await axios.get(
      `${process.env.PORTAL_URL}/api/localUploader/fetchBoxIds/${caseId}`
    );
    const { caseFolderId } = data;

    const commonPath = `${ROOT_DIR}/${activeDate}/${userToken}/EXPORT - External/${caseId} -- ${caseOwner}`;

    const folderPath = patientName
      ? `${commonPath}/${caseId} -- ${patientName}`
      : commonPath;

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

export const uploadRedesigns = async (req: Request, res: Response) => {
  const { activeDate, caseId, caseOwner, patientName, attempt, priority } =
    req.body;

  const patientFolderName = patientName;

  const { data } = await axios.get(
    `${process.env.PORTAL_URL}/api/localUploader/fetchBoxIds/${caseId}`
  );
  const { caseFolderId } = data;

  const folderPath = `${ROOT_DIR}/${activeDate}/REDESIGN/RD-${attempt}-${caseId} -- ${caseOwner}-${priority}/TS_Uploads/${patientName}`;

  const userToken = caseId.substring(0, 2);

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

  console.log("After upload summary : ", summary);

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
