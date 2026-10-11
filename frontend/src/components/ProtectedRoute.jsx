
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ allowedRoles, children }) {
    const { user } = useAuth();
    const location = useLocation();
    const token = localStorage.getItem("token");

    // Require login
    if (!token || !user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    // Restrict access by role
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        const home =
            user.role === "admin" ? "/admin" : "/student";

        return <Navigate to={home} replace />;
    }

    // Students with temporary passwords must change them first
    if (
        user.role === "student" &&
        user.must_change_password &&
        location.pathname !== "/change-password"
    ) {
        return <Navigate to="/change-password" replace />;
    }

    // Support both wrapped pages and nested routes
    return children || <Outlet />;
}

export default ProtectedRoute;
