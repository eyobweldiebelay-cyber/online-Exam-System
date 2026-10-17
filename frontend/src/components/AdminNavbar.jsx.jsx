
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminNavbar({
    pageTitle = "Dashboard",
    isDark = false,
    onToggleTheme,
    onToggleSidebar,
}) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const displayName =
        user?.first_name ||
        user?.username ||
        user?.name ||
        "Administrator";

    const avatarLetter = displayName.charAt(0).toUpperCase();

    function handleLogout() {
        logout();
        navigate("/login", { replace: true });
    }

    return (
        <header className="admin-navbar">
            <div className="admin-navbar__left">
                <button
                    type="button"
                    className="admin-navbar__menu"
                    onClick={onToggleSidebar}
                    aria-label="Toggle navigation menu"
                    title="Toggle navigation menu"
                >
                    <span />
                    <span />
                    <span />
                </button>

                <div className="admin-navbar__heading">
                    <span className="admin-navbar__eyebrow">
                        INJIBARA UNIVERSITY
                    </span>
                    <h1>{pageTitle}</h1>
                </div>
            </div>

            <div className="admin-navbar__actions">
                <button
                    type="button"
                    className="admin-navbar__theme"
                    onClick={onToggleTheme}
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
                    <span className="admin-navbar__theme-label">
                        {isDark ? "Light" : "Dark"}
                    </span>
                </button>

                <div className="admin-navbar__identity">
                    <div className="admin-navbar__avatar">
                        {avatarLetter}
                    </div>

                    <div className="admin-navbar__user">
                        <strong>{displayName}</strong>
                        <span>Administrator</span>
                    </div>
                </div>

                <button
                    type="button"
                    className="admin-navbar__logout"
                    onClick={handleLogout}
                    title="Log out of your account"
                >
                    <span aria-hidden="true">↪</span>
                    <span>Logout</span>
                </button>
            </div>
        </header>
    );
}
