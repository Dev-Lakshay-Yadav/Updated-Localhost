import React, { useState } from "react";
import type {
  RedesignCaseTableProps,
  UploadResponse,
} from "../types/caseTypes";

const RedesignTable: React.FC<RedesignCaseTableProps> = ({
  data,
  activeDate,
  activeToken,
  onRefresh,
}) => {
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<Record<string, string>>({});

  if (!activeDate || !activeToken)
    return (
      <div className="p-10 text-gray-600 text-center text-lg font-medium bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-sm border border-gray-200">
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

    // 🟢 Step 1: Build selected data list
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
            patientName:
              !p.patientName || p.patientName === "Single Unit Case"
                ? ""
                : p.patientName,
            caseOwner: item.caseOwner,
            attempt: item.attempt,
            activeDate,
            priority: item.priority,
            key,
          });
        }
      });
    });

    // 🟡 Step 2: Validate selection
    if (selectedData.length === 0) {
      setUploadStatus((prev) => ({
        ...prev,
        global: "⚠️ No patients selected for upload.",
      }));
      return;
    }

    // 🟣 Step 3: Prepare upload state
    setLoading(true);
    setUploadStatus(
      Object.fromEntries(selectedData.map((d) => [d.key, "uploading"]))
    );

    try {
      // 🟢 Step 4: Send upload request
      const response = await fetch(
        "http://localhost:5000/api/upload/redesign",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cases: selectedData }),
        }
      );

      const result: UploadResponse = await response.json();

      // 🔴 Step 5: Handle server errors
      if (!response.ok) {
        console.error("❌ Bulk upload failed:", result);
        selectedData.forEach((d) =>
          setUploadStatus((prev) => ({ ...prev, [d.key]: "failed" }))
        );
      } else {
        // 🟢 Step 6: Apply upload results
        result.results.forEach((r) => {
          const match = selectedData.find(
            (d) => d.caseId === r.caseId && d.patientName === r.patientName
          );
          if (match) {
            setUploadStatus((prev) => ({
              ...prev,
              [match.key]: r.status === "uploaded" ? "uploaded" : "failed",
            }));
          }
        });

        // 🟢 Step 7: Auto refresh if all succeeded
        const allUploaded = result.results.every(
          (r) => r.status === "uploaded"
        );
        if (allUploaded && typeof onRefresh === "function") {
          setTimeout(() => {
            onRefresh();
          }, 800);
        }
      }
    } catch (error) {
      // 🛑 Step 8: Network or unexpected error
      console.error("💥 Bulk upload network error:", error);
      selectedData.forEach((d) =>
        setUploadStatus((prev) => ({ ...prev, [d.key]: "failed" }))
      );
    } finally {
      setLoading(false);
    }
  };

  // Get all case keys and filter out already uploaded ones
  const allKeys: string[] = [];
  const eligibleKeys: string[] = [];

  filteredData.forEach((item) => {
    const patients =
      item.patients && item.patients.length > 0
        ? item.patients
        : [{ patientName: "Single Unit Case", status: "-" }];

    patients.forEach((p, i) => {
      const key = `${item.caseId}-${item.attempt}-${i}`;
      allKeys.push(key);
      if (p.status !== "uploaded" && uploadStatus[key] !== "uploaded") {
        eligibleKeys.push(key);
      }
    });
  });

  const allSelected =
    eligibleKeys.length > 0 &&
    eligibleKeys.every((k) => selectedPatients.has(k));

  const toggleSelectAll = () => {
    const updated = new Set(selectedPatients);
    if (allSelected) {
      // Unselect only eligible ones
      eligibleKeys.forEach((k) => updated.delete(k));
    } else {
      // Add only eligible (non-uploaded) keys
      eligibleKeys.forEach((k) => updated.add(k));
    }
    setSelectedPatients(updated);
  };

  return (
    <div className="w-full p-6 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xl font-semibold text-blue-700 tracking-tight">
            {activeToken}
          </span>
          <input
            type="text"
            placeholder="🔍 Search Case ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={selectedPatients.size === 0 || loading}
          className={`px-6 py-2.5 rounded-xl font-semibold text-white shadow-md transition-all duration-150 ${
            selectedPatients.size > 0 && !loading
              ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-95"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          {loading ? "Uploading..." : "Upload Selected"}
        </button>
      </div>

      {uploadStatus.global && (
        <div className="text-center text-md text-gray-600 mb-4 font-medium">
          {uploadStatus.global}
        </div>
      )}

      {/* Modern Table */}
      <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm">
        <table className="min-w-full text-md text-gray-700">
          <thead className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-200">
            <tr>
              {[
                "S.No.",
                "Case ID",
                "Attempt",
                "Case Owner",
                "Priority",
                "Patient Name",
                "Status",
                "Select",
              ].map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 font-semibold text-gray-700 text-center"
                >
                  {header === "Select" ? (
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 accent-blue-600"
                    />
                  ) : (
                    header
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
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
                      className={`transition-colors hover:bg-blue-50 ${
                        status === "uploaded"
                          ? "bg-green-50"
                          : status === "failed"
                          ? "bg-red-50"
                          : ""
                      }`}
                    >
                      {patientIndex === 0 && (
                        <>
                          <td
                            rowSpan={patients.length}
                            className="px-4 py-3 text-center font-semibold text-gray-800"
                          >
                            {caseIndex + 1}
                          </td>
                          <td
                            rowSpan={patients.length}
                            className="px-4 py-3 text-center text-gray-700 font-medium"
                          >
                            {item.caseId}
                          </td>
                          <td
                            rowSpan={patients.length}
                            className="px-4 py-3 text-center text-gray-500"
                          >
                            {item.attempt}
                          </td>
                          <td
                            rowSpan={patients.length}
                            className="px-4 py-3 text-center text-gray-700"
                          >
                            {item.caseOwner}
                          </td>
                          <td
                            rowSpan={patients.length}
                            className={`px-4 py-3 text-center font-semibold ${
                              item.priority === "High"
                                ? "text-red-600"
                                : "text-blue-600"
                            }`}
                          >
                            {item.priority}
                          </td>
                        </>
                      )}

                      <td className="px-4 py-3 text-center">
                        {patient.patientName || "Single Unit Case"}
                      </td>

                      <td
                        className={`px-4 py-3 text-center font-semibold ${
                          status === "uploaded"
                            ? "text-green-600"
                            : status === "failed"
                            ? "text-red-600"
                            : status === "uploading"
                            ? "text-orange-400"
                            : "text-gray-600"
                        }`}
                      >
                        {status}
                      </td>

                      <td className="px-4 py-3 text-center">
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
                          disabled={loading || status === "uploaded"}
                          className={`w-4 h-4 accent-blue-600 ${
                            status === "uploaded"
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        />
                      </td>
                    </tr>
                  );
                });
              })
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="text-center py-6 text-gray-400 italic"
                >
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
