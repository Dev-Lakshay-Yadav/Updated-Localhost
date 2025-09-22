import React, { useState } from "react";

interface Folder {
  name: string;
  path: string;
}

interface FolderTableProps {
  folders: Folder[];
}

const FolderTable: React.FC<FolderTableProps> = ({ folders }) => {
  const [uploaded, setUploaded] = useState<{ [key: string]: boolean }>({});

  const handleUpload = async (folderPath: string) => {
    try {
      const res = await fetch("http://localhost:3000/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderPath }),
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();
      console.log("✅ Response:", data);

      // mark this folder as uploaded
      setUploaded((prev) => ({ ...prev, [folderPath]: true }));
    } catch (err) {
      console.error("❌ Error uploading:", err);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 border">ID</th>
            <th className="px-4 py-2 border">Filename</th>
            <th className="px-4 py-2 border">Path</th>
            <th className="px-4 py-2 border">Action</th>
          </tr>
        </thead>
        <tbody>
          {folders.map((f, index) => (
            <tr key={f.path}>
              <td className="px-4 py-2 border">{index + 1}</td>
              <td className="px-4 py-2 border">{f.name}</td>
              <td className="px-4 py-2 border">{f.path}</td>
              <td className="px-4 py-2 border text-center">
                {uploaded[f.path] ? (
                  <span className="px-3 py-1 bg-gray-400 text-white rounded">
                    Uploaded
                  </span>
                ) : (
                  <button
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    onClick={() => handleUpload(f.path)}
                  >
                    Upload
                  </button>
                )}
              </td>
            </tr>
          ))}
          {folders.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                No folders found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default FolderTable;
