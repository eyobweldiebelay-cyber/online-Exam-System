import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../../pages/services/api";
import "../../css/student/exam.css";

function ExamInstructions() {

    const { examId } = useParams();

    const navigate = useNavigate();

    const [exam, setExam] = useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {

        fetchExam();

    }, [examId]);

    async function fetchExam() {

        try {

            setLoading(true);
            setError("");

            const token =
                localStorage.getItem("token");

            const response = await api.get(
                `/exams/${examId}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            setExam(
                response.data.exam
            );

        } catch (error) {

            console.log(
                "Exam details error:",
                error.response?.data
            );

            if (
                error.response?.data?.message
            ) {

                setError(
                    error.response.data.message
                );

            } else {

                setError(
                    "Unable to load examination details."
                );
            }

        } finally {

            setLoading(false);
        }
    }

    function handleStartExam() {

        navigate(
            `/student/exam/${examId}/take`
        );
    }

    function handleBack() {

        navigate("/student");
    }

    if (loading) {

        return (
            <div className="instructions-page">

                <div className="instructions-loading">
                    Loading examination details...
                </div>

            </div>
        );
    }

    if (error) {

        return (
            <div className="instructions-page">

                <div className="instructions-error">

                    <h2>
                        Unable to Load Examination
                    </h2>

                    <p>
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={handleBack}
                    >
                        Back to Examinations
                    </button>

                </div>

            </div>
        );
    }

    if (!exam) {

        return (
            <div className="instructions-page">

                <div className="instructions-error">

                    <h2>
                        Examination Not Found
                    </h2>

                    <button
                        type="button"
                        onClick={handleBack}
                    >
                        Back to Examinations
                    </button>

                </div>

            </div>
        );
    }

    return (

        <div className="instructions-page">

            <div className="instructions-card">

                <div className="instructions-header">

                    <h2>
                        EXAM INSTRUCTIONS
                    </h2>

                    <p>
                        Please read the following
                        information carefully before
                        starting your examination.
                    </p>

                </div>


                <div className="exam-information">

                    <div className="information-item">

                        <span>
                            Exam
                        </span>

                        <strong>
                            {exam.title}
                        </strong>

                    </div>


                    <div className="information-item">

                        <span>
                            Department
                        </span>

                        <strong>
                            {exam.department_name}
                        </strong>

                    </div>


                    <div className="information-item">

                        <span>
                            Academic Year
                        </span>

                        <strong>
                            {exam.academic_year}
                        </strong>

                    </div>


                    <div className="information-item">

                        <span>
                            Duration
                        </span>

                        <strong>
                            {exam.duration_minutes} Minutes
                        </strong>

                    </div>


                    <div className="information-item">

                        <span>
                            Questions
                        </span>

                        <strong>
                            {exam.total_questions}
                        </strong>

                    </div>


                    <div className="information-item">

                        <span>
                            Pass Mark
                        </span>

                        <strong>
                            {exam.pass_mark}%
                        </strong>

                    </div>

                </div>


                <div className="instructions-section">

                    <h3>
                        Instructions
                    </h3>

                    <ul>

                        <li>
                            Read each question
                            carefully before answering.
                        </li>

                        <li>
                            Complete the examination
                            within the given time.
                        </li>

                        <li>
                            Questions may appear in
                            randomized order.
                        </li>

                        <li>
                            Do not refresh or leave the
                            examination unnecessarily.
                        </li>

                        <li>
                            Once submitted, the
                            examination cannot be changed.
                        </li>

                        <li>
                            Make sure you submit your
                            examination before the timer
                            reaches zero.
                        </li>

                    </ul>

                </div>


                <div className="instructions-warning">

                    <strong>
                        Important
                    </strong>

                    <p>
                        Once you start the examination,
                        the timer will begin. Make sure
                        you are ready before clicking
                        Start Exam.
                    </p>

                </div>


                <div className="instructions-actions">

                    <button
                        type="button"
                        className="back-button"
                        onClick={handleBack}
                    >
                        Back
                    </button>

                    <button
                        type="button"
                        className="start-exam-button"
                        onClick={handleStartExam}
                    >
                        Start Exam
                    </button>

                </div>

            </div>

        </div>
    );
}

export default ExamInstructions;