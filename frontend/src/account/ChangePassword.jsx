
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { changePassword } from "../pages/services/authService";
import "../css/login.css";

function ChangePassword() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        setMessage("");
        setError("");

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError("Please fill in all password fields.");
            return;
        }

        if (newPassword.length < 6) {
            setError("Your new password must contain at least 6 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("New password and confirmation do not match.");
            return;
        }

        if (currentPassword === newPassword) {
            setError("Your new password must be different from your current password.");
            return;
        }

        try {
            setSubmitting(true);

            const response = await changePassword(
                currentPassword,
                newPassword
            );

            // Update the saved user so ProtectedRoute sees the new status.
            const updatedUser = {
                ...user,
                must_change_password: false
            };

            localStorage.setItem("user", JSON.stringify(updatedUser));

            setMessage(
                response.message || "Password changed successfully."
            );

            // Redirect according to the user's role.
            setTimeout(() => {
                if (updatedUser.role === "admin") {
                    navigate("/admin", { replace: true });
                } else {
                    navigate("/student", { replace: true });
                }
            }, 1000);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to change your password. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <div className="college-logo">
                        <LockKeyhole size={34} />
                    </div>

                    <h1>Change Password</h1>

                    <p>
                        {user?.must_change_password
                            ? "Set a new password before continuing to your exams."
                            : "Update your account password."}
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="login-form"
                >
                    <div className="form-group">
                        <label htmlFor="currentPassword">
                            Current Password
                        </label>

                        <div className="password-wrapper">
                            <input
                                id="currentPassword"
                                type={showCurrent ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) =>
                                    setCurrentPassword(e.target.value)
                                }
                                placeholder="Enter current password"
                                autoComplete="current-password"
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowCurrent((value) => !value)
                                }
                                aria-label={
                                    showCurrent
                                        ? "Hide current password"
                                        : "Show current password"
                                }
                            >
                                {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="newPassword">
                            New Password
                        </label>

                        <div className="password-wrapper">
                            <input
                                id="newPassword"
                                type={showNew ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) =>
                                    setNewPassword(e.target.value)
                                }
                                placeholder="Enter new password"
                                autoComplete="new-password"
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowNew((value) => !value)
                                }
                                aria-label={
                                    showNew
                                        ? "Hide new password"
                                        : "Show new password"
                                }
                            >
                                {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">
                            Confirm New Password
                        </label>

                        <div className="password-wrapper">
                            <input
                                id="confirmPassword"
                                type={showConfirm ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                placeholder="Confirm new password"
                                autoComplete="new-password"
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowConfirm((value) => !value)
                                }
                                aria-label={
                                    showConfirm
                                        ? "Hide confirmation password"
                                        : "Show confirmation password"
                                }
                            >
                                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <p className="login-error" role="alert">
                            {error}
                        </p>
                    )}

                    {message && (
                        <p className="login-message" role="status">
                            {message}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={submitting}
                    >
                        {submitting
                            ? "Changing Password..."
                            : "Change Password"}
                    </button>

                    {!user?.must_change_password && (
                        <button
                            type="button"
                            className="login-button"
                            onClick={() =>
                                navigate(
                                    user?.role === "admin"
                                        ? "/admin"
                                        : "/student"
                                )
                            }
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}

export default ChangePassword;
