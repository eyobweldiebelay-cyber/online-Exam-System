
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    getAllTeachers,
    updateTeacher,
} from "../services/teacher";
import { getAllPrograms } from "../services/programService";
import { getAllDepartments } from "../services/departmentService";
import "../../css/teacher/TeacherAssignments.css";

const getList = (response, key) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.[key])) return response.data[key];
    if (Array.isArray(response?.[key])) return response[key];
    return [];
};

const getTeacherId = (teacher) =>
    teacher?.id ?? teacher?.teacher_id ?? teacher?.user_id;

const getProgramId = (teacher) =>
    teacher?.program_id ?? teacher?.programId ?? "";

const getDepartmentId = (teacher) =>
    teacher?.department_id ?? teacher?.departmentId ?? "";

const getProgramName = (program) =>
    program?.name ?? program?.program_name ?? program?.programName ?? "";

const getDepartmentName = (department) =>
    department?.name ??
    department?.department_name ??
    department?.departmentName ??
    "";

const getErrorMessage = (error, fallback) =>
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    fallback;

const hasAssignment = (teacher) =>
    Boolean(getProgramId(teacher) && getDepartmentId(teacher));

export default function TeacherAssignments() {
    const [teachers, setTeachers] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [selectedTeacherId, setSelectedTeacherId] = useState("");
    const [programId, setProgramId] = useState("");
    const [departmentId, setDepartmentId] = useState("");

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const selectedTeacher = teachers.find(
        (teacher) =>
            String(getTeacherId(teacher)) === String(selectedTeacherId)
    );

    const isEditing = Boolean(selectedTeacher);

    const filteredDepartments = useMemo(() => {
        if (!programId) return [];

        return departments.filter((department) => {
            const departmentProgramId =
                department?.program_id ?? department?.programId;

            return String(departmentProgramId) === String(programId);
        });
    }, [departments, programId]);

    const filteredTeachers = useMemo(() => {
        const term = search.trim().toLowerCase();

        return teachers.filter((teacher) => {
            const assigned = hasAssignment(teacher);

            if (filter === "assigned" && !assigned) return false;
            if (filter === "unassigned" && assigned) return false;

            if (!term) return true;

            const program = programs.find(
                (item) => String(item.id) === String(getProgramId(teacher))
            );

            const department = departments.find(
                (item) => String(item.id) === String(getDepartmentId(teacher))
            );

            const values = [
                teacher?.username,
                teacher?.full_name,
                teacher?.name,
                teacher?.program_name,
                teacher?.department_name,
                getProgramName(program || {}),
                getDepartmentName(department || {}),
            ];

            return values.some((value) =>
                String(value ?? "").toLowerCase().includes(term)
            );
        });
    }, [teachers, programs, departments, search, filter]);

    const assignedCount = useMemo(
        () => teachers.filter(hasAssignment).length,
        [teachers]
    );

    const unassignedCount = teachers.length - assignedCount;

    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");

        const requests = [
            {
                name: "GET /api/teachers",
                request: getAllTeachers,
                key: "teachers",
                setData: setTeachers,
            },
            {
                name: "GET /api/programs",
                request: getAllPrograms,
                key: "programs",
                setData: setPrograms,
            },
            {
                name: "GET /api/departments",
                request: getAllDepartments,
                key: "departments",
                setData: setDepartments,
            },
        ];

        try {
            const results = await Promise.allSettled(
                requests.map((item) => item.request())
            );

            const failures = [];

            results.forEach((result, index) => {
                const item = requests[index];

                if (result.status === "fulfilled") {
                    item.setData(getList(result.value, item.key));
                } else {
                    const err = result.reason;

                    console.error(`${item.name} failed:`, {
                        status: err?.response?.status,
                        response: err?.response?.data,
                        message: err?.message,
                    });

                    failures.push(
                        `${item.name}: ${
                            err?.response?.data?.message ||
                            err?.response?.data?.error ||
                            err?.message ||
                            "Request failed"
                        }`
                    );
                }
            });

            if (failures.length > 0) {
                setError(failures.join(" | "));
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const clearForm = () => {
        setSelectedTeacherId("");
        setProgramId("");
        setDepartmentId("");
        setError("");
        setSuccess("");
    };

    const selectTeacher = (teacher) => {
        setSelectedTeacherId(String(getTeacherId(teacher)));
        setProgramId(String(getProgramId(teacher)));
        setDepartmentId(String(getDepartmentId(teacher)));
        setError("");
        setSuccess("");
    };

    const handleProgramChange = (value) => {
        setProgramId(value);
        setDepartmentId("");
        setError("");
        setSuccess("");
    };

    const handleSave = async (event) => {
        event.preventDefault();

        if (!selectedTeacher) {
            setError("Please select an existing teacher.");
            return;
        }

        if (!programId || !departmentId) {
            setError("Please select both a program and a department.");
            return;
        }

        const validDepartment = filteredDepartments.some(
            (department) => String(department.id) === String(departmentId)
        );

        if (!validDepartment) {
            setError(
                "Please select a department that belongs to the selected program."
            );
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            // Keep the existing API contract. Backend authorization must
            // restrict Academic Dean changes to assignment fields.
            await updateTeacher(getTeacherId(selectedTeacher), {
                username: selectedTeacher.username,
                program_id: Number(programId),
                department_id: Number(departmentId),
            });

            await loadData();
            clearForm();
            setSuccess("Teacher assignment saved successfully.");
        } catch (err) {
            setError(
                getErrorMessage(err, "Unable to save the teacher assignment.")
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="teacher-assignments-page">
            <header className="teacher-assignments-header">
                <div className="assignment-heading-icon" aria-hidden="true">
                    <span>TA</span>
                </div>

                <div className="assignment-heading-copy">
                    <span className="assignment-eyebrow">
                        ACADEMIC ADMINISTRATION
                    </span>
                    <h2>Teacher Assignments</h2>
                    <p>
                        Assign teachers to their academic departments and
                        manage their current assignments.
                    </p>
                </div>

                <button
                    type="button"
                    className="assignment-refresh-button"
                    onClick={loadData}
                    disabled={loading || saving}
                >
                    <span aria-hidden="true">↻</span>
                    Refresh
                </button>
            </header>

            {error && (
                <div className="assignment-message assignment-error" role="alert">
                    <strong>Attention</strong>
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div
                    className="assignment-message assignment-success"
                    role="status"
                >
                    <strong>Success</strong>
                    <span>{success}</span>
                </div>
            )}

            <section className="assignment-stats" aria-label="Teacher summary">
                <article className="assignment-stat-card">
                    <div className="assignment-stat-icon assignment-stat-blue">
                        <span aria-hidden="true">♙</span>
                    </div>
                    <div>
                        <p>Total Teachers</p>
                        <strong>{loading ? "—" : teachers.length}</strong>
                        <small>Existing teacher accounts</small>
                    </div>
                </article>

                <article className="assignment-stat-card">
                    <div className="assignment-stat-icon assignment-stat-green">
                        <span aria-hidden="true">✓</span>
                    </div>
                    <div>
                        <p>Assigned</p>
                        <strong>{loading ? "—" : assignedCount}</strong>
                        <small>Teachers with a department</small>
                    </div>
                </article>

                <article className="assignment-stat-card">
                    <div className="assignment-stat-icon assignment-stat-orange">
                        <span aria-hidden="true">!</span>
                    </div>
                    <div>
                        <p>Unassigned</p>
                        <strong>{loading ? "—" : unassignedCount}</strong>
                        <small>Teachers needing assignment</small>
                    </div>
                </article>
            </section>

            <section className="assignment-panel">
                <div className="assignment-section-heading">
                    <div>
                        <span className="assignment-section-number">01</span>
                        <h3>{isEditing ? "Edit Assignment" : "Assign a Teacher"}</h3>
                    </div>
                    <p>Teacher accounts are created by the Admin.</p>
                </div>

                <form onSubmit={handleSave}>
                    <div className="assignment-form-grid">
                        <div className="assignment-field">
                            <label htmlFor="assignment-teacher">
                                Existing Teacher <span>*</span>
                            </label>

                            <select
                                id="assignment-teacher"
                                value={selectedTeacherId}
                                onChange={(event) => {
                                    const teacher = teachers.find(
                                        (item) =>
                                            String(getTeacherId(item)) ===
                                            event.target.value
                                    );

                                    if (teacher) {
                                        selectTeacher(teacher);
                                    } else {
                                        clearForm();
                                    }
                                }}
                                disabled={loading || saving}
                                required
                            >
                                <option value="">Select a teacher</option>
                                {teachers.map((teacher) => (
                                    <option
                                        key={getTeacherId(teacher)}
                                        value={getTeacherId(teacher)}
                                    >
                                        {teacher.full_name || teacher.name
                                            ? `${teacher.full_name || teacher.name} (${teacher.username})`
                                            : teacher.username}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="assignment-field">
                            <label htmlFor="assignment-program">
                                Academic Program <span>*</span>
                            </label>

                            <select
                                id="assignment-program"
                                value={programId}
                                onChange={(event) =>
                                    handleProgramChange(event.target.value)
                                }
                                disabled={!selectedTeacher || saving}
                                required
                            >
                                <option value="">Select a program</option>
                                {programs.map((program) => (
                                    <option key={program.id} value={program.id}>
                                        {getProgramName(program)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="assignment-field assignment-field-full">
                            <label htmlFor="assignment-department">
                                Department <span>*</span>
                            </label>

                            <select
                                id="assignment-department"
                                value={departmentId}
                                onChange={(event) => {
                                    setDepartmentId(event.target.value);
                                    setError("");
                                    setSuccess("");
                                }}
                                disabled={!programId || saving}
                                required
                            >
                                <option value="">
                                    {programId
                                        ? "Select a department"
                                        : "Select a program first"}
                                </option>

                                {filteredDepartments.map((department) => (
                                    <option
                                        key={department.id}
                                        value={department.id}
                                    >
                                        {getDepartmentName(department)}
                                    </option>
                                ))}
                            </select>

                            <small>
                                Only departments belonging to the selected
                                program are displayed.
                            </small>

                            {programId && filteredDepartments.length === 0 && (
                                <small className="assignment-field-warning">
                                    No departments were found for this program.
                                </small>
                            )}
                        </div>
                    </div>

                    <div className="assignment-actions">
                        <button
                            type="submit"
                            className="assignment-save-button"
                            disabled={loading || saving || !selectedTeacher}
                        >
                            {saving
                                ? "Saving assignment..."
                                : isEditing
                                  ? "Save Changes"
                                  : "Save Assignment"}
                        </button>

                        <button
                            type="button"
                            className="assignment-cancel"
                            onClick={clearForm}
                            disabled={saving}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </section>

            <section className="assignment-list-panel">
                <div className="assignment-list-header">
                    <div>
                        <span className="assignment-section-number">02</span>
                        <h3>Existing Teacher Assignments</h3>
                        <p>Review current assignments and update them when needed.</p>
                    </div>

                    <div className="assignment-list-count">
                        {loading ? "Loading..." : `${filteredTeachers.length} records`}
                    </div>
                </div>

                <div className="assignment-toolbar">
                    <div className="assignment-search">
                        <span aria-hidden="true">⌕</span>
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search teacher, program, or department..."
                            aria-label="Search teacher assignments"
                        />
                    </div>

                    <div className="assignment-filter-group" aria-label="Filter teachers">
                        {[
                            { value: "all", label: "All Teachers" },
                            { value: "assigned", label: "Assigned" },
                            { value: "unassigned", label: "Unassigned" },
                        ].map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={
                                    filter === option.value
                                        ? "assignment-filter active"
                                        : "assignment-filter"
                                }
                                onClick={() => setFilter(option.value)}
                                aria-pressed={filter === option.value}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="assignment-table-state">
                        <span className="assignment-loading-indicator" />
                        Loading teacher assignments...
                    </div>
                ) : (
                    <div className="assignment-table-wrapper">
                        <table className="assignment-table">
                            <thead>
                                <tr>
                                    <th>Teacher</th>
                                    <th>Academic Program</th>
                                    <th>Department</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredTeachers.map((teacher) => {
                                    const program = programs.find(
                                        (item) =>
                                            String(item.id) ===
                                            String(getProgramId(teacher))
                                    );

                                    const department = departments.find(
                                        (item) =>
                                            String(item.id) ===
                                            String(getDepartmentId(teacher))
                                    );

                                    const assigned = hasAssignment(teacher);

                                    return (
                                        <tr key={getTeacherId(teacher)}>
                                            <td>
                                                <div className="assignment-teacher-cell">
                                                    <span className="assignment-avatar">
                                                        {String(
                                                            teacher.full_name ||
                                                            teacher.name ||
                                                            teacher.username ||
                                                            "T"
                                                        )
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </span>
                                                    <div>
                                                        <strong>
                                                            {teacher.full_name ||
                                                                teacher.name ||
                                                                teacher.username}
                                                        </strong>
                                                        {teacher.username && (
                                                            <small>{teacher.username}</small>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                {teacher.program_name ||
                                                    getProgramName(program || {}) ||
                                                    "Not assigned"}
                                            </td>

                                            <td>
                                                {teacher.department_name ||
                                                    getDepartmentName(department || {}) ||
                                                    "Not assigned"}
                                            </td>

                                            <td>
                                                <span
                                                    className={
                                                        assigned
                                                            ? "assignment-status assignment-status-assigned"
                                                            : "assignment-status assignment-status-unassigned"
                                                    }
                                                >
                                                    <span />
                                                    {assigned
                                                        ? "Assigned"
                                                        : "Unassigned"}
                                                </span>
                                            </td>

                                            <td>
                                                <button
                                                    type="button"
                                                    className="assignment-edit-button"
                                                    onClick={() =>
                                                        selectTeacher(teacher)
                                                    }
                                                    disabled={saving}
                                                >
                                                    <span aria-hidden="true">✎</span>
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {filteredTeachers.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="assignment-empty">
                                            <span aria-hidden="true">⌕</span>
                                            <strong>No teachers found</strong>
                                            <small>
                                                Try changing your search or assignment filter.
                                            </small>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <footer className="assignment-page-footer">
                <span>INJIBARA UNIVERSITY</span>
                <span>Academic Administration · Teacher Assignments</span>
            </footer>
        </main>
    );
}
