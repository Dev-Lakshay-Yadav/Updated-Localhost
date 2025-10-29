import { useEffect, useState } from "react";
import { useDashboard } from "../components/DashboardContext";

const UploadTable = () => {
  const { activeFolder: activeDate, activeToken } = useDashboard();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeDate || !activeToken) return;

    const fetchCaseData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("http://localhost:5000/api/cases/case-data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            activeDate,
            activeToken,
          }),
        });

        if (!res.ok) {
          throw new Error(`Server responded with status ${res.status}`);
        }

        const result = await res.json();
        setData(result);
      } catch (err: any) {
        console.error("Error fetching case data:", err);
        setError(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchCaseData();
  }, [activeDate, activeToken]);

  return (
    <div className="p-4">
      <h1 className="text-lg font-semibold mb-2">Upload Table</h1>
      <p>Active Folder: {activeDate ?? "None"}</p>
      <p>Active Token: {activeToken ?? "None"}</p>

      {loading && <p className="mt-4 text-gray-500">Loading...</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}

      {!loading && !error && data.length > 0 && (
        <div className="mt-4 border rounded-lg p-4">
          <h2 className="font-medium mb-2">Fetched Data:</h2>
          <pre className="bg-gray-100 text-sm p-2 rounded">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}

      {!loading && !error && data.length === 0 && (
        <p className="mt-4 text-gray-500">No data found.</p>
      )}
    </div>
  );
};

export default UploadTable;
