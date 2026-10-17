
import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../pages/services/api";

function ProtectedRoute({ allowedRoles, children }) {
    const { user } = useAuth();
    const location = useLocation();
    const token = localStorage.getItem("token");

    const [maintenance, setMaintenance] = useState(null);
    const [maintenanceError, setMaintenanceError] = useState(false);

    const role = String(user?.role || "").toLowerCase();

    const isExistingExamRoute =
        /^\/student\/exam\/[^/]+\/take\/?$/.test(location.pathname);

    useEffect(() => {
        let cancelled = false;

        if (!user || role === "admin") {
            setMaintenance({ enabled: false, message: "" });
            setMaintenanceError(false);
            return () => {
                cancelled = true;
            };
        }

        setMaintenance(null);
        setMaintenanceError(false);

        api.get("/maintenance/status")
            .then((response) => {
                if (cancelled) return;

                setMaintenance(
                    response.data?.maintenance || {
                        enabled: false,
                        message: ""
                    }
                );
            })
            .catch((error) => {
                if (cancelled) return;

                console.error("Unable to check maintenance status:", error);
                setMaintenanceError(true);
            });

        return () => {
            cancelled = true;
        };
    }, [user, role]);

    // Require login.
    if (!token || !user) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location }}
            />
        );
    }

    // Require temporary-password changes before normal access.
    if (
        role === "student" &&
        user.must_change_password &&
        location.pathname !== "/change-password"
    ) {
        return <Navigate to="/change-password" replace />;
    }

    // Enforce role permissions.
    if (
        allowedRoles &&
        !allowedRoles.map((item) => item.toLowerCase()).includes(role)
    ) {
        const home =
            role === "admin"
                ? "/admin"
                : role === "teacher"
                    ? "/teacher"
                    : "/student";

        return <Navigate to={home} replace />;
    }

    // Admin can manage the system during maintenance.
    if (role !== "admin" && location.pathname !== "/change-password") {
        if (maintenanceError) {
            return (
                <main className="maintenance-control">
                    <h2>Unable to Check System Status</h2>
                    <p>
                        The system maintenance status could not be checked.
                        Please try again shortly.
                    </p>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                    >
                        Try Again
                    </button>
                </main>
            );
        }

        if (maintenance === null) {
            return <p role="status">Checking system availability...</p>;
        }

        if (maintenance.enabled) {
            // Do not automatically interrupt an existing exam screen.
            // The backend must verify that the attempt is already in progress.
            if (!(role === "student" && isExistingExamRoute)) {
                return (
                    <main className="maintenance-control">
                        <h2>System Maintenance</h2>
                        <p>
                            {maintenance.message ||
                                "The system is temporarily under maintenance."}
                        </p>
                        <p>
                            Examination services are temporarily unavailable.
                            Please try again later.
                        </p>
                    </main>
                );
            }
        }
    }

    return children || <Outlet />;
}

export default ProtectedRoute;
