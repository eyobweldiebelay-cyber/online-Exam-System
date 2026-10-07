import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./css/global.css";

import { AuthProvider } from "./context/AuthContext";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <AuthProvider>
            <App />
        </AuthProvider>
    </StrictMode>
);