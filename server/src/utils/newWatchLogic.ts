import fs from "fs";
import path from "path";

// date folder filteration
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

export function dateFoldersUtil(basePath: string): string[] {
  if (!fs.existsSync(basePath)) return [];

  const allowed = buildAllowedRtFolders();

  return fs
    .readdirSync(basePath)
    .filter((item) => {
      const fullPath = path.join(basePath, item);
      return fs.statSync(fullPath).isDirectory() && allowed.has(item);
    })
    .sort();
}

// token folder filteration
export function getTokenFoldersUtil(basePath: string): string[] {
  if (!basePath || !fs.existsSync(basePath)) return [];

  return fs.readdirSync(basePath).filter((item) => {
    const fullPath = path.join(basePath, item);
    if (!fs.statSync(fullPath).isDirectory()) return false;

    return item === "REDESIGN" || /^[A-Z]{2}$/.test(item);
  });
}

// final cases and redesigns folder filteration
const LIVE_REGEX = /^([A-Z]{2}\d{5})\s--\s(.+)$/;
const REDESIGN_REGEX = /^RD-(\d+)-([A-Z]{2}\d{5})\s--\s(.+)-\s?(HIGH|MEDIUM)$/;

// 🔹 LIVE CASES
export const getLiveCases = (basePath: string) => {
  if (!fs.existsSync(basePath)) {
    throw new Error(`Base path not found: ${basePath}`);
  }

  const entries = fs.readdirSync(basePath, { withFileTypes: true });

  const result = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const match = entry.name.match(LIVE_REGEX);
      if (!match) return null;

      const [, caseId, caseOwner] = match;
      const token = caseId.slice(0, 2);
      const casePath = path.join(basePath, entry.name);

      const patients: {
        patientName: string;
        status: string;
      }[] = [];

      try {
        const innerEntries = fs.readdirSync(casePath, { withFileTypes: true });

        for (const inner of innerEntries) {
          if (!inner.isDirectory()) continue;

          const innerMatch = inner.name.match(LIVE_REGEX);
          if (!innerMatch) continue;

          const [, , patientName] = innerMatch;
          const patientPath = path.join(casePath, inner.name);

          let status = "pending";
          try {
            const patientInner = fs.readdirSync(patientPath, {
              withFileTypes: true,
            });
            const hasUploadedFolder = patientInner.some(
              (e) => e.isDirectory() && e.name.trim().toUpperCase() === "AAA-U"
            );
            if (hasUploadedFolder) status = "uploaded";
          } catch {
            // ignore patient-level read errors
          }

          patients.push({
            patientName: patientName.trim(),
            status,
          });
        }
      } catch {
        // ignore case-level read errors
      }

      return {
        // name: entry.name,
        // path: casePath,
        caseId,
        token,
        caseOwner,
        patients, // list of patients with individual statuses
        // priority: null,
        // type: "live",
      };
    })
    .filter(Boolean);

  return result;
};

// 🔹 REDESIGN CASES
export const getRedesignCases = (basePath: string) => {
  if (!fs.existsSync(basePath)) {
    throw new Error(`Base path not found: ${basePath}`);
  }

  const entries = fs.readdirSync(basePath, { withFileTypes: true });

  const result = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const match = entry.name.match(REDESIGN_REGEX);
      if (!match) return null;

      const [, attempt, caseId, caseOwner, priority] = match;
      const token = caseId.slice(0, 2);
      const casePath = path.join(basePath, entry.name);
      const uploadsPath = path.join(casePath, "TS_Uploads");

      const patients: {
        patientName: string;
        status: string;
      }[] = [];

      try {
        if (fs.existsSync(uploadsPath)) {
          const uploadEntries = fs.readdirSync(uploadsPath, {
            withFileTypes: true,
          });

          for (const upload of uploadEntries) {
            if (!upload.isDirectory()) continue;

            const patientName = upload.name;
            const patientPath = path.join(uploadsPath, upload.name);

            let status = "pending";
            try {
              const innerEntries = fs.readdirSync(patientPath, {
                withFileTypes: true,
              });
              const hasUploadedFolder = innerEntries.some(
                (e) =>
                  e.isDirectory() && e.name.trim().toUpperCase() === "AAA-U"
              );
              if (hasUploadedFolder) status = "uploaded";
            } catch {
              // ignore patient-level read errors
            }

            patients.push({
              patientName: patientName.trim(),
              status,
            });
          }
        }
      } catch {
        // ignore TS_Uploads-level read errors
      }

      return {
        // name: entry.name,
        // path: casePath,
        caseId,
        token,
        attempt: Number(attempt),
        caseOwner,
        patients,
        // priority: priority || null,
        // type: "redesign",
      };
    })
    .filter(Boolean);

  return result;
};
