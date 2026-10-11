import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, LockKeyhole, LogOut } from "lucide-react";

import "../css/navbar.css";
import imagelog from '../image/logo.jpg'

function StudentNavbar() {

    const navigate = useNavigate();

    const [showAccount, setShowAccount] =
        useState(false);

    // Get logged-in student information
    const user = JSON.parse(
        localStorage.getItem("user")
    );

    const studentId =
        user?.username || "Student";

    // Use first letter as temporary profile icon
    const profileLetter =
        studentId.charAt(0).toUpperCase();

    function handleChangePassword() {

        setShowAccount(false);

        navigate("/change-password");
    }

    function handleLogout() {

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
    }

    return (

        <header className="student-navbar">

            <div className="student-navbar-left">

                <img
                    src={imagelog}
                    alt="College Logo"
                    className="college-logo"
                />

                <h1>
                    Online Examination System
                </h1>

            </div>

            <div className="student-account">

                <button
                    type="button"
                    className="student-account-button"
                    onClick={() =>
                        setShowAccount(
                            (previousValue) =>
                                !previousValue
                        )
                    }
                >

                    <span className="student-profile-circle">
                        {profileLetter}
                    </span>

                    <span className="student-id">
                        {studentId}
                    </span>

                    <ChevronDown
                        size={18}
                        className={
                            showAccount
                                ? "account-arrow open"
                                : "account-arrow"
                        }
                    />

                </button>

                {showAccount && (

                    <div className="student-account-menu">

                        <div className="account-menu-header">

                            <div className="account-large-circle">
                                {profileLetter}
                            </div>

                            <div>
                                <strong>
                                    {studentId}
                                </strong>

                                <span>
                                    Student
                                </span>
                            </div>

                        </div>

                        <div className="account-menu-divider"></div>

                        <button
                            type="button"
                            onClick={
                                handleChangePassword
                            }
                        >

                            <LockKeyhole size={18} />

                            <span>
                                Change Password
                            </span>

                        </button>

                        <button
                            type="button"
                            onClick={
                                handleLogout
                            }
                            className="logout-button"
                        >

                            <LogOut size={18} />

                            <span>
                                Logout
                            </span>

                        </button>

                    </div>

                )}

            </div>

        </header>
    );
}

export default StudentNavbar;