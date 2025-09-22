import { useEffect, useState } from "react";
import FolderTable from "./components/FolderTable";

interface Folder {
  name: string;
  path: string;
}

const App = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState<string[]>([]);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/cases");
        const data: Folder[] = await res.json();
        setFolders(data);

        const uniqueTokens: string[] = Array.from(
          new Set(data.map((f) => f.name.slice(0, 2)))
        );
        setTokens(uniqueTokens);
      } catch (err) {
        console.error("Error fetching folders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFolders();
  }, []);

  if (loading) return <div>Loading folders...</div>;

  const filteredFolders = selectedToken
    ? folders.filter((f) => f.name.startsWith(selectedToken))
    : [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-center">Case Folders</h1>

      {/* Token Buttons */}
      <div className="flex justify-center gap-2 mb-6 flex-wrap">
        {tokens.map((token) => (
          <button
            key={token}
            onClick={() => setSelectedToken(token)}
            className={`px-4 py-2 border rounded ${
              selectedToken === token
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-black"
            }`}
          >
            {token}
          </button>
        ))}
      </div>

      {/* Render table only if a token is selected */}
      {selectedToken && <FolderTable folders={filteredFolders} />}
    </div>
  );
};

export default App;
