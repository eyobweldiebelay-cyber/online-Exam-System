
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../pages/services/api";
import "../../css/teacher/dashboard.css";

export default function TeacherResults() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const statusFilter = (
        searchParams.get("status") || "all"
    ).toLowerCase();

    useEffect(() => {
        let cancelled = false;

        async function loadResults() {
            setLoading(true);
            setError("");

            try {
                // Correct endpoint for the teacher workspace
                const response = await api.get(
                    "/teacher-workspace/results"
                );

                const data = response?.data;

                const rows = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.results)
                      ? data.results
                      : Array.isArray(data?.data)
                        ? data.data
                        : [];

                if (!cancelled) {
                    setResults(rows);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err?.response?.data?.message ||
                            "Unable to load exam results. Please check the teacher workspace API."
                    );

                    console.error(
                        "Teacher results error:",
                        err?.response?.data || err?.message
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadResults();

        return () => {
            cancelled = true;
        };
    }, []);

    const filteredResults = useMemo(() => {
        if (statusFilter === "all") {
            return results;
        }

        return results.filter((result) => {
            const status = String(
                result.result_status || result.status || ""
            ).toLowerCase();

            if (
                statusFilter === "pass" ||
                statusFilter === "passed"
            ) {
                return status === "pass" || status === "passed";
            }

            if (
                statusFilter === "fail" ||
                statusFilter === "failed"
            ) {
                return status === "fail" || status === "failed";
            }

            return true;
        });
    }, [results, statusFilter]);

    function handleStatusChange(event) {
        const value = event.target.value;
        const nextParams = new URLSearchParams(searchParams);

        if (value === "all") {
            nextParams.delete("status");
        } else {
            nextParams.set("status", value);
        }

        setSearchParams(nextParams);
    }

    function getStudentName(result) {
        return (
            result.student_name ||
            result.full_name ||
            result.student ||
            result.username ||
            "—"
        );
    }

    function getExamName(result) {
        return (
            result.exam_title ||
            result.exam_name ||
            result.title ||
            "—"
        );
    }

    function getPercentage(result) {
        const value = Number(result.percentage);

        return result.percentage != null &&
            result.percentage !== "" &&
            Number.isFinite(value)
            ? `${value.toFixed(1)}%`
            : "—";
    }

    function getStatus(result) {
        const status = String(
            result.result_status || result.status || ""
        ).toLowerCase();

        if (status === "pass" || status === "passed") {
            return "Passed";
        }

        if (status === "fail" || status === "failed") {
            return "Failed";
        }

        return status ? status.replaceAll("_", " ") : "Pending";
    }

    function getStatusClass(result) {
        const status = getStatus(result).toLowerCase();

        if (status === "passed") {
            return "teacher-result-passed";
        }

        if (status === "failed") {
            return "teacher-result-failed";
        }

        return "teacher-result-pending";
    }

    return (
        <div className="teacher-page teacher-results-page">
            <div className="teacher-page-header">
                <div>
                    <p className="teacher-eyebrow">
                        ASSESSMENT REPORTING
                    </p>

                    <h1>Exam Results</h1>

                    <p className="teacher-page-description">
                        Review results available to your teaching assignment.
                    </p>
                </div>
            </div>

            <div className="teacher-results-toolbar">
                <div>
                    <strong>{filteredResults.length}</strong>

                    <span>
                        {filteredResults.length === 1
                            ? " result"
                            : " results"}
                    </span>
                </div>

                <select
                    aria-label="Filter results by status"
                    value={statusFilter}
                    onChange={handleStatusChange}
                >
                    <option value="all">All results</option>
                    <option value="pass">Passed</option>
                    <option value="fail">Failed</option>
                </select>
            </div>

            {error && (
                <div
                    className="teacher-alert teacher-alert-error"
                    role="alert"
                >
                    {error}
                </div>
            )}

            {loading ? (
                <div className="teacher-empty-state">
                    Loading exam results...
                </div>
            ) : !error && filteredResults.length === 0 ? (
                <div className="teacher-empty-state">
                    <h3>No results found</h3>

                    <p>
                        {statusFilter === "pass" ||
                        statusFilter === "passed"
                            ? "No passing results are available for your assigned department."
                            : statusFilter === "fail" ||
                                statusFilter === "failed"
                              ? "No failing results are available for your assigned department."
                              : "Results will appear here when data is available for your assigned department."}
                    </p>
                </div>
            ) : !error ? (
                <div className="teacher-table-container">
                    <table className="teacher-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Exam</th>
                                <th>Obtained Marks</th>
                                <th>Percentage</th>
                                <th>Result</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredResults.map((result, index) => (
                                <tr
                                    key={
                                        result.id ||
                                        result.result_id ||
                                        result.attempt_id ||
                                        index
                                    }
                                >
                                    <td>{getStudentName(result)}</td>

                                    <td>{getExamName(result)}</td>

                                    <td>
                                        {result.obtained_marks ??
                                            result.marks_obtained ??
                                            "—"}

                                        {result.total_marks != null
                                            ? ` / ${result.total_marks}`
                                            : ""}
                                    </td>

                                    <td>{getPercentage(result)}</td>

                                    <td>
                                        <span
                                            className={`teacher-result-status ${getStatusClass(result)}`}
                                        >
                                            {getStatus(result)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    );
}
