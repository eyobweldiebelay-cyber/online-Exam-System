import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../services/api";
import "../../css/teacher/dashboard.css";

export default function TeacherProfile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadProfile() {
            try {
                const response = await api.get("/teacher-workspace/profile");

                if (active) {
                    setProfile(response.data.profile);
                }
            } catch (err) {
                if (active) {
                    setError(
                        err.response?.data?.message ||
                        "Unable to load your profile."
                    );
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        loadProfile();

        return () => {
            active = false;
        };
    }, []);

    const fullName =
        user?.full_name ||
        user?.name ||
        profile?.full_name ||
        profile?.username ||
        user?.username ||
        "Not available";

    const username =
        profile?.username || user?.username || "Not available";

   // const email = profile?.email || user?.email || "Not available";

    const program =
        profile?.program_name || user?.program_name || "Not available";

    const department =
        profile?.department_name ||
        user?.department_name ||
        "Not available";

    const initials = fullName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");

    return (
        <div className="teacher-page teacher-profile-page">
            <div className="teacher-page-header">
                <div>
                    <p className="teacher-eyebrow">ACCOUNT SETTINGS</p>
                    <h1>My Profile</h1>
                    <p className="teacher-page-description">
                        View your account information and assigned department.
                    </p>
                </div>
            </div>

            {loading && <p>Loading your profile...</p>}

            {!loading && error && (
                <p role="alert">{error}</p>
            )}

            {!loading && !error && (
                <section className="teacher-profile-card">
                    <div className="teacher-profile-banner" />

                    <div className="teacher-profile-identity">
                        <div className="teacher-profile-avatar">
                            {initials || "T"}
                        </div>

                        <div className="teacher-profile-heading">
                            <h2>{fullName}</h2>
                            <span className="teacher-role-badge">Teacher</span>
                            <p>{username}</p>
                        </div>
                    </div>

                    <div className="teacher-profile-divider" />

                    <div className="teacher-profile-section-heading">
                        <h3>Personal Information</h3>
                        <p>Your account details</p>
                    </div>

                    <div className="teacher-profile-grid">
                        <div className="teacher-profile-item">
                            <span className="teacher-profile-label">
                                Full Name
                            </span>
                            <strong>{fullName}</strong>
                        </div>

                        <div className="teacher-profile-item">
                            <span className="teacher-profile-label">
                                Username
                            </span>
                            <strong>{username}</strong>
                        </div>

                        <div className="teacher-profile-item">
                            <span className="teacher-profile-label">
                                
                            </span>
                           {/* <strong>{email}</strong>*/}
                        </div>

                        <div className="teacher-profile-item">
                            <span className="teacher-profile-label">Role</span>
                            <strong>Teacher</strong>
                        </div>
                    </div>

                    <div className="teacher-profile-divider" />

                    <div className="teacher-profile-section-heading">
                        <h3>Teaching Assignment</h3>
                        <p>Your academic responsibility</p>
                    </div>

                    <div className="teacher-profile-grid">
                        <div className="teacher-profile-item">
                            <span className="teacher-profile-label">
                                Program
                            </span>
                            <strong>{program}</strong>
                        </div>

                        <div className="teacher-profile-item">
                            <span className="teacher-profile-label">
                                Assigned Department
                            </span>
                            <strong>{department}</strong>
                        </div>
                    </div>

                    <div className="teacher-profile-notice">
                        <span className="teacher-profile-notice-icon">i</span>
                        <div>
                            <strong>Department assignment</strong>
                            <p>
                                Your question management access is limited to
                                your assigned department. Contact the
                                administrator if your account information or
                                assignment needs to be updated.
                            </p>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}