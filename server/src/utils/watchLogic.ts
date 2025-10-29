import fs from "fs";
import path from "path";

interface FolderInfo {
  name: string;
  path: string;
  status: "uploaded" | "portal upload" | "pending";
  clientFiles?: string[];
}

// 🔹 Build allowed RT folders (today + last 2 days)
function buildAllowedRtFolders(): Set<string> {
  const today = new Date();
  const allowed = new Set<string>();

  for (let i = 0; i < 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);

    const day = d.getDate();
    const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const year = d.getFullYear();

    allowed.add(`RT-${day} ${month} ${year}`.toUpperCase());
    allowed.add(
      `RT-${String(day).padStart(2, "0")} month ${year}`.toUpperCase()
    );
  }

  return allowed;
}

function isRtFolder(name: string, allowed: Set<string>): boolean {
  return allowed.has(name.toUpperCase());
}

// 🔹 Folder status logic (shared for both normal + redesign)
function getFolderStatus(
  casePath: string
): "uploaded" | "portal upload" | "pending" {
  // Check if the path exists first to avoid fs.readdirSync error on non-existent paths
  if (!fs.existsSync(casePath) || !fs.statSync(casePath).isDirectory())
    return "pending";

  const items = fs.readdirSync(casePath, { withFileTypes: true });
  for (const d of items) {
    if (!d.isDirectory()) continue;
    const upper = d.name.toUpperCase();
    if (upper === "AAA -- P") return "portal upload";
    if (upper === "AAA -- U") return "uploaded";
  }
  return "pending";
}

export function getCaseFolders(root: string): FolderInfo[] {
  const results: FolderInfo[] = [];
  const allowedRtFolders = buildAllowedRtFolders();

  // 🔹 Iterate through RT folders
  const rtFolders = fs.readdirSync(root, { withFileTypes: true });

  for (const rtFolder of rtFolders) {
    if (!rtFolder.isDirectory()) continue;
    if (!isRtFolder(rtFolder.name, allowedRtFolders)) continue;

    const rtPath = path.join(root, rtFolder.name);
    const innerFolders = fs.readdirSync(rtPath, { withFileTypes: true });

    for (const inner of innerFolders) {
      if (!inner.isDirectory()) continue;

      // 🔸 Case 1: REDESIGN folder inside RT
      if (inner.name.toUpperCase() === "REDESIGN") {
        const redesignPath = path.join(rtPath, inner.name); // e.g., .../RT-DATE/REDESIGN
        const redesignCases = fs.readdirSync(redesignPath, {
          withFileTypes: true,
        });

        for (const redesignCase of redesignCases) {
          // redesignCase.name is the top-level case name
          if (!redesignCase.isDirectory()) continue;

          const topCasePath = path.join(redesignPath, redesignCase.name); // e.g., .../REDESIGN/CaseName
          const tsUploadsPath = path.join(topCasePath, "TS_Uploads");

          // Check if TS_Uploads exists inside the CaseName folder
          if (
            fs.existsSync(tsUploadsPath) &&
            fs.statSync(tsUploadsPath).isDirectory()
          ) {
            // Found TS_Uploads. Look inside for final patient folders (PatientA, PatientB, etc.)
            const patientFolders = fs.readdirSync(tsUploadsPath, {
              withFileTypes: true,
            });

            for (const patientFolder of patientFolders) {
              if (!patientFolder.isDirectory()) continue;

              // This is the final path we want to track: .../CaseName/TS_Uploads/PatientA
              const casePath = path.join(tsUploadsPath, patientFolder.name);

              // Collect client files directly inside the patient folder
              const clientFiles = fs
                .readdirSync(casePath, { withFileTypes: true })
                .filter((f) => f.isFile())
                .map((f) => f.name);

              const status = getFolderStatus(casePath);

              results.push({
                // MODIFIED: Use the top-level case name instead of the patient folder name
                name: redesignCase.name,
                path: casePath,
                status,
                clientFiles,
              });
            }
          } else {
            // No TS_Uploads folder found. Use the CaseName folder itself (original redesign logic).
            const casePath = topCasePath;

            // Collect client files directly inside redesign case folder
            const clientFiles = fs
              .readdirSync(casePath, { withFileTypes: true })
              .filter((f) => f.isFile())
              .map((f) => f.name);

            const status = getFolderStatus(casePath);

            results.push({
              name: redesignCase.name,
              path: casePath,
              status,
              clientFiles,
            });
          }
        }

        continue; // Skip further recursion for REDESIGN
      }

      // 🔸 Case 2: Normal department folder
      const exportPath = path.join(rtPath, inner.name, "EXPORT - External");
      if (!fs.existsSync(exportPath)) continue;

      const caseFolders = fs.readdirSync(exportPath, { withFileTypes: true });
      for (const caseFolder of caseFolders) {
        if (!caseFolder.isDirectory()) continue;

        const casePath = path.join(exportPath, caseFolder.name);
        const prefix = caseFolder.name.split(" -- ")[0] + " --";

        const subFolders = fs
          .readdirSync(casePath, { withFileTypes: true })
          .filter(
            (d) =>
              d.isDirectory() &&
              d.name.startsWith(prefix) &&
              d.name.toUpperCase() !== "REDESIGN"
          );

        if (subFolders.length > 0) {
          for (const sub of subFolders) {
            const subPath = path.join(casePath, sub.name);
            results.push({
              name: sub.name,
              path: subPath,
              status: getFolderStatus(subPath),
            });
          }
        } else {
          results.push({
            name: caseFolder.name,
            path: casePath,
            status: getFolderStatus(casePath),
          });
        }
      }
    }
  }

  return results;
}

// import fs from "fs";
// import path from "path";

// interface FolderInfo {
//   name: string;
//   path: string;
//   status: "uploaded" | "portal upload" | "pending";
// }

// // Build allowed RT folders for today and the last 2 days
// function buildAllowedRtFolders(): Set<string> {
//   const today = new Date();
//   const allowed = new Set<string>();

//   for (let i = 0; i < 3; i++) {
//     const d = new Date(today);
//     d.setDate(today.getDate() - i);

//     const day = d.getDate(); // no zero padding
//     const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
//     const year = d.getFullYear();

//     // allow both formats: RT-4 OCT 2025 and RT-04 OCT 2025
//     allowed.add(`RT-${day} ${month} ${year}`.toUpperCase());
//     allowed.add(
//       `RT-${String(day).padStart(2, "0")} ${month} ${year}`.toUpperCase()
//     );
//   }

//   return allowed;
// }

// // Check if folder name matches one of the allowed RT folder names
// function isRtFolder(name: string, allowed: Set<string>): boolean {
//   return allowed.has(name.toUpperCase());
// }

// export function getCaseFolders(root: string): FolderInfo[] {
//   const results: FolderInfo[] = [];
//   const allowedRtFolders = buildAllowedRtFolders();

//   const rtFolders = fs.readdirSync(root, { withFileTypes: true });

//   for (const rtFolder of rtFolders) {
//     if (!rtFolder.isDirectory() || !isRtFolder(rtFolder.name, allowedRtFolders))
//       continue;

//     const rtPath = path.join(root, rtFolder.name);

//     const deptFolders = fs.readdirSync(rtPath, { withFileTypes: true });

//     for (const deptFolder of deptFolders) {
//       if (!deptFolder.isDirectory()) continue;

//       // 🚨 Skip REDESIGN dept folder
//       if (deptFolder.name.toUpperCase() === "REDESIGN") continue;

//       const exportPath = path.join(
//         rtPath,
//         deptFolder.name,
//         "EXPORT - External"
//       );
//       if (!fs.existsSync(exportPath)) continue;

//       const caseFolders = fs.readdirSync(exportPath, { withFileTypes: true });
//       for (const caseFolder of caseFolders) {
//         if (!caseFolder.isDirectory()) continue;

//         const casePath = path.join(exportPath, caseFolder.name);
//         const prefix = caseFolder.name.split(" -- ")[0] + " --";

//         const subFolders = fs
//           .readdirSync(casePath, { withFileTypes: true })
//           .filter(
//             (d) =>
//               d.isDirectory() &&
//               d.name.startsWith(prefix) &&
//               d.name.toUpperCase() !== "REDESIGN" // skip redesign at case level too
//           );

//         if (subFolders.length > 0) {
//           for (const sub of subFolders) {
//             const subPath = path.join(casePath, sub.name);
//             results.push({
//               name: sub.name,
//               path: subPath,
//               status: getFolderStatus(subPath),
//             });
//           }
//         } else {
//           results.push({
//             name: caseFolder.name,
//             path: casePath,
//             status: getFolderStatus(casePath),
//           });
//         }
//       }
//     }
//   }
//   return results;
// }

// // Optimized: early return instead of building big arrays
// function getFolderStatus(
//   casePath: string
// ): "uploaded" | "portal upload" | "pending" {
//   const subFolders = fs.readdirSync(casePath, { withFileTypes: true });
//   for (const d of subFolders) {
//     if (!d.isDirectory()) continue;
//     const upper = d.name.toUpperCase();
//     if (upper === "AAA -- P") return "portal upload";
//     if (upper === "AAA -- U") return "uploaded";
//   }
//   return "pending";
// }
