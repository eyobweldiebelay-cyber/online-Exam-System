
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    GraduationCap,
    Users,
    UserCheck,
    UserX,
    ShieldCheck,
    Settings,
    Upload,
    ArrowUpRight,
    RefreshCw,
    AlertCircle,
} from "lucide-react";

import api from "../services/api";
import { getAllTeachers } from "../services/teacher";
import "../../css/admin/dashboard.css";

const emptyStats = {
    students: null,
    activeStudents: null,
    teachers: null,
    activeTeachers: null,
};

function extractList(response, preferredKey) {
    const data = response?.data ?? response;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.[preferredKey])) return data[preferredKey];
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.data?.[preferredKey])) {
        return data.data[preferredKey];
    }

    return null;
}

function isActive(record) {
    if (typeof record?.is_active === "boolean") {
        return record.is_active;
    }

    if (record?.is_active === 1 || record?.is_active === "1") {
        return true;
    }

    if (record?.is_active === 0 || record?.is_active === "0") {
        return false;
    }

    if (typeof record?.isActive === "boolean") {
        return record.isActive;
    }

    if (typeof record?.isActive === "number") {
        return record.isActive === 1;
    }

    return String(record?.status ?? "").toLowerCase() === "active";
}

function getErrorMessage(error) {
    return (
        error?.response?.data?.message ||
        error?.message ||
        "Unable to load this information."
    );
}

export default function Dashboard() {
    const navigate = useNavigate();

    const [stats, setStats] = useState(emptyStats);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        setErrors([]);

        const nextStats = { ...emptyStats };
        const nextErrors = [];

        try {
            const [studentResult, teacherResult] =
                await Promise.allSettled([
                    api.get("/students"),
                    getAllTeachers(),
                ]);

            if (studentResult.status === "fulfilled") {
                const students = extractList(
                    studentResult.value,
                    "students"
                );

                if (students) {
                    nextStats.students = students.length;
                    nextStats.activeStudents =
                        students.filter(isActive).length;
                } else {
                    nextErrors.push(
                        "Student data was returned in an unexpected format."
                    );
                }
            } else {
                nextErrors.push(
                    `Students: ${getErrorMessage(studentResult.reason)}`
                );
            }

            if (teacherResult.status === "fulfilled") {
                const teachers = extractList(
                    teacherResult.value,
                    "teachers"
                );

                if (teachers) {
                    nextStats.teachers = teachers.length;
                    nextStats.activeTeachers =
                        teachers.filter(isActive).length;
                } else {
                    nextErrors.push(
                        "Teacher data was returned in an unexpected format."
                    );
                }
            } else {
                nextErrors.push(
                    `Teachers: ${getErrorMessage(teacherResult.reason)}`
                );
            }

            setStats(nextStats);
            setErrors(nextErrors);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const inactiveAccounts =
        stats.students === null || stats.teachers === null
            ? null
            : Math.max(
                  0,
                  stats.students - (stats.activeStudents ?? 0)
              ) +
              Math.max(
                  0,
                  stats.teachers - (stats.activeTeachers ?? 0)
              );

    const statisticCards = [
        {
            title: "Student Accounts",
            value: stats.students,
            description: "Registered student accounts",
            icon: GraduationCap,
            color: "blue",
            path: "/admin/students",
        },
        {
            title: "Active Students",
            value: stats.activeStudents,
            description: "Currently active students",
            icon: UserCheck,
            color: "green",
            path: "/admin/students",
        },
        {
            title: "Teacher Accounts",
            value: stats.teachers,
            description: "Registered teacher accounts",
            icon: Users,
            color: "purple",
            path: "/admin/teachers",
        },
        {
            title: "Inactive Accounts",
            value: inactiveAccounts,
            description: "Inactive student and teacher accounts",
            icon: UserX,
            color: "orange",
            path: "/admin/teachers",
        },
    ];

    const quickActions = [
        {
            title: "Manage Students",
            description: "Review accounts and reset student passwords.",
            icon: GraduationCap,
            path: "/admin/students",
            color: "blue",
        },
        {
            title: "Manage Teachers",
            description: "Create teacher accounts and manage access.",
            icon: Users,
            path: "/admin/teachers",
            color: "purple",
        },
        {
            title: "Import Students",
            description: "Register students using the import page.",
            icon: Upload,
            path: "/admin/student-import",
            color: "green",
        },
        {
            title: "Maintenance Mode",
            description: "Manage system maintenance settings.",
            icon: Settings,
            path: "/admin/maintenance",
            color: "orange",
        },
    ];

    return (
        <main className="system-dashboard">
            {/* Compact refresh control: no large dashboard header */}
            <div className="system-dashboard__toolbar">
                <span className="system-dashboard__status">
                    <span
                        className={`system-dashboard__status-dot ${
                            loading ? "is-loading" : ""
                        }`}
                    />
                    {loading ? "Updating account data" : "Account data"}
                </span>

                <button
                    type="button"
                    className="system-dashboard__refresh"
                    onClick={loadDashboard}
                    disabled={loading}
                    aria-label="Refresh account data"
                    title="Refresh account data"
                >
                    <RefreshCw
                        size={17}
                        className={loading ? "system-dashboard__spinning" : ""}
                    />
                    Refresh
                </button>
            </div>

            {errors.length > 0 && (
                <section
                    className="system-dashboard__error"
                    role="alert"
                >
                    <AlertCircle size={20} />

                    <div>
                        <strong>Some account information could not load.</strong>

                        {errors.map((message, index) => (
                            <p key={`${index}-${message}`}>{message}</p>
                        ))}

                        <button
                            type="button"
                            onClick={loadDashboard}
                            disabled={loading}
                        >
                            Try again
                        </button>
                    </div>
                </section>
            )}

            {/* Account statistic cards */}
            <section
                className="system-dashboard__stats"
                aria-label="Account statistics"
            >
                {statisticCards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <button
                            type="button"
                            key={card.title}
                            className={`system-dashboard__stat-card card--${card.color}`}
                            onClick={() => navigate(card.path)}
                        >
                            <div className="system-dashboard__card-top">
                                <span className="system-dashboard__stat-icon">
                                    <Icon size={25} />
                                </span>

                                <span className="system-dashboard__card-arrow">
                                    <ArrowUpRight size={19} />
                                </span>
                            </div>

                            <span className="system-dashboard__stat-title">
                                {card.title}
                            </span>

                            <strong className="system-dashboard__stat-value">
                                {card.value === null
                                    ? loading
                                        ? "..."
                                        : "—"
                                    : card.value.toLocaleString()}
                            </strong>

                            <span className="system-dashboard__stat-description">
                                {card.description}
                            </span>

                            <span className="system-dashboard__card-footer">
                                View details <ArrowUpRight size={15} />
                            </span>
                        </button>
                    );
                })}
            </section>

            {/* Clickable administration cards */}
            <section
                className="system-dashboard__actions-section"
                aria-label="Administration actions"
            >
                <div className="system-dashboard__section-label">
                    <span className="system-dashboard__section-line" />
                    <span>ADMINISTRATION</span>
                    <span className="system-dashboard__section-line" />
                </div>

                <div className="system-dashboard__actions">
                    {quickActions.map((action) => {
                        const Icon = action.icon;

                        return (
                            <button
                                type="button"
                                key={action.title}
                                className={`system-dashboard__action action--${action.color}`}
                                onClick={() => navigate(action.path)}
                            >
                                <div className="system-dashboard__action-top">
                                    <span className="system-dashboard__action-icon">
                                        <Icon size={26} />
                                    </span>

                                    <span className="system-dashboard__action-arrow">
                                        <ArrowUpRight size={20} />
                                    </span>
                                </div>

                                <strong className="system-dashboard__action-title">
                                    {action.title}
                                </strong>

                                <span className="system-dashboard__action-description">
                                    {action.description}
                                </span>

                                <span className="system-dashboard__action-footer">
                                    Open section <ArrowUpRight size={15} />
                                </span>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Responsibilities presented as a card */}
            <section className="system-dashboard__responsibility">
                <span className="system-dashboard__responsibility-icon">
                    <ShieldCheck size={27} />
                </span>

                <div>
                    <span className="system-dashboard__responsibility-label">
                        ROLE & ACCESS
                    </span>

                    <h2>System responsibilities</h2>

                    <p>
                        Admin manages student and teacher accounts and
                        system maintenance. The Academic Dean manages
                        academic setup, questions, examinations, and
                        academic results. Teacher and Student access
                        remains role-restricted.
                    </p>
                </div>
            </section>
        </main>
    );
}
