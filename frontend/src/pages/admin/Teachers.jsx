
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    getAllTeachers,
    createTeacher,
    updateTeacherStatus,
    resetTeacherPassword,
} from "../services/teacher";
import "../../css/admin/Teachers.css";

function extractList(response) {
    const data = response?.data ?? response;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.teachers)) return data.teachers;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.data?.teachers)) return data.data.teachers;
    if (Array.isArray(data?.results)) return data.results;

    return [];
}

/*
 * Return a teacher's name from common API field names.
 * Supports camelCase, snake_case, and nested user objects.
 */
function getTeacherName(teacher) {
    const possibleNames = [
        teacher?.full_name,
        teacher?.fullName,
        teacher?.teacher_name,
        teacher?.teacherName,
        teacher?.name,
        teacher?.user?.full_name,
        teacher?.user?.fullName,
        teacher?.user?.name,
        teacher?.user?.username,
    ];

    const name = possibleNames.find(
        (value) =>
            typeof value === "string" &&
            value.trim() !== ""
    );

    return name ? name.trim() : "";
}

function normalizeTeacher(teacher) {
    return {
        ...teacher,
        full_name: getTeacherName(teacher),
        username: teacher?.username ?? teacher?.user?.username ?? "",
    };
}

function getTeacherId(teacher) {
    return (
        teacher?.id ??
        teacher?.user_id ??
        teacher?.teacher_id ??
        teacher?.user?.id
    );
}

function isTeacherActive(teacher) {
    if (typeof teacher?.is_active === "boolean") {
        return teacher.is_active;
    }

    if (
        teacher?.is_active !== undefined &&
        teacher?.is_active !== null
    ) {
        return Number(teacher.is_active) === 1;
    }

    if (typeof teacher?.isActive === "boolean") {
        return teacher.isActive;
    }

    if (
        teacher?.isActive !== undefined &&
        teacher?.isActive !== null
    ) {
        return Number(teacher.isActive) === 1;
    }

    return String(teacher?.status ?? "").toLowerCase() === "active";
}

function getErrorMessage(error) {
    return (
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "An unexpected error occurred. Please try again."
    );
}

export default function Teachers() {
    const [teachers, setTeachers] = useState([]);
    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [workingId, setWorkingId] = useState(null);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [temporaryPassword, setTemporaryPassword] = useState("");
    const [copyMessage, setCopyMessage] = useState("");

    const loadTeachers = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await getAllTeachers();
            const list = extractList(response);

            setTeachers(list.map(normalizeTeacher));
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTeachers();
    }, [loadTeachers]);

    const filteredTeachers = useMemo(() => {
        const term = search.trim().toLowerCase();

        return teachers.filter((teacher) => {
            const matchesSearch = [
                teacher.full_name,
                teacher.username,
                teacher.name,
            ]
                .filter(Boolean)
                .some((value) =>
                    String(value).toLowerCase().includes(term)
                );

            const active = isTeacherActive(teacher);

            const matchesFilter =
                filter === "all" ||
                (filter === "active" && active) ||
                (filter === "inactive" && !active);

            return matchesSearch && matchesFilter;
        });
    }, [teachers, search, filter]);

    const activeCount = teachers.filter(isTeacherActive).length;
    const inactiveCount = teachers.length - activeCount;

    const handleCreate = async (event) => {
        event.preventDefault();

        const cleanName = fullName.trim();
        const cleanUsername = username.trim();

        if (!cleanName || !cleanUsername) {
            setError(
                "Please enter the teacher's full name and username."
            );
            return;
        }

        setCreating(true);
        setError("");
        setSuccess("");
        setTemporaryPassword("");
        setCopyMessage("");

        try {
            const response = await createTeacher({
                full_name: cleanName,
                username: cleanUsername,
            });

            const data = response?.data ?? response;

            setFullName("");
            setUsername("");

            setSuccess(
                data?.message || "Teacher account created successfully."
            );

            if (data?.temporary_password) {
                setTemporaryPassword(data.temporary_password);
            } else {
                setSuccess(
                    (data?.message ||
                        "Teacher account created successfully.") +
                    " However, the API did not return a temporary password."
                );
            }

            await loadTeachers();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setCreating(false);
        }
    };

    const handleCopyPassword = async () => {
        if (!temporaryPassword) return;

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(temporaryPassword);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = temporaryPassword;
                textArea.style.position = "fixed";
                textArea.style.opacity = "0";

                document.body.appendChild(textArea);
                textArea.select();

                const copied = document.execCommand("copy");
                document.body.removeChild(textArea);

                if (!copied) {
                    throw new Error("Copy failed");
                }
            }

            setCopyMessage("Password copied.");
        } catch {
            setCopyMessage(
                "Copy failed. Please select and copy the password manually."
            );
        }
    };

    const handleStatusChange = async (teacher) => {
        const id = getTeacherId(teacher);

        if (!id) {
            setError("Unable to identify this teacher account.");
            return;
        }

        const currentlyActive = isTeacherActive(teacher);
        const action = currentlyActive ? "deactivate" : "activate";

        const teacherLabel =
            getTeacherName(teacher) ||
            teacher.username ||
            "this teacher";

        if (
            !window.confirm(
                `Are you sure you want to ${action} ${teacherLabel}?`
            )
        ) {
            return;
        }

        setWorkingId(id);
        setError("");
        setSuccess("");
        setTemporaryPassword("");
        setCopyMessage("");

        try {
            await updateTeacherStatus(id, !currentlyActive);

            setSuccess(
                `Teacher account ${action}d successfully.`
            );

            await loadTeachers();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setWorkingId(null);
        }
    };

    const handleResetPassword = async (teacher) => {
        const id = getTeacherId(teacher);

        if (!id) {
            setError("Unable to identify this teacher account.");
            return;
        }

        const teacherLabel =
            getTeacherName(teacher) ||
            teacher.username ||
            "this teacher";

        if (
            !window.confirm(
                `Generate a new temporary password for ${teacherLabel}?`
            )
        ) {
            return;
        }

        setWorkingId(id);
        setError("");
        setSuccess("");
        setTemporaryPassword("");
        setCopyMessage("");

        try {
            const response = await resetTeacherPassword(id);
            const data = response?.data ?? response;

            setSuccess(
                data?.message || "Teacher password reset successfully."
            );

            if (data?.temporary_password) {
                setTemporaryPassword(data.temporary_password);
            } else {
                setSuccess(
                    (data?.message ||
                        "Teacher password reset successfully.") +
                    " However, the API did not return a temporary password."
                );
            }
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setWorkingId(null);
        }
    };

    return (
        <section className="admin-teachers-page">
            <header className="admin-teachers-header">
                <div>
                    <p className="admin-teachers-eyebrow">
                        ADMINISTRATION
                    </p>

                    <h1>Teacher Account Management</h1>

                    <p>
                        Create teacher login credentials and manage account
                        access. Academic assignments are handled by the
                        Academic Dean.
                    </p>
                </div>

                <button
                    type="button"
                    className="teacher-refresh-button"
                    onClick={loadTeachers}
                    disabled={loading}
                >
                    {loading ? "Refreshing..." : "Refresh"}
                </button>
            </header>

            <div className="teacher-summary-grid">
                <article className="teacher-summary-card">
                    <span>Total teacher accounts</span>
                    <strong>{teachers.length}</strong>
                </article>

                <article className="teacher-summary-card">
                    <span>Active accounts</span>
                    <strong>{activeCount}</strong>
                </article>

                <article className="teacher-summary-card">
                    <span>Inactive accounts</span>
                    <strong>{inactiveCount}</strong>
                </article>
            </div>

            {error && (
                <div
                    className="teacher-alert teacher-alert-error"
                    role="alert"
                >
                    {error}
                </div>
            )}

            {success && (
                <div
                    className="teacher-alert teacher-alert-success"
                    role="status"
                >
                    {success}
                </div>
            )}

            {temporaryPassword && (
                <div className="teacher-temporary-password">
                    <strong>Temporary password</strong>

                    <p>
                        Share these credentials securely with the teacher.
                        The teacher should change this password after
                        signing in.
                    </p>

                    <div className="teacher-password-copy-row">
                        <code>{temporaryPassword}</code>

                        <button
                            type="button"
                            onClick={handleCopyPassword}
                        >
                            Copy password
                        </button>
                    </div>

                    {copyMessage && (
                        <p
                            role="status"
                            className="teacher-copy-message"
                        >
                            {copyMessage}
                        </p>
                    )}
                </div>
            )}

            <div className="teacher-management-grid">
                <section className="teacher-panel">
                    <h2>Create Teacher Account</h2>

                    <p className="teacher-panel-description">
                        Enter the teacher's name and username. A temporary
                        password is generated by the account API.
                    </p>

                    <form onSubmit={handleCreate}>
                        <label htmlFor="teacher-full-name">
                            Teacher full name
                        </label>

                        <input
                            id="teacher-full-name"
                            type="text"
                            value={fullName}
                            onChange={(event) =>
                                setFullName(event.target.value)
                            }
                            placeholder="Enter teacher's full name"
                            autoComplete="name"
                            required
                        />

                        <label htmlFor="teacher-username">
                            Username
                        </label>

                        <input
                            id="teacher-username"
                            type="text"
                            value={username}
                            onChange={(event) =>
                                setUsername(event.target.value)
                            }
                            placeholder="Enter teacher username"
                            autoComplete="off"
                            required
                        />

                        <button
                            type="submit"
                            className="teacher-primary-button"
                            disabled={creating}
                        >
                            {creating
                                ? "Creating account..."
                                : "Create Teacher Account"}
                        </button>
                    </form>
                </section>

                <section className="teacher-panel teacher-list-panel">
                    <div className="teacher-list-heading">
                        <div>
                            <h2>Teacher Accounts</h2>

                            <p className="teacher-panel-description">
                                Search teachers, reset passwords, or
                                manage access.
                            </p>
                        </div>

                        <span className="teacher-count">
                            {filteredTeachers.length} shown
                        </span>
                    </div>

                    <div className="teacher-toolbar">
                        <input
                            type="search"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Search name or username..."
                            aria-label="Search teacher accounts"
                        />

                        <select
                            value={filter}
                            onChange={(event) =>
                                setFilter(event.target.value)
                            }
                            aria-label="Filter teacher accounts"
                        >
                            <option value="all">All accounts</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    {loading ? (
                        <p className="teacher-empty-state">
                            Loading teacher accounts...
                        </p>
                    ) : filteredTeachers.length === 0 ? (
                        <p className="teacher-empty-state">
                            No teacher accounts found.
                        </p>
                    ) : (
                        <div className="teacher-table-wrapper">
                            <table className="teacher-table">
                                <thead>
                                    <tr>
                                        <th>Teacher name</th>
                                        <th>Username</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredTeachers.map((teacher) => {
                                        const id = getTeacherId(teacher);
                                        const active =
                                            isTeacherActive(teacher);

                                        const teacherName =
                                            getTeacherName(teacher) ||
                                            "Name not provided";

                                        return (
                                            <tr
                                                key={
                                                    id ?? teacher.username
                                                }
                                            >
                                                <td>
                                                    <strong>
                                                        {teacherName}
                                                    </strong>
                                                </td>

                                                <td>
                                                    {teacher.username || "—"}
                                                </td>

                                                <td>
                                                    <span
                                                        className={`teacher-status ${
                                                            active
                                                                ? "is-active"
                                                                : "is-inactive"
                                                        }`}
                                                    >
                                                        {active
                                                            ? "Active"
                                                            : "Inactive"}
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="teacher-row-actions">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleStatusChange(
                                                                    teacher
                                                                )
                                                            }
                                                            disabled={
                                                                workingId === id
                                                            }
                                                            className={
                                                                active
                                                                    ? "teacher-action-danger"
                                                                    : "teacher-action-success"
                                                            }
                                                        >
                                                            {workingId === id
                                                                ? "Please wait..."
                                                                : active
                                                                  ? "Deactivate"
                                                                  : "Activate"}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="teacher-action-neutral"
                                                            onClick={() =>
                                                                handleResetPassword(
                                                                    teacher
                                                                )
                                                            }
                                                            disabled={
                                                                workingId === id
                                                            }
                                                        >
                                                            Reset password
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </section>
    );
}
