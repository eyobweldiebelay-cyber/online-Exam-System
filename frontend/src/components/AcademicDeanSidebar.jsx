
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import "../css/academicdean/AdminSidebar.css";

const Icon = ({ name, size = 20 }) => {
    const common = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true,
    };

    const paths = {
        dashboard: (
            <>
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="5" rx="1.5" />
                <rect x="14" y="12" width="7" height="9" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </>
        ),

        academic: (
            <>
                <path d="m2.5 9 9.5-5 9.5 5-9.5 5-9.5-5Z" />
                <path d="M6 11v5c3.5 3 8.5 3 12 0v-5" />
                <path d="M21.5 9v6" />
            </>
        ),

        users: (
            <>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </>
        ),

        questions: (
            <>
                <path d="M8 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8l-6-6H9" />
                <path d="M15 2v6h6" />
                <path d="M8 13h8M8 17h6" />
                <path d="M8 9h2" />
            </>
        ),

        exams: (
            <>
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <path d="M9 3.5h6M8 10h8M8 14h8M8 18h4" />
            </>
        ),

        results: (
            <>
                <path d="M3 3v18h18" />
                <path d="m7 14 4-4 4 3 5-7" />
            </>
        ),

        maintenance: (
            <>
                <path d="M14.7 6.3a5 5 0 0 0-6.6 6.6L3 18l3 3 5.1-5.1a5 5 0 0 0 6.6-6.6L14 13l-3-3 3.7-3.7Z" />
            </>
        ),

        import: (
            <>
                <path d="M12 16V4m-4 4 4-4 4 4" />
                <path d="M4 16v4h16v-4" />
            </>
        ),

        chevron: <path d="m9 18 6-6-6-6" />,

        close: <path d="m18 6-12 12M6 6l12 12" />,
    };

    return <svg {...common}>{paths[name] || paths.dashboard}</svg>;
};

const sections = [
    {
        label: "OVERVIEW",
        items: [
            {
                label: "Dashboard",
                to: "/academic-dean",
                icon: "dashboard",
                end: true,
            },
        ],
    },

    {
        label: "ACADEMIC SETUP",
        items: [
            {
                label: "Programs",
                to: "/academic-dean/programs",
                icon: "academic",
            },
            {
                label: "Departments",
                to: "/academic-dean/departements",
                icon: "academic",
            },
        ],
    },

    {
        label: "EXAMINATION",
        items: [
            {
                label: "Question Bank",
                to: "/academic-dean/questions",
                icon: "questions",
            },
            {
                label: "Exam Management",
                to: "/academic-dean/exams",
                icon: "exams",
            },
            {
                label: "Results",
                to: "/academic-dean/results",
                icon: "results",
            },
        ],
    },

    {
        label: "USER MANAGEMENT",
        items: [
            {
                label: "Students",
                to: "/academic-dean/students",
                icon: "users",
            },
            
            {
                label: "Teacher Assigne",
                to: "/academic-dean/teachers",
                icon: "users",
            },
        ],
    },

  
];

function AcademicDeanSidebar({ mobileOpen = false, onClose = () => {} }) {
    const location = useLocation();
    const [collapsedGroups, setCollapsedGroups] = useState({});

    const toggleGroup = (label) => {
        setCollapsedGroups((previous) => ({
            ...previous,
            [label]: !previous[label],
        }));
    };

    return (
        <>
            {mobileOpen && (
                <button
                    type="button"
                    className="admin-sidebar-backdrop"
                    aria-label="Close navigation menu"
                    onClick={onClose}
                />
            )}

            <aside
                className={`admin-sidebar ${
                    mobileOpen ? "admin-sidebar--mobile-open" : ""
                }`}
                aria-label="Academic Dean navigation"
            >
                <div className="admin-sidebar__brand">
                    <div className="admin-sidebar__logo">
                        <span>INU</span>
                    </div>

                    <div className="admin-sidebar__brand-text">
                        <strong>INJIBARA UNIVERSITY</strong>
                        <span>Examination System</span>
                    </div>

                    <button
                        type="button"
                        className="admin-sidebar__mobile-close"
                        aria-label="Close sidebar"
                        onClick={onClose}
                    >
                        <Icon name="close" />
                    </button>
                </div>

                <div className="admin-sidebar__identity">
                    <div className="admin-sidebar__identity-icon">
                        <Icon name="dashboard" size={19} />
                    </div>

                    <div>
                        <strong>Academic Dean</strong>
                        <span>Academic control panel</span>
                    </div>
                </div>

                <nav className="admin-sidebar__nav">
                    {sections.map((section) => (
                        <div
                            className="admin-sidebar__section"
                            key={section.label}
                        >
                            <button
                                type="button"
                                className="admin-sidebar__section-heading"
                                onClick={() => toggleGroup(section.label)}
                                aria-expanded={!collapsedGroups[section.label]}
                            >
                                <span>{section.label}</span>

                                <span
                                    className={`admin-sidebar__section-chevron ${
                                        collapsedGroups[section.label]
                                            ? "is-collapsed"
                                            : ""
                                    }`}
                                >
                                    <Icon name="chevron" size={14} />
                                </span>
                            </button>

                            {!collapsedGroups[section.label] && (
                                <div className="admin-sidebar__links">
                                    {section.items.map((item) => (
                                        <NavLink
                                            key={item.to}
                                            to={item.to}
                                            end={item.end}
                                            onClick={onClose}
                                            className={({ isActive }) =>
                                                `admin-sidebar__link ${
                                                    isActive
                                                        ? "admin-sidebar__link--active"
                                                        : ""
                                                }`
                                            }
                                        >
                                            <Icon name={item.icon} />
                                            <span>{item.label}</span>

                                            {item.to === "/academic-dean" &&
                                                location.pathname ===
                                                    "/academic-dean" && (
                                                    <span className="admin-sidebar__active-dot" />
                                                )}
                                        </NavLink>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                <div className="admin-sidebar__footer">
                    <div className="admin-sidebar__footer-mark">FC</div>

                    <div>
                        <strong>INJIBARA UNIVERSITY</strong>
                        <span>Academic Examination Portal</span>
                    </div>
                </div>
            </aside>
        </>
    );
}

export default AcademicDeanSidebar;
