import axios from "axios";
import fs from "fs";
import path from "path";

import {
  INCOMING_REDESIGNS_QUERY,
  UPDATE_REDESIGN_STATUS_ENDPOINT,
} from "./ts_constants.js";
import {
  ensureRedesignFolderExists,
  getRedesignFolderPath,
} from "./ts_folder_structure.js";
import {
  generateCasePDF,
  generateCommentsPDF,
} from "./ts_case_details_pdf.js";

import { getClient } from "../../config/box.js";

// ---- Types ----
interface CaseDetails {
  priority: string;
  case_id: string;
  creation_time_ms: number;
  redesign_attempt: number;
  box_folder_id: string;
  details_json: string;
  case_activities: string;
  casePriority?: string;
}

interface BoxItem {
  id: string;
  type: "file" | "folder";
  name: string;
}

interface BoxClient {
  folders: {
    getItems(
      folderId: string,
      options?: { fields?: string }
    ): Promise<{ entries: BoxItem[] }>;
  };
  files: {
    getReadStream(fileId: string): Promise<NodeJS.ReadableStream>;
  };
}

export function processRedesigns(): void {
  console.log("Starting to process redesigns");

  axios<{ cases: CaseDetails[] }>({
    method: "get",
    url: INCOMING_REDESIGNS_QUERY,
  }).then(async (response) => {
    getClient(async (client: BoxClient) => {
      for (const caseDetails of response.data.cases) {
        const priority = caseDetails.priority.toUpperCase();
        caseDetails.casePriority = priority.toUpperCase();
        const creationTimeMs = caseDetails.creation_time_ms;

        const rdCaseId = `RD-${caseDetails.redesign_attempt}-${caseDetails.case_id}-${priority}`;
        ensureRedesignFolderExists(rdCaseId, creationTimeMs);

        const boxFolderId = caseDetails.box_folder_id;
        await processFolder(client, boxFolderId, getRedesignFolderPath(rdCaseId));

        const detailsJson = JSON.parse(caseDetails.details_json);
        detailsJson.casePriority = `[REDESIGN PRIORITY] ${priority}`;

        try {
          generateCasePDF(
            caseDetails.case_id,
            detailsJson,
            path.join(getRedesignFolderPath(rdCaseId), "CaseDetails.pdf")
          );
        } catch (e: unknown) {
          console.log("Failed to generate CaseDetails.pdf for " + rdCaseId);
        }

        try {
          generateCommentsPDF(
            caseDetails.case_id,
            JSON.parse(JSON.parse(caseDetails.case_activities)),
            priority,
            path.join(getRedesignFolderPath(rdCaseId), "Comments.pdf")
          );
        } catch (e: unknown) {
          console.log(e);
          console.log("Failed to generate Comments.pdf for " + rdCaseId);
        }

        console.log(
          `Completed redesign processing for ${caseDetails.case_id}`
        );

        axios
          .post(
            UPDATE_REDESIGN_STATUS_ENDPOINT,
            {
              case_id: caseDetails.case_id.split(" -- ")[0],
              status: "downloaded",
            },
            { headers: { "Content-Type": "application/json" } }
          )
          .then((res) => {
            console.log(res.data);
            console.log(`Updated status for ${caseDetails.case_id}`);
          });
      }
    });
  });
}

export async function processFolder(
  client: BoxClient,
  folderId: string,
  downloadPath: string
): Promise<void> {
  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath, { recursive: true });
  }

  const items = await client.folders.getItems(folderId, {
    fields: "id,type,name",
  });

  for (const item of items.entries) {
    if (item.type === "file") {
      console.log(`Downloading file: ${item.name}`);
      await downloadFile(client, item.id, item.name, downloadPath);
    } else if (item.type === "folder") {
      console.log(`Entering folder: ${item.name}`);
      await processFolder(client, item.id, path.join(downloadPath, item.name));
    }
  }
}

export async function downloadFile(
  client: BoxClient,
  fileId: string,
  fileName: string,
  downloadPath: string
): Promise<void> {
  const stream = await client.files.getReadStream(fileId);
  const filePath = path.join(downloadPath, fileName);
  const writeStream = fs.createWriteStream(filePath);
  stream.pipe(writeStream);

  return new Promise((resolve, reject) => {
    writeStream.on("finish", () => resolve());
    writeStream.on("error", (err) => reject(err));
  });
}

























// import axios from "axios";
// import fs from "fs";
// import path from "path";

// import {
//   INCOMING_REDESIGNS_QUERY,
//   UPDATE_REDESIGN_STATUS_ENDPOINT,
// } from "./ts_constants.js";
// import {
//   ensureRedesignFolderExists,
//   getRedesignFolderPath,
// } from "./ts_folder_structure.js";
// import { generateCasePDF, generateCommentsPDF } from "./ts_case_details_pdf.js";

// import { getClient } from "../../config/box.js";

// export function processRedesigns() {
//   console.log("Starting to process redesigns");
//   axios({
//     method: "get",
//     url: INCOMING_REDESIGNS_QUERY,
//   }).then(async (response) => {
//     getClient(async (client) => {
//       for (let caseDetails of response.data.cases) {
//         const priority = caseDetails["priority"].toUpperCase();
//         caseDetails["casePriority"] = priority.toUpperCase();
//         let creationTimeMs = caseDetails["creation_time_ms"];
//         const rdCaseId = `RD-${caseDetails["redesign_attempt"]}-${caseDetails["case_id"]}-${priority}`;
//         ensureRedesignFolderExists(rdCaseId, creationTimeMs);
//         const boxFolderId = caseDetails["box_folder_id"];
//         await processFolder(
//           client,
//           boxFolderId,
//           getRedesignFolderPath(rdCaseId)
//         );
//         const detailsJson = JSON.parse(caseDetails.details_json);
//         detailsJson["casePriority"] = `[REDESIGN PRIORITY] ${priority}`;
//         try {
//           generateCasePDF(
//             caseDetails["case_id"],
//             detailsJson,
//             path.join(getRedesignFolderPath(rdCaseId), "CaseDetails.pdf")
//           );
//         } catch (e) {
//           console.log("Failed to generate CaseDetails.pdf for " + rdCaseId);
//         }
//         try {
//           generateCommentsPDF(
//             caseDetails["case_id"],
//             JSON.parse(JSON.parse(caseDetails.case_activities)),
//             priority,
//             path.join(getRedesignFolderPath(rdCaseId), "Comments.pdf")
//           );
//         } catch (e) {
//           console.log(e);
//           console.log("Failed to generate Comments.pdf for " + rdCaseId);
//         }
//         console.log(
//           `Completed redesign processing for ${caseDetails["case_id"]}`
//         );
//         const response = axios
//           .post(
//             UPDATE_REDESIGN_STATUS_ENDPOINT,
//             {
//               case_id: caseDetails["case_id"].split(" -- ")[0],
//               status: "downloaded",
//             },
//             { headers: { "Content-Type": "application/json" } }
//           )
//           .then((response) => {
//             console.log(response.data);
//             console.log(`Updated status for ${caseDetails["case_id"]}`);
//           });
//       }
//     });
//   });
// }

// export async function processFolder(client, folderId, downloadPath) {
//   if (!fs.existsSync(downloadPath)) {
//     fs.mkdirSync(downloadPath, { recursive: true });
//   }

//   const items = await client.folders.getItems(folderId, {
//     fields: "id,type,name",
//   });

//   for (const item of items.entries) {
//     if (item.type === "file") {
//       console.log(`Downloading file: ${item.name}`);
//       await downloadFile(client, item.id, item.name, downloadPath);
//     } else if (item.type === "folder") {
//       console.log(`Entering folder: ${item.name}`);
//       await processFolder(client, item.id, path.join(downloadPath, item.name));
//     }
//   }
// }

// export async function downloadFile(client, fileId, fileName, downloadPath) {
//   const stream = await client.files.getReadStream(fileId);
//   const filePath = path.join(downloadPath, fileName);
//   const writeStream = fs.createWriteStream(filePath);
//   stream.pipe(writeStream);

//   return new Promise((resolve, reject) => {
//     writeStream.on("finish", resolve);
//     writeStream.on("error", reject);
//   });
// }
