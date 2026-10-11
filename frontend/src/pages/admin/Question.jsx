import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    getAllQuestions,
    deactivateQuestion,
    activateQuestion
} from "../services/questionService";

import "../../css/admin/question.css";

const Questions = () => {

    const navigate = useNavigate();

    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState(null);

    const loadQuestions = async () => {

        try {

            setLoading(true);
            setError("");

            const data = await getAllQuestions();

            setQuestions(
                Array.isArray(data)
                    ? data
                    : data.questions || []
            );

        } catch (error) {

            console.error(
                "Get questions error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to load questions"
            );

        } finally {

            setLoading(false);
        }
    };


    useEffect(() => {
        loadQuestions();
    }, []);


    const handleDeactivate = async (id) => {

        const confirmed = window.confirm(
            "Are you sure you want to deactivate this question?"
        );

        if (!confirmed) {
            return;
        }

        try {

            setActionLoading(id);
            setError("");

            await deactivateQuestion(id);

            await loadQuestions();

        } catch (error) {

            console.error(
                "Deactivate question error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to deactivate question"
            );

        } finally {

            setActionLoading(null);
        }
    };


    const handleActivate = async (id) => {

        const confirmed = window.confirm(
            "Are you sure you want to activate this question?"
        );

        if (!confirmed) {
            return;
        }

        try {

            setActionLoading(id);
            setError("");

            await activateQuestion(id);

            await loadQuestions();

        } catch (error) {

            console.error(
                "Activate question error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to activate question"
            );

        } finally {

            setActionLoading(null);
        }
    };


    const getStatusLabel = (status) => {

        if (status === "active") {
            return "Active";
        }

        return "Inactive";
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

            {/* Header */}
            <div className="admin-page-header">

                <div>
                    <h1> Welcome TO Question Management Page</h1>

                    <strong>
                        Create, update Activate and deactivate  examination questions.
                    </strong>
                </div>

                <button
                    className="primary-button"
                    onClick={() =>
                        navigate("/admin/questions/create")
                    }
                >
                    + Add Question
                </button>

            </div>


            {/* Error */}
            {error && (
                <div className="admin-error">
                    {error}
                </div>
            )}


            {/* Refresh */}
            <div className="admin-toolbar">

                <button
                    className="secondary-button"
                    onClick={loadQuestions}
                    disabled={loading}
                >
                    Refresh
                </button>

                <span className="question-count">
                    {questions.length} question
                    {questions.length !== 1 ? "s" : ""}
                </span>

            </div>


            {/* Empty */}
            {questions.length === 0 ? (

                <div className="admin-empty">

                    <h2>No Questions Found</h2>

                    <p>
                        Create your first examination question.
                    </p>

                    <button
                        className="primary-button"
                        onClick={() =>
                            navigate("/admin/questions/create")
                        }
                    >
                        + Add Question
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
    <th>Marks</th>
    <th>Status</th>
    <th>Actions</th>
</tr>

                        </thead>

                        <tbody>

                            {questions.map((question) => (

                                <tr key={question.id}>

                                    <td>
                                        {question.id}
                                    </td>

                                    <td className="question-text-cell">
                                        {question.question_text}
                                    </td>
                                    <td>
                                     {question.program_name || "N/A"}
                                       </td>

                                    <td>
                                        {question.department_name}
                                    </td>

                                    <td>
                                        {question.marks}
                                    </td>

                                    <td>

                                        <span
                                            className={`status-badge ${
                                                question.status === "active"
                                                    ? "status-active"
                                                    : "status-inactive"
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
                                                className="edit-button"
                                                onClick={() =>
                                                    navigate(
                                                        `/admin/questions/edit/${question.id}`
                                                    )
                                                }
                                            >
                                                Edit
                                            </button>


                                            {question.status === "active" ? (

                                                <button
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

                                            ) : (

                                                <button
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

export default Questions;