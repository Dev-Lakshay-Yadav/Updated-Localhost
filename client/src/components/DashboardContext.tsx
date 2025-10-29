// components/upload-dashboard/DashboardContext.tsx
import { createContext, useContext } from "react";

interface DashboardContextType {
  activeFolder: string | null;
  setActiveFolder: (folder: string | null) => void;
  activeToken: string | null;
  setActiveToken: (token: string | null) => void;
}

export const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) throw new Error("useDashboard must be used within DashboardProvider");
  return context;
};
