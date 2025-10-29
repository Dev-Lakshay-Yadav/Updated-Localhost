import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./sidebar";
import { DashboardContext } from "../DashboardContext";

function Layout() {
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [activeToken, setActiveToken] = useState<string | null>(null);

  return (
    <DashboardContext.Provider
      value={{ activeFolder, setActiveFolder, activeToken, setActiveToken }}
    >
      <div className="w-full bg-white">
        <div className="min-h-screen w-full flex flex-col items-center">
          <div className="sticky top-0 z-50 w-full">
            <Header
              activeFolder={activeFolder}
              setActiveToken={setActiveToken}
            />
          </div>
          <div className="flex w-full max-w-screen-2xl overflow-hidden">
            <div className="sticky z-20 left-0 top-0 h-full w-44 md:w-[20%]">
              <Sidebar
                activeFolder={activeFolder}
                setActiveFolder={setActiveFolder}
              />
            </div>
            <div className="flex flex-1 flex-col h-full">
              <main className="flex-1 h-full overflow-y-auto bg-white p-4 md:p-6 border-l-2">
                <Outlet />
              </main>
            </div>
          </div>
        </div>
      </div>
    </DashboardContext.Provider>
  );
}

export default Layout;
