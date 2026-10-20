
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
    getExamById,
    getExamQuestions,
    getAvailableQuestions,
    addQuestionsToExam
} from "../services/examService";

import { getQuestionById } from "../services/questionService";
import "../../css/academicdean/examQuestions.css";

const getErrorMessage = (error, fallback) =>
    error?.response?.data?.message ||
    error?.message ||
    fallback;

const normalizeExam = (response) =>
    response?.exam ??
    response?.data?.exam ??
    response?.data ??
    response;

const normalizeQuestionList = (response) => {
    const candidates = [
        response?.questions,
        response?.data?.questions,
        response?.data?.data?.questions,
        response?.data,
        response
    ];

    return candidates.find(Array.isArray) || [];
};

const normalizeQuestion = (response) => {
    let data = response?.data ?? response;

    for (let i = 0; i < 4; i += 1) {
        if (
            data?.question &&
            typeof data.question === "object" &&
            !data.question.question_text
        ) {
            data = data.question;
            continue;
        }

        if (
            data?.data &&
            typeof data.data === "object" &&
            !data.question_text
        ) {
            data = data.data;
            continue;
        }

        break;
    }

    if (data?.question?.question_text) {
        return {
            ...data.question,
            options:
                data.options ??
                data.question.options ??
                data.question.question_options ??
                []
        };
    }

    return data;
};

const normalizeOptions = (question) => {
    if (!question) return [];

    const options =
        question.options ??
        question.question_options ??
        question.answers ??
        question.QuestionOptions ??
        [];

    if (Array.isArray(options)) return options;

    if (options && typeof options === "object") {
        return Object.values(options);
    }

    return [];
};

const isCorrectOption = (option) => {
    const value =
        option?.is_correct ??
        option?.isCorrect ??
        option?.correct ??
        option?.is_answer;

    return (
        value === true ||
        value === 1 ||
        value === "1" ||
        value === "true"
    );
};

const getOptionText = (option) => {
    if (typeof option === "string") return option;

    return (
        option?.option_text ??
        option?.text ??
        option?.answer_text ??
        option?.option ??
        ""
    );
};

const getQuestionId = (question) => {
    const id = Number(
        question?.question_id ??
        question?.id
    );

    return Number.isInteger(id) && id > 0 ? id : null;
};

const ExamQuestions = () => {
    const { examId } = useParams();
    const navigate = useNavigate();

    const [exam, setExam] = useState(null);
    const [assignedQuestions, setAssignedQuestions] = useState([]);
    const [availableQuestions, setAvailableQuestions] = useState([]);

    const [loading, setLoading] = useState(true);
    const [availableLoading, setAvailableLoading] = useState(false);
    const [error, setError] = useState("");
    const [availableError, setAvailableError] = useState("");
    const [assignError, setAssignError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);
    const [assigning, setAssigning] = useState(false);

    const [viewQuestion, setViewQuestion] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState("");

    const loadData = useCallback(async () => {
        if (!examId) {
            setError("Exam ID is missing from the URL.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const [examResponse, assignedResponse] =
                await Promise.all([
                    getExamById(examId),
                    getExamQuestions(examId)
                ]);

            const normalizedExam = normalizeExam(examResponse);

            if (
                !normalizedExam ||
                typeof normalizedExam !== "object" ||
                Array.isArray(normalizedExam)
            ) {
                throw new Error(
                    "The exam details were returned in an unexpected format."
                );
            }

            setExam(normalizedExam);
            setAssignedQuestions(
                normalizeQuestionList(assignedResponse)
            );
        } catch (err) {
            console.error("Failed to load exam questions:", err);
            setError(
                getErrorMessage(
                    err,
                    "Failed to load the exam and its assigned questions."
                )
            );
        } finally {
            setLoading(false);
        }
    }, [examId]);

    const loadAvailableQuestions = useCallback(async () => {
        if (!examId) return;

        setAvailableLoading(true);
        setAvailableError("");

        try {
            const response = await getAvailableQuestions(examId);
            const questions = normalizeQuestionList(response);

            setAvailableQuestions(questions);

            // Clear selections for questions that are no longer available.
            const availableIds = new Set(
                questions.map(getQuestionId).filter(Boolean)
            );

            setSelectedIds((previous) =>
                previous.filter((id) => availableIds.has(id))
            );
        } catch (err) {
            console.error("Failed to load available questions:", err);

            setAvailableQuestions([]);
            setAvailableError(
                getErrorMessage(
                    err,
                    "Could not load available questions from the Question Bank."
                )
            );
        } finally {
            setAvailableLoading(false);
        }
    }, [examId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        loadAvailableQuestions();
    }, [loadAvailableQuestions]);

    const assignedIds = useMemo(
        () =>
            new Set(
                assignedQuestions
                    .map(getQuestionId)
                    .filter(Boolean)
            ),
        [assignedQuestions]
    );

    const filteredAvailableQuestions = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        return availableQuestions.filter((question) => {
            const id = getQuestionId(question);

            if (!id || assignedIds.has(id)) return false;
            if (!search) return true;

            const text = [
                question.question_text,
                question.department_name,
                question.academic_year,
                question.program_name,
                id
            ]
                .filter((value) => value !== undefined && value !== null)
                .join(" ")
                .toLowerCase();

            return text.includes(search);
        });
    }, [availableQuestions, assignedIds, searchTerm]);

    const requiredCount = Number(exam?.total_questions) || 0;
    const assignedCount = assignedQuestions.length;
    const remainingCount = Math.max(
        0,
        requiredCount - assignedCount
    );

    const selectedAvailableIds = selectedIds.filter(
        (id) =>
            !assignedIds.has(id) &&
            availableQuestions.some(
                (question) => getQuestionId(question) === id
            )
    );

    const selectionLimitReached =
        selectedAvailableIds.length >= remainingCount;

    const toggleQuestion = (questionId) => {
        setAssignError("");
        setSuccessMessage("");

        setSelectedIds((previous) => {
            if (previous.includes(questionId)) {
                return previous.filter((id) => id !== questionId);
            }

            if (previous.length >= remainingCount) {
                setAssignError(
                    `You can select at most ${remainingCount} more question(s) for this exam.`
                );
                return previous;
            }

            return [...previous, questionId];
        });
    };

    const handleAssignQuestions = async () => {
        if (selectedAvailableIds.length === 0) {
            setAssignError("Select at least one question to assign.");
            return;
        }

        if (selectedAvailableIds.length > remainingCount) {
            setAssignError(
                `Only ${remainingCount} more question(s) can be assigned to this exam.`
            );
            return;
        }

        try {
            setAssigning(true);
            setAssignError("");
            setSuccessMessage("");

            // The existing service sends { questions: [...] }.
            await addQuestionsToExam(
                examId,
                selectedAvailableIds
            );

            setSelectedIds([]);
            setSuccessMessage(
                `${selectedAvailableIds.length} question(s) assigned successfully.`
            );

            await loadData();
            await loadAvailableQuestions();
        } catch (err) {
            console.error("Failed to assign questions:", err);

            setAssignError(
                getErrorMessage(
                    err,
                    "Failed to assign questions to this exam."
                )
            );
        } finally {
            setAssigning(false);
        }
    };

    const closeQuestionDetails = () => {
        setViewQuestion(null);
        setDetailError("");
        setDetailLoading(false);
    };

    const handleViewQuestion = async (questionId) => {
        if (!questionId) {
            setDetailError("Question ID is missing.");
            return;
        }

        try {
            setDetailLoading(true);
            setDetailError("");
            setViewQuestion(null);

            const response = await getQuestionById(questionId);
            const question = normalizeQuestion(response);

            if (!question?.question_text) {
                console.error("Unexpected question response:", response);
                throw new Error(
                    "Question details were not returned in the expected format."
                );
            }

            setViewQuestion({
                ...question,
                id: question.id ?? question.question_id ?? questionId,
                options: normalizeOptions(question)
            });
        } catch (err) {
            console.error("Failed to load question details:", err);
            setDetailError(
                getErrorMessage(
                    err,
                    "Failed to load question details."
                )
            );
        } finally {
            setDetailLoading(false);
        }
    };

    const handleEditQuestion = (questionId) => {
        if (!questionId) {
            setDetailError("Question ID is missing.");
            return;
        }

        closeQuestionDetails();
        navigate(`/academic-dean/questions/edit/${questionId}`);
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
                <div className="eq-alert eq-error" role="alert">
                    {error || "Exam not found."}
                </div>

                <button
                    type="button"
                    className="eq-secondary-btn"
                    onClick={() =>
                        navigate("/academic-dean/exams")
                    }
                >
                    Back to Exams
                </button>
            </div>
        );
    }

    const questionOptions = normalizeOptions(viewQuestion);

    return (
        <div className="exam-questions-page">
            <div className="eq-page-header">
                <div>
                    <p className="eq-eyebrow">EXAM MANAGEMENT</p>
                    <h1>Manage Exam Questions</h1>
                    <p className="eq-subtitle">
                        Select eligible uploaded questions from the
                        Question Bank and manage questions assigned
                        to this exam.
                    </p>
                </div>

                <button
                    type="button"
                    className="eq-secondary-btn"
                    onClick={() =>
                        navigate("/academic-dean/exams")
                    }
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
                                `ID ${exam.department_id ?? "Unknown"}`}
                        </strong>
                    </p>

                    <p>
                        Academic Year:{" "}
                        <strong>
                            {exam.academic_year || "Not specified"}
                        </strong>
                    </p>

                    <p>
                        Status:{" "}
                        <span
                            className={`eq-status eq-status-${String(
                                exam.status || ""
                            ).toLowerCase()}`}
                        >
                            {exam.status || "Unknown"}
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

            {successMessage && (
                <div className="eq-alert eq-success" role="status">
                    {successMessage}
                </div>
            )}

            {assignError && (
                <div className="eq-alert eq-error" role="alert">
                    {assignError}
                </div>
            )}

            <section className="eq-section">
                <div className="eq-section-header">
                    <div>
                        <h2>Question Bank</h2>
                        <p>
                            Select questions that belong to this
                            exam's department and academic year.
                        </p>
                    </div>

                    <span className="eq-section-count">
                        {filteredAvailableQuestions.length} available
                    </span>
                </div>

                <div className="eq-bank-toolbar">
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(event) =>
                            setSearchTerm(event.target.value)
                        }
                        placeholder="Search question text or ID..."
                        aria-label="Search available questions"
                        className="eq-search-input"
                    />

                    <button
                        type="button"
                        className="eq-secondary-btn"
                        onClick={loadAvailableQuestions}
                        disabled={availableLoading}
                    >
                        {availableLoading ? "Refreshing..." : "Refresh Bank"}
                    </button>
                </div>

                {availableError && (
                    <div className="eq-alert eq-error" role="alert">
                        {availableError}
                        <p>
                            Check that the available-questions API
                            exists and that your account has permission
                            to access it.
                        </p>
                    </div>
                )}

                {!availableError && availableLoading ? (
                    <div className="eq-loading">
                        Loading available questions...
                    </div>
                ) : !availableError &&
                  filteredAvailableQuestions.length === 0 ? (
                    <div className="eq-empty">
                        No eligible questions were found. Check the
                        exam department, academic year, and question
                        status in the Question Bank.
                    </div>
                ) : !availableError ? (
                    <div className="eq-question-list">
                        {filteredAvailableQuestions.map((question) => {
                            const questionId = getQuestionId(question);
                            const selected =
                                selectedAvailableIds.includes(questionId);
                            const disabled =
                                !selected && selectionLimitReached;

                            return (
                                <article
                                    className="eq-question-card"
                                    key={questionId}
                                >
                                    <input
                                        type="checkbox"
                                        className="eq-question-checkbox"
                                        checked={selected}
                                        disabled={disabled || assigning}
                                        onChange={() =>
                                            toggleQuestion(questionId)
                                        }
                                        aria-label={`Select question ${questionId}`}
                                    />

                                    <div className="eq-question-number">
                                        {questionId}
                                    </div>

                                    <div className="eq-question-content">
                                        <p>
                                            {question.question_text ||
                                                "Question text unavailable."}
                                        </p>

                                        <span>
                                            Question ID: {questionId}
                                            {" · "}
                                            {Number(question.marks || 1)}
                                            {" mark(s)"}
                                            {question.academic_year
                                                ? ` · ${question.academic_year}`
                                                : ""}
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
                                        </div>
                                    </div>

                                    <span className="eq-available-label">
                                        Available
                                    </span>
                                </article>
                            );
                        })}
                    </div>
                ) : null}

                <div className="eq-assign-toolbar">
                    <span>
                        Selected: {selectedAvailableIds.length}
                        {" · "}
                        Remaining capacity: {remainingCount}
                    </span>

                    <button
                        type="button"
                        className="eq-primary-btn"
                        onClick={handleAssignQuestions}
                        disabled={
                            assigning ||
                            selectedAvailableIds.length === 0 ||
                            selectedAvailableIds.length > remainingCount
                        }
                    >
                        {assigning
                            ? "Assigning..."
                            : `Assign ${selectedAvailableIds.length} Question(s)`}
                    </button>
                </div>
            </section>

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
                        {assignedQuestions.map((question, index) => {
                            const questionId = getQuestionId(question);

                            return (
                                <article
                                    className="eq-question-card"
                                    key={
                                        questionId ??
                                        `assigned-question-${index}`
                                    }
                                >
                                    <div className="eq-question-number">
                                        {question.question_order ?? index + 1}
                                    </div>

                                    <div className="eq-question-content">
                                        <p>
                                            {question.question_text ||
                                                "Question text unavailable."}
                                        </p>

                                        <span>
                                            Question ID: {questionId ?? "Unknown"}
                                            {" · "}
                                            {Number(question.marks || 1)}
                                            {" mark(s)"}
                                        </span>

                                        <div className="eq-question-actions">
                                            <button
                                                type="button"
                                                className="eq-view-btn"
                                                disabled={!questionId}
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
                                                disabled={!questionId}
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

            {(detailLoading || detailError || viewQuestion) && (
                <div
                    className="eq-modal-overlay"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeQuestionDetails();
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
                                    {viewQuestion
                                        ? `Question #${viewQuestion.id}`
                                        : "Question Details"}
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="eq-modal-close"
                                onClick={closeQuestionDetails}
                                aria-label="Close question details"
                            >
                                &times;
                            </button>
                        </div>

                        {detailLoading ? (
                            <div className="eq-loading">
                                Loading question details...
                            </div>
                        ) : detailError ? (
                            <div className="eq-alert eq-error" role="alert">
                                {detailError}
                            </div>
                        ) : viewQuestion ? (
                            <>
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
                                                `ID ${
                                                    viewQuestion.department_id ??
                                                    exam.department_id ??
                                                    "Unknown"
                                                }`}
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
                                            No answer options were returned
                                            by the question detail API.
                                        </p>
                                    ) : (
                                        questionOptions.map(
                                            (option, index) => {
                                                const correct =
                                                    isCorrectOption(option);

                                                return (
                                                    <div
                                                        className={`eq-detail-option ${
                                                            correct
                                                                ? "eq-correct-option"
                                                                : ""
                                                        }`}
                                                        key={
                                                            option?.id ??
                                                            option?.option_id ??
                                                            index
                                                        }
                                                    >
                                                        <span className="eq-option-letter">
                                                            {String.fromCharCode(
                                                                65 + index
                                                            )}
                                                            .
                                                        </span>

                                                        <span className="eq-option-text">
                                                            {getOptionText(
                                                                option
                                                            ) ||
                                                                "Option text unavailable."}
                                                        </span>

                                                        {correct && (
                                                            <span className="eq-correct-label">
                                                                Correct Answer
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            }
                                        )
                                    )}
                                </div>
                            </>
                        ) : null}

                        <div className="eq-modal-footer">
                            <button
                                type="button"
                                className="eq-secondary-btn"
                                onClick={closeQuestionDetails}
                            >
                                Close
                            </button>

                            {viewQuestion && (
                                <button
                                    type="button"
                                    className="eq-primary-btn"
                                    onClick={() =>
                                        handleEditQuestion(viewQuestion.id)
                                    }
                                >
                                    Edit Question
                                </button>
                            )}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};

export default ExamQuestions;
