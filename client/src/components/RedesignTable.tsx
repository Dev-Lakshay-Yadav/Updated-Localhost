import React, { useState } from "react";
import type { RedesignCaseTableProps } from "../types/caseTypes";

const RedesignTable: React.FC<RedesignCaseTableProps> = ({
  data,
  activeDate,
  activeToken,
}) => {
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<Record<string, string>>({});

  if (!activeDate || !activeToken)
    return (
      <div className="p-6 text-gray-600">
        Select a date and token to view data
      </div>
    );

  const tableData = data || [];
  const searchString = searchQuery.toLowerCase();

  const filteredData = tableData.filter((item) =>
    item.caseId.toLowerCase().includes(searchString)
  );

  const togglePatientSelection = (
    caseId: string,
    attempt: number,
    index: number
  ) => {
    const key = `${caseId}-${attempt}-${index}`;
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
      attempt: number;
      activeDate: string;
      priority: string;
      key: string;
    }[] = [];

    filteredData.forEach((item) => {
      const patients =
        item.patients && item.patients.length > 0
          ? item.patients
          : [{ patientName: "Single Unit Case" }];

      patients.forEach((p, i) => {
        const key = `${item.caseId}-${item.attempt}-${i}`;
        if (selectedPatients.has(key)) {
          selectedData.push({
            caseId: item.caseId,
            patientName: p.patientName || "Single Unit Case",
            caseOwner: item.caseOwner,
            attempt: item.attempt,
            activeDate,
            priority: item.priority,
            key,
          });
        }
      });
    });

    if (selectedData.length === 0) {
      setUploadStatus((prev) => ({
        ...prev,
        global: "⚠️ No patients selected for upload.",
      }));
      return;
    }

    setLoading(true);
    setUploadStatus({});

    for (const item of selectedData) {
      try {
        // Mark as "uploading"
        setUploadStatus((prev) => ({ ...prev, [item.key]: "uploading" }));

        const response = await fetch(
          "http://localhost:5000/api/upload/redesign",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Failed for ${item.caseId}:`, errorText);
          setUploadStatus((prev) => ({ ...prev, [item.key]: "failed" }));
        } else {
          const resJson = await response.json();
          console.log(`✅ Uploaded ${item.caseId}`, resJson);
          setUploadStatus((prev) => ({ ...prev, [item.key]: "uploaded" }));
        }
      } catch (error) {
        console.error("❌ Upload error:", error);
        setUploadStatus((prev) => ({ ...prev, [item.key]: "failed" }));
      }
    }

    setLoading(false);
  };

  // Collect all patient keys
  const allKeys: string[] = [];
  filteredData.forEach((item) => {
    const patients =
      item.patients && item.patients.length > 0
        ? item.patients
        : [{ patientName: "Single Unit Case", status: "-" }];
    patients.forEach((_, i) =>
      allKeys.push(`${item.caseId}-${item.attempt}-${i}`)
    );
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

  return (
    <div className="w-full p-6 overflow-auto">
      {/* Header Row */}
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

      {/* Upload Info */}
      {uploadStatus.global && (
        <div className="text-center text-sm text-gray-700 mb-2">
          {uploadStatus.global}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border text-center">S.No.</th>
              <th className="px-4 py-2 border">Case ID</th>
              <th className="px-4 py-2 border">Attempt</th>
              <th className="px-4 py-2 border">Case Owner</th>
              <th className="px-4 py-2 border">Priority</th>
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
                    : [{ patientName: "Single Unit Case", status: "-" }];

                return patients.map((patient, patientIndex) => {
                  const key = `${item.caseId}-${item.attempt}-${patientIndex}`;
                  const isChecked = selectedPatients.has(key);
                  const status = uploadStatus[key] || patient.status || "-";

                  return (
                    <tr
                      key={key}
                      className={`text-center border-t ${
                        status === "uploaded"
                          ? "bg-green-50"
                          : status === "failed"
                          ? "bg-red-50"
                          : ""
                      } hover:bg-gray-50`}
                    >
                      {patientIndex === 0 && (
                        <>
                          <td
                            rowSpan={patients.length}
                            className="px-4 py-2 border align-middle font-medium"
                          >
                            {caseIndex + 1}
                          </td>
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
                            {item.attempt}
                          </td>
                          <td
                            rowSpan={patients.length}
                            className="px-4 py-2 border align-middle"
                          >
                            {item.caseOwner}
                          </td>
                          <td
                            rowSpan={patients.length}
                            className="px-4 py-2 border align-middle text-blue-600 font-medium"
                          >
                            {item.priority}
                          </td>
                        </>
                      )}

                      <td className="px-4 py-2 border">
                        {patient.patientName || "Single Unit Case"}
                      </td>

                      <td
                        className={`px-4 py-2 border font-medium ${
                          status === "uploaded"
                            ? "text-green-600"
                            : status === "failed"
                            ? "text-red-600"
                            : status === "uploading"
                            ? "text-yellow-600"
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
                            togglePatientSelection(
                              item.caseId,
                              item.attempt,
                              patientIndex
                            )
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
                <td colSpan={8} className="text-center py-4 text-gray-500">
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

export default RedesignTable;
