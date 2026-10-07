import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../pages/services/api";
import "../../css/student/exams.css";

function AvailableExams() {

    const navigate = useNavigate();

    const [exams, setExams] = useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {

        fetchAvailableExams();

    }, []);

    async function fetchAvailableExams() {

        try {

            setLoading(true);
            setError("");

            const token =
                localStorage.getItem("token");

            const response = await api.get(
                "/exams/student/available",
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            setExams(
                response.data.exams || []
            );

        } catch (error) {

            console.log(
                "Available exams error:",
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
                    "Unable to load available examinations."
                );
            }

        } finally {

            setLoading(false);
        }
    }

    function handleViewExam(examId) {

        navigate(
            `/student/exam/${examId}/instructions`
        );
    }

    if (loading) {

        return (
            <div className="exams-page">

                <div className="exams-loading">
                    Loading available examinations...
                </div>

            </div>
        );
    }

    return (

        <div className="exams-page">

            <div className="exams-header">

                <h2>
                    Available Examinations
                </h2>

                <p>
                    Select an examination to view
                    its details and instructions.
                </p>

            </div>

            {error && (

                <div className="exams-error">
                    {error}
                </div>

            )}

            {!error && exams.length === 0 && (

                <div className="no-exams">

                    <h3>
                        No Examinations Available
                    </h3>

                    <p>
                        There are currently no
                        examinations available for you.
                    </p>

                </div>

            )}

            <div className="exam-list">

                {exams.map((exam) => (

                    <div
                        className="exam-card"
                        key={exam.id}
                    >

                        <div className="exam-card-content">

                            <h3>
                                {exam.title}
                            </h3>

                            <div className="exam-details">

                                <div>
                                    <span>
                                        Academic Year
                                    </span>

                                    <strong>
                                        {exam.academic_year ||
                                            "Not specified"}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Duration
                                    </span>

                                    <strong>
                                        {exam.duration_minutes} Minutes
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Questions
                                    </span>

                                    <strong>
                                        {exam.total_questions}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Pass Mark
                                    </span>

                                    <strong>
                                        {exam.pass_mark}
                                    </strong>
                                </div>

                            </div>

                        </div>

                        <div className="exam-card-action">

                            <button
                                type="button"
                                onClick={() =>
                                    handleViewExam(
                                        exam.id
                                    )
                                }
                            >
                                View Examination
                            </button>

                        </div>

                    </div>

                ))}

            </div>

        </div>
    );
}

export default AvailableExams;