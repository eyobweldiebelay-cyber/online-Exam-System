import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ChevronLeft,
    ChevronRight,
    Send
} from "lucide-react";
import logoimage from "../../image/logo.jpg";

import api from "../../pages/services/api";
import "../../css/student/exam.css";

const TakeExam = () => {
    const { examId } = useParams();
    const navigate = useNavigate();

    const [exam, setExam] = useState(null);
    const [attemptId, setAttemptId] = useState(null);
    const [questions, setQuestions] = useState([]);

    const [answers, setAnswers] = useState({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const [timeLeft, setTimeLeft] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const token = localStorage.getItem("token");

    // =========================================================
    // START / RESUME EXAM
    // =========================================================
    useEffect(() => {
        const startExam = async () => {
            try {
                setLoading(true);
                setError("");

                if (!token) {
                    navigate("/login");
                    return;
                }

                const response = await api.post(
                    `/attempts/start/${examId}`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = response.data;

                console.log("START EXAM RESPONSE:", data);
                console.log("DURATION:", data.duration_minutes);
                console.log("QUESTIONS:", data.questions);
                console.log(
                    "QUESTION COUNT:",
                    data.questions?.length
                );

                // -------------------------------------------------
                // EXAM DATA
                // -------------------------------------------------
                setExam(data.exam);

                // -------------------------------------------------
                // ATTEMPT ID
                // -------------------------------------------------
                setAttemptId(
                    data.attempt_id || data.attemptId
                );

                // -------------------------------------------------
                // QUESTIONS
                // -------------------------------------------------
                const receivedQuestions = Array.isArray(
                    data.questions
                )
                    ? data.questions
                    : [];

                setQuestions(receivedQuestions);

                // -------------------------------------------------
                // TIMER
                // -------------------------------------------------
                // Backend returns:
                // duration_minutes: 60
                //
                // Convert minutes to seconds.
                // -------------------------------------------------
                const durationMinutes = Number(
                    data.exam?.duration_minutes
                );

                if (
                    !Number.isFinite(durationMinutes) ||
                    durationMinutes <= 0
                ) {
                    setError(
                        "Invalid examination duration."
                    );
                    return;
                }

                const totalSeconds =
                    Math.floor(durationMinutes * 60);

                console.log(
                    "TIMER SECONDS:",
                    totalSeconds
                );

                setTimeLeft(totalSeconds);

            } catch (err) {
                console.error(
                    "Start exam error:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                        "Unable to start examination."
                );
            } finally {
                setLoading(false);
            }
        };

        startExam();
    }, [examId, navigate, token]);

    // =========================================================
    // COUNTDOWN TIMER
    // =========================================================
    useEffect(() => {
        if (
            timeLeft === null ||
            timeLeft <= 0 ||
            loading
        ) {
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((previousTime) => {
                if (
                    previousTime === null ||
                    previousTime <= 1
                ) {
                    clearInterval(timer);
                    return 0;
                }

                return previousTime - 1;
            });
        }, 1000);

        return () => {
            clearInterval(timer);
        };
    }, [loading, timeLeft]);

    // =========================================================
    // AUTO SUBMIT WHEN TIMER REACHES ZERO
    // =========================================================
    useEffect(() => {
        if (
            timeLeft === 0 &&
            attemptId &&
            !loading &&
            !submitting
        ) {
            submitExam();
        }
    }, [
        timeLeft,
        attemptId,
        loading,
        submitting
    ]);

    // =========================================================
    // FORMAT TIMER
    // =========================================================
    const formatTime = (seconds) => {
        if (
            seconds === null ||
            seconds === undefined
        ) {
            return "00:00:00";
        }

        const safeSeconds = Math.max(
            0,
            Math.floor(seconds)
        );

        const hours = Math.floor(
            safeSeconds / 3600
        );

        const minutes = Math.floor(
            (safeSeconds % 3600) / 60
        );

        const secs =
            safeSeconds % 60;

        return `${String(hours).padStart(
            2,
            "0"
        )}:${String(minutes).padStart(
            2,
            "0"
        )}:${String(secs).padStart(
            2,
            "0"
        )}`;
    };

    // =========================================================
    // SELECT ANSWER
    // =========================================================
    const selectAnswer = (
        questionId,
        optionId
    ) => {
        setAnswers((previous) => ({
            ...previous,
            [questionId]: optionId
        }));
    };

    // =========================================================
    // PREVIOUS
    // =========================================================
    const goToPreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(
                (previous) =>
                    previous - 1
            );
        }
    };

    // =========================================================
    // NEXT
    // =========================================================
    const goToNextQuestion = () => {
        if (
            currentQuestionIndex <
            questions.length - 1
        ) {
            setCurrentQuestionIndex(
                (previous) =>
                    previous + 1
            );
        }
    };

    // =========================================================
    // QUESTION NAVIGATION
    // =========================================================
    const goToQuestion = (index) => {
        if (
            index >= 0 &&
            index < questions.length
        ) {
            setCurrentQuestionIndex(index);
        }
    };

    // =========================================================
    // SUBMIT EXAM
    // =========================================================
    const submitExam = async () => {
        if (
            submitting ||
            !attemptId
        ) {
            return;
        }

        try {
            setSubmitting(true);
            setError("");

            const answerArray =
                Object.entries(answers).map(
                    ([questionId, optionId]) => ({
                        question_id:
                            Number(questionId),

                        selected_option_id:
                            Number(optionId)
                    })
                );

            console.log(
                "SUBMIT ANSWERS:",
                answerArray
            );

            // -------------------------------------------------
            // SUBMIT EXAM
            // -------------------------------------------------
            const response = await api.post(
                `/attempts/submit/${attemptId}`,
                {
                    answers: answerArray
                },
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            // -------------------------------------------------
            // SHOW BACKEND RESULT
            // -------------------------------------------------
            console.log(
                "SUBMIT EXAM RESPONSE:",
                response.data
            );

            // -------------------------------------------------
            // GO TO RESULT PAGE
            // Pass the backend result to Result.jsx
            // -------------------------------------------------
            navigate(
                `/student/result/${attemptId}`,
                {
                    replace: true,
                    state: {
                        result:
                            response.data?.result ||
                            null
                    }
                }
            );

        } catch (err) {
            console.error(
                "Submit exam error:",
                err
            );

            setError(
                err.response?.data?.message ||
                    "Failed to submit examination."
            );

            setSubmitting(false);
        }
    };

    // =========================================================
    // LOADING
    // =========================================================
    if (loading) {
        return (
            <div className="exam-screen-loading">
                <div className="exam-loading-spinner"></div>

                <p>
                    Loading examination...
                </p>
            </div>
        );
    }

    // =========================================================
    // ERROR
    // =========================================================
    if (
        error &&
        questions.length === 0
    ) {
        return (
            <div className="exam-screen-error">
                <h2>
                    Examination Error
                </h2>

                <p>{error}</p>

                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            "/student"
                        )
                    }
                >
                    Back to Examinations
                </button>
            </div>
        );
    }

    // =========================================================
    // NO QUESTIONS
    // =========================================================
    if (questions.length === 0) {
        return (
            <div className="exam-screen-error">
                <h2>
                    No Questions Available
                </h2>

                <p>
                    This examination does not
                    have any questions assigned.
                </p>
            </div>
        );
    }

    // =========================================================
    // CURRENT QUESTION
    // =========================================================
    const currentQuestion =
        questions[currentQuestionIndex];

    const questionId =
        currentQuestion.id;

    const selectedOption =
        answers[questionId];

    const options =
        currentQuestion.options ||
        currentQuestion.question_options ||
        [];

    const isFirstQuestion =
        currentQuestionIndex === 0;

    const isLastQuestion =
        currentQuestionIndex ===
        questions.length - 1;

    // =========================================================
    // RENDER
    // =========================================================
    return (
        <div className="exit-exam-screen">

            {/* =================================================
                EXAM HEADER
               ================================================= */}
            <header className="exit-exam-header">

                <div className="exit-exam-brand">

                    <img src={logoimage}
                        alt="College Logo"
                        className="exit-exam-logo"
                    />

                    <div className="exit-exam-title">
                        {exam?.title ||
                            "INFORMATION TECHNOLOGY EXIT EXAM"}
                    </div>

                </div>

                {/* TIMER */}
                <div
                    className={`exit-exam-timer ${
                        timeLeft <= 300
                            ? "timer-warning"
                            : ""
                    }`}
                >
                    {formatTime(timeLeft)}
                </div>

            </header>

            {/* =================================================
                MAIN QUESTION AREA
               ================================================= */}
            <main className="exit-exam-main">

                {error && (
                    <div className="exam-inline-error">
                        {error}
                    </div>
                )}

                {/* QUESTION NUMBER */}
                <div className="exit-exam-question-count">
                    Question{" "}
                    {currentQuestionIndex + 1}{" "}
                    of{" "}
                    {questions.length}
                </div>

                {/* QUESTION */}
                <section className="exit-exam-question">

                    <h1>
                        {
                            currentQuestion.question_text
                        }
                    </h1>

                    {/* OPTIONS */}
                    <div className="exit-exam-options">

                        {options.map(
                            (option, index) => {
                                const optionId =
                                    option.id ||
                                    option.option_id;

                                const letters = [
                                    "A",
                                    "B",
                                    "C",
                                    "D",
                                    "E",
                                    "F"
                                ];

                                const isSelected =
                                    Number(
                                        selectedOption
                                    ) ===
                                    Number(
                                        optionId
                                    );

                                return (
                                    <button
                                        type="button"
                                        key={
                                            optionId
                                        }
                                        className={`exit-exam-option ${
                                            isSelected
                                                ? "selected"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            selectAnswer(
                                                questionId,
                                                optionId
                                            )
                                        }
                                    >
                                        <span className="option-radio">
                                            {isSelected
                                                ? "●"
                                                : "○"}
                                        </span>

                                        <span className="option-letter">
                                            {
                                                letters[
                                                    index
                                                ]
                                            }
                                            .
                                        </span>

                                        <span className="option-answer">
                                            {
                                                option.option_text
                                            }
                                        </span>
                                    </button>
                                );
                            }
                        )}

                    </div>

                </section>

                {/* =================================================
                    PREVIOUS / NEXT
                   ================================================= */}
                <div className="exit-exam-actions">

                    <button
                        type="button"
                        className="exam-nav-button previous"
                        disabled={
                            isFirstQuestion
                        }
                        onClick={
                            goToPreviousQuestion
                        }
                    >
                        <ChevronLeft
                            size={20}
                        />

                        Previous
                    </button>

                    {!isLastQuestion ? (
                        <button
                            type="button"
                            className="exam-nav-button next"
                            onClick={
                                goToNextQuestion
                            }
                        >
                            Next

                            <ChevronRight
                                size={20}
                            />
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="exam-submit-button"
                            disabled={
                                submitting
                            }
                            onClick={
                                submitExam
                            }
                        >
                            <Send size={18} />

                            {submitting
                                ? "Submitting..."
                                : "Submit Exam"}
                        </button>
                    )}

                </div>

            </main>

            {/* =================================================
                QUESTION NAVIGATION
               ================================================= */}
            <section className="exit-exam-navigation">

                <div className="navigation-title">
                    Question Navigation
                </div>

                <div className="question-number-list">

                    {questions.map(
                        (question, index) => {
                            const answered =
                                answers[
                                    question.id
                                ] !==
                                undefined;

                            const current =
                                index ===
                                currentQuestionIndex;

                            return (
                                <button
                                    type="button"
                                    key={
                                        question.id
                                    }
                                    className={`question-number ${
                                        current
                                            ? "current"
                                            : ""
                                    } ${
                                        answered
                                            ? "answered"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        goToQuestion(
                                            index
                                        )
                                    }
                                >
                                    {index + 1}
                                </button>
                            );
                        }
                    )}

                </div>

            </section>

        </div>
    );
};

export default TakeExam;