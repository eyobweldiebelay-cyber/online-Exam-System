import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    getAllExams,
    deleteExam,
    publishExam
} from "../services/examService";

import "../../css/academicdean/exams.css";

const Exams = () => {
    const navigate = useNavigate();

    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState(null);

    const loadExams = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getAllExams();

            setExams(data.exams || []);
      } catch (err) {
            console.error("Failed to load exams:", err);

            setError(
                err.response?.data?.message ||
                "Failed to load exams"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadExams();
    }, []);

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this exam?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setActionLoading(id);
            setError("");

            await deleteExam(id);

            await loadExams();
        } catch (err) {
            console.error("Delete exam error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to delete exam"
            );
        } finally {
            setActionLoading(null);
        }
    };

  const handlePublish = async (id) => {
    if (
        !window.confirm(
            "Publish this exam? Students will be able to access it when the exam schedule allows."
        )
    ) {
        return;
    }

    try {
        setActionLoading(id);
        setError("");

        await publishExam(id);

        await loadExams();
    } catch (error) {
        console.error("Publish exam error:", error);

        setError(
            error.response?.data?.message ||
            "Failed to publish exam"
        );
    } finally {
        setActionLoading(null);
    }
};

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        return new Date(date).toLocaleString();
    };

    if (loading) {
        return (
            <div className="admin-exams-page">
                <div className="exam-loading">
                    Loading exams...
                </div>
            </div>
        );
    }

    return (
        <div className="admin-exams-page">

            <div className="exam-page-header">
                <div>
                    <h1> Wellcome TO Exam Management Page.</h1>
                    <strong>
                        Create, Updete  publish  and delete if it need examinations.
                    </strong>
                </div>

                <button
                    className="exam-create-btn"
                    onClick={() => navigate("/academic-dean/exams/create")}
                >
                    + Add Exam
                </button>
            </div>

            {error && (
                <div className="exam-error">
                    {error}
                </div>
            )}

            <div className="exam-content-card">

                <div className="exam-table-header">
                    <div>
                        <h2>How many Exam Here see it</h2>
                        <span>
                            {exams.length} exam
                            {exams.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                </div>

                {exams.length === 0 ? (
                    <div className="exam-empty">
                        <h3>No exams found</h3>

                        <p>
                            You have not created any examinations yet.
                        </p>

                        <button
                            onClick={() =>
                                navigate("/academic-dean/exams/create")
                            }
                        >
                            Create Your First Exam
                        </button>
                    </div>
                ) : (
                    <div className="exam-table-wrapper">

                        <table className="exam-table">

                            <thead>
                                <tr>
                                    <th>Title</th>
                                  
                                    <th>Department</th>
                                    <th>Academic Year</th>
                                    <th>Duration</th>
                                    <th>Questions</th>
                                    <th>Pass Mark</th>
                                    <th>Schedule</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {exams.map((exam) => (
                                    <tr key={exam.id}>

                                        <td>
                                            <div className="exam-title">
                                                {exam.title}
                                            </div>
                                        </td>
                                        

                                        <td>
                                            {exam.department_name || "-"}
                                        </td>

                                        <td>
                                            {exam.academic_year}
                                        </td>

                                        <td>
                                            {exam.duration_minutes} min
                                        </td>

                                        <td>
                                            {exam.total_questions}
                                        </td>

                                        <td>
                                            {exam.pass_mark}%
                                        </td>

                                        <td>
                                            <div className="exam-schedule">
                                                <span>
                                                    {formatDate(
                                                        exam.start_at
                                                    )}
                                                </span>

                                                <strong>
                                                    to
                                                </strong>

                                                <span>
                                                    {formatDate(
                                                        exam.end_at
                                                    )}
                                                </span>
                                            </div>
                                        </td>

                                        <td>
                                            <span
                                                className={`exam-status status-${exam.status}`}
                                            >
                                                {exam.status}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="exam-actions">

                                                {exam.status === "draft" && (
                                                    <button
                                                        className="action-publish"
                                                        disabled={
                                                            actionLoading ===
                                                            exam.id
                                                        }
                                                        onClick={() =>
                                                            handlePublish(
                                                                exam.id
                                                            )
                                                        }
                                                    >
                                                        Publish
                                                    </button>
                                                )}

                                                <button
                                                    className="action-edit"
                                                    onClick={() =>
                                                        navigate(
                                                            `/academic-dean/exams/edit/${exam.id}`
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </button>
                                                
                                            <button
                                            className="action-edit"
                                            onClick={() => navigate(`/academic-dean/exams/${exam.id}/questions`)}
                                                  >
                                               Manage Questions
                                                 </button>


                                                <button
                                                    className="action-delete"
                                                    disabled={
                                                        actionLoading ===
                                                        exam.id
                                                    }
                                                    onClick={() =>
                                                        handleDelete(
                                                            exam.id
                                                        )
                                                    }
                                                >
                                                    Delete
                                                </button>

                                            </div>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>

                        </table>

                    </div>
                )}

            </div>

        </div>
    );
};

export default Exams;