
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Building2,
    GraduationCap,
    Users,
    FileText,
    HelpCircle,
    ClipboardCheck
} from "lucide-react";

import api from "../../pages/services/api";
import "../../css/academicdean/dashboard.css";

function AdminDashboard() {
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        departments: 0,
        programs: 0,
        students: 0,
        exams: 0,
        questions: 0,
        results: 0
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const getList = (response, key) => {
        const body = response?.data;

        if (Array.isArray(body)) {
            return body;
        }

        if (Array.isArray(body?.[key])) {
            return body[key];
        }

        if (Array.isArray(body?.data)) {
            return body.data;
        }

        return [];
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        setLoading(true);
        setError("");

        const requests = [
            { key: "departments", url: "/departments" },
            { key: "programs", url: "/programs" },
            { key: "students", url: "/students/count" },
            { key: "exams", url: "/exams" },
            { key: "questions", url: "/questions" },
            { key: "results", url: "/results" }
        ];

        const newStats = {
            departments: 0,
            programs: 0,
            students: 0,
            exams: 0,
            questions: 0,
            results: 0
        };

        try {
            const responses = await Promise.allSettled(
                requests.map(({ url }) => api.get(url))
            );

            const failedRequests = [];

            responses.forEach((result, index) => {
                const request = requests[index];

                if (result.status === "fulfilled") {
                    // Student count endpoint returns { count: number }.
                    if (request.key === "students") {
                        const count = result.value?.data?.count;

                        if (count !== undefined && count !== null) {
                            newStats.students = Number(count);
                        } else {
                            failedRequests.push(
                                `${request.url}: count was not returned`
                            );
                        }

                        return;
                    }

                    newStats[request.key] = getList(
                        result.value,
                        request.key
                    ).length;
                } else {
                    const status =
                        result.reason?.response?.status ??
                        "Network error";

                    const message =
                        result.reason?.response?.data?.message ||
                        result.reason?.message ||
                        "Request failed";

                    failedRequests.push(
                        `${request.url} (${status}): ${message}`
                    );

                    console.error(
                        `Academic Dean dashboard request failed: ${request.url}`,
                        {
                            status,
                            message,
                            response: result.reason?.response?.data
                        }
                    );
                }
            });

            setStats(newStats);

            if (failedRequests.length > 0) {
                console.error(
                    "Failed dashboard requests:",
                    failedRequests
                );

                setError(
                    `Some dashboard data could not be loaded: ${
                        failedRequests.join("; ")
                    }`
                );
            }
        } catch (err) {
            console.error("Academic Dean dashboard error:", err);

            setError(
                "Unable to load dashboard data. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const cards = [
        {
            title: "Departments",
            value: stats.departments,
            icon: Building2,
            className: "admin-card-blue",
            path: "/academic-dean/departements"
        },
        {
            title: "Programs",
            value: stats.programs,
            icon: GraduationCap,
            className: "admin-card-green",
            path: "/academic-dean/programs"
        },
        {
            title: "Students",
            value: stats.students,
            icon: Users,
            className: "admin-card-purple",
            path: "/academic-dean/students"
        },
        {
            title: "Examinations",
            value: stats.exams,
            icon: ClipboardCheck,
            className: "admin-card-orange",
            path: "/academic-dean/exams"
        },
        {
            title: "Questions",
            value: stats.questions,
            icon: HelpCircle,
            className: "admin-card-red",
            path: "/academic-dean/questions"
        },
        {
            title: "Results",
            value: stats.results,
            icon: FileText,
            className: "admin-card-teal",
            path: "/academic-dean/results"
        }
    ];

    return (
        <div className="admin-dashboard">
            <div className="admin-dashboard-header">
                <div>
                    <h1>Academic Dean Dashboard</h1>
                    <p>
                        Manage the college examination system.
                        Select a card to open its management page.
                    </p>
                </div>
            </div>

            {error && (
                <div
                    className="admin-dashboard-error"
                    role="alert"
                >
                    {error}
                </div>
            )}

            {loading ? (
                <div className="admin-dashboard-loading">
                    Loading dashboard...
                </div>
            ) : (
                <div className="admin-stats-grid">
                    {cards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <button
                                type="button"
                                className={`admin-stat-card ${card.className} admin-stat-card-clickable`}
                                key={card.title}
                                onClick={() => navigate(card.path)}
                                aria-label={`Open ${card.title}`}
                                title={`Open ${card.title}`}
                            >
                                <div className="admin-stat-icon">
                                    <Icon size={24} />
                                </div>

                                <div className="admin-stat-content">
                                    <span>{card.title}</span>
                                    <strong>{card.value}</strong>
                                    <small className="admin-stat-action">
                                        View details →
                                    </small>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;
