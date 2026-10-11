import { useEffect, useState } from "react";
import {
Search,
RefreshCw,
Users,
CheckCircle,
XCircle,
Percent,
} from "lucide-react";

import { getAllResults } from "../services/resultService";

import "../../css/admin/result.css";

const ResultAdmin = () => {
const [results, setResults] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

const [search, setSearch] = useState("");
const [program, setProgram] = useState("");
const [department, setDepartment] = useState("");
const [status, setStatus] = useState("");

const loadResults = async () => {
try {
setLoading(true);
setError("");


  const data = await getAllResults({
    search: search.trim(),
    program,
    department,
    status,
  });

  setResults(data.results || []);
} catch (err) {
  setError(
    err.response?.data?.message ||
      "Unable to load results. Check that the admin results API exists."
  );
} finally {
  setLoading(false);
}


};

useEffect(() => {
loadResults();
}, []);

const filteredResults = results.filter((item) => {
const username = String(item.username || "").toLowerCase();
const studentName = String(item.student_name || "").toLowerCase();


return (
  username.includes(search.toLowerCase()) ||
  studentName.includes(search.toLowerCase())
);


});

const passed = filteredResults.filter(
(item) => String(item.result_status).toLowerCase() === "pass"
).length;

const failed = filteredResults.filter(
(item) => String(item.result_status).toLowerCase() === "fail"
).length;

const passRate =
filteredResults.length > 0
? Math.round((passed / filteredResults.length) * 100)
: 0;

return ( <div className="admin-results-page"> <div className="results-header"> <div> <h1>Result Management</h1> <p>View and review students' examination results.</p> </div>


    <button
      type="button"
      className="results-refresh-btn"
      onClick={loadResults}
      disabled={loading}
    >
      <RefreshCw size={17} />
      Refresh
    </button>
  </div>

  {error && <div className="results-error">{error}</div>}

  <div className="results-summary">
    <div className="results-summary-card">
      <Users size={22} />
      <span>Total Results</span>
      <strong>{filteredResults.length}</strong>
    </div>

    <div className="results-summary-card">
      <CheckCircle size={22} />
      <span>Passed</span>
      <strong>{passed}</strong>
    </div>

    <div className="results-summary-card">
      <XCircle size={22} />
      <span>Failed</span>
      <strong>{failed}</strong>
    </div>

    <div className="results-summary-card">
      <Percent size={22} />
      <span>Pass Rate</span>
      <strong>{passRate}%</strong>
    </div>
  </div>

  <div className="results-filters">
    <div className="results-search">
      <Search size={18} />
      <input
        type="text"
        placeholder="Search student username or name"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
    </div>

    <input
      type="text"
      placeholder="Filter by program"
      value={program}
      onChange={(event) => setProgram(event.target.value)}
    />

    <input
      type="text"
      placeholder="Filter by department"
      value={department}
      onChange={(event) => setDepartment(event.target.value)}
    />

    <select
      value={status}
      onChange={(event) => setStatus(event.target.value)}
    >
      <option value="">All results</option>
      <option value="pass">Passed</option>
      <option value="fail">Failed</option>
    </select>

    <button
      type="button"
      className="results-filter-btn"
      onClick={loadResults}
    >
      Apply Filters
    </button>
  </div>

  <div className="results-table-wrapper">
    <table className="results-table">
      <thead>
        <tr>
          <th>Student Username</th>
          <th>Student Name</th>
          <th>Program</th>
          <th>Department</th>
          <th>Examination</th>
          <th>Score</th>
          <th>Percentage</th>
          <th>Result</th>
          <th>Date</th>
        </tr>
      </thead>

      <tbody>
        {loading ? (
          <tr>
            <td colSpan="9" className="results-empty">
              Loading results...
            </td>
          </tr>
        ) : filteredResults.length === 0 ? (
          <tr>
            <td colSpan="9" className="results-empty">
              No results found.
            </td>
          </tr>
        ) : (
          filteredResults.map((item) => {
            const isPassed =
              String(item.result_status).toLowerCase() === "pass";

            return (
              <tr key={item.id}>
                <td>{item.username || "—"}</td>
                <td>{item.student_name || "—"}</td>
                <td>{item.program_name || "—"}</td>
                <td>{item.department_name || "—"}</td>
                <td>{item.exam_title || "—"}</td>
                <td>
                  {item.obtained_marks ?? 0} / {item.total_marks ?? 0}
                </td>
                <td>{Number(item.percentage ?? 0).toFixed(1)}%</td>
                <td>
                  <span
                    className={`results-status ${
                      isPassed ? "passed" : "failed"
                    }`}
                  >
                    {item.result_status || "Unknown"}
                  </span>
                </td>
                <td>
                  {item.created_at
                    ? new Date(item.created_at).toLocaleDateString()
                    : "—"}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
</div>

);
};

export default ResultAdmin;
