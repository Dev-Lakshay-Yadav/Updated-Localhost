import fs from "fs";
import path from "path";

interface FolderInfo {
  name: string;
  path: string;
  status: "uploaded" | "portal upload" | "pending";
}

function buildAllowedRtFolders(): Set<string> {
  const today = new Date();
  const allowed = new Set<string>();

  for (let i = 0; i < 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);

    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const year = d.getFullYear();

    allowed.add(`RT-${day} ${month} ${year}`);
  }

  return allowed;
}

function isRtFolder(name: string, allowed: Set<string>): boolean {
  return allowed.has(name.toUpperCase());
}

export function getCaseFolders(root: string): FolderInfo[] {
  const results: FolderInfo[] = [];
  const allowedRtFolders = buildAllowedRtFolders();

  const rtFolders = fs.readdirSync(root, { withFileTypes: true });
  for (const rtFolder of rtFolders) {
    if (!rtFolder.isDirectory() || !isRtFolder(rtFolder.name, allowedRtFolders)) continue;

    const rtPath = path.join(root, rtFolder.name);
    const deptFolders = fs.readdirSync(rtPath, { withFileTypes: true });
    for (const deptFolder of deptFolders) {
      if (!deptFolder.isDirectory()) continue;

      const exportPath = path.join(rtPath, deptFolder.name, "EXPORT - External");
      if (!fs.existsSync(exportPath)) continue;

      const caseFolders = fs.readdirSync(exportPath, { withFileTypes: true });
      for (const caseFolder of caseFolders) {
        if (!caseFolder.isDirectory()) continue;

        const casePath = path.join(exportPath, caseFolder.name);
        const prefix = caseFolder.name.split(" -- ")[0] + " --";

        const subFolders = fs.readdirSync(casePath, { withFileTypes: true })
          .filter(d => d.isDirectory() && d.name.startsWith(prefix));

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

// Optimized: early return instead of building big arrays
function getFolderStatus(casePath: string): "uploaded" | "portal upload" | "pending" {
  const subFolders = fs.readdirSync(casePath, { withFileTypes: true });
  for (const d of subFolders) {
    if (!d.isDirectory()) continue;
    const upper = d.name.toUpperCase();
    if (upper === "AAA -- O") return "portal upload";
    if (upper === "AAA -- U") return "uploaded";
  }
  return "pending";
}
