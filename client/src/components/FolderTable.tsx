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
  const [filterStatus, setFilterStatus] = useState<Folder["status"] | "all">(
    "all"
  );

  const [confirmFolder, setConfirmFolder] = useState<Folder | null>(null); // Track folder to confirm

  const handleUpload = async (folderPath: string) => {
    if (uploading[folderPath] || uploadedFolders[folderPath]) return;

    // Close modal immediately
    setConfirmFolder(null);

    // Mark as uploading
    setUploading((prev) => ({ ...prev, [folderPath]: true }));

    try {
      const res = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderPath }),
      });

      if (!res.ok) throw new Error("Upload failed");
      await res.json();

      setUploadedFolders((prev) => ({ ...prev, [folderPath]: true }));
    } catch (err) {
      console.error("❌ Error uploading:", err);
    } finally {
      setUploading((prev) => ({ ...prev, [folderPath]: false }));
    }
  };

  const renderButton = (folder: Folder) => {
    const isAlreadyUploaded =
      uploadedFolders[folder.path] ||
      folder.status === "uploaded" ||
      folder.status === "portal upload";

    if (isAlreadyUploaded) {
      return (
        <button
          disabled
          className="px-4 py-2 rounded font-semibold bg-gray-300 text-gray-500 cursor-not-allowed"
        >
          Uploaded
        </button>
      );
    }

    if (uploading[folder.path]) {
      return (
        <button
          disabled
          className="px-4 py-2 rounded font-semibold bg-blue-500 text-white cursor-wait"
        >
          Uploading…
        </button>
      );
    }

    return (
      <button
        className="px-4 py-2 rounded cursor-pointer font-semibold bg-green-500 hover:bg-green-600 text-white"
        onClick={() => setConfirmFolder(folder)} // show modal on click
      >
        Upload
      </button>
    );
  };

  const filteredFolders = useMemo(() => {
    if (filterStatus === "all") return folders;
    return folders.filter((f) => f.status === filterStatus);
  }, [folders, filterStatus]);

  const counts = useMemo(() => {
    const total = folders.length;
    const pending = folders.filter((f) => f.status === "pending").length;
    const uploaded = folders.filter((f) => f.status === "uploaded").length;
    const portal = folders.filter((f) => f.status === "portal upload").length;
    return { total, pending, uploaded, portal };
  }, [folders]);

  return (
    <div className="overflow-x-auto p-4 bg-white shadow-md rounded-lg">
      {/* Filter + Counts */}
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
        <div>
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
        </div>
      </div>

      <table className="min-w-full border-separate border-spacing-y-2">
        <thead>
          <tr className="bg-gray-50 text-left">
            <th className="px-4 py-2">#</th>
            <th className="px-4 py-2">Folder Name</th>
            <th className="px-4 py-2">Path</th>
            <th className="px-4 py-2 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredFolders.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                No folders found
              </td>
            </tr>
          ) : (
            filteredFolders.map((folder, index) => (
              <tr
                key={folder.path}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <td className="px-4 py-3">{index + 1}</td>
                <td className="px-4 py-3 font-medium">{folder.name}</td>
                <td className="px-4 py-3 text-gray-500 text-sm truncate">
                  {folder.path}
                </td>
                <td className="px-4 py-3 text-center">
                  {renderButton(folder)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Confirm Modal */}
      {confirmFolder && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="bg-white shadow-2xl rounded-lg p-6 w-80">
            <h2 className="text-lg font-semibold mb-4">Confirm Upload</h2>
            <p className="mb-6 text-gray-700">
              Are you sure you want to upload{" "}
              <strong>{confirmFolder.name}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmFolder(null)}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpload(confirmFolder.path)}
                className="px-4 py-2 rounded bg-green-500 hover:bg-green-600 text-white font-semibold cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderTable;
