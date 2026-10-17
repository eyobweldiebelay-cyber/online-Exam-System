
import { useEffect, useMemo, useState } from "react";

import { getAllQuestions } from "../services/questionService";
import "../../css/admin/question.css";

const Question = () => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const loadQuestions = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getAllQuestions();

            setQuestions(
                Array.isArray(data)
                    ? data
                    : Array.isArray(data?.questions)
                        ? data.questions
                        : []
            );
        } catch (err) {
            console.error("Get questions error:", err);

            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to load questions."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQuestions();
    }, []);

    const getStatusLabel = (status) => {
        if (status === "active") return "Active";
        if (status === "inactive") return "Inactive";
        return status || "Unknown";
    };

    const getAcademicYear = (question) => {
        return (
            question.academic_year ||
            question.academic_year_name ||
            "Not assigned"
        );
    };

    // Every search word must match somewhere in the question's details.
    // This supports searches such as "Information Technology 2026/2027".
    const filteredQuestions = useMemo(() => {
        const terms = searchTerm
            .trim()
            .toLowerCase()
            .split(/\s+/)
            .filter(Boolean);

        if (terms.length === 0) {
            return questions;
        }

        return questions.filter((question) => {
            const searchableText = [
                question.id,
                question.question_text,
                question.program_name,
                question.department_name,
                question.academic_year,
                question.academic_year_name,
                question.academic_year_id,
                question.created_by_username,
                question.status,
                question.marks,
                question.created_at
                    ? new Date(question.created_at).toLocaleDateString()
                    : ""
            ]
                .filter((value) => value !== null && value !== undefined)
                .join(" ")
                .toLowerCase();

            return terms.every((term) =>
                searchableText.includes(term)
            );
        });
    }, [questions, searchTerm]);

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-loading">
                    Loading questions...
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1>Question Management</h1>
                    <strong>
                        View examination questions across departments
                        and see their recorded creators.
                    </strong>
                </div>
            </div>

            {error && (
                <div className="admin-error" role="alert">
                    {error}
                </div>
            )}

            <div className="admin-toolbar">
                <input
                    type="search"
                    className="question-search-input"
                    placeholder="Search by question, department, academic year..."
                    value={searchTerm}
                    onChange={(event) =>
                        setSearchTerm(event.target.value)
                    }
                    aria-label="Search questions by department, academic year, or other details"
                />

                <button
                    type="button"
                    className="secondary-button"
                    onClick={loadQuestions}
                    disabled={loading}
                >
                    Refresh
                </button>

                <span className="question-count">
                    {filteredQuestions.length} of {questions.length} question
                    {questions.length !== 1 ? "s" : ""}
                </span>
            </div>

            {questions.length === 0 ? (
                <div className="admin-empty">
                    <h2>No Questions Found</h2>
                    <p>
                        No examination questions are currently available.
                    </p>
                </div>
            ) : filteredQuestions.length === 0 ? (
                <div className="admin-empty">
                    <h2>No Matching Questions</h2>
                    <p>
                        No questions match "{searchTerm}". Try a different
                        search term.
                    </p>
                </div>
            ) : (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Question</th>
                                <th>Program</th>
                                <th>Department</th>
                                <th>Academic Year</th>
                                <th>Created By</th>
                                <th>Marks</th>
                                <th>Status</th>
                                <th>Created At</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredQuestions.map((question) => (
                                <tr key={question.id}>
                                    <td>{question.id}</td>

                                    <td className="question-text-cell">
                                        {question.question_text}
                                    </td>

                                    <td>
                                        {question.program_name || "N/A"}
                                    </td>

                                    <td>
                                        {question.department_name || "N/A"}
                                    </td>

                                    <td>
                                        {getAcademicYear(question)}
                                    </td>

                                    <td>
                                        {question.created_by_username ||
                                            "Not recorded"}
                                    </td>

                                    <td>
                                        {question.marks ?? "N/A"}
                                    </td>

                                    <td>
                                        <span
                                            className={`status-badge ${
                                                question.status === "active"
                                                    ? "status-active"
                                                    : question.status === "inactive"
                                                        ? "status-inactive"
                                                        : ""
                                            }`}
                                        >
                                            {getStatusLabel(question.status)}
                                        </span>
                                    </td>

                                    <td>
                                        {question.created_at
                                            ? new Date(
                                                  question.created_at
                                              ).toLocaleDateString()
                                            : "N/A"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Question;
