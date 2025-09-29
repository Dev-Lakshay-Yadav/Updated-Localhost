import React, { useState, useMemo } from "react";

interface Folder {
  name: string;
  path: string;
  status: "uploaded" | "portal upload" | "pending";
}

interface FolderTableProps {
  folders: Folder[];
}

const FolderTable: React.FC<FolderTableProps> = ({ folders }) => {
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadedFolders, setUploadedFolders] = useState<
    Record<string, boolean>
  >({});
  const [uploadError, setUploadError] = useState<Record<string, boolean>>({});
  const [filterStatus, setFilterStatus] = useState<Folder["status"] | "all">(
    "all"
  );
  const [selectedFolders, setSelectedFolders] = useState<
    Record<string, boolean>
  >({});

  const toggleFolderSelection = (folderPath: string) => {
    setSelectedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }));
  };

  const isAnyUploading = useMemo(
    () => Object.values(uploading).some(Boolean),
    [uploading]
  );

  const filteredFolders = useMemo(() => {
    if (filterStatus === "all") return folders;
    return folders.filter((f) => f.status === filterStatus);
  }, [folders, filterStatus]);

  // "Select All" functionality
  const allFilteredSelected = useMemo(() => {
    return (
      filteredFolders.length > 0 &&
      filteredFolders.every(
        (f) =>
          selectedFolders[f.path] ||
          uploadedFolders[f.path] ||
          f.status === "uploaded" ||
          f.status === "portal upload"
      )
    );
  }, [filteredFolders, selectedFolders, uploadedFolders]);

  const toggleSelectAll = () => {
    const newSelected: Record<string, boolean> = { ...selectedFolders };
    const shouldSelectAll = !allFilteredSelected;

    filteredFolders.forEach((f) => {
      const isAlreadyUploaded =
        uploadedFolders[f.path] ||
        f.status === "uploaded" ||
        f.status === "portal upload";
      if (!isAlreadyUploaded) {
        newSelected[f.path] = shouldSelectAll;
      }
    });

    setSelectedFolders(newSelected);
  };

  const handleUploadSelected = async () => {
    const pathsToUpload = Object.keys(selectedFolders).filter(
      (path) => selectedFolders[path] && !uploadedFolders[path]
    );

    if (pathsToUpload.length === 0) return;

    for (const path of pathsToUpload) {
      setUploading((prev) => ({ ...prev, [path]: true }));
      setUploadError((prev) => ({ ...prev, [path]: false }));

      try {
        const res = await fetch("http://localhost:5000/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folderPath: path }),
        });

        if (!res.ok) throw new Error(`Upload failed for ${path}`);
        await res.json();

        setUploadedFolders((prev) => ({ ...prev, [path]: true }));
        setSelectedFolders((prev) => ({ ...prev, [path]: false }));
      } catch (err) {
        console.error("❌ Error uploading:", err);
        setUploadError((prev) => ({ ...prev, [path]: true }));
      } finally {
        setUploading((prev) => ({ ...prev, [path]: false }));
      }
    }
  };

  const counts = useMemo(() => {
    const total = folders.length;
    const pending = folders.filter((f) => f.status === "pending").length;
    const uploaded = folders.filter((f) => f.status === "uploaded").length;
    const portal = folders.filter((f) => f.status === "portal upload").length;
    return { total, pending, uploaded, portal };
  }, [folders]);

  return (
    <div className="overflow-x-auto p-4 bg-white shadow-md rounded-lg relative">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <div className="flex flex-wrap gap-4 text-gray-700">
          <span>
            Total: <strong>{counts.total}</strong>
          </span>
          <span>
            Pending: <strong>{counts.pending}</strong>
          </span>
          <span>
            Uploaded: <strong>{counts.uploaded}</strong>
          </span>
          <span>
            Portal Upload: <strong>{counts.portal}</strong>
          </span>
        </div>

        <div className="flex gap-2 items-center">
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as Folder["status"] | "all")
            }
            className="border cursor-pointer border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="uploaded">Uploaded</option>
            <option value="portal upload">Portal Upload</option>
          </select>

          <button
            onClick={handleUploadSelected}
            disabled={
              isAnyUploading ||
              Object.keys(selectedFolders).filter(
                (key) => selectedFolders[key] && !uploadedFolders[key]
              ).length === 0
            }
            className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnyUploading ? "Uploading…" : "Upload Selected"}
          </button>
        </div>
      </div>

      {/* Folder Table */}
      <table className="min-w-full border-separate border-spacing-y-2">
        <thead>
          <tr className="bg-gray-50 text-left">
            <th className="px-4 py-2">SNo.</th>
            <th className="px-4 py-2">Folder Name</th>
            <th className="px-4 py-2">Path</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2 text-center">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={toggleSelectAll}
                disabled={filteredFolders.length === 0}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredFolders.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                No folders found
              </td>
            </tr>
          ) : (
            filteredFolders.map((folder, index) => {
              const isAlreadyUploaded =
                uploadedFolders[folder.path] ||
                folder.status === "uploaded" ||
                folder.status === "portal upload";

              // Dynamic row background
              let rowClass = "bg-white";
              if (uploading[folder.path])
                rowClass = "bg-yellow-200 animate-pulse";
              else if (uploadError[folder.path]) rowClass = "bg-red-200";
              else if (
                uploadedFolders[folder.path] ||
                folder.status === "uploaded" ||
                folder.status === "portal upload"
              )
                rowClass = "bg-green-200";

              return (
                <tr
                  key={folder.path}
                  className={`${rowClass} rounded-lg shadow-sm hover:shadow-md transition-shadow`}
                >
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3 font-medium">
                    {folder.name}
                    {uploadError[folder.path] && (
                      <div className="text-red-600 text-sm mt-1">
                        Failed to upload. Some wrong
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm truncate">
                    {folder.path}
                  </td>
                  <td className="px-4 py-3 font-semibold capitalize">
                    {folder.status}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      disabled={isAlreadyUploaded || uploading[folder.path]}
                      checked={!!selectedFolders[folder.path]}
                      onChange={() => toggleFolderSelection(folder.path)}
                    />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default FolderTable;
