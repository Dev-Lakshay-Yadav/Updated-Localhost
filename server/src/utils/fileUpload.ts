// import fs from "fs";
// import path from "path";
// import { initializeBoxClient } from "../config/box.js"; 
// // import BoxFiles from "../models/BoxFiles.js";

// export const getOrCreateFolder = async (
//   parentFolderId: string,
//   folderName: string
// ): Promise<string> => {
//   const client = await initializeBoxClient();
//   const items = await client.folders.getItems(parentFolderId, {
//     limit: 1000,
//     fields: "name,id,type",
//   });

//   const existingFolder = items.entries.find(
//     (item: { type: string; name: string }) =>
//       item.type === "folder" && item.name === folderName
//   );

//   if (existingFolder) return existingFolder.id;

//   const newFolder = await client.folders.create(parentFolderId, folderName);
//   return newFolder.id;
// };

// export const generateUniqueFileName = async (
//   folderId: string,
//   originalName: string
// ): Promise<string> => {
//   const client = await initializeBoxClient();
//   const { name: baseName, ext } = path.parse(originalName);
//   const items = await client.folders.getItems(folderId, {
//     limit: 1000,
//     fields: "name",
//   });

//   const existingNames = items.entries.map((entry: any) => entry.name);
//   if (!existingNames.includes(originalName)) return originalName;

//   let counter = 1;
//   let newName = `${baseName}(${counter})${ext}`;
//   while (existingNames.includes(newName)) {
//     counter++;
//     newName = `${baseName}(${counter})${ext}`;
//   }

//   return newName;
// };

// export const cleanupFiles = (files: Express.Multer.File[]) => {
//   for (const file of files) {
//     try {
//       if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
//     } catch (err) {
//       console.error(`Error cleaning up ${file.path}:`, err);
//     }
//   }
// };

// export const uploadToBox = async (
//   file: Express.Multer.File,
//   folderId: string,
//   file_type: string,
//   case_id: string,
//   folder_name: string
// ) => {
//   let fileStream: fs.ReadStream | null = null;
//   try {
//     const uniqueFileName = await generateUniqueFileName(folderId, file.originalname);

//     fileStream = fs.createReadStream(file.path);

//     const client = await initializeBoxClient();
//     const uploadedFile = await client.files.uploadFile(folderId, uniqueFileName, fileStream);
//     const boxFileId = uploadedFile.entries[0].id;

//     const sharedLink = await client.files.update(boxFileId, {
//       shared_link: { access: "open" },
//     });

//     // await BoxFiles.create({
//     //   case_id,
//     //   file_id: boxFileId,
//     //   file_name: uniqueFileName,
//     //   file_type: file_type || "CLIENT_UPLOAD",
//     //   folder_name,
//     // });

//     return {
//       success: true,
//       boxFileId,
//       fileUrl: sharedLink.shared_link?.url,
//       fileName: uniqueFileName,
//     };
//   } catch (error) {
//     console.error(`Error uploading file ${file.originalname}:`, error);
//     return {
//       success: false,
//       fileName: file.originalname,
//       error: error instanceof Error ? error.message : "Upload failed",
//     };
//   } finally {
//     if (fileStream) fileStream.destroy();
//     try {
//       if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
//     } catch (err) {
//       console.error(`Error cleaning up ${file.path}:`, err);
//     }
//   }
// };