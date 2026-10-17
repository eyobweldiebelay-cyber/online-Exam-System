
import { useEffect, useMemo, useState } from "react";
import api from "../../pages/services/api";
import "../../css/teacher/dashboard.css";

export default function TeacherStudents() {
    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadStudents() {
            setLoading(true);
            setError("");

            try {
                // Correct endpoint for the teacher workspace backend
                const response = await api.get(
                    "/teacher-workspace/students"
                );

                const data = response?.data;

                const rows = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.students)
                      ? data.students
                      : Array.isArray(data?.data)
                        ? data.data
                        : [];

                if (!cancelled) {
                    setStudents(rows);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err?.response?.data?.message ||
                            "Unable to load students. Please check the teacher workspace API."
                    );

                    console.error(
                        "Teacher students error:",
                        err?.response?.data || err?.message
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadStudents();

        return () => {
            cancelled = true;
        };
    }, []);

    const filteredStudents = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return students;

        return students.filter((student) => {
            const searchableValues = [
                student.full_name,
                student.name,
                student.username,
                student.student_code,
                student.email,
                student.program_name,
                student.department_name,
            ];

            return searchableValues.some((value) =>
                String(value || "").toLowerCase().includes(query)
            );
        });
    }, [students, search]);

    function getStudentName(student) {
        return (
            student.full_name ||
            student.name ||
            student.username ||
            "Unnamed student"
        );
    }

    function getInitials(student) {
        return getStudentName(student)
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join("");
    }

    return (
        <div className="teacher-page teacher-students-page">
            <div className="teacher-page-header">
                <div>
                    <p className="teacher-eyebrow">
                        ACADEMIC MANAGEMENT
                    </p>

                    <h1>Students</h1>

                    <p className="teacher-page-description">
                        View students available within your teaching assignment.
                    </p>
                </div>
            </div>

            <div className="teacher-students-toolbar">
                <div className="teacher-students-count">
                    <strong>{filteredStudents.length}</strong>

                    <span>
                        {filteredStudents.length === 1
                            ? " student"
                            : " students"}
                    </span>
                </div>

                <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search students..."
                    aria-label="Search students"
                    className="teacher-students-search"
                />
            </div>

            {error && (
                <div
                    className="teacher-alert teacher-alert-error"
                    role="alert"
                >
                    {error}
                </div>
            )}

            {loading ? (
                <div className="teacher-empty-state">
                    Loading students...
                </div>
            ) : !error && filteredStudents.length === 0 ? (
                <div className="teacher-empty-state">
                    <h3>No students found</h3>

                    <p>
                        {search
                            ? "Try another search term."
                            : "No student records are available for this view yet."}
                    </p>
                </div>
            ) : !error ? (
                <div className="teacher-table-container">
                    <table className="teacher-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Username / Student ID</th>
                             {/*<th>Email</th>*/}   
                                <th>Program</th>
                                <th>Department</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredStudents.map((student, index) => (
                                <tr
                                    key={
                                        student.id ||
                                        student.student_id ||
                                        student.student_code ||
                                        student.username ||
                                        index
                                    }
                                >
                                    <td>
                                        <div className="teacher-student-identity">
                                            <span className="teacher-student-avatar">
                                                {getInitials(student) || "S"}
                                            </span>

                                            <strong>
                                                {getStudentName(student)}
                                            </strong>
                                        </div>
                                    </td>

                                    <td>
                                        {student.student_code ||
                                            student.username ||
                                            student.id ||
                                            student.student_id ||
                                            "—"}
                                    </td>

                                   {/*<td>{student.email || "—"}</td>*/} 

                                    <td>{student.program_name || "—"}</td>

                                    <td>{student.department_name || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    );
}
