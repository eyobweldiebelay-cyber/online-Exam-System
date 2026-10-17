
import { useEffect, useMemo, useState } from "react";
import {
    getAllTeachers,
    createTeacher,
    updateTeacher,
    updateTeacherStatus,
    resetTeacherPassword,
} from "../services/teacher";
import { getAllPrograms } from "../services/programService";
import { getAllDepartments } from "../services/departmentService";
import "../../css/admin/Teachers.css";

const emptyForm = {
    username: "",
    program_id: "",
    department_id: "",
};

function extractList(response, key) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.[key])) return response[key];
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.[key])) return response.data[key];
    return [];
}

function Teachers() {
    const [teachers, setTeachers] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [resettingTeacherId, setResettingTeacherId] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [temporaryPassword, setTemporaryPassword] = useState("");

    const availableDepartments = useMemo(
        () =>
            departments.filter(
                (department) =>
                    String(department.program_id) === String(form.program_id)
            ),
        [departments, form.program_id]
    );

    const filteredTeachers = useMemo(() => {
        const term = search.trim().toLowerCase();

        return teachers.filter((teacher) => {
            const matchesSearch = [
                teacher.username,
                teacher.department_name,
                teacher.program_name,
            ].some((value) =>
                String(value || "").toLowerCase().includes(term)
            );

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" &&
                    Number(teacher.is_active) === 1) ||
                (statusFilter === "inactive" &&
                    Number(teacher.is_active) === 0);

            return matchesSearch && matchesStatus;
        });
    }, [teachers, search, statusFilter]);

    async function loadData() {
        setLoading(true);
        setError("");

        try {
            const [
                teacherResponse,
                programResponse,
                departmentResponse,
            ] = await Promise.all([
                getAllTeachers(),
                getAllPrograms(),
                getAllDepartments(),
            ]);

            setTeachers(extractList(teacherResponse, "teachers"));
            setPrograms(extractList(programResponse, "programs"));
            setDepartments(extractList(departmentResponse, "departments"));
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Unable to load teacher management data. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    function handleFormChange(event) {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
            ...(name === "program_id" ? { department_id: "" } : {}),
        }));
    }

    function resetForm() {
        setForm(emptyForm);
        setEditingId(null);
        setError("");
        setSuccess("");
    }

    function startEditing(teacher) {
        setEditingId(teacher.user_id);

        setForm({
            username: teacher.username || "",
            program_id: String(teacher.program_id || ""),
            department_id: String(teacher.department_id || ""),
        });

        setTemporaryPassword("");
        setError("");
        setSuccess("");

        document
            .querySelector(".teacher-management__form-card")
            ?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setSuccess("");
        setTemporaryPassword("");

        if (
            !form.program_id ||
            !form.department_id ||
            !form.username.trim()
        ) {
            setError("Username, program, and department are required.");
            return;
        }

        setSaving(true);

        try {
            const payload = {
                username: form.username.trim(),
                program_id: Number(form.program_id),
                department_id: Number(form.department_id),
            };

            if (editingId) {
                await updateTeacher(editingId, payload);
                setSuccess("Teacher account updated successfully.");
            } else {
                const response = await createTeacher(payload);

                setTemporaryPassword(
                    response.temporary_password || ""
                );

                setSuccess(
                    response.message ||
                        "Teacher account created successfully."
                );
            }

            setForm(emptyForm);
            setEditingId(null);

            await loadData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Unable to save the teacher account."
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleStatusChange(teacher) {
        const currentlyActive = Number(teacher.is_active) === 1;
        const nextStatus = !currentlyActive;

        const confirmed = window.confirm(
            `${nextStatus ? "Activate" : "Deactivate"} the account for "${teacher.username}"?`
        );

        if (!confirmed) return;

        setError("");
        setSuccess("");
        setTemporaryPassword("");

        try {
            const response = await updateTeacherStatus(
                teacher.user_id,
                nextStatus
            );

            setSuccess(
                response.message ||
                    `Teacher account ${nextStatus ? "activated" : "deactivated"} successfully.`
            );

            await loadData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Unable to update the teacher account status."
            );
        }
    }

    async function handleResetPassword(teacher) {
        const confirmed = window.confirm(
            `Reset the password for "${teacher.username}"?\n\n` +
                "A new temporary password will be generated. " +
                "The teacher will need to change it after logging in."
        );

        if (!confirmed) return;

        setError("");
        setSuccess("");
        setTemporaryPassword("");
        setResettingTeacherId(teacher.user_id);

        try {
            const response = await resetTeacherPassword(
                teacher.user_id
            );

            if (!response.temporary_password) {
                throw new Error(
                    "The server did not return a temporary password."
                );
            }

            setTemporaryPassword(response.temporary_password);

            setSuccess(
                response.message ||
                    `Password reset successfully for ${teacher.username}.`
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    err.message ||
                    "Unable to reset the teacher password."
            );
        } finally {
            setResettingTeacherId(null);
        }
    }

    async function copyTemporaryPassword() {
        try {
            await navigator.clipboard.writeText(temporaryPassword);
            setSuccess("Temporary password copied to clipboard.");
        } catch {
            setError(
                "Unable to copy automatically. Select and copy the password manually."
            );
        }
    }

    return (
        <div className="teacher-management">
            <section className="teacher-management__stats">
                <article className="teacher-management__stat">
                    <div className="teacher-management__stat-icon teacher-management__stat-icon--blue">
                        <span aria-hidden="true">♙</span>
                    </div>
                    <div>
                        <span>Total teachers</span>
                        <strong>{teachers.length}</strong>
                    </div>
                </article>

                <article className="teacher-management__stat">
                    <div className="teacher-management__stat-icon teacher-management__stat-icon--green">
                        <span aria-hidden="true">✓</span>
                    </div>
                    <div>
                        <span>Active accounts</span>
                        <strong>
                            {
                                teachers.filter(
                                    (teacher) =>
                                        Number(teacher.is_active) === 1
                                ).length
                            }
                        </strong>
                    </div>
                </article>

                <article className="teacher-management__stat">
                    <div className="teacher-management__stat-icon teacher-management__stat-icon--orange">
                        <span aria-hidden="true">−</span>
                    </div>
                    <div>
                        <span>Inactive accounts</span>
                        <strong>
                            {
                                teachers.filter(
                                    (teacher) =>
                                        Number(teacher.is_active) === 0
                                ).length
                            }
                        </strong>
                    </div>
                </article>
            </section>

            {error && (
                <div
                    className="teacher-management__alert teacher-management__alert--error"
                    role="alert"
                >
                    {error}
                    <button
                        type="button"
                        onClick={() => setError("")}
                        aria-label="Dismiss error"
                    >
                        ×
                    </button>
                </div>
            )}

            {success && (
                <div
                    className="teacher-management__alert teacher-management__alert--success"
                    role="status"
                >
                    {success}
                    <button
                        type="button"
                        onClick={() => setSuccess("")}
                        aria-label="Dismiss message"
                    >
                        ×
                    </button>
                </div>
            )}

            {temporaryPassword && (
                <section
                    className="teacher-management__password"
                    aria-live="polite"
                >
                    <div>
                        <strong>Temporary password</strong>
                        <p>
                            Share this password securely with the teacher.
                            For security, it will not be shown again after
                            you leave this message or reset another password.
                        </p>
                    </div>

                    <code>{temporaryPassword}</code>

                    <button
                        type="button"
                        onClick={copyTemporaryPassword}
                    >
                        Copy password
                    </button>
                </section>
            )}

            <section className="teacher-management__form-card">
                <div className="teacher-management__section-heading">
                    <div>
                        <h2>
                            {editingId
                                ? "Edit teacher account"
                                : "Add a teacher"}
                        </h2>
                        <p>
                            {editingId
                                ? "Update the username and department assignment."
                                : "Create a teacher login and assign an academic department."}
                        </p>
                    </div>

                    {editingId && (
                        <button
                            type="button"
                            className="teacher-management__button teacher-management__button--secondary"
                            onClick={resetForm}
                        >
                            Cancel edit
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="teacher-management__form-grid">
                        <label>
                            Username
                            <input
                                name="username"
                                value={form.username}
                                onChange={handleFormChange}
                                placeholder="Enter teacher username"
                                autoComplete="off"
                                required
                            />
                        </label>

                        <label>
                            Program
                            <select
                                name="program_id"
                                value={form.program_id}
                                onChange={handleFormChange}
                                required
                            >
                                <option value="">Select program</option>
                                {programs.map((program) => (
                                    <option
                                        key={program.id}
                                        value={program.id}
                                    >
                                        {program.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Department
                            <select
                                name="department_id"
                                value={form.department_id}
                                onChange={handleFormChange}
                                required
                                disabled={!form.program_id}
                            >
                                <option value="">Select department</option>
                                {availableDepartments.map((department) => (
                                    <option
                                        key={department.id}
                                        value={department.id}
                                    >
                                        {department.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="teacher-management__form-actions">
                        <button
                            type="submit"
                            className="teacher-management__button teacher-management__button--primary"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : editingId
                                  ? "Save changes"
                                  : "Create teacher"}
                        </button>

                        {!editingId && (
                            <button
                                type="button"
                                className="teacher-management__button teacher-management__button--secondary"
                                onClick={resetForm}
                            >
                                Clear form
                            </button>
                        )}
                    </div>
                </form>
            </section>

            <section className="teacher-management__list-card">
                <div className="teacher-management__section-heading teacher-management__list-heading">
                    <div>
                        <h2>Teacher accounts</h2>
                        <p>
                            Manage teacher access, department assignments,
                            and password resets.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="teacher-management__button teacher-management__button--secondary"
                        onClick={loadData}
                        disabled={loading}
                    >
                        ↻ Refresh
                    </button>
                </div>

                <div className="teacher-management__filters">
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search username, program, or department..."
                        aria-label="Search teachers"
                    />

                    <select
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(event.target.value)
                        }
                        aria-label="Filter by account status"
                    >
                        <option value="all">All accounts</option>
                        <option value="active">Active only</option>
                        <option value="inactive">Inactive only</option>
                    </select>
                </div>

                {loading ? (
                    <div className="teacher-management__empty">
                        Loading teacher accounts...
                    </div>
                ) : filteredTeachers.length === 0 ? (
                    <div className="teacher-management__empty">
                        <strong>No teacher accounts found</strong>
                        <p>
                            Try changing your search, or create a teacher
                            account above.
                        </p>
                    </div>
                ) : (
                    <div className="teacher-management__table-wrap">
                        <table className="teacher-management__table">
                            <thead>
                                <tr>
                                    <th>Teacher</th>
                                    <th>Program</th>
                                    <th>Department</th>
                                    <th>Account status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredTeachers.map((teacher) => {
                                    const active =
                                        Number(teacher.is_active) === 1;

                                    const resetting =
                                        resettingTeacherId === teacher.user_id;

                                    return (
                                        <tr key={teacher.user_id}>
                                            <td>
                                                <div className="teacher-management__user">
                                                    <span className="teacher-management__user-avatar">
                                                        {(teacher.username || "T")
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </span>

                                                    <div>
                                                        <strong>
                                                            {teacher.username}
                                                        </strong>
                                                        <span>
                                                            ID: {teacher.user_id}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                {teacher.program_name || "—"}
                                            </td>

                                            <td>
                                                {teacher.department_name ||
                                                    "Unassigned"}
                                            </td>

                                            <td>
                                                <span
                                                    className={`teacher-management__status ${
                                                        active
                                                            ? "is-active"
                                                            : "is-inactive"
                                                    }`}
                                                >
                                                    <span />
                                                    {active
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="teacher-management__actions">
                                                    <button
                                                        type="button"
                                                        className="teacher-management__action"
                                                        onClick={() =>
                                                            startEditing(teacher)
                                                        }
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className={`teacher-management__action ${
                                                            active
                                                                ? "is-danger"
                                                                : "is-success"
                                                        }`}
                                                        onClick={() =>
                                                            handleStatusChange(
                                                                teacher
                                                            )
                                                        }
                                                    >
                                                        {active
                                                            ? "Deactivate"
                                                            : "Activate"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="teacher-management__action"
                                                        onClick={() =>
                                                            handleResetPassword(
                                                                teacher
                                                            )
                                                        }
                                                        disabled={
                                                            resetting ||
                                                            !active
                                                        }
                                                        title={
                                                            !active
                                                                ? "Activate this teacher account before resetting its password."
                                                                : "Generate a new temporary password."
                                                        }
                                                    >
                                                        {resetting
                                                            ? "Resetting..."
                                                            : "Reset Password"}
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

                <div className="teacher-management__list-footer">
                    Showing {filteredTeachers.length} of {teachers.length}{" "}
                    teacher accounts
                </div>
            </section>
        </div>
    );
}

export default Teachers;