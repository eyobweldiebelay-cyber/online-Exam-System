import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/teacher/teacher-navbar.css";
import imagelog from "../image/logo.jpg";

export default function TeacherNavbar() {
  const navigate = useNavigate();

  const [teacherName, setTeacherName] = useState("Teacher");
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    // Read the logged-in user's information from existing browser storage.
    const storedUser =
      localStorage.getItem("user") ||
      sessionStorage.getItem("user");

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setTeacherName(
          user.full_name ||
          user.name ||
          user.username ||
          "Teacher"
        );
      } catch {
        setTeacherName("Teacher");
      }
    }

    // Apply the initial theme.
    document.documentElement.classList.toggle("dark", darkMode);
  }, []);

  const toggleTheme = () => {
    const nextTheme = !darkMode;

    setDarkMode(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme);
    localStorage.setItem("theme", nextTheme ? "dark" : "light");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    navigate("/login", { replace: true });
  };

  const initial = teacherName.trim().charAt(0).toUpperCase() || "T";

  return (
    <header className="teacher-navbar">
      <div className="teacher-navbar-brand">
        <img
          src={imagelog}
          alt="Future College logo"
          className="teacher-navbar-logo"
        />

        <div className="teacher-navbar-brand-text">
          <span className="teacher-navbar-college">
            Injibara University
          </span>
          <span className="teacher-navbar-subtitle">
            Online Examination System
          </span>
        </div>
      </div>

      <div className="teacher-navbar-actions">
        <button
          type="button"
          className="teacher-theme-button"
          onClick={toggleTheme}
          aria-label={
            darkMode ? "Switch to light mode" : "Switch to dark mode"
          }
          title={darkMode ? "Light mode" : "Dark mode"}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>

        <div className="teacher-navbar-user" title={teacherName}>
          <div className="teacher-navbar-avatar">{initial}</div>
          <span className="teacher-navbar-user-name">
            {teacherName}
          </span>
        </div>

        {/* Change Password */}
        <button
          type="button"
          className="teacher-change-password-button"
          onClick={() => navigate("/change-password")}
          title="Change your password"
        >
          🔑 Change Password
        </button>

        <button
          type="button"
          className="teacher-logout-button"
          onClick={handleLogout}
        >
          <span aria-hidden="true">↪</span>
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}