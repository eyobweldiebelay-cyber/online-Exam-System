import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    getAllQuestions,
    deactivateQuestion,
    activateQuestion,
} from "../services/questionService";

import "../../css/teacher/question.css";

const getErrorMessage = (err, fallback) => {
    const status = err?.response?.status;

    if (status === 401) {
        return "Your session has expired. Please log in again.";
    }

    if (status === 403) {
        return (
            err.response?.data?.message ||
            "Access denied. Your account does not have permission for this request."
        );
    }

    return (
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        fallback
    );
};

const unwrapList = (data, key) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(data?.data)) return data.data;
    return [];
};

const Question = () => {
    const navigate = useNavigate();

    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState(null);

    const loadQuestions = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getAllQuestions();
            setQuestions(unwrapList(data, "questions"));
        } catch (err) {
            console.error(
                "Load teacher questions error:",
                err?.response?.data || err
            );

            setError(
                `Questions: ${getErrorMessage(
                    err,
                    "Failed to load questions."
                )}`
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadQuestions();
    }, [loadQuestions]);

    const handleDeactivate = async (id) => {
        if (
            !window.confirm(
                "Are you sure you want to deactivate this question?"
            )
        ) {
            return;
        }

        try {
            setActionLoading(id);
            setError("");

            await deactivateQuestion(id);
            await loadQuestions();
        } catch (err) {
            console.error(
                "Deactivate question error:",
                err?.response?.data || err
            );

            setError(
                getErrorMessage(
                    err,
                    "Failed to deactivate question."
                )
            );
        } finally {
            setActionLoading(null);
        }
    };

    const handleActivate = async (id) => {
        if (
            !window.confirm(
                "Are you sure you want to activate this question?"
            )
        ) {
            return;
        }

        try {
            setActionLoading(id);
            setError("");

            await activateQuestion(id);
            await loadQuestions();
        } catch (err) {
            console.error(
                "Activate question error:",
                err?.response?.data || err
            );

            setError(
                getErrorMessage(
                    err,
                    "Failed to activate question."
                )
            );
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusLabel = (status) => {
        if (status === "active") return "Active";
        if (status === "inactive") return "Inactive";
        return status || "Unknown";
    };

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
                        Import and manage questions for your department.
                    </strong>
                </div>

                <button
                    type="button"
                    className="primary-button"
                    onClick={() =>
                        navigate("/teacher/questions/new")
                    }
                >
                    Import Questions
                </button>
            </div>

            {error && (
                <div className="admin-error" role="alert">
                    {error}
                </div>
            )}

            <div className="admin-toolbar">
                <button
                    type="button"
                    className="secondary-button"
                    onClick={loadQuestions}
                    disabled={loading || actionLoading !== null}
                >
                    Refresh
                </button>

                <span className="question-count">
                    {questions.length} question
                    {questions.length !== 1 ? "s" : ""}
                </span>
            </div>

            {questions.length === 0 ? (
                <div className="admin-empty">
                    <h2>No Questions Found</h2>
                    <p>
                        Import questions using an Excel or CSV file
                        to get started.
                    </p>

                    <button
                        type="button"
                        className="primary-button"
                        onClick={() =>
                            navigate("/teacher/questions/new")
                        }
                    >
                        Import Questions
                    </button>
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
                                <th>Created By</th>
                                <th>Marks</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {questions.map((question) => (
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
                                        {question.created_by_username ||
                                            "Not recorded"}
                                    </td>

                                    <td>{question.marks ?? "N/A"}</td>

                                    <td>
                                        <span
                                            className={`status-badge ${
                                                question.status === "active"
                                                    ? "status-active"
                                                    : question.status ===
                                                        "inactive"
                                                      ? "status-inactive"
                                                      : ""
                                            }`}
                                        >
                                            {getStatusLabel(
                                                question.status
                                            )}
                                        </span>
                                    </td>

                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                type="button"
                                                className="edit-button"
                                                onClick={() =>
                                                    navigate(
                                                        `/teacher/questions/edit/${question.id}`
                                                    )
                                                }
                                            >
                                                Edit
                                            </button>

                                            {question.status === "active" ? (
                                                <button
                                                    type="button"
                                                    className="danger-button"
                                                    disabled={
                                                        actionLoading ===
                                                        question.id
                                                    }
                                                    onClick={() =>
                                                        handleDeactivate(
                                                            question.id
                                                        )
                                                    }
                                                >
                                                    {actionLoading ===
                                                    question.id
                                                        ? "..."
                                                        : "Deactivate"}
                                                </button>
                                            ) : question.status ===
                                              "inactive" ? (
                                                <button
                                                    type="button"
                                                    className="success-button"
                                                    disabled={
                                                        actionLoading ===
                                                        question.id
                                                    }
                                                    onClick={() =>
                                                        handleActivate(
                                                            question.id
                                                        )
                                                    }
                                                >
                                                    {actionLoading ===
                                                    question.id
                                                        ? "..."
                                                        : "Activate"}
                                                </button>
                                            ) : (
                                                <span>Unknown status</span>
                                            )}
                                        </div>
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