
import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import { useAuth } from "../context/AuthContext";
import "../css/admin/AdminLayout.css";
import imagelogo from "../image/logo.jpg"

const pageTitles = [
    {
        path: "/admin",
        title: "Dashboard",
        subtitle: "Overview of your examination system",
    },
    {
        path: "/admin/programs",
        title: "Programs",
        subtitle: "Manage academic programs",
    },
    {
        path: "/admin/departements",
        title: "Departments",
        subtitle: "Manage departments and academic structure",
    },
    {
        path: "/admin/students",
        title: "Student Management",
        subtitle: "Manage student records and accounts",
    },
    {
        path: "/admin/questions",
        title: "Question Bank",
        subtitle: "Review and manage examination questions",
    },
    {
        path: "/admin/exams/create",
        title: "Create Exam",
        subtitle: "Configure a new examination",
    },
    {
        path: "/admin/exams",
        title: "Exam Management",
        subtitle: "Create, manage, and review examinations",
    },
    {
        path: "/admin/results",
        title: "Results",
        subtitle: "Review examination results",
    },
    {
        path: "/admin/student-import",
        title: "Student Import",
        subtitle: "Import student accounts from a file",
    },
    {
        path: "/admin/MaintenanceControl",
        title: "Maintenance Mode",
        subtitle: "Manage system maintenance settings",
    },
    {
        path: "/admin/teachers",
        title: "Teacher Management",
        subtitle: "Manage teacher accounts and department assignments",
    },
];

function getPageInfo(pathname) {
    if (pathname.includes("/exams/") && pathname.includes("/questions")) {
        return {
            title: "Exam Questions",
            subtitle: "Manage the questions attached to this examination",
        };
    }

    if (pathname.includes("/exams/edit/")) {
        return {
            title: "Edit Exam",
            subtitle: "Update examination details",
        };
    }

    const match = pageTitles.find((page) =>
        page.path === "/admin"
            ? pathname === "/admin"
            : pathname === page.path ||
              pathname.startsWith(`${page.path}/`)
    );

    return (
        match || {
            title: "Administration",
            subtitle: "Future College examination management",
        }
    );
}

function AdminLayout() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [isDark, setIsDark] = useState(() => {
        try {
            return localStorage.getItem("admin-theme") === "dark";
        } catch {
            return false;
        }
    });

    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const pageInfo = getPageInfo(location.pathname);

    const displayName =
        user?.first_name ||
        user?.username ||
        user?.name ||
        "Administrator";

    const avatarLetter = displayName.charAt(0).toUpperCase();

    useEffect(() => {
        document.documentElement.dataset.adminTheme = isDark
            ? "dark"
            : "light";

        document.body.dataset.adminTheme = isDark ? "dark" : "light";

        try {
            localStorage.setItem("admin-theme", isDark ? "dark" : "light");
        } catch {
            // Theme remains usable for the current session.
        }
    }, [isDark]);

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    function handleLogout() {
        logout();
        navigate("/login", { replace: true });
    }

    return (
        <div
            className={`admin-layout ${
                isDark ? "admin-layout--dark" : "admin-layout--light"
            }`}
        >
            <AdminSidebar
                mobileOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
            />

            <div className="admin-layout__main">
                <header className="admin-layout__topbar">
                    <div className="admin-layout__topbar-left">
                        <button
                            type="button"
                            className="admin-layout__menu-button"
                            onClick={() => setMobileMenuOpen(true)}
                            aria-label="Open navigation menu"
                            title="Open navigation menu"
                        >
                            <svg
                                width="22"
                                height="22"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            >
                                <path d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        <img
                            src={imagelogo}
                            alt="Future College logo"
                            className="admin-layout__college-logo"
                        />

                        <div className="admin-layout__breadcrumb">
                            <span>Admin Portal</span>
                            <span className="admin-layout__breadcrumb-separator">
                                /
                            </span>
                            <strong>{pageInfo.title}</strong>
                        </div>
                    </div>

                    <div className="admin-layout__topbar-right">
                        <div className="admin-layout__system-status">
                            <span className="admin-layout__status-dot" />
                            <span>Examination System</span>
                        </div>

                        <button
                            type="button"
                            className="admin-layout__theme-button"
                            onClick={() => setIsDark((previous) => !previous)}
                            aria-label={
                                isDark
                                    ? "Switch to light mode"
                                    : "Switch to dark mode"
                            }
                            title={
                                isDark
                                    ? "Switch to light mode"
                                    : "Switch to dark mode"
                            }
                        >
                            <span aria-hidden="true">
                                {isDark ? "☀️" : "🌙"}
                            </span>
                            <span>
                                {isDark ? "Light" : "Dark"}
                            </span>
                        </button>

                        <div className="admin-layout__admin-profile">
                            <div
                                className="admin-layout__admin-avatar"
                                title={displayName}
                                aria-label={displayName}
                            >
                                {avatarLetter}
                            </div>

                            <div className="admin-layout__admin-info">
                                <strong>{displayName}</strong>
                                <span>Administrator</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="admin-layout__logout-button"
                            onClick={handleLogout}
                            title="Log out"
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M10 17l5-5-5-5" />
                                <path d="M15 12H3" />
                                <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
                            </svg>
                            <span>Logout</span>
                        </button>
                    </div>
                </header>

                <main className="admin-layout__content">
                    <div className="admin-layout__page-heading">
                        <div>
                            <p className="admin-layout__eyebrow">
                                INJIBARA UNIVERSITY
                            </p>
                            <h1>{pageInfo.title}</h1>
                            <p className="admin-layout__subtitle">
                                {pageInfo.subtitle}
                            </p>
                        </div>
                    </div>

                    <div className="admin-layout__page-content">
                        <Outlet />
                    </div>

                    <footer className="admin-layout__footer">
                        <span>
                            INJIBARA UNIVERSITY· Online Examination System
                        </span>
                        <span>Administration Portal</span>
                    </footer>
                </main>
            </div>
        </div>
    );
}

export default AdminLayout;
