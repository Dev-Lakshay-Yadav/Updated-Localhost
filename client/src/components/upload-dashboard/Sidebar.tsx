import React, { useEffect } from "react";

interface SidebarProps {
  activeFolder: string | null;
  setActiveFolder: (folder: string) => void;
}

const Sidebar = ({ activeFolder, setActiveFolder }: SidebarProps) => {
  const [folders, setFolders] = React.useState<string[]>([]);

  useEffect(() => {
    const fetchDateFolders = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/cases/date");
        const data = await res.json();

        setFolders(data);
        if (data.length === 3) {
          setActiveFolder(data[1]);
        }
      } catch (err) {
        console.error("Error fetching folders:", err);
      }
    };

    fetchDateFolders();
  }, [setActiveFolder]);

  const formatFolderName = (name: string) => {
    const parts = name.split(" ");
    return parts.slice(0, 3).join(" "); // e.g. "RT-27 OCT"
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-gray-100 h-full">
      {folders.map((folder) => {
        const isSelected = activeFolder === folder;
        return (
          <button
            key={folder}
            onClick={() => setActiveFolder(folder)}
            className={`px-4 py-2 rounded text-sm transition-colors text-left
              ${
                isSelected
                  ? "bg-blue-700 text-white"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }
            `}
          >
            {formatFolderName(folder)}
          </button>
        );
      })}
    </div>
  );
};

export default Sidebar;
