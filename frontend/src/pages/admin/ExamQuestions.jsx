
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    getExamById,
    getExamQuestions
} from "../services/examService";
import { getQuestionById } from "../services/questionService";
import "../../css/admin/examQuestions.css";

const ExamQuestions = () => {
    const { examId } = useParams();
    const navigate = useNavigate();

    const [exam, setExam] = useState(null);
    const [assignedQuestions, setAssignedQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [viewQuestion, setViewQuestion] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const [examData, assignedData] = await Promise.all([
                getExamById(examId),
                getExamQuestions(examId)
            ]);

            setExam(examData.exam || examData);

            setAssignedQuestions(
                Array.isArray(assignedData)
                    ? assignedData
                    : assignedData.questions || []
            );
        } catch (err) {
            console.error("Failed to load exam questions:", err);
            setError(
                err.response?.data?.message ||
                "Failed to load the exam questions."
            );
        } finally {
            setLoading(false);
        }
    }, [examId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Fetch the full question, including options and correct-answer flags.
    const handleViewQuestion = async (questionId) => {
        try {
            setDetailLoading(true);
            setError("");
            setViewQuestion(null);

            const response = await getQuestionById(questionId);
            const question = response.question || response;

            setViewQuestion(question);
        } catch (err) {
            console.error("Failed to load question details:", err);
            setError(
                err.response?.data?.message ||
                "Failed to load question details."
            );
        } finally {
            setDetailLoading(false);
        }
    };

    // Uses the existing Admin question-edit route.
    const handleEditQuestion = (questionId) => {
        navigate(`/admin/questions/edit/${questionId}`);
    };

    if (loading) {
        return (
            <div className="exam-questions-page">
                <div className="eq-loading">
                    Loading exam questions...
                </div>
            </div>
        );
    }

    if (!exam) {
        return (
            <div className="exam-questions-page">
                <div className="eq-alert eq-error">
                    {error || "Exam not found."}
                </div>

                <button
                    className="eq-secondary-btn"
                    onClick={() => navigate("/admin/exams")}
                >
                    Back to Exams
                </button>
            </div>
        );
    }

    const requiredCount = Number(exam.total_questions) || 0;
    const assignedCount = assignedQuestions.length;
    const remainingCount = Math.max(
        0,
        requiredCount - assignedCount
    );

    const questionOptions = viewQuestion
        ? (
            viewQuestion.options ||
            viewQuestion.question_options ||
            viewQuestion.answers ||
            []
        )
        : [];

    return (
        <div className="exam-questions-page">
            <div className="eq-page-header">
                <div>
                    <p className="eq-eyebrow">EXAM MANAGEMENT</p>
                    <h1>Manage Exam Questions</h1>
                    <p className="eq-subtitle">
                        Review questions already assigned to this exam.
                    </p>
                </div>

                <button
                    className="eq-secondary-btn"
                    onClick={() => navigate("/admin/exams")}
                >
                    Back to Exams
                </button>
            </div>

            <section className="eq-exam-card">
                <div>
                    <h2>{exam.title}</h2>

                    <p>
                        Department:{" "}
                        <strong>
                            {exam.department_name ||
                                `ID ${exam.department_id}`}
                        </strong>
                    </p>

                    <p>
                        Status:{" "}
                        <span
                            className={`eq-status eq-status-${exam.status}`}
                        >
                            {exam.status}
                        </span>
                    </p>
                </div>

                <div className="eq-count-grid">
                    <div className="eq-count-item">
                        <span>Required</span>
                        <strong>{requiredCount}</strong>
                    </div>

                    <div className="eq-count-item">
                        <span>Assigned</span>
                        <strong>{assignedCount}</strong>
                    </div>

                    <div className="eq-count-item">
                        <span>Remaining</span>
                        <strong>{remainingCount}</strong>
                    </div>
                </div>
            </section>

            {error && (
                <div className="eq-alert eq-error" role="alert">
                    {error}
                </div>
            )}

            <section className="eq-section">
                <div className="eq-section-header">
                    <div>
                        <h2>Assigned Questions</h2>
                        <p>
                            Questions already linked to this exam.
                        </p>
                    </div>

                    <span className="eq-section-count">
                        {assignedCount} / {requiredCount}
                    </span>
                </div>

                {assignedQuestions.length === 0 ? (
                    <div className="eq-empty">
                        No questions have been assigned to this exam yet.
                    </div>
                ) : (
                    <div className="eq-question-list">
                        {assignedQuestions.map((question) => {
                            const questionId = Number(
                                question.question_id ?? question.id
                            );

                            return (
                                <article
                                    className="eq-question-card"
                                    key={questionId}
                                >
                                    <div className="eq-question-number">
                                        {question.question_order}
                                    </div>

                                    <div className="eq-question-content">
                                        <p>{question.question_text}</p>

                                        <span>
                                            Question ID: {questionId}
                                            {" · "}
                                            {Number(question.marks || 1)}
                                            {" mark(s)"}
                                        </span>

                                        <div className="eq-question-actions">
                                            <button
                                                type="button"
                                                className="eq-view-btn"
                                                onClick={() =>
                                                    handleViewQuestion(
                                                        questionId
                                                    )
                                                }
                                            >
                                                View Question
                                            </button>

                                            <button
                                                type="button"
                                                className="eq-edit-btn"
                                                onClick={() =>
                                                    handleEditQuestion(
                                                        questionId
                                                    )
                                                }
                                            >
                                                Edit Question
                                            </button>
                                        </div>
                                    </div>

                                    <span className="eq-assigned-label">
                                        Assigned
                                    </span>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            {detailLoading && (
                <div className="eq-modal-overlay">
                    <div
                        className="eq-question-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Loading question details"
                    >
                        <p>Loading question details...</p>
                    </div>
                </div>
            )}

            {viewQuestion && (
                <div
                    className="eq-modal-overlay"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setViewQuestion(null);
                        }
                    }}
                >
                    <section
                        className="eq-question-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="eq-modal-title"
                    >
                        <div className="eq-modal-header">
                            <div>
                                <p className="eq-eyebrow">
                                    QUESTION DETAILS
                                </p>

                                <h2 id="eq-modal-title">
                                    Question #{viewQuestion.id}
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="eq-modal-close"
                                onClick={() => setViewQuestion(null)}
                                aria-label="Close question details"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="eq-modal-meta">
                            <span>
                                Marks:{" "}
                                <strong>
                                    {Number(viewQuestion.marks || 1)}
                                </strong>
                            </span>

                            <span>
                                Status:{" "}
                                <strong>
                                    {viewQuestion.status || "Unknown"}
                                </strong>
                            </span>

                            <span>
                                Department:{" "}
                                <strong>
                                    {viewQuestion.department_name ||
                                        exam.department_name ||
                                        `ID ${viewQuestion.department_id}`}
                                </strong>
                            </span>
                        </div>

                        <div className="eq-modal-question">
                            <h3>Question</h3>
                            <p>{viewQuestion.question_text}</p>
                        </div>

                        <div className="eq-modal-options">
                            <h3>Answer Options</h3>

                            {questionOptions.length === 0 ? (
                                <p className="eq-readonly-note">
                                    No answer options were returned. Check the
                                    question detail API response.
                                </p>
                            ) : (
                                questionOptions.map((option, index) => {
                                    const isCorrect =
                                        option.is_correct === 1 ||
                                        option.is_correct === true ||
                                        option.is_correct === "1";

                                    return (
                                        <div
                                            className={`eq-detail-option ${
                                                isCorrect
                                                    ? "eq-correct-option"
                                                    : ""
                                            }`}
                                            key={option.id ?? index}
                                        >
                                            <span className="eq-option-letter">
                                                {String.fromCharCode(65 + index)}.
                                            </span>

                                            <span className="eq-option-text">
                                                {option.option_text ??
                                                    option.text ??
                                                    option.answer_text}
                                            </span>

                                            {isCorrect && (
                                                <span className="eq-correct-label">
                                                    Correct Answer
                                                </span>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="eq-modal-footer">
                            <button
                                type="button"
                                className="eq-secondary-btn"
                                onClick={() => setViewQuestion(null)}
                            >
                                Close
                            </button>

                            <button
                                type="button"
                                className="eq-primary-btn"
                                onClick={() =>
                                    handleEditQuestion(viewQuestion.id)
                                }
                            >
                                Edit Question
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};

export default ExamQuestions;
