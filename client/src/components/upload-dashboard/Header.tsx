import { useEffect, useState } from "react";

interface HeaderProps {
  activeFolder: string | null;
  setActiveToken: (token: string | null) => void;
}

const Header = ({ activeFolder, setActiveToken }: HeaderProps) => {
  const [tokens, setTokens] = useState<string[]>([]);
  const [localActiveToken, setLocalActiveToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!activeFolder) return;

    const fetchDateFolders = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(
          `http://localhost:5000/api/cases/tokens/${activeFolder}`
        );
        const data = await res.json();
        setTokens(data || []);

        if (data && data.length > 0) {
          setLocalActiveToken(data[0]);
          setActiveToken(data[0]); // update global context
        } else {
          setLocalActiveToken(null);
          setActiveToken(null);
        }
      } catch (err) {
        console.error("Error fetching token folders:", err);
        setTokens([]);
        setLocalActiveToken(null);
        setActiveToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDateFolders();
  }, [activeFolder, setActiveToken]);

  const handleClick = (token: string) => {
    setLocalActiveToken(token);
    setActiveToken(token); // update global state
  };

  return (
    <div className="bg-white border-b px-4 py-2 flex justify-center gap-2">
      <div className="flex flex-wrap gap-2 mt-1">
        {isLoading ? (
          <p className="text-sm text-gray-500 italic">Loading...</p>
        ) : tokens.length > 0 ? (
          tokens.map((token) => (
            <button
              key={token}
              onClick={() => handleClick(token)}
              className={`px-3 py-1 text-sm font-medium rounded-lg transition ${
                token === localActiveToken
                  ? "bg-blue-500 text-white"
                  : "bg-blue-100 hover:bg-blue-200 text-blue-700"
              }`}
            >
              {token}
            </button>
          ))
        ) : (
          <p className="text-sm text-gray-500 italic">No cases yet</p>
        )}
      </div>
    </div>
  );
};

export default Header;
