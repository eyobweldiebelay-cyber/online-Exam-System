
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./css/global.css";
import "./css/theme.css";

import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <AuthProvider>
            <ThemeProvider>
                <App />
            </ThemeProvider>
        </AuthProvider>
    </StrictMode>
);
