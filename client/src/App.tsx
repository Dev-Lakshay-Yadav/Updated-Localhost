import { Routes, Route } from "react-router-dom";

import DashboardLayout from "./components/upload-dashboard/Layout";
import PageNotFound from "./pages/pageNotFound";
import UploadTable from "./pages/uploadTable";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route path="" element={<UploadTable />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

export default App;

// import { useEffect, useState } from "react";
// import FolderTable from "./components/FolderTable";

// interface Folder {
//   name: string;
//   path: string;
//   status: "uploaded" | "portal upload" | "pending";
// }

// const App = () => {
//   const [folders, setFolders] = useState<Folder[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [tokens, setTokens] = useState<string[]>([]);
//   const [selectedToken, setSelectedToken] = useState<string | null>(null);

// useEffect(() => {
//   const fetchFolders = async () => {
//     try {
//       const res = await fetch("http://localhost:5000/api/cases");
//       const data: Folder[] = await res.json();
//       setFolders(data);

//       // Extract token (folder after RT-xxx)
//       const uniqueTokens: string[] = Array.from(
//         new Set(
//           data
//             .map((f) => {
//               // Handle both Windows "\" and Unix "/"
//               const parts = f.path.split(/[/\\]+/);
//               const rtIndex = parts.findIndex((p) => p.startsWith("RT-"));
//               if (rtIndex !== -1 && parts.length > rtIndex + 1) {
//                 return parts[rtIndex + 1]; // token = folder after RT-xxxx
//               }
//               return null;
//             })
//             .filter((token): token is string => token !== null)
//         )
//       );

//       setTokens(uniqueTokens);

//       // Set the first token as default
//       if (uniqueTokens.length > 0) {
//         setSelectedToken(uniqueTokens[0]);
//       }
//     } catch (err) {
//       console.error("Error fetching folders:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//     fetchFolders();
//   }, []);

//   if (loading) return <div>Loading folders...</div>;

//   // Filter folders based on token (folder after RT-xxx)
//   const filteredFolders = selectedToken
//     ? folders.filter((f) => {
//         const parts = f.path.split(/[/\\]+/);
//         const rtIndex = parts.findIndex((p) => p.startsWith("RT-"));
//         return rtIndex !== -1 && parts[rtIndex + 1] === selectedToken;
//       })
//     : [];

//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold mb-4 text-center">Upload Cases</h1>

//       {/* Token Buttons */}
//       <div className="flex justify-center gap-2 mb-6 flex-wrap">
//         {tokens.map((token) => (
//           <button
//             key={token}
//             onClick={() => setSelectedToken(token)}
//             className={`px-4 py-2 border rounded cursor-pointer transition-colors ${
//               selectedToken === token
//                 ? "bg-blue-600 text-white"
//                 : "bg-gray-200 text-black hover:bg-gray-300"
//             }`}
//           >
//             {token}
//           </button>
//         ))}
//       </div>

//       {/* Render table only if a token is selected */}
//       {selectedToken && <FolderTable folders={filteredFolders} />}
//     </div>
//   );
// };

// export default App;

// import { useEffect, useState } from "react";
// import FolderTable from "./components/FolderTable";

// interface Folder {
//   name: string;
//   path: string;
//   status: "uploaded" | "portal upload" | "pending";
// }

// const App = () => {
//   const [folders, setFolders] = useState<Folder[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [tokens, setTokens] = useState<string[]>([]);
//   const [selectedToken, setSelectedToken] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchFolders = async () => {
//       try {
//         const res = await fetch("http://localhost:5000/api/cases");
//         const data: Folder[] = await res.json();
//         setFolders(data);

//         const uniqueTokens: string[] = Array.from(
//           new Set(data.map((f) => f.name.slice(0, 2)))
//         );
//         setTokens(uniqueTokens);

//         // ✅ Set the first token as default
//         if (uniqueTokens.length > 0) {
//           setSelectedToken(uniqueTokens[0]);
//         }
//       } catch (err) {
//         console.error("Error fetching folders:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchFolders();
//   }, []);

//   if (loading) return <div>Loading folders...</div>;

//   const filteredFolders = selectedToken
//     ? folders.filter((f) => f.name.startsWith(selectedToken))
//     : [];

//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold mb-4 text-center">Upload Cases</h1>

//       {/* Token Buttons */}
//       <div className="flex justify-center gap-2 mb-6 flex-wrap">
//         {tokens.map((token) => (
//           <button
//             key={token}
//             onClick={() => setSelectedToken(token)}
//             className={`px-4 py-2 border rounded cursor-pointer ${
//               selectedToken === token
//                 ? "bg-blue-600 text-white"
//                 : "bg-gray-200 text-black"
//             }`}
//           >
//             {token}
//           </button>
//         ))}
//       </div>

//       {/* Render table only if a token is selected */}
//       {selectedToken && <FolderTable folders={filteredFolders} />}
//     </div>
//   );
// };

// export default App;
