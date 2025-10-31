import React, { useState } from "react";
import type { LiveCaseTableProps } from "../types/caseTypes";

const LiveCaseTable: React.FC<LiveCaseTableProps> = ({
  data,
  activeDate,
  activeToken,
}) => {
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<Record<string, string>>({}); // { "caseId-index": "uploaded" | "failed" }

  if (!activeDate || !activeToken)
    return (
      <div className="p-6 text-gray-600">
        Select a date and token to view data
      </div>
    );

  const tableData = data[activeDate]?.[activeToken] || [];
  const searchString = `${activeToken}${searchQuery}`.toLowerCase();

  const filteredData = tableData.filter((item) =>
    item.caseId.toLowerCase().includes(searchString)
  );

  const togglePatientSelection = (caseId: string, index: number) => {
    const key = `${caseId}-${index}`;
    setSelectedPatients((prev) => {
      const updated = new Set(prev);
      if (updated.has(key)) updated.delete(key);
      else updated.add(key);
      return updated;
    });
  };

  const handleSubmit = async () => {
    const selectedData: {
      caseId: string;
      patientName: string;
      caseOwner: string;
      activeDate: string;
      key: string;
    }[] = [];

    filteredData.forEach((item) => {
      const patients =
        item.patients && item.patients.length > 0
          ? item.patients
          : [{ patientName: "Single Unit Case" }];

      patients.forEach((p, i) => {
        const key = `${item.caseId}-${i}`;
        if (selectedPatients.has(key)) {
          const nameToSend =
            !p.patientName || p.patientName === "Single Unit Case"
              ? ""
              : p.patientName;

          selectedData.push({
            caseId: item.caseId,
            patientName: nameToSend,
            caseOwner: item.caseOwner,
            activeDate,
            key,
          });
        }
      });
    });

    if (selectedData.length === 0) {
      console.log("⚠️ No patients selected!");
      return;
    }

    setLoading(true);

    for (const item of selectedData) {
      try {
        console.log("📤 Uploading:", item);
        setUploadStatus((prev) => ({ ...prev, [item.key]: "uploading" }));

        const response = await fetch("http://localhost:5000/api/upload/live", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`❌ Failed for ${item.caseId}: ${errText}`);
          setUploadStatus((prev) => ({ ...prev, [item.key]: "failed" }));
          continue;
        }

        console.log(`✅ Uploaded ${item.caseId}`);
        setUploadStatus((prev) => ({ ...prev, [item.key]: "uploaded" }));
      } catch (error) {
        console.error(`💥 Network error for ${item.caseId}:`, error);
        setUploadStatus((prev) => ({ ...prev, [item.key]: "failed" }));
      }
    }

    setLoading(false);
    console.log("✅ All selected uploads processed");
  };

  // Determine all visible rows
  const allKeys: string[] = [];
  filteredData.forEach((item) => {
    const patients =
      item.patients && item.patients.length > 0
        ? item.patients
        : [{ patientName: "Single Unit Case", status: item.caseStatus || "-" }];
    patients.forEach((_, i) => allKeys.push(`${item.caseId}-${i}`));
  });

  const allSelected =
    allKeys.length > 0 && allKeys.every((k) => selectedPatients.has(k));

  const toggleSelectAll = () => {
    if (allSelected) {
      const updated = new Set(selectedPatients);
      allKeys.forEach((k) => updated.delete(k));
      setSelectedPatients(updated);
    } else {
      const updated = new Set(selectedPatients);
      allKeys.forEach((k) => updated.add(k));
      setSelectedPatients(updated);
    }
  };

  console.log(data, "asd");

  return (
    <div className="w-full p-6 overflow-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        {/* Search Bar */}
        <div className="flex items-center gap-2">
          <span className="text-gray-700 font-medium">{activeToken}</span>
          <input
            type="text"
            placeholder="Enter Case Number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 w-48 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={selectedPatients.size === 0 || loading}
          className={`px-4 py-2 rounded-md text-white ${
            selectedPatients.size > 0 && !loading
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {loading ? "Uploading..." : "Submit Selected"}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border text-center">S.No.</th>
              <th className="px-4 py-2 border">Case ID</th>
              <th className="px-4 py-2 border">Case Owner</th>
              <th className="px-4 py-2 border">Patient Name</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                />
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((item, caseIndex) => {
                const patients =
                  item.patients && item.patients.length > 0
                    ? item.patients
                    : [
                        {
                          patientName: "Single Unit Case",
                          status: item.caseStatus || "-",
                        },
                      ];

                return patients.map((patient, patientIndex) => {
                  const key = `${item.caseId}-${patientIndex}`;
                  const isChecked = selectedPatients.has(key);
                  const status =
                    uploadStatus[key] ||
                    patient.status ||
                    item.caseStatus ||
                    "-";

                  return (
                    <tr
                      key={key}
                      className="text-center border-t hover:bg-gray-50"
                    >
                      {patientIndex === 0 && (
                        <td
                          rowSpan={patients.length}
                          className="px-4 py-2 border align-middle font-medium"
                        >
                          {caseIndex + 1}
                        </td>
                      )}

                      {patientIndex === 0 && (
                        <>
                          <td
                            rowSpan={patients.length}
                            className="px-4 py-2 border align-middle"
                          >
                            {item.caseId}
                          </td>
                          <td
                            rowSpan={patients.length}
                            className="px-4 py-2 border align-middle"
                          >
                            {item.caseOwner}
                          </td>
                        </>
                      )}

                      <td className="px-4 py-2 border">
                        {patient.patientName || "Single Unit Case"}
                      </td>

                      <td
                        className={`px-4 py-2 border ${
                          status === "uploaded"
                            ? "text-green-600 font-semibold"
                            : status === "uploading"
                            ? "text-blue-600 italic"
                            : status === "failed"
                            ? "text-red-600 font-semibold"
                            : "text-gray-700"
                        }`}
                      >
                        {status}
                      </td>

                      <td className="px-4 py-2 border">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() =>
                            togglePatientSelection(item.caseId, patientIndex)
                          }
                          disabled={loading}
                        />
                      </td>
                    </tr>
                  );
                });
              })
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-4 text-gray-500">
                  No cases found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LiveCaseTable;
