
import { useState } from "react";
import { Link } from "react-router-dom";
import "../css/PublicNavbar.css";
import imagelogo from "../image/logo.jpg"

function PublicNavbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(
        document.documentElement.dataset.theme === "dark"
    );

    const toggleTheme = () => {
        const nextTheme = darkMode ? "light" : "dark";

        document.documentElement.dataset.theme = nextTheme;
        setDarkMode(!darkMode);
    };

    const closeMenu = () => setMenuOpen(false);

    return (
        <header className="public-navbar">
            <div className="public-navbar-container">
                {/* College logo and name */}
                <Link
                    to="/"
                    className="public-brand"
                    onClick={closeMenu}
                    aria-label="Future College home"
                >
                    <img
                        src={imagelogo}
                        alt="Future College logo"
                        className="public-brand-logo"
                    />

                    <span className="public-brand-text">
                        <strong>INJIBARA UNIVERSITY</strong>
                        <small>Online Examination System</small>
                    </span>
                </Link>

                {/* Mobile menu button */}
                <button
                    type="button"
                    className="public-menu-toggle"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label={menuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={menuOpen}
                >
                    {menuOpen ? "✕" : "☰"}
                </button>

                {/* Public navigation links */}
                <nav
                    className={`public-nav-links ${
                        menuOpen ? "public-nav-open" : ""
                    }`}
                >
                    <a href="/#home" onClick={closeMenu}>
                        Home
                    </a>

                    <a href="/#about" onClick={closeMenu}>
                        About Us
                    </a>

                    <Link
                        to="/login"
                        className="public-login-button"
                        onClick={closeMenu}
                    >
                        Login
                    </Link>

                    <button
                        type="button"
                        className="public-theme-toggle"
                        onClick={toggleTheme}
                        aria-label={
                            darkMode
                                ? "Switch to light mode"
                                : "Switch to dark mode"
                        }
                        title={
                            darkMode
                                ? "Switch to light mode"
                                : "Switch to dark mode"
                        }
                    >
                        {darkMode ? "☀️ Light" : "🌙 Dark"}
                    </button>
                </nav>
            </div>
        </header>
    );
}

export default PublicNavbar;