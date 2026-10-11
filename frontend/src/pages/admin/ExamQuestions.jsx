
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    getExamById,
    getExamQuestions,
    addQuestionsToExam
} from "../services/examService";
import { getAllQuestions } from "../services/questionService";
import "../../css/admin/examQuestions.css";

const ExamQuestions = () => {
    const { examId } = useParams();
    const navigate = useNavigate();

    const [exam, setExam] = useState(null);
    const [assignedQuestions, setAssignedQuestions] = useState([]);
    const [questionBank, setQuestionBank] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const [examData, assignedData, bankData] = await Promise.all([
                getExamById(examId),
                getExamQuestions(examId),
                getAllQuestions()
            ]);

            setExam(examData.exam || examData);
            setAssignedQuestions(
                Array.isArray(assignedData)
                    ? assignedData
                    : assignedData.questions || []
            );
            setQuestionBank(
                Array.isArray(bankData)
                    ? bankData
                    : bankData.questions || []
            );
        } catch (err) {
            console.error("Failed to load exam questions:", err);
            setError(
                err.response?.data?.message ||
                "Failed to load the exam and question bank."
            );
        } finally {
            setLoading(false);
        }
    }, [examId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const assignedIds = useMemo(
        () => new Set(
            assignedQuestions.map((question) =>
                Number(question.question_id ?? question.id)
            )
        ),
        [assignedQuestions]
    );

    const availableQuestions = useMemo(() => {
        if (!exam) return [];

        return questionBank.filter((question) =>
            Number(question.department_id) === Number(exam.department_id) &&
            question.status === "active" &&
            !assignedIds.has(Number(question.id))
        );
    }, [exam, questionBank, assignedIds]);

    const toggleQuestion = (questionId) => {
        setSelectedIds((current) =>
            current.includes(questionId)
                ? current.filter((id) => id !== questionId)
                : [...current, questionId]
        );
        setError("");
        setSuccess("");
    };

    const selectAllAvailable = () => {
        setSelectedIds((current) => {
            const combined = new Set([
                ...current,
                ...availableQuestions.map((question) => Number(question.id))
            ]);
            return [...combined];
        });
        setError("");
        setSuccess("");
    };

    const clearSelection = () => {
        setSelectedIds([]);
        setError("");
        setSuccess("");
    };

    const handleAssign = async () => {
        if (selectedIds.length === 0) {
            setError("Select at least one question to assign.");
            return;
        }

        if (
            exam.total_questions &&
            assignedQuestions.length + selectedIds.length >
                Number(exam.total_questions)
        ) {
            setError(
                `You can assign only ${Math.max(
                    0,
                    Number(exam.total_questions) - assignedQuestions.length
                )} more question(s) to this exam.`
            );
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const lastOrder = assignedQuestions.reduce(
                (highest, question) =>
                    Math.max(highest, Number(question.question_order) || 0),
                0
            );

            const questions = selectedIds.map((questionId, index) => ({
                question_id: questionId,
                question_order: lastOrder + index + 1
            }));

            await addQuestionsToExam(examId, questions);

            setSelectedIds([]);
            setSuccess("Questions assigned to the exam successfully.");
            await loadData();
        } catch (err) {
            console.error("Failed to assign questions:", err);
            setError(
                err.response?.data?.message ||
                "Failed to assign questions. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="exam-questions-page">
                <div className="eq-loading">Loading exam questions...</div>
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
    const remainingCount = Math.max(0, requiredCount - assignedCount);

    return (
        <div className="exam-questions-page">
            <div className="eq-page-header">
                <div>
                    <p className="eq-eyebrow">EXAM MANAGEMENT</p>
                    <h1>Manage Exam Questions</h1>
                    <p className="eq-subtitle">
                        Choose questions from the question bank for this exam.
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
                        <strong>{exam.department_name || `ID ${exam.department_id}`}</strong>
                    </p>
                    <p>
                        Status:{" "}
                        <span className={`eq-status eq-status-${exam.status}`}>
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

            {success && (
                <div className="eq-alert eq-success" role="status">
                    {success}
                </div>
            )}

            <section className="eq-section">
                <div className="eq-section-header">
                    <div>
                        <h2>Assigned Questions</h2>
                        <p>Questions already linked to this exam.</p>
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
                        {assignedQuestions.map((question) => (
                            <article
                                className="eq-question-card"
                                key={question.question_id ?? question.id}
                            >
                                <div className="eq-question-number">
                                    {question.question_order}
                                </div>
                                <div className="eq-question-content">
                                    <p>{question.question_text}</p>
                                    <span>
                                        Question ID: {question.question_id}
                                        {" · "}
                                        {Number(question.marks || 1)} mark(s)
                                    </span>
                                </div>
                                <span className="eq-assigned-label">Assigned</span>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <section className="eq-section">
                <div className="eq-section-header">
                    <div>
                        <h2>Question Bank</h2>
                        <p>
                            Only active questions from this exam's department
                            are shown.
                        </p>
                    </div>
                    <span className="eq-section-count">
                        {availableQuestions.length} available
                    </span>
                </div>

                {availableQuestions.length === 0 ? (
                    <div className="eq-empty">
                        No additional active questions are available for this
                        department. Create more questions in Question Management
                        if needed.
                    </div>
                ) : (
                    <>
                        <div className="eq-selection-toolbar">
                            <span>
                                {selectedIds.length} question(s) selected
                            </span>
                            <div>
                                <button
                                    type="button"
                                    className="eq-text-btn"
                                    onClick={selectAllAvailable}
                                >
                                    Select all
                                </button>
                                <button
                                    type="button"
                                    className="eq-text-btn"
                                    onClick={clearSelection}
                                >
                                    Clear selection
                                </button>
                            </div>
                        </div>

                        <div className="eq-question-list">
                            {availableQuestions.map((question) => {
                                const questionId = Number(question.id);
                                const checked = selectedIds.includes(questionId);

                                return (
                                    <label
                                        className={`eq-bank-question ${
                                            checked ? "eq-selected" : ""
                                        }`}
                                        key={question.id}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() =>
                                                toggleQuestion(questionId)
                                            }
                                            disabled={
                                                saving ||
                                                exam.status !== "draft" ||
                                                remainingCount === 0
                                            }
                                        />

                                        <div className="eq-question-content">
                                            <p>{question.question_text}</p>
                                            <span>
                                                ID: {question.id}
                                                {" · "}
                                                {Number(question.marks || 1)} mark(s)
                                            </span>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </>
                )}

                <div className="eq-footer-actions">
                    {exam.status !== "draft" && (
                        <p className="eq-readonly-note">
                            Only draft exams can be assigned new questions.
                        </p>
                    )}

                    <button
                        type="button"
                        className="eq-primary-btn"
                        onClick={handleAssign}
                        disabled={
                            saving ||
                            selectedIds.length === 0 ||
                            exam.status !== "draft" ||
                            remainingCount === 0
                        }
                    >
                        {saving
                            ? "Assigning..."
                            : `Assign ${selectedIds.length} Selected Question(s)`}
                    </button>
                </div>
            </section>
        </div>
    );
};

export default ExamQuestions;
