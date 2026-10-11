import { useEffect, useState } from "react";
import {
    Building2,
    GraduationCap,
    Users,
    FileText,
    HelpCircle,
    ClipboardCheck
} from "lucide-react";

import api from "../../pages/services/api";
import "../../css/admin/dashboard.css";

function AdminDashboard() {

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

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {

        try {

            setLoading(true);
            setError("");

            const [
                departmentsResponse,
                programsResponse,
                studentsResponse,
                examsResponse,
                questionsResponse,
                resultsResponse
            ] = await Promise.all([
                api.get("/departments"),
                api.get("/programs"),
                api.get("/students"),
                api.get("/exams"),
                api.get("/questions"),
                api.get("/results/admin")
            ]);

            setStats({
                departments:
                    departmentsResponse.data.departments?.length ||
                    departmentsResponse.data.data?.length ||
                    0,

                programs:
                    programsResponse.data.programs?.length ||
                    programsResponse.data.data?.length ||
                    0,

                students:
                    studentsResponse.data.students?.length ||
                    studentsResponse.data.data?.length ||
                    0,

                exams:
                    examsResponse.data.exams?.length ||
                    examsResponse.data.data?.length ||
                    0,

                questions:
                    questionsResponse.data.questions?.length ||
                    questionsResponse.data.data?.length ||
                    0,

                results:
                    resultsResponse.data.results?.length ||
                    resultsResponse.data.data?.length ||
                    0
            });

        } catch (err) {

            console.error(
                "Admin dashboard error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to load dashboard data."
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
            className: "admin-card-blue"
        },
        {
            title: "Programs",
            value: stats.programs,
            icon: GraduationCap,
            className: "admin-card-green"
        },
        {
            title: "Students",
            value: stats.students,
            icon: Users,
            className: "admin-card-purple"
        },
        {
            title: "Examinations",
            value: stats.exams,
            icon: ClipboardCheck,
            className: "admin-card-orange"
        },
        {
            title: "Questions",
            value: stats.questions,
            icon: HelpCircle,
            className: "admin-card-red"
        },
        {
            title: "Results",
            value: stats.results,
            icon: FileText,
            className: "admin-card-teal"
        }
    ];

    return (
        <div className="admin-dashboard">

            <div className="admin-dashboard-header">

                <div>
                    <h1>
                        Admin Dashboard
                    </h1>

                    <p>
                        Manage the college examination system.
                    </p>
                </div>

            </div>

            {error && (
                <div className="admin-dashboard-error">
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
                            <div
                                className={`admin-stat-card ${card.className}`}
                                key={card.title}
                            >

                                <div className="admin-stat-icon">
                                    <Icon size={24} />
                                </div>

                                <div className="admin-stat-content">

                                    <span>
                                        {card.title}
                                    </span>

                                    <strong>
                                        {card.value}
                                    </strong>

                                </div>

                            </div>
                        );
                    })}

                </div>
            )}

        </div>
    );
}

export default AdminDashboard;