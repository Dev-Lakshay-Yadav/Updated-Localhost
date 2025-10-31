export interface Patient {
  patientName?: string;
  status?: string;
}

export interface LiveCaseItem {
  caseId: string;
  token: string;
  caseOwner: string;
  caseStatus?: string;
  patients?: Patient[];
}

export interface RedesignItem {
  caseId: string;
  attempt: number;
  caseOwner: string;
  patients?: Patient[];
  priority: string;
}

export interface RedesignCaseTableProps {
  data: RedesignItem[];
  activeDate: string | null;
  activeToken: string | null;
  onRefresh?: () => void;
}

export interface LiveCaseTableProps {
  data: Record<string, Record<string, LiveCaseItem[]>>;
  activeDate: string | null;
  activeToken: string | null;
  onRefresh?: () => void;
}

export interface UploadResult {
  caseId: string;
  patientName: string;
  status: "uploaded" | "failed" | "uploading" | string;
}

export interface UploadResponse {
  results: UploadResult[];
}
