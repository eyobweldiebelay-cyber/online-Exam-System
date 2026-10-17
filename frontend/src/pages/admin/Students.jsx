
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../../css/admin/students.css";

const emptyForm = {
    student_id: "",
    first_name: "",
    last_name: "",
    department_id: "",
    academic_year: "",
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
    return error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Something went wrong.";
}

export default function Students() {
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
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const loadStudents = useCallback(async () => {
        const response = await api.get("/students");
        setStudents(getRows(response));
    }, []);

    const loadReferenceData = useCallback(async () => {
        const results = await Promise.allSettled([
            api.get("/programs"),
            api.get("/departments"),
            api.get("/academic-years"),
        ]);

        if (results[0].status === "fulfilled") {
            setPrograms(getRows(results[0].value));
        }
        if (results[1].status === "fulfilled") {
            setDepartments(getRows(results[1].value));
        }
        if (results[2].status === "fulfilled") {
            setAcademicYears(getRows(results[2].value));
        }
    }, []);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            await Promise.all([loadStudents(), loadReferenceData()]);
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

            const matchesSearch = !term || [
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

            const status = String(
                student.status ?? student.user_status ?? "active"
            ).toLowerCase();

            const matchesStatus =
                statusFilter === "all" || status === statusFilter;

            const matchesDepartment =
                departmentFilter === "all" ||
                String(student.department_id) === departmentFilter;

            return matchesSearch && matchesStatus && matchesDepartment;
        });
    }, [students, departments, search, statusFilter, departmentFilter]);

    const activeCount = students.filter(
        (student) =>
            String(student.status ?? student.user_status ?? "active")
                .toLowerCase() === "active"
    ).length;

    const inactiveCount = students.length - activeCount;

    function openCreateForm() {
        setEditingId(null);
        setForm(emptyForm);
        setError("");
        setNotice("");
        setShowForm(true);
    }

    function openEditForm(student) {
        setEditingId(student.id);

        setForm({
            student_id: student.student_id ?? "",
            first_name: student.first_name ?? "",
            last_name: student.last_name ?? "",
            department_id: student.department_id
                ? String(student.department_id)
                : "",
            academic_year: student.academic_year ?? "",
            program_id: student.program_id
                ? String(student.program_id)
                : "",
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

            return { ...previous, [name]: value };
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSaving(true);
        setError("");
        setNotice("");

        try {
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

            setShowForm(false);
            setEditingId(null);
            setForm(emptyForm);
            await loadStudents();
        } catch (err) {
            setError(getError(err));
        } finally {
            setSaving(false);
        }
    }

    async function toggleStatus(student) {
        const currentStatus = String(
            student.status ?? student.user_status ?? "active"
        ).toLowerCase();

        const nextStatus =
            currentStatus === "active" ? "inactive" : "active";

        const name =
            `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() ||
            student.student_id ||
            "this student";

        if (
            !window.confirm(
                `Are you sure you want to ${nextStatus === "active" ? "activate" : "deactivate"} ${name}?`
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
                `Student ${nextStatus === "active" ? "activated" : "deactivated"} successfully.`
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

        return student.department_name ??
            department?.name ??
            "Not assigned";
    }

    function getProgramName(student) {
        const department = departments.find(
            (item) =>
                String(item.id) === String(student.department_id)
        );

        const programId = student.program_id ?? department?.program_id;

        const program = programs.find(
            (item) => String(item.id) === String(programId)
        );

        return student.program_name ?? program?.name ?? "—";
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
                    <h1>Student Management</h1>
                    <p>Manage student records, academic details and status.</p>
                </div>

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
            </div>

            {error && <div className="students-alert error">{error}</div>}
            {notice && <div className="students-alert success">{notice}</div>}

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

            {showForm && (
                <section className="students-form-panel">
                    <div className="students-form-heading">
                        <h2>
                            {editingId !== null
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

                            <label>
                                Program
                                <select
                                    name="program_id"
                                    value={form.program_id ?? ""}
                                    onChange={updateField}
                                >
                                    <option value="">All programs</option>
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
                                    <option value="">Select department</option>
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
                                    <option value="">Select academic year</option>
                                    {academicYears.map((year) => (
                                        <option
                                            key={year.id}
                                            value={year.year_name ?? year.academic_year ?? year.name}
                                        >
                                            {year.year_name ?? year.academic_year ?? year.name}
                                        </option>
                                    ))}
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
                        onChange={(event) => setStatusFilter(event.target.value)}
                        aria-label="Filter by account status"
                    >
                        <option value="all">All statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                {loading ? (
                    <div className="students-empty">Loading students...</div>
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
                                    const status = getStatus(student);

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
                                                    className={`students-status ${status === "active" ? "is-active" : "is-inactive"}`}
                                                >
                                                    {status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="students-row-actions">
                                                    <button
                                                        type="button"
                                                        className="students-action-edit"
                                                        onClick={() => openEditForm(student)}
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className={
                                                            status === "active"
                                                                ? "students-action-disable"
                                                                : "students-action-enable"
                                                        }
                                                        disabled={changingStatus === student.id}
                                                        onClick={() => toggleStatus(student)}
                                                    >
                                                        {changingStatus === student.id
                                                            ? "Saving..."
                                                            : status === "active"
                                                                ? "Deactivate"
                                                                : "Activate"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {!filteredStudents.length && (
                                    <tr>
                                        <td colSpan="7" className="students-empty">
                                            {students.length
                                                ? "No students match your filters."
                                                : "No students found. Add a student or import student records."}
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
