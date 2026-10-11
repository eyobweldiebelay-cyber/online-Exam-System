
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

import "../../css/login.css";
import { useAuth } from "../../context/AuthContext";
import imaglogo from "../../image/logo.jpg";

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [usernameError, setUsernameError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [message, setMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        let isValid = true;
        setMessage("");

        // Validate username
        if (!username.trim()) {
            setUsernameError("Student ID is required");
            isValid = false;
        } else {
            setUsernameError("");
        }

        // Validate password
        if (!password) {
            setPasswordError("Password is required");
            isValid = false;
        } else {
            setPasswordError("");
        }

        if (!isValid) {
            return;
        }

        try {
            setIsSubmitting(true);

            // Login through the existing AuthContext
            const data = await login(username.trim(), password);

            setMessage("Login successful");

            // Navigate according to role and password status
            if (data.user.role === "student") {
                if (data.user.must_change_password) {
                    navigate("/change-password", { replace: true });
                } else {
                    navigate("/student", { replace: true });
                }
                return;
            }

            if (data.user.role === "admin") {
                navigate("/admin", { replace: true });
                return;
            }

            setMessage("Your account role is not recognized.");
        } catch (error) {
            console.error("Login error:", error);

            setMessage(
                error.response?.data?.message ||
                error.message ||
                "Unable to connect to the server."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    function handlePasswordVisibility() {
        setShowPassword((previousValue) => !previousValue);
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <div className="college-logo">
                        <img src={imaglogo} alt="College logo" />
                    </div>

                    <h1>Welcome To Online Examination System</h1>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {/* Username */}
                    <div className="form-group">
                        <label htmlFor="username">
                            Student username
                        </label>

                        <input
                            id="username"
                            type="text"
                            placeholder="Enter your student ID or username"
                            value={username}
                            onChange={(event) =>
                                setUsername(event.target.value)
                            }
                            autoComplete="username"
                        />

                        {usernameError && (
                            <p className="login-error">
                                {usernameError}
                            </p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="form-group">
                        <label htmlFor="password">
                            Password
                        </label>

                        <div className="password-wrapper">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                autoComplete="current-password"
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={handlePasswordVisibility}
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >
                                {showPassword ? (
                                    <EyeOff size={20} />
                                ) : (
                                    <Eye size={20} />
                                )}
                            </button>
                        </div>

                        {passwordError && (
                            <p className="login-error">
                                {passwordError}
                            </p>
                        )}
                    </div>

                    {/* Server message */}
                    {message && (
                        <p className="login-message" role="status">
                            {message}
                        </p>
                    )}

                    {/* Login button */}
                    <button
                        type="submit"
                        className="login-button"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Logging in..." : "Login Here"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
