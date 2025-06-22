import React, { useEffect, useState } from "react";
import api from "../../config/axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function SurveyResult() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [selectedResult, setSelectedResult] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await api.get("/survey-results");
        setResults(res.data || []);
      } catch {
        toast.error("Không thể tải kết quả khảo sát!");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const handleReset = () => {
    setFilterName("");
    setFilterDate("");
  };

  const filteredResults = results.filter(
    (r) =>
      (!filterName ||
        (r.userFullName || "")
          .toLowerCase()
          .includes(filterName.toLowerCase())) &&
      (!filterDate || (r.submittedAt || "").slice(0, 10) === filterDate)
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-blue-900">Survey Results</h1>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <input
          type="text"
          placeholder="Filter by user name"
          className="border rounded px-2 py-1"
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
        />
        <input
          type="date"
          className="border rounded px-2 py-1"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
        <button
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded"
          onClick={handleReset}
        >
          Reset
        </button>
      </div>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-900">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-white">No.</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-white">User Name</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-white">Submitted At</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-white">Score</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-white">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filteredResults.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  No survey results found
                </td>
              </tr>
            ) : (
              filteredResults.map((result, idx) => (
                <tr key={result.id} className="hover:bg-blue-50">
                  <td className="px-4 py-2">{idx + 1}</td>
                  <td className="px-4 py-2">{result.userFullName}</td>
                  <td className="px-4 py-2">{result.submittedAt?.slice(0, 10)}</td>
                  <td className="px-4 py-2">{result.score}</td>
                  <td className="px-4 py-2 flex gap-2 justify-center">
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                      onClick={() => setSelectedResult(result)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal xem chi tiết kết quả khảo sát */}
      {selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px] max-w-lg">
            <h2 className="text-xl font-bold mb-4">Survey Detail</h2>
            <div className="space-y-2">
              <div>
                <b>User:</b> {selectedResult.userFullName}
              </div>
              <div>
                <b>Submitted At:</b> {selectedResult.submittedAt?.slice(0, 10)}
              </div>
              <div>
                <b>Score:</b> {selectedResult.score}
              </div>
              <div>
                <b>Answers:</b>
                <ul className="list-disc ml-6">
                  {selectedResult.answers?.map((ans, i) => (
                    <li key={i} className="mb-2">
                      <b>Q{i + 1}:</b> {ans.question} <br />
                      <b>Answer:</b> {ans.answer}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setSelectedResult(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
}

export default SurveyResult;
