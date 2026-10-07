import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

import "../../css/login.css";
import api from "../../pages/services/api";

function Login() {

    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    // Validation errors
    const [usernameError, setUsernameError] =
        useState("");

    const [passwordError, setPasswordError] =
        useState("");

    // Server message
    const [message, setMessage] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const handleSubmit = async (event) => {

        event.preventDefault();

        let isValid = true;

        setMessage("");

        // Student ID validation
        if (!username.trim()) {

            setUsernameError(
                "Student ID is required"
            );

            isValid = false;

        } else {

            setUsernameError("");
        }

        // Password validation
        if (!password) {

            setPasswordError(
                "Password is required"
            );

            isValid = false;

        } else {

            setPasswordError("");
        }

        // Stop if validation fails
        if (!isValid) {

            console.log(
                "Form submission failed"
            );

            return;
        }

        console.log(
            "Form validation successful"
        );

        // Send data to backend
        try {

            const response = await api.post("/auth/login",
                {
                    username: username.trim(),
                    password: password
                }
            );

            console.log(
                "Backend output:",
                response.data
            );

            // Save token
            localStorage.setItem(
                "token",
                response.data.token
            );

            // Save user
            localStorage.setItem(
                "user",
                JSON.stringify(
                    response.data.user
                )
            );

            setMessage(
                "User Login successfully"
            );

            // Navigate according to role
            if (
                response.data.user.role ===
                "student"
            ) {

                navigate("/student");

                return;
            }

            if (
                response.data.user.role ===
                "admin"
            ) {

                navigate("/admin");

                return;
            }

        } catch (error) {

            console.log(
                "Login error:",
                error.response?.data
            );

            if (
                error.response?.data?.message
            ) {

                setMessage(
                    error.response.data.message
                );

            } else {

                setMessage(
                    "Unable to connect to the server."
                );
            }
        }
    };

    function handlePasswordVisibility() {

        setShowPassword(
            (previousValue) =>
                !previousValue
        );
    }

    return (

        <div className="login-page">

            <div className="login-card">

                <div className="login-header">

                    <div className="college-logo">
                        LOGO
                    </div>

                    <h1>
                        Online Examination System
                    </h1>

                    <p>
                        Login to continue
                    </p>

                </div>

                <form
                    onSubmit={handleSubmit}
                    className="login-form"
                >

                    {/* Student ID */}

                    <div className="form-group">

                        <label htmlFor="username">
                            Student ID
                        </label>

                        <input
                            id="username"
                            type="text"
                            placeholder="Enter your student ID"
                            value={username}
                            onChange={(event) =>
                                setUsername(
                                    event.target.value
                                )
                            }
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
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                placeholder="Enter your password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(
                                        event.target.value
                                    )
                                }
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={
                                    handlePasswordVisibility
                                }
                            >

                                {showPassword ? (
                                    <EyeOff
                                        size={20}
                                    />
                                ) : (
                                    <Eye
                                        size={20}
                                    />
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

                        <p className="login-message">
                            {message}
                        </p>

                    )}


                    {/* Login button */}

                    <button
                        type="submit"
                        className="login-button"
                    >
                        Login
                    </button>

                </form>

            </div>

        </div>
    );
}

export default Login;