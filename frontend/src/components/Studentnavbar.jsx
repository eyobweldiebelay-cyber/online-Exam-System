
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    LockKeyhole,
    LogOut,
    Sun,
    Moon,
} from "lucide-react";

import "../css/student/studentnavbar.css";
import imagelog from "../image/logo.jpg";

function StudentNavbar() {
    const navigate = useNavigate();

    // Get logged-in student information
    const user = (() => {
        try {
            return JSON.parse(localStorage.getItem("user")) || {};
        } catch {
            return {};
        }
    })();

    const studentId = user.username || "Student";
    const profileLetter = studentId.charAt(0).toUpperCase();

    // Restore the saved navbar theme
    const [theme, setTheme] = useState(
        () => localStorage.getItem("student-theme") || "light"
    );

    // Apply the theme attribute to the document
    useEffect(() => {
        document.documentElement.dataset.theme = theme;
    }, [theme]);

    // Toggle navbar light/dark mode
    function handleThemeToggle() {
        const nextTheme = theme === "light" ? "dark" : "light";

        setTheme(nextTheme);
        localStorage.setItem("student-theme", nextTheme);
    }

    // Navigate to the existing change-password page
    function handleChangePassword() {
        navigate("/change-password");
    }

    // Log out the student
    function handleLogout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", { replace: true });
    }

    return (
        <header className="student-navbar">
            <div className="student-navbar-left">
                <img
                    src={imagelog}
                    alt="College Logo"
                    className="college-logo"
                />

                <h1>Online Examination System</h1>
            </div>

            <div className="student-navbar-actions">
                <div className="student-profile" title={studentId}>
                    <span className="student-profile-circle">
                        {profileLetter}
                    </span>

                    <span className="student-id">
                        {studentId}
                    </span>
                </div>

                <button
                    type="button"
                    className="student-navbar-action"
                    onClick={handleChangePassword}
                    title="Change Password"
                >
                    <LockKeyhole size={18} />
                    <span>Change Password</span>
                </button>

                <button
                    type="button"
                    className="student-navbar-action theme-toggle"
                    onClick={handleThemeToggle}
                    title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                    aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                >
                    {theme === "light" ? (
                        <Moon size={19} />
                    ) : (
                        <Sun size={19} />
                    )}

                    <span>
                        {theme === "light" ? "Dark Mode" : "Light Mode"}
                    </span>
                </button>

                <button
                    type="button"
                    className="student-navbar-action logout-button"
                    onClick={handleLogout}
                    title="Logout"
                >
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </header>
    );
}

export default StudentNavbar;
