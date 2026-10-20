
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/teacher/teacher-navbar.css";
import imagelog from "../image/logo.jpg";

export default function TeacherNavbar({
  pageTitle = "Teacher Dashboard",
}) {
  const navigate = useNavigate();

  const [userName, setUserName] = useState("Teacher");
  const [userRole, setUserRole] = useState("Teacher");

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    const storedUser =
      localStorage.getItem("user") ||
      sessionStorage.getItem("user");

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);

        setUserName(
          user.full_name ||
          user.name ||
          user.username ||
          "User"
        );

        const role = String(user.role || "Teacher").toLowerCase();

        setUserRole(
          role === "admin" || role === "administrator"
            ? "Administrator"
            : role === "academic_dean"
            ? "Academic Dean"
            : role === "student"
            ? "Student"
            : "Teacher"
        );
      } catch {
        setUserName("User");
      }
    }

    const savedTheme = localStorage.getItem("theme");
    const initialDark =
      savedTheme === "dark" ||
      (!savedTheme &&
        document.documentElement.classList.contains("dark"));

    setDarkMode(initialDark);
    document.documentElement.classList.toggle("dark", initialDark);
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

  const initial = userName.trim().charAt(0).toUpperCase() || "U";

  return (
    <header className="teacher-navbar">
      <div className="teacher-navbar-brand">
        <img
          src={imagelog}
          alt="Injibara University logo"
          className="teacher-navbar-logo"
        />

        <div className="teacher-navbar-brand-text">
          <span className="teacher-navbar-college">
            Injibara University
          </span>

          <span className="teacher-navbar-page-title">
            {pageTitle}
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

        <div className="teacher-navbar-user" title={userName}>
          <div className="teacher-navbar-avatar">{initial}</div>

          <div className="teacher-navbar-user-details">
            <span className="teacher-navbar-user-name">
              {userName}
            </span>
            <span className="teacher-navbar-user-role">
              {userRole}
            </span>
          </div>
        </div>

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
