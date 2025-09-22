import fs from "fs";
import path from "path";

interface FolderInfo {
  name: string;
  path: string;
}

function isRtFolder(name: string): boolean {
  return /^RT-\d{2} SEP \d{4}$/i.test(name);
}

export function getCaseFolders(root: string): FolderInfo[] {
  const results: FolderInfo[] = [];

  const rtFolders = fs.readdirSync(root, { withFileTypes: true })
    .filter(d => d.isDirectory() && isRtFolder(d.name));

  for (const rtFolder of rtFolders) {
    const rtPath = path.join(root, rtFolder.name);
    const deptFolders = fs.readdirSync(rtPath, { withFileTypes: true })
      .filter(d => d.isDirectory());

    for (const deptFolder of deptFolders) {
      const exportPath = path.join(rtPath, deptFolder.name, "EXPORT - External");
      if (!fs.existsSync(exportPath)) continue;

      const caseFolders = fs.readdirSync(exportPath, { withFileTypes: true })
        .filter(d => d.isDirectory());

      for (const caseFolder of caseFolders) {
        const casePath = path.join(exportPath, caseFolder.name);

        // Get prefix e.g. "CU00002 --"
        const prefix = caseFolder.name.split(" -- ")[0] + " --";

        // Look for subfolders starting with the same prefix
        const subFolders = fs.readdirSync(casePath, { withFileTypes: true })
          .filter(d => d.isDirectory() && d.name.startsWith(prefix));

        if (subFolders.length > 0) {
          for (const sub of subFolders) {
            results.push({
              name: sub.name,
              path: path.join(casePath, sub.name)
            });
          }
        } else {
          results.push({
            name: caseFolder.name,
            path: casePath
          });
        }
      }
    }
  }

  return results;
}
