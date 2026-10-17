
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Download } from "lucide-react";

import { getMyResultByAttempt } from "../services/resultService";
import "../../css/student/result.css";

function Result() {
    const location = useLocation();
    const navigate = useNavigate();
    const { attemptId } = useParams();

    const [result, setResult] = useState(location.state?.result || null);
    const [loading, setLoading] = useState(!location.state?.result);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!attemptId) {
            setError("Attempt ID is missing from the URL.");
            setLoading(false);
            return;
        }

        let cancelled = false;

        const fetchResult = async () => {
            setLoading(true);
            setError("");

            try {
                const response = await getMyResultByAttempt(attemptId);

                if (cancelled) return;

                // Support either a direct result object or a wrapped response.
                const data =
                    response?.result ??
                    response?.data?.result ??
                    response?.data ??
                    response;

                setResult(data);
            } catch (err) {
                if (cancelled) return;

                setError(
                    err.response?.data?.message ||
                    err.message ||
                    "Failed to load your result."
                );
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchResult();

        return () => {
            cancelled = true;
        };
    }, [attemptId]);

    if (loading) {
        return (
            <div className="result-page">
                <div className="result-error">
                    <h2>Loading Result...</h2>
                    <p>Please wait while we retrieve your exam result.</p>
                </div>
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className="result-page">
                <div className="result-error">
                    <h2>Result Not Found</h2>
                    <p>{error || "Your exam result could not be loaded."}</p>
                    <button onClick={() => navigate("/student")}>
                        Back to Exams
                    </button>
                </div>
            </div>
        );
    }

    const studentName =
        result.student_name ??
        result.full_name ??
        result.name ??
        "N/A";

    const studentId =
        result.student_id ??
        result.student_code ??
        "N/A";

    const examTitle =
        result.exam_title ??
        result.exam_name ??
        result.title ??
        "N/A";

    const totalMarks = Number(result.total_marks ?? 0);

    const obtainedMarks = Number(
        result.obtained_marks ??
        result.score ??
        result.marks_obtained ??
        0
    );

    const percentage = Number(result.percentage ?? 0);

    const status = String(
        result.result_status ?? result.status ?? ""
    ).toLowerCase();

    const isPassed = status === "pass";

    const completedAt =
        result.completed_at ??
        result.submitted_at ??
        result.created_at ??
        result.completedAt ??
        null;

    const completedDate = completedAt
        ? new Date(completedAt).toLocaleString()
        : "N/A";

    const downloadResult = () => {
        window.print();
    };

    return (
        <div className="result-page">
            <main className="result-container">
                <section className="result-info">
                    <div className="result-row">
                        <span>Student:</span>
                        <strong>{studentName}</strong>
                    </div>

                    <div className="result-row">
                        <span>Student ID:</span>
                        <strong>{studentId}</strong>
                    </div>

                    <div className="result-row">
                        <span>Exam:</span>
                        <strong>{examTitle}</strong>
                    </div>
                </section>

                <section className="marks-section">
                    <div className="mark-item">
                        <span>Total Marks</span>
                        <strong>{totalMarks}</strong>
                    </div>

                    <div className="mark-item">
                        <span>Obtained Marks</span>
                        <strong>{obtainedMarks}</strong>
                    </div>
                </section>

                <section className="progress-section">
                    <div className="progress-header">
                        <span>Percentage</span>
                        <strong className={isPassed ? "pass" : "fail"}>
                            {percentage}%
                        </strong>
                    </div>

                    <div className="progress-track">
                        <div
                            className={`progress-fill ${
                                isPassed ? "progress-pass" : "progress-fail"
                            }`}
                            style={{
                                width: `${Math.min(
                                    Math.max(percentage, 0),
                                    100
                                )}%`
                            }}
                        />
                    </div>

                    <div
                        className={`result-status ${
                            isPassed ? "status-pass" : "status-fail"
                        }`}
                    >
                        {isPassed ? "PASS" : "FAIL"}
                    </div>
                </section>

                <section className="completed-section">
                    <span>Completed:</span>
                    <strong>{completedDate}</strong>
                </section>

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
                        onClick={() => navigate("/student")}
                    >
                        Back to Exams
                    </button>
                </div>
            </main>
        </div>
    );
}

export default Result;
