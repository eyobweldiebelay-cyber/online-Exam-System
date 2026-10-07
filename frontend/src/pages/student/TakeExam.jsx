import React, {
    useEffect,
    useState
} from "react";

import {
    useNavigate,
    useParams
} from "react-router-dom";

import {
    AlertTriangle,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Clock,
    Send
} from "lucide-react";

import api from "../../pages/services/api";

import "../../css/student/exam.css";


function TakeExam() {

    const { examId } = useParams();

    const navigate = useNavigate();


    const [exam, setExam] = useState(null);

    const [attemptId, setAttemptId] =
        useState(null);

    const [questions, setQuestions] =
        useState([]);

    const [answers, setAnswers] =
        useState({});

    const [currentQuestionIndex, setCurrentQuestionIndex] =
        useState(0);

    const [timeLeft, setTimeLeft] =
        useState(0);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [submitting, setSubmitting] =
        useState(false);

    const [showSubmitModal, setShowSubmitModal] =
        useState(false);


    // ======================================================
    // START EXAM
    // ======================================================

    useEffect(() => {

        startExam();

    }, [examId]);


    async function startExam() {

        try {

            setLoading(true);

            setError("");

            const token =
                localStorage.getItem("token");


            const response =
                await api.post(
                    `/attempts/start/${examId}`,
                    {},
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            const data =
                response.data;


            console.log(
                "Exam started:",
                data
            );


            setAttemptId(
                data.attempt_id
            );

            setExam(
                data.exam
            );

            setQuestions(
                data.questions || []
            );


            if (
                data.exam &&
                data.exam.duration_minutes
            ) {

                setTimeLeft(
                    data.exam.duration_minutes * 60
                );

            }


        } catch (err) {

            console.error(
                "Start exam error:",
                err
            );


            setError(
                err.response?.data?.message ||
                "Unable to start the examination."
            );

        } finally {

            setLoading(false);

        }

    }


    // ======================================================
    // COUNTDOWN TIMER
    // ======================================================

    useEffect(() => {

        if (
            loading ||
            !exam ||
            timeLeft <= 0 ||
            submitting
        ) {
            return;
        }


        const timer =
            setInterval(() => {

                setTimeLeft(
                    previousTime => {

                        if (
                            previousTime <= 1
                        ) {

                            clearInterval(timer);

                            handleAutoSubmit();

                            return 0;

                        }

                        return previousTime - 1;

                    }
                );

            }, 1000);


        return () => {

            clearInterval(timer);

        };

    }, [
        loading,
        exam,
        timeLeft,
        submitting
    ]);


    // ======================================================
    // FORMAT TIMER
    // ======================================================

    function formatTime(seconds) {

        const minutes =
            Math.floor(seconds / 60);

        const remainingSeconds =
            seconds % 60;


        return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;

    }


    // ======================================================
    // SELECT ANSWER
    // ======================================================

    function handleAnswerSelect(
        questionId,
        optionId
    ) {

        setAnswers(
            previousAnswers => ({
                ...previousAnswers,

                [questionId]:
                    optionId
            })
        );

    }


    // ======================================================
    // NEXT QUESTION
    // ======================================================

    function goToNextQuestion() {

        if (
            currentQuestionIndex <
            questions.length - 1
        ) {

            setCurrentQuestionIndex(
                previousIndex =>
                    previousIndex + 1
            );

        }

    }


    // ======================================================
    // PREVIOUS QUESTION
    // ======================================================

    function goToPreviousQuestion() {

        if (
            currentQuestionIndex > 0
        ) {

            setCurrentQuestionIndex(
                previousIndex =>
                    previousIndex - 1
            );

        }

    }


    // ======================================================
    // GO TO QUESTION
    // ======================================================

    function goToQuestion(index) {

        setCurrentQuestionIndex(index);

    }


    // ======================================================
    // OPEN SUBMIT MODAL
    // ======================================================

    function openSubmitModal() {

        setShowSubmitModal(true);

    }


    // ======================================================
    // CLOSE SUBMIT MODAL
    // ======================================================

    function closeSubmitModal() {

        if (!submitting) {

            setShowSubmitModal(false);

        }

    }


    // ======================================================
    // AUTO SUBMIT
    // ======================================================

    function handleAutoSubmit() {

        submitExam();

    }


    // ======================================================
    // SUBMIT EXAM
    // ======================================================

    async function submitExam() {

        if (
            submitting ||
            !attemptId
        ) {

            return;

        }


        try {

            setSubmitting(true);

            setError("");


            const token =
                localStorage.getItem("token");


            // --------------------------------------------------
            // Create answer array
            // Only send questions that have an answer
            // --------------------------------------------------

            const answerArray =
                questions
                    .filter(
                        question =>
                            answers[question.id] !== undefined
                    )
                    .map(
                        question => ({
                            question_id:
                                question.id,

                            selected_option_id:
                                answers[question.id]
                        })
                    );


            console.log(
                "Attempt ID:",
                attemptId
            );

            console.log(
                "Answers being submitted:",
                answerArray
            );


            // --------------------------------------------------
            // Prevent empty submission
            // --------------------------------------------------

            if (
                answerArray.length === 0
            ) {

                setError(
                    "Please answer at least one question before submitting."
                );

                setSubmitting(false);

                setShowSubmitModal(false);

                return;

            }


            // --------------------------------------------------
            // Send submission
            // --------------------------------------------------

            const response =
                await api.post(
                    `/attempts/submit/${attemptId}`,

                    {
                        answers:
                            answerArray
                    },

                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json"
                        }
                    }
                );


            console.log(
                "Submit response:",
                response.data
            );


            const result =
                response.data.result;


            if (!result) {

                throw new Error(
                    "Result was not returned by the server."
                );

            }


            // --------------------------------------------------
            // Navigate to Result page
            // --------------------------------------------------

           

navigate(
    `/student/result/${attemptId}`,
    {
        state: {
            result: result
        }
    }
);

        } catch (err) {

            console.error(
                "Submit exam error:",
                err
            );


            console.error(
                "Backend response:",
                err.response?.data
            );


            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to submit the examination."
            );


            setSubmitting(false);

        }

    }


    // ======================================================
    // LOADING
    // ======================================================

    if (loading) {

        return (

            <div className="take-exam-loading">

                <div className="loading-spinner"></div>

                <p>
                    Starting examination...
                </p>

            </div>

        );

    }


    // ======================================================
    // START ERROR
    // ======================================================

    if (
        error &&
        !exam
    ) {

        return (

            <div className="take-exam-error">

                <AlertTriangle
                    size={42}
                />

                <h2>
                    Unable to Start Examination
                </h2>

                <p>
                    {error}
                </p>

                <button
                    type="button"
                    onClick={() =>
                        navigate("/student")
                    }
                >
                    Back to Examinations
                </button>

            </div>

        );

    }


    // ======================================================
    // NO QUESTIONS
    // ======================================================

    if (
        !exam ||
        questions.length === 0
    ) {

        return (

            <div className="take-exam-error">

                <AlertTriangle
                    size={42}
                />

                <h2>
                    No Questions Available
                </h2>

                <p>
                    This examination does not
                    currently contain any questions.
                </p>

                <button
                    type="button"
                    onClick={() =>
                        navigate("/student")
                    }
                >
                    Back to Examinations
                </button>

            </div>

        );

    }


    // ======================================================
    // CURRENT QUESTION
    // ======================================================

    const currentQuestion =
        questions[currentQuestionIndex];


    const selectedOption =
        answers[currentQuestion.id];


    const answeredCount =
        Object.keys(answers).length;


    // ======================================================
    // PAGE
    // ======================================================

    return (

        <div className="take-exam-page">


            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="take-exam-header">

                <div>

                    <span className="exam-label">
                        Examination
                    </span>

                    <h1>
                        {exam.title}
                    </h1>

                </div>


                <div
                    className={
                        timeLeft <= 300
                            ? "exam-timer danger"
                            : "exam-timer"
                    }
                >

                    <Clock
                        size={22}
                    />

                    <div>

                        <span>
                            Time Remaining
                        </span>

                        <strong>
                            {formatTime(timeLeft)}
                        </strong>

                    </div>

                </div>

            </div>


            {/* ==================================================
                PROGRESS
            ================================================== */}

            <div className="exam-progress">

                <div className="progress-info">

                    <span>

                        Question{" "}

                        {currentQuestionIndex + 1}

                        {" "}of{" "}

                        {questions.length}

                    </span>


                    <span>

                        {answeredCount}
                        {" "}
                        answered

                    </span>

                </div>


                <div className="progress-track">

                    <div
                        className="progress-fill"
                        style={{
                            width:
                                `${(
                                    (
                                        currentQuestionIndex + 1
                                    ) /
                                    questions.length
                                ) * 100}%`
                        }}
                    ></div>

                </div>

            </div>


            {/* ==================================================
                CONTENT
            ================================================== */}

            <div className="take-exam-content">


                {/* ==================================================
                    QUESTION
                ================================================== */}

                <main className="question-section">

                    <div className="question-card">

                        <div className="question-top">

                            <span>

                                Question{" "}

                                {currentQuestionIndex + 1}

                            </span>


                            <span>

                                {currentQuestion.marks}
                                {" "}
                                mark

                            </span>

                        </div>


                        <h2>
                            {currentQuestion.question_text}
                        </h2>


                        <div className="options-list">

                            {currentQuestion.options.map(
                                (
                                    option,
                                    index
                                ) => (

                                    <button
                                        key={
                                            option.id
                                        }
                                        type="button"
                                        className={
                                            selectedOption ===
                                            option.id
                                                ? "answer-option selected"
                                                : "answer-option"
                                        }
                                        onClick={() =>
                                            handleAnswerSelect(
                                                currentQuestion.id,
                                                option.id
                                            )
                                        }
                                    >

                                        <span className="option-letter">

                                            {String.fromCharCode(
                                                65 + index
                                            )}

                                        </span>


                                        <span className="option-text">

                                            {option.option_text}

                                        </span>


                                        {selectedOption ===
                                            option.id && (

                                            <CheckCircle
                                                size={21}
                                                className="selected-icon"
                                            />

                                        )}

                                    </button>

                                )
                            )}

                        </div>

                    </div>


                    {/* ==================================================
                        QUESTION ACTIONS
                    ================================================== */}

                    <div className="question-actions">


                        <button
                            type="button"
                            className="previous-button"
                            onClick={
                                goToPreviousQuestion
                            }
                            disabled={
                                currentQuestionIndex === 0
                            }
                        >

                            <ChevronLeft
                                size={19}
                            />

                            Previous

                        </button>


                        {currentQuestionIndex <
                            questions.length - 1 ? (

                            <button
                                type="button"
                                className="next-button"
                                onClick={
                                    goToNextQuestion
                                }
                            >

                                Next

                                <ChevronRight
                                    size={19}
                                />

                            </button>

                        ) : (

                            <button
                                type="button"
                                className="submit-button"
                                onClick={
                                    openSubmitModal
                                }
                                disabled={
                                    submitting
                                }
                            >

                                <Send
                                    size={18}
                                />

                                Submit Exam

                            </button>

                        )}

                    </div>

                </main>


                {/* ==================================================
                    QUESTION NAVIGATION
                ================================================== */}

                <aside className="question-navigation">

                    <div className="navigation-header">

                        <h3>
                            Questions
                        </h3>

                        <span>

                            {answeredCount}/
                            {questions.length}

                        </span>

                    </div>


                    <div className="question-number-grid">

                        {questions.map(
                            (
                                question,
                                index
                            ) => {

                                const isAnswered =
                                    answers[
                                        question.id
                                    ] !== undefined;


                                const isCurrent =
                                    index ===
                                    currentQuestionIndex;


                                return (

                                    <button
                                        key={
                                            question.id
                                        }
                                        type="button"
                                        className={`
                                            question-number
                                            ${isCurrent ? "current" : ""}
                                            ${isAnswered ? "answered" : ""}
                                        `}
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


                    {/* ==================================================
                        LEGEND
                    ================================================== */}

                    <div className="navigation-legend">

                        <div>

                            <span
                                className="legend-box current-box"
                            ></span>

                            Current

                        </div>


                        <div>

                            <span
                                className="legend-box answered-box"
                            ></span>

                            Answered

                        </div>


                        <div>

                            <span
                                className="legend-box unanswered-box"
                            ></span>

                            Unanswered

                        </div>

                    </div>

                </aside>

            </div>


            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (

                <div className="submit-error">

                    <AlertTriangle
                        size={18}
                    />

                    {error}

                </div>

            )}


            {/* ==================================================
                SUBMIT MODAL
            ================================================== */}

            {showSubmitModal && (

                <div className="submit-modal-overlay">

                    <div className="submit-modal">


                        <div className="modal-icon">

                            <AlertTriangle
                                size={28}
                            />

                        </div>


                        <h2>
                            Submit Examination?
                        </h2>


                        <p>

                            You have answered{" "}

                            <strong>
                                {answeredCount}
                            </strong>

                            {" "}of{" "}

                            <strong>
                                {questions.length}
                            </strong>

                            {" "}questions.

                        </p>


                        {answeredCount <
                            questions.length && (

                            <p className="unanswered-warning">

                                You still have unanswered
                                questions. Are you sure
                                you want to submit?

                            </p>

                        )}


                        <div className="modal-actions">


                            <button
                                type="button"
                                onClick={
                                    closeSubmitModal
                                }
                                disabled={
                                    submitting
                                }
                            >

                                Continue Exam

                            </button>


                            <button
                                type="button"
                                className="confirm-submit"
                                onClick={
                                    submitExam
                                }
                                disabled={
                                    submitting
                                }
                            >

                                {submitting
                                    ? "Submitting..."
                                    : "Yes, Submit"}

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

}


export default TakeExam;