// import { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import RedesignTable from "../components/RedesignTable";
// import LiveCaseTable from "../components/LiveCaseTable";

// interface RedesignCase {
//   caseId: string;
//   attempt: number;
//   caseOwner: string;
//   patients: {
//     patientName: string;
//     status: string;
//   }[];
// }

// interface LiveCase {
//   caseId: string;
//   caseOwner: string;
//   patients: {
//     patientName: string;
//     status: string;
//   }[];
// }

// const UploadTable = () => {
//   const { date, token } = useParams();
//   const [data, setData] = useState<(RedesignCase | LiveCase)[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     if (!date || !token) return;

//     const fetchCaseData = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const res = await fetch("http://localhost:5000/api/cases/case-data", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ activeDate: date, activeToken: token }),
//         });

//         if (!res.ok) throw new Error(`Server responded with ${res.status}`);
//         const result = await res.json();
//         setData(result);
//       } catch (err) {
//         console.error("Error fetching case data:", err);
//         setError(err instanceof Error ? err.message : "Failed to fetch data");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCaseData();
//   }, [date, token]);

//   return (
//     <div className="p-4">
//       {loading && <p className="text-gray-500">Loading...</p>}
//       {error && <p className="text-red-500">{error}</p>}

//       {!loading && !error && (
//         <>
//           {data.length > 0 ? (
//             token?.toUpperCase() === "REDESIGN" ? (
//               <RedesignTable rows={data as RedesignCase[]} />
//             ) : (
//               <LiveCaseTable rows={data as LiveCase[]} />
//             )
//           ) : (
//             <p className="text-gray-500">No cases found.</p>
//           )}
//         </>
//       )}
//     </div>
//   );
// };

// export default UploadTable;
