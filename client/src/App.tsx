import React, { useEffect, useState } from "react";
import LiveCaseTable from "./components/LiveCaseTable";
import RedesignTable from "./components/RedesignTable";
import type { LiveCaseItem, RedesignItem } from "./types/caseTypes";

type CaseItem = LiveCaseItem | RedesignItem;
type DateMap = Record<string, Record<string, CaseItem[]>>;

const App: React.FC = () => {
  const [data, setData] = useState<DateMap>({});
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/cases/details");
        const json: DateMap = await res.json();
        setData(json);

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

  if (isLoading)
    return <div className="p-4 animate-pulse">Loading cases...</div>;
  if (!data || Object.keys(data).length === 0)
    return <div className="p-4">No data found</div>;

  const filteredCases =
    activeDate && activeToken ? data[activeDate]?.[activeToken] || [] : [];

  const dates = Object.keys(data);
  const tokens = activeDate ? Object.keys(data[activeDate] || {}) : [];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50 border-r p-4 overflow-y-auto space-y-6">
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
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                {date}
              </button>
            ))}
          </div>
        </div>

        {activeDate && tokens.length > 0 && (
          <div>
            <h2 className="font-semibold mt-6 mb-2 text-gray-700">
              Tokens ({activeDate})
            </h2>
            <div className="flex gap-2 flex-wrap">
              {tokens.map((token) => (
                <button
                  key={token}
                  onClick={() => setActiveToken(token)}
                  className={`px-3 py-2 rounded-md ${
                    activeToken === token
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  {token}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
        {activeToken?.toLowerCase() === "redesign" ? (
          <RedesignTable
            activeDate={activeDate}
            activeToken={activeToken}
            data={filteredCases as RedesignItem[]}
          />
        ) : (
          <LiveCaseTable
            data={{
              [activeDate || ""]: {
                [activeToken || ""]: filteredCases as LiveCaseItem[],
              },
            }}
            activeDate={activeDate}
            activeToken={activeToken}
          />
        )}
      </div>
    </div>
  );
};

export default App;
