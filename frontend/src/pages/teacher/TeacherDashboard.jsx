
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../pages/services/api";
import "../../css/teacher/dashboard.css";

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [summary, setSummary] = useState({
        students: 0,
        questions: 0,
        passed: 0,
        failed: 0,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const departmentName =
        user?.department_name || "My Assigned Department";

    const programName =
        user?.program_name || "My Assigned Program";

    useEffect(() => {
        let isMounted = true;

        const loadDashboardSummary = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get(
                    "/teacher-workspace/dashboard"
                );

                if (isMounted) {
                    setSummary((currentSummary) => ({
                        ...currentSummary,
                        ...(response.data.summary || {}),
                    }));
                }
            } catch (err) {
                if (isMounted) {
                    setError(
                        err.response?.data?.message ||
                        "Unable to load dashboard summary."
                    );

                    console.error(
                        "Teacher dashboard error:",
                        err.response?.data || err.message
                    );
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadDashboardSummary();

        return () => {
            isMounted = false;
        };
    }, []);

    const dashboardCards = [
        {
            title: "Assigned Students",
            count: summary.students,
            description: "View students in your department",
            icon: "👥",
            path: "/teacher/students",
            className: "students",
        },
        {
            title: "Active Questions",
            count: summary.questions,
            description: "Manage your department's questions",
            icon: "📚",
            path: "/teacher/questions",
            className: "questions",
        },
        {
            title: "Students Passed",
            count: summary.passed,
            description: "View students who passed",
            icon: "✓",
            path: "/teacher/results?status=pass",
            className: "passed",
        },
        {
            title: "Students Failed",
            count: summary.failed,
            description: "View students who failed",
            icon: "✕",
            path: "/teacher/results?status=fail",
            className: "failed",
        },
    ];

    return (
        <div className="teacher-dashboard">
            <header className="teacher-dashboard-header">
                <div>
                    <p className="teacher-dashboard-eyebrow">
                        TEACHER WORKSPACE
                    </p>
                    <h1>Teacher Dashboard</h1>
                    <p className="teacher-dashboard-subtitle">
                        Manage your department's questions and monitor
                        student performance.
                    </p>
                </div>

                <div className="teacher-dashboard-profile">
                    <div className="teacher-dashboard-avatar">
                        {(user?.username || user?.name || "T")
                            .charAt(0)
                            .toUpperCase()}
                    </div>
                    <div>
                        <strong>
                            {user?.name || user?.username || "Teacher"}
                        </strong>
                        <span>Teacher</span>
                    </div>
                </div>
            </header>

            <section className="teacher-assignment-card">
                <div className="teacher-assignment-icon">🏫</div>
                <div>
                    <span>YOUR ASSIGNMENT</span>
                    <h2>{departmentName}</h2>
                    <p>{programName}</p>
                </div>
            </section>

            {error && (
                <p role="alert" className="teacher-dashboard-error">
                    {error}
                </p>
            )}

            <section className="teacher-dashboard-section">
                <div className="teacher-section-heading">
                    <div>
                        <h2>Department Overview</h2>
                        <p>
                            Select a card to view its detailed information.
                        </p>
                    </div>
                </div>

                <div className="teacher-dashboard-grid">
                    {dashboardCards.map((card) => (
                        <button
                            type="button"
                            key={card.title}
                            className={`teacher-dashboard-card ${card.className}`}
                            onClick={() => navigate(card.path)}
                            aria-label={`View ${card.title}`}
                        >
                            <div className="teacher-card-top">
                                <span className="teacher-card-icon">
                                    {card.icon}
                                </span>
                                <span className="teacher-card-arrow">
                                    ↗
                                </span>
                            </div>

                            <div className="teacher-card-count">
                                {loading ? "..." : card.count}
                            </div>

                            <h3>{card.title}</h3>
                            <p>{card.description}</p>

                            <span className="teacher-card-link">
                                View details →
                            </span>
                        </button>
                    ))}
                </div>
            </section>

            <section className="teacher-quick-actions">
                <h2>Quick Actions</h2>

                <div className="teacher-quick-actions-list">
                    <button
                        type="button"
                        onClick={() => navigate("/teacher/questions/new")}
                    >
                        <span>📄</span>
                        <div>
                            <strong>Import Questions</strong>
                            <p>Upload a CSV or Excel spreadsheet</p>
                        </div>
                        <span className="teacher-card-arrow">→</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/teacher/students")}
                    >
                        <span>👥</span>
                        <div>
                            <strong>View Assigned Students</strong>
                            <p>See students in your department</p>
                        </div>
                        <span className="teacher-card-arrow">→</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/teacher/results")}
                    >
                        <span>📊</span>
                        <div>
                            <strong>Results & Performance</strong>
                            <p>Review available student results</p>
                        </div>
                        <span className="teacher-card-arrow">→</span>
                    </button>
                </div>
            </section>
        </div>
    );
};

export default TeacherDashboard;
