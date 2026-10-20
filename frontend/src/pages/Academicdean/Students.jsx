
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    KeyRound,
    Copy,
    Check,
    X,
    AlertTriangle,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../../context/AuthContext";
import "../../css/academicdean/students.css";

const emptyForm = {
    student_id: "",
    first_name: "",
    last_name: "",
    department_id: "",
    academic_year: "",
    program_id: "",
};

function getRows(response) {
    const body = response?.data;

    if (Array.isArray(body)) return body;
    if (Array.isArray(body?.data)) return body.data;
    if (Array.isArray(body?.students)) return body.students;
    if (Array.isArray(body?.programs)) return body.programs;
    if (Array.isArray(body?.departments)) return body.departments;
    if (Array.isArray(body?.academicYears)) return body.academicYears;
    if (Array.isArray(body?.academic_years)) return body.academic_years;

    return [];
}

function getError(error) {
    return (
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Something went wrong."
    );
}

export default function Students() {
    const { user } = useAuth();

    const role = String(user?.role || "")
        .toLowerCase()
        .replace(/-/g, "_");

    const isAcademicDean = role === "academic_dean";
    const isAdmin = role === "admin";
    const canManageStudentStatus = isAdmin || isAcademicDean;

    const [students, setStudents] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [departmentFilter, setDepartmentFilter] = useState("all");

    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingStatus, setChangingStatus] = useState(null);

    // NEW: password reset state
    const [resettingStudentId, setResettingStudentId] = useState(null);
    const [resetResult, setResetResult] = useState(null);
    const [copyMessage, setCopyMessage] = useState("");

    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const loadStudents = useCallback(async () => {
        const endpoint = isAcademicDean
            ? "/students/academic-list"
            : "/students";

        const response = await api.get(endpoint);
        setStudents(getRows(response));
    }, [isAcademicDean]);

    const loadReferenceData = useCallback(async () => {
        const responses = await Promise.allSettled([
            api.get("/programs"),
            api.get("/departments"),
            api.get("/academic-years"),
        ]);

        if (responses[0].status === "fulfilled") {
            setPrograms(getRows(responses[0].value));
        }

        if (responses[1].status === "fulfilled") {
            setDepartments(getRows(responses[1].value));
        }

        if (responses[2].status === "fulfilled") {
            setAcademicYears(getRows(responses[2].value));
        }
    }, []);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            await Promise.all([
                loadStudents(),
                loadReferenceData(),
            ]);
        } catch (err) {
            setError(getError(err));
        } finally {
            setLoading(false);
        }
    }, [loadStudents, loadReferenceData]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const filteredDepartments = useMemo(() => {
        if (!form.program_id) return departments;

        return departments.filter(
            (department) =>
                String(department.program_id) === String(form.program_id)
        );
    }, [departments, form.program_id]);

    const filteredStudents = useMemo(() => {
        const term = search.trim().toLowerCase();

        return students.filter((student) => {
            const department = departments.find(
                (item) =>
                    String(item.id) === String(student.department_id)
            );

            const matchesSearch =
                !term ||
                [
                    student.student_id,
                    student.first_name,
                    student.last_name,
                    student.username,
                    student.email,
                    student.full_name,
                    department?.name,
                ].some((value) =>
                    String(value ?? "").toLowerCase().includes(term)
                );

            const studentStatus = String(
                student.status ?? student.user_status ?? "active"
            ).toLowerCase();

            const matchesStatus =
                statusFilter === "all" ||
                studentStatus === statusFilter;

            const matchesDepartment =
                departmentFilter === "all" ||
                String(student.department_id) === departmentFilter;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesDepartment
            );
        });
    }, [
        students,
        departments,
        search,
        statusFilter,
        departmentFilter,
    ]);

    const activeCount = students.filter(
        (student) =>
            String(
                student.status ?? student.user_status ?? "active"
            ).toLowerCase() === "active"
    ).length;

    const inactiveCount = students.length - activeCount;

    function openCreateForm() {
        if (!isAdmin) return;

        setEditingId(null);
        setForm({ ...emptyForm });
        setError("");
        setNotice("");
        setShowForm(true);
    }

    function openEditForm(student) {
        if (!isAdmin && !isAcademicDean) return;

        setEditingId(student.id);

        const department = departments.find(
            (item) =>
                String(item.id) === String(student.department_id)
        );

        setForm({
            student_id: student.student_id ?? "",
            first_name: student.first_name ?? "",
            last_name: student.last_name ?? "",
            department_id: student.department_id
                ? String(student.department_id)
                : "",
            academic_year: student.academic_year ?? "",
            program_id: String(
                student.program_id ?? department?.program_id ?? ""
            ),
        });

        setError("");
        setNotice("");
        setShowForm(true);
    }

    function updateField(event) {
        const { name, value } = event.target;

        setForm((previous) => {
            if (name === "program_id") {
                return {
                    ...previous,
                    program_id: value,
                    department_id: "",
                };
            }

            return {
                ...previous,
                [name]: value,
            };
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (!isAdmin && !isAcademicDean) {
            setError("You are not authorized to edit student records.");
            return;
        }

        if (isAcademicDean && editingId === null) {
            setError("Academic Dean cannot create student accounts.");
            return;
        }

        setSaving(true);
        setError("");
        setNotice("");

        try {
            if (isAcademicDean) {
                await api.put(
                    `/students/${editingId}/academic`,
                    {
                        department_id: Number(form.department_id),
                        academic_year: form.academic_year,
                    }
                );

                setNotice(
                    "Student academic details updated successfully."
                );
            } else {
                const payload = {
                    student_id: form.student_id.trim(),
                    first_name: form.first_name.trim(),
                    last_name: form.last_name.trim(),
                    department_id: Number(form.department_id),
                    academic_year: form.academic_year,
                };

                if (editingId !== null) {
                    await api.put(`/students/${editingId}`, payload);
                    setNotice("Student details updated successfully.");
                } else {
                    await api.post("/students", payload);
                    setNotice("Student created successfully.");
                }
            }

            setShowForm(false);
            setEditingId(null);
            setForm({ ...emptyForm });

            await loadStudents();
        } catch (err) {
            setError(getError(err));
        } finally {
            setSaving(false);
        }
    }

    // NEW: Admin-only password reset
    async function handleResetPassword(student) {
        if (!isAdmin) {
            setError("Only Admin can reset student passwords.");
            return;
        }

        const studentName =
            `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() ||
            student.username ||
            student.student_id ||
            "this student";

        if (
            !window.confirm(
                `Reset the password for ${studentName}?\n\n` +
                "The student's current password will stop working. " +
                "A new temporary password will be generated."
            )
        ) {
            return;
        }

        setResettingStudentId(student.id);
        setError("");
        setNotice("");
        setCopyMessage("");
        setResetResult(null);

        try {
            const response = await api.patch(
                `/students/${student.id}/reset-password`
            );

            const data = response?.data;
            const temporaryPassword = data?.temporary_password;

            if (!temporaryPassword) {
                throw new Error(
                    "The reset endpoint succeeded but did not return a temporary password. Check the backend response."
                );
            }

            setResetResult({
                studentName,
                studentId: student.student_id ?? "",
                username: student.username ?? "",
                temporaryPassword,
            });

            setNotice(
                `Temporary password generated for ${studentName}.`
            );
        } catch (err) {
            setError(getError(err));
        } finally {
            setResettingStudentId(null);
        }
    }

    async function copyTemporaryPassword() {
        if (!resetResult?.temporaryPassword) return;

        try {
            await navigator.clipboard.writeText(
                resetResult.temporaryPassword
            );

            setCopyMessage("Temporary password copied.");
        } catch {
            setCopyMessage(
                "Copy was blocked by the browser. Select and copy the password manually."
            );
        }
    }

    async function toggleStatus(student) {
        if (!canManageStudentStatus) {
            setError(
                "You are not authorized to change student account status."
            );
            return;
        }

        const currentStatus = String(
            student.status ?? student.user_status ?? "active"
        ).toLowerCase();

        const nextStatus =
            currentStatus === "active" ? "inactive" : "active";

        const name =
            `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() ||
            student.student_id ||
            "this student";

        const action =
            nextStatus === "active" ? "activate" : "deactivate";

        if (
            !window.confirm(
                `Are you sure you want to ${action} ${name}?`
            )
        ) {
            return;
        }

        setChangingStatus(student.id);
        setError("");
        setNotice("");

        try {
            await api.patch(`/students/${student.id}/status`, {
                status: nextStatus,
            });

            await loadStudents();

            setNotice(
                `Student ${
                    nextStatus === "active" ? "activated" : "deactivated"
                } successfully.`
            );
        } catch (err) {
            setError(getError(err));
        } finally {
            setChangingStatus(null);
        }
    }

    function getDepartmentName(student) {
        const department = departments.find(
            (item) =>
                String(item.id) === String(student.department_id)
        );

        return (
            student.department_name ||
            department?.name ||
            "Not assigned"
        );
    }

    function getProgramName(student) {
        const department = departments.find(
            (item) =>
                String(item.id) === String(student.department_id)
        );

        const programId =
            student.program_id ?? department?.program_id;

        const program = programs.find(
            (item) => String(item.id) === String(programId)
        );

        return student.program_name || program?.name || "—";
    }

    function getStatus(student) {
        return String(
            student.status ?? student.user_status ?? "active"
        ).toLowerCase();
    }

    return (
        <div className="students-page">
            <div className="students-heading">
                <div>
                    <h1>
                        {isAcademicDean
                            ? "Student Academic Records"
                            : "Student Management"}
                    </h1>

                    <p>
                        {isAcademicDean
                            ? "View students, manage academic details, and activate or deactivate student accounts."
                            : "Manage student accounts, academic details and status."}
                    </p>
                </div>

                {isAdmin && (
                    <div className="students-actions">
                        <Link
                            className="students-button students-button-secondary"
                            to="/admin/student-import"
                        >
                            Import Students
                        </Link>

                        <button
                            type="button"
                            className="students-button students-button-primary"
                            onClick={openCreateForm}
                        >
                            + Add Student
                        </button>
                    </div>
                )}
            </div>

            {error && (
                <div className="students-alert error" role="alert">
                    {error}
                </div>
            )}

            {notice && (
                <div className="students-alert success" role="status">
                    {notice}
                </div>
            )}

            <div className="students-stat-grid">
                <div className="students-stat">
                    <span>Total Students</span>
                    <strong>{students.length}</strong>
                </div>

                <div className="students-stat">
                    <span>Active Accounts</span>
                    <strong>{activeCount}</strong>
                </div>

                <div className="students-stat">
                    <span>Inactive Accounts</span>
                    <strong>{inactiveCount}</strong>
                </div>
            </div>

            {/* NEW: Show the temporary password after a successful reset */}
            {resetResult && (
                <div
                    className="student-reset-overlay"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setResetResult(null);
                            setCopyMessage("");
                        }
                    }}
                >
                    <section
                        className="student-reset-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="student-reset-title"
                    >
                        <div className="student-reset-dialog-heading">
                            <div className="student-reset-icon">
                                <KeyRound size={24} />
                            </div>

                            <button
                                type="button"
                                className="student-reset-close"
                                onClick={() => {
                                    setResetResult(null);
                                    setCopyMessage("");
                                }}
                                aria-label="Close password dialog"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <h2 id="student-reset-title">
                            Password reset successful
                        </h2>

                        <p className="student-reset-student-name">
                            {resetResult.studentName}
                        </p>

                        {resetResult.studentId && (
                            <p className="student-reset-student-id">
                                Student ID: {resetResult.studentId}
                            </p>
                        )}

                        {resetResult.username && (
                            <p className="student-reset-student-id">
                                Username: {resetResult.username}
                            </p>
                        )}

                        <div className="student-reset-warning">
                            <AlertTriangle size={19} />
                            <p>
                                Copy this temporary password and share it
                                privately with the student. Do not leave
                                this dialog visible to others.
                            </p>
                        </div>

                        <label
                            className="student-reset-password-label"
                            htmlFor="student-temporary-password"
                        >
                            Temporary password
                        </label>

                        <div className="student-reset-password-row">
                            <input
                                id="student-temporary-password"
                                type="text"
                                value={resetResult.temporaryPassword}
                                readOnly
                                autoComplete="off"
                                spellCheck={false}
                                onFocus={(event) => event.target.select()}
                            />

                            <button
                                type="button"
                                className="student-reset-copy-button"
                                onClick={copyTemporaryPassword}
                            >
                                {copyMessage === "Temporary password copied." ? (
                                    <Check size={17} />
                                ) : (
                                    <Copy size={17} />
                                )}
                                Copy
                            </button>
                        </div>

                        {copyMessage && (
                            <p
                                className="student-reset-copy-message"
                                role="status"
                            >
                                {copyMessage}
                            </p>
                        )}

                        <p className="student-reset-reminder">
                            The student must change this password after
                            logging in. This temporary password will not
                            be shown again after you close this dialog.
                        </p>

                        <button
                            type="button"
                            className="students-button students-button-primary student-reset-done"
                            onClick={() => {
                                setResetResult(null);
                                setCopyMessage("");
                            }}
                        >
                            Done
                        </button>
                    </section>
                </div>
            )}

            {showForm && (
                <section className="students-form-panel">
                    <div className="students-form-heading">
                        <h2>
                            {isAcademicDean
                                ? "Edit Academic Details"
                                : editingId !== null
                                    ? "Edit Student"
                                    : "Add Student"}
                        </h2>

                        <button
                            type="button"
                            className="students-close"
                            onClick={() => setShowForm(false)}
                            aria-label="Close form"
                        >
                            ×
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="students-form-grid">
                            {isAcademicDean ? (
                                <>
                                    <label>
                                        Student ID
                                        <input
                                            value={form.student_id}
                                            readOnly
                                        />
                                    </label>

                                    <label>
                                        Student Name
                                        <input
                                            value={`${form.first_name} ${form.last_name}`.trim()}
                                            readOnly
                                        />
                                    </label>
                                </>
                            ) : (
                                <>
                                    <label>
                                        Student ID
                                        <input
                                            name="student_id"
                                            value={form.student_id}
                                            onChange={updateField}
                                            required
                                        />
                                    </label>

                                    <label>
                                        First Name
                                        <input
                                            name="first_name"
                                            value={form.first_name}
                                            onChange={updateField}
                                            required
                                        />
                                    </label>

                                    <label>
                                        Last Name
                                        <input
                                            name="last_name"
                                            value={form.last_name}
                                            onChange={updateField}
                                            required
                                        />
                                    </label>
                                </>
                            )}

                            <label>
                                Program
                                <select
                                    name="program_id"
                                    value={form.program_id}
                                    onChange={updateField}
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
                                    onChange={updateField}
                                    required
                                >
                                    <option value="">
                                        Select department
                                    </option>

                                    {filteredDepartments.map((department) => (
                                        <option
                                            key={department.id}
                                            value={department.id}
                                        >
                                            {department.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                Academic Year
                                <select
                                    name="academic_year"
                                    value={form.academic_year}
                                    onChange={updateField}
                                    required
                                >
                                    <option value="">
                                        Select academic year
                                    </option>

                                    {academicYears.map((year) => {
                                        const yearValue =
                                            year.year_name ??
                                            year.academic_year ??
                                            year.name;

                                        return (
                                            <option
                                                key={year.id}
                                                value={yearValue ?? ""}
                                            >
                                                {yearValue ?? "Unnamed year"}
                                            </option>
                                        );
                                    })}
                                </select>
                            </label>
                        </div>

                        <div className="students-form-actions">
                            <button
                                type="button"
                                className="students-button students-button-secondary"
                                onClick={() => setShowForm(false)}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="students-button students-button-primary"
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : isAcademicDean
                                        ? "Save Academic Details"
                                        : editingId !== null
                                            ? "Save Changes"
                                            : "Create Student"}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            <section className="students-list-panel">
                <div className="students-toolbar">
                    <input
                        type="search"
                        placeholder="Search name, student ID, username..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        aria-label="Search students"
                    />

                    <select
                        value={departmentFilter}
                        onChange={(event) =>
                            setDepartmentFilter(event.target.value)
                        }
                        aria-label="Filter by department"
                    >
                        <option value="all">All departments</option>

                        {departments.map((department) => (
                            <option
                                key={department.id}
                                value={String(department.id)}
                            >
                                {department.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(event.target.value)
                        }
                        aria-label="Filter by account status"
                    >
                        <option value="all">All statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                {loading ? (
                    <div className="students-empty">
                        Loading students...
                    </div>
                ) : (
                    <div className="students-table-wrap">
                        <table className="students-table">
                            <thead>
                                <tr>
                                    <th>Student ID</th>
                                    <th>Student Name</th>
                                    <th>Program</th>
                                    <th>Department</th>
                                    <th>Academic Year</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredStudents.map((student) => {
                                    const studentStatus = getStatus(student);

                                    return (
                                        <tr key={student.id}>
                                            <td>{student.student_id ?? "—"}</td>

                                            <td>
                                                <strong>
                                                    {`${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() ||
                                                        student.username ||
                                                        "Unnamed Student"}
                                                </strong>

                                                {student.username && (
                                                    <small>{student.username}</small>
                                                )}
                                            </td>

                                            <td>{getProgramName(student)}</td>
                                            <td>{getDepartmentName(student)}</td>
                                            <td>{student.academic_year ?? "—"}</td>

                                            <td>
                                                <span
                                                    className={`students-status ${
                                                        studentStatus === "active"
                                                            ? "is-active"
                                                            : "is-inactive"
                                                    }`}
                                                >
                                                    {studentStatus}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="students-row-actions">
                                                    {(isAdmin || isAcademicDean) && (
                                                        <button
                                                            type="button"
                                                            className="students-action-edit"
                                                            onClick={() => openEditForm(student)}
                                                        >
                                                            {isAcademicDean
                                                                ? "Edit Academic Details"
                                                                : "Edit"}
                                                        </button>
                                                    )}

                                                    {canManageStudentStatus && (
                                                        <button
                                                            type="button"
                                                            className={
                                                                studentStatus === "active"
                                                                    ? "students-action-disable"
                                                                    : "students-action-enable"
                                                            }
                                                            disabled={changingStatus === student.id}
                                                            onClick={() => toggleStatus(student)}
                                                        >
                                                            {changingStatus === student.id
                                                                ? "Saving..."
                                                                : studentStatus === "active"
                                                                    ? "Deactivate"
                                                                    : "Activate"}
                                                        </button>
                                                    )}

                                                    {/* NEW: Admin-only reset button */}
                                                    {isAdmin && (
                                                        <button
                                                            type="button"
                                                            className="students-action-reset"
                                                            disabled={
                                                                resettingStudentId !== null ||
                                                                changingStatus === student.id
                                                            }
                                                            onClick={() => handleResetPassword(student)}
                                                            title="Generate a new temporary password"
                                                        >
                                                            <KeyRound size={15} />
                                                            {resettingStudentId === student.id
                                                                ? "Resetting..."
                                                                : "Reset Password"}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {!filteredStudents.length && (
                                    <tr>
                                        <td colSpan={7} className="students-empty">
                                            {students.length
                                                ? "No students match your filters."
                                                : "No students found."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
