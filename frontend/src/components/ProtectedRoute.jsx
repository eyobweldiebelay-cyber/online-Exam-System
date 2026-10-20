import { useEffect, useState } from "react";
import {
    Link,
    Navigate,
    Outlet,
    useLocation,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../pages/services/api";

const MAX_RETRIES = 3;
const COOLDOWN_SECONDS = 60;

function MaintenanceGate({ children, role, pathname }) {
    const [maintenance, setMaintenance] = useState(null);
    const [maintenanceError, setMaintenanceError] = useState(false);
    const [checking, setChecking] = useState(false);

    const storageKey = `maintenance-retries-${role}`;
    const cooldownKey = `maintenance-cooldown-${role}`;

    const [retryCount, setRetryCount] = useState(() => {
        const saved = Number(sessionStorage.getItem(storageKey));
        return Number.isFinite(saved)
            ? Math.min(MAX_RETRIES, Math.max(0, saved))
            : 0;
    });

    const [countdown, setCountdown] = useState(() => {
        const endTime = Number(sessionStorage.getItem(cooldownKey));
        return Number.isFinite(endTime) && endTime > Date.now()
            ? Math.ceil((endTime - Date.now()) / 1000)
            : 0;
    });

    const isExistingExamRoute =
        /^\/student\/exam\/[^/]+\/take\/?$/.test(pathname);

    // Persist retry count for the current browser tab.
    useEffect(() => {
        sessionStorage.setItem(storageKey, String(retryCount));
    }, [retryCount, storageKey]);

    // Maintain the cooldown even if the component re-renders.
    useEffect(() => {
        if (countdown <= 0) return undefined;

        const timer = window.setTimeout(() => {
            const endTime = Number(
                sessionStorage.getItem(cooldownKey)
            );

            const remaining =
                Number.isFinite(endTime) && endTime > Date.now()
                    ? Math.ceil((endTime - Date.now()) / 1000)
                    : 0;

            if (remaining <= 0) {
                setCountdown(0);
                setRetryCount(0);

                sessionStorage.setItem(storageKey, "0");
                sessionStorage.removeItem(cooldownKey);
            } else {
                setCountdown(remaining);
            }
        }, 1000);

        return () => window.clearTimeout(timer);
    }, [countdown, cooldownKey, storageKey]);

    async function checkMaintenanceStatus() {
        const response = await api.get("/maintenance/status");

        const status =
            response.data?.maintenance ??
            response.data ??
            {};

        const result = {
            enabled: Boolean(status.enabled),
            message:
                status.message ||
                "The system is temporarily under maintenance.",
        };

        setMaintenance(result);
        setMaintenanceError(false);

        return result;
    }

    // Initial status check.
    useEffect(() => {
        let cancelled = false;

        async function loadStatus() {
            try {
                const response = await api.get("/maintenance/status");

                if (cancelled) return;

                const status =
                    response.data?.maintenance ??
                    response.data ??
                    {};

                setMaintenance({
                    enabled: Boolean(status.enabled),
                    message:
                        status.message ||
                        "The system is temporarily under maintenance.",
                });

                setMaintenanceError(false);
            } catch (error) {
                if (cancelled) return;

                console.error(
                    "Unable to check maintenance status:",
                    error
                );

                setMaintenanceError(true);
            }
        }

        setMaintenance(null);
        setMaintenanceError(false);
        loadStatus();

        return () => {
            cancelled = true;
        };
    }, [role]);

    async function handleRetry() {
        if (
            checking ||
            countdown > 0 ||
            retryCount >= MAX_RETRIES
        ) {
            return;
        }

        setChecking(true);
        setMaintenanceError(false);

        const nextRetryCount = retryCount + 1;
        setRetryCount(nextRetryCount);

        try {
            const status = await checkMaintenanceStatus();

            if (!status.enabled) {
                setRetryCount(0);
                setCountdown(0);
                sessionStorage.setItem(storageKey, "0");
                sessionStorage.removeItem(cooldownKey);
                return;
            }

            if (nextRetryCount >= MAX_RETRIES) {
                const endTime =
                    Date.now() + COOLDOWN_SECONDS * 1000;

                sessionStorage.setItem(
                    cooldownKey,
                    String(endTime)
                );

                setCountdown(COOLDOWN_SECONDS);
            }
        } catch (error) {
            console.error(
                "Unable to retry maintenance status:",
                error
            );

            setMaintenanceError(true);

            // Apply cooldown after the third failed check as well.
            if (nextRetryCount >= MAX_RETRIES) {
                const endTime =
                    Date.now() + COOLDOWN_SECONDS * 1000;

                sessionStorage.setItem(
                    cooldownKey,
                    String(endTime)
                );

                setCountdown(COOLDOWN_SECONDS);
            }
        } finally {
            setChecking(false);
        }
    }

    if (maintenance === null && !maintenanceError) {
        return (
            <p role="status">
                Checking system availability...
            </p>
        );
    }

    const blocked =
        maintenance?.enabled &&
        !(role === "student" && isExistingExamRoute);

    if (maintenanceError || blocked) {
        const retriesExhausted = retryCount >= MAX_RETRIES;

        return (
            <main
                className="maintenance-control"
                aria-live="polite"
            >
                <h2>
                    {maintenanceError
                        ? "Unable to Check System Status"
                        : "System Maintenance"}
                </h2>

                <p>
                    {maintenanceError
                        ? "The system status could not be checked. Please try again."
                        : maintenance?.message ||
                          "The system is temporarily under maintenance."}
                </p>

                <p>
                    Examination services are temporarily unavailable.
                    Please try again later.
                </p>

                <p>
                    Retry attempts: {retryCount}/{MAX_RETRIES}
                </p>

                {countdown > 0 && (
                    <p role="status">
                        You can try again in {countdown} seconds.
                    </p>
                )}

                {retriesExhausted && countdown === 0 && (
                    <p role="alert">
                        All three retry attempts have been used.
                        Please try again after the cooldown.
                    </p>
                )}

                <button
                    type="button"
                    onClick={handleRetry}
                    disabled={
                        checking ||
                        countdown > 0 ||
                        retriesExhausted
                    }
                >
                    {checking
                        ? "Checking..."
                        : countdown > 0
                            ? `Try Again in ${countdown}s`
                            : retriesExhausted
                                ? "Preparing Retry..."
                                : "Try Again"}
                </button>


<div className="maintenance-login-section">
    <p className="maintenance-login-notice">
        Access restricted: Only the Admin is authorized to log
        in while system maintenance is active. Other users
        cannot access the system during this period.
    </p>

    <Link
        to="/login"
        className="maintenance-login-btn"
    >
        Admin Login
    </Link>
</div>


            </main>
        );
    }

    return children;
}

function ProtectedRoute({ allowedRoles, children }) {
    const { user } = useAuth();
    const location = useLocation();
    const token = localStorage.getItem("token");

    const role = String(user?.role || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");

    // Require authentication.
    if (!token || !user) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location }}
            />
        );
    }

    // Preserve the existing temporary-password workflow.
    if (
        ["student", "teacher", "academic_dean"].includes(role) &&
        user.must_change_password &&
        location.pathname !== "/change-password"
    ) {
        return <Navigate to="/change-password" replace />;
    }

    // Preserve role-based authorization.
    if (
        allowedRoles &&
        !allowedRoles
            .map((item) =>
                String(item).trim().toLowerCase()
            )
            .includes(role)
    ) {
        const home =
            role === "admin"
                ? "/admin"
                : role === "academic_dean"
                    ? "/academic-dean"
                    : role === "teacher"
                        ? "/teacher"
                        : "/student";

        return <Navigate to={home} replace />;
    }

    // Admin can access protected Admin pages during maintenance.
    if (role === "admin") {
        return children || <Outlet />;
    }

    // Preserve maintenance restrictions for all other roles.
    return (
        <MaintenanceGate
            role={role}
            pathname={location.pathname}
        >
            {children || <Outlet />}
        </MaintenanceGate>
    );
}

export default ProtectedRoute;