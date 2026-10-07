import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Download } from "lucide-react";

import "../../css/student/result.css";

function Result() {
    const location = useLocation();
    const navigate = useNavigate();

    const result = location.state?.result;

    if (!result) {
        return (
            <div className="result-page">

                <div className="result-error">

                    <h2>
                        Result Not Found
                    </h2>

                    <p>
                        Your exam result could not be loaded.
                    </p>

                    <button
                        onClick={() => navigate("/student")}
                    >
                        Back to Exams
                    </button>

                </div>

            </div>
        );
    }

    const percentage = Number(result.percentage || 0);

    const isPassed =
        String(result.result_status).toLowerCase() === "pass";

    const completedDate = result.completed_at
        ? new Date(result.completed_at).toLocaleString()
        : "N/A";

    const downloadResult = () => {
        window.print();
    };

    return (
        <div className="result-page">

            {/* NAVBAR */}
            <header className="result-header">

                <div className="result-logo">

                    <span>
                        College Examination System
                    </span>

                </div>

                <h1>
                    EXAM RESULT
                </h1>

            </header>


            {/* RESULT CONTENT */}
            <main className="result-container">

                {/* STUDENT INFORMATION */}
                <section className="result-info">

                    <div className="result-row">
                        <span>
                            Student:
                        </span>

                        <strong>
                            {result.student_name || "N/A"}
                        </strong>
                    </div>


                    <div className="result-row">
                        <span>
                            Student ID:
                        </span>

                        <strong>
                            {result.student_id || "N/A"}
                        </strong>
                    </div>


                    <div className="result-row">
                        <span>
                            Exam:
                        </span>

                        <strong>
                            {result.exam_title || "N/A"}
                        </strong>
                    </div>

                </section>


                {/* MARKS */}
                <section className="marks-section">

                    <div className="mark-item">

                        <span>
                            Total Marks
                        </span>

                        <strong>
                            {result.total_marks}
                        </strong>

                    </div>


                    <div className="mark-item">

                        <span>
                            Obtained Marks
                        </span>

                        <strong>
                            {result.obtained_marks}
                        </strong>

                    </div>

                </section>


                {/* PERFORMANCE */}
                <section className="progress-section">

                    <div className="progress-header">

                        <span>
                            Percentage
                        </span>

                        <strong
                            className={
                                isPassed
                                    ? "pass"
                                    : "fail"
                            }
                        >
                            {percentage}%
                        </strong>

                    </div>


                    <div className="progress-track">

                        <div
                            className={
                                `progress-fill ${
                                    isPassed
                                        ? "progress-pass"
                                        : "progress-fail"
                                }`
                            }
                            style={{
                                width: `${Math.min(
                                    Math.max(percentage, 0),
                                    100
                                )}%`
                            }}
                        />

                    </div>


                    <div
                        className={
                            `result-status ${
                                isPassed
                                    ? "status-pass"
                                    : "status-fail"
                            }`
                        }
                    >
                        {isPassed
                            ? "PASS"
                            : "FAIL"}
                    </div>

                </section>


                {/* COMPLETED */}
                <section className="completed-section">

                    <span>
                        Completed:
                    </span>

                    <strong>
                        {completedDate}
                    </strong>

                </section>


                {/* ACTIONS */}
                <div className="result-actions">

                    <button
                        className="download-result-btn"
                        onClick={downloadResult}
                    >
                        <Download size={18} />
                        Download Result
                    </button>


                    <button
                        className="back-exams-btn"
                        onClick={() =>
                            navigate("/student")
                        }
                    >
                        Back to Exams
                    </button>

                </div>

            </main>

        </div>
    );
}

export default Result;