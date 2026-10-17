
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        try {
            return localStorage.getItem("exam-system-theme") || "light";
        } catch {
            return "light";
        }
    });

    useEffect(() => {
        document.documentElement.dataset.theme = theme;

        try {
            localStorage.setItem("exam-system-theme", theme);
        } catch {
            // The theme still works if browser storage is unavailable.
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme((current) =>
            current === "light" ? "dark" : "light"
        );
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error("useTheme must be used inside ThemeProvider");
    }

    return context;
}
