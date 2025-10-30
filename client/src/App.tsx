import React, { useEffect, useState } from "react";

const App = () => {
  const [data, setData] = useState<Record<string, any>>({});
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/cases/details");
        const json = await res.json();
        setData(json);

        // Auto-select first date & token
        const allDates = Object.keys(json);
        if (allDates.length > 0) {
          const firstDate = allDates[0];
          const tokens = Object.keys(json[firstDate] || {});
          const firstToken = tokens.length > 0 ? tokens[0] : null;
          setActiveDate(firstDate);
          setActiveToken(firstToken);
        }
      } catch (err) {
        console.error("Error fetching:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (!data || Object.keys(data).length === 0)
    return <div className="p-4">No data found</div>;

  const dates = Object.keys(data);
  const tokens = activeDate ? Object.keys(data[activeDate] || {}) : [];

  const tableData =
    activeDate && activeToken ? data[activeDate][activeToken] || [] : [];

  return (
    <div className="flex h-screen">
      {/* LEFT PANEL */}
      <div className="w-60 bg-gray-50 border-r p-4 overflow-y-auto space-y-6">
        {/* Date Buttons */}
        <div>
          <h2 className="font-semibold mb-2 text-gray-700">Dates</h2>
          <div className="flex flex-col gap-2">
            {dates.map((date) => (
              <button
                key={date}
                onClick={() => {
                  setActiveDate(date);
                  const firstToken = Object.keys(data[date] || {})[0] || null;
                  setActiveToken(firstToken);
                }}
                className={`px-3 py-2 rounded-md text-left ${
                  activeDate === date
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {date}
              </button>
            ))}
          </div>
        </div>

        {/* Token Buttons */}
        {activeDate && (
          <div>
            <h2 className="font-semibold mt-6 mb-2 text-gray-700">
              Tokens ({activeDate})
            </h2>
            <div className="flex gap-4 flex-wrap">
              {tokens.map((token) => (
                <button
                  key={token}
                  onClick={() => setActiveToken(token)}
                  className={`px-3 py-2 rounded-md text-left ${
                    activeToken === token
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {token}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT TABLE VIEW */}
      <div className="w-full p-6 overflow-auto">
        {activeDate && activeToken ? (
          <>
            <h2 className="text-lg font-semibold mb-4">
              {activeDate} / {activeToken}
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 border">Case ID</th>
                    <th className="px-4 py-2 border">Token</th>
                    <th className="px-4 py-2 border">Case Owner</th>
                    <th className="px-4 py-2 border">Patient Name</th>
                    <th className="px-4 py-2 border">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.length > 0 ? (
                    tableData.map((item: any, i: number) => (
                      <tr key={i} className="text-center border-t">
                        <td className="px-4 py-2 border">{item.caseId}</td>
                        <td className="px-4 py-2 border">{item.token}</td>
                        <td className="px-4 py-2 border">{item.caseOwner}</td>
                        <td className="px-4 py-2 border">
                          {item.patients?.[0]?.patientName || "-"}
                        </td>
                        <td className="px-4 py-2 border">
                          {item.patients?.[0]?.status || "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-4 text-gray-500"
                      >
                        No cases found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-gray-600">
            Select a date and token to view data
          </div>
        )}
      </div>
    </div>
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

//   useEffect(() => {
//     const fetchFolders = async () => {
//       try {
//         const res = await fetch("http://localhost:5000/api/cases");
//         const data: Folder[] = await res.json();
//         setFolders(data);

//         // Extract token (folder after RT-xxx)
//         const uniqueTokens: string[] = Array.from(
//           new Set(
//             data
//               .map((f) => {
//                 // Handle both Windows "\" and Unix "/"
//                 const parts = f.path.split(/[/\\]+/);
//                 const rtIndex = parts.findIndex((p) => p.startsWith("RT-"));
//                 if (rtIndex !== -1 && parts.length > rtIndex + 1) {
//                   return parts[rtIndex + 1]; // token = folder after RT-xxxx
//                 }
//                 return null;
//               })
//               .filter((token): token is string => token !== null)
//           )
//         );

//         setTokens(uniqueTokens);

//         // Set the first token as default
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
