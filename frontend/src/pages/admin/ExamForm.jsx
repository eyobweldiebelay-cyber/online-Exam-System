
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../pages/services/api";

import { getAllPrograms } from "../services/programService";

import {
    createExam,
    getExamById,
    updateExam
} from "../../pages/services/examService";

import "../../css/admin/exams.css";

const ExamForm = ({ examId = null }) => {
    const navigate = useNavigate();

    const isEditMode = Boolean(examId);

    const [programs, setPrograms] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [formData, setFormData] = useState({
        title: "",
        program_id: "",
        department_id: "",
        academic_year: "",
        duration_minutes: "",
        total_questions: "",
        pass_mark: "",
        start_at: "",
        end_at: ""
    });

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(isEditMode);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // ==========================================
    // Load programs
    // ==========================================
    const loadPrograms = async () => {
        try {
            const response = await getAllPrograms();

            console.log("All programs returned by API:", response);

            const programList = Array.isArray(response)
                ? response
                : [];

            // Keep Degree and Diploma unless explicitly inactive.
            const availablePrograms = programList.filter(
                (program) =>
                    String(program.status ?? "").toLowerCase() !==
                    "inactive"
            );

            console.log("Programs displayed in dropdown:", availablePrograms);

            setPrograms(availablePrograms);

            return availablePrograms;
        } catch (err) {
            console.error("Failed to load programs:", err);

            setError(
                err.response?.data?.message ||
                "Failed to load programs."
            );

            setPrograms([]);
            return [];
        }
    };

    // ==========================================
    // Load departments
    // ==========================================
    const loadDepartments = async () => {
        try {
            const response = await api.get("/departments");

            const departmentList = Array.isArray(
                response.data.departments
            )
                ? response.data.departments
                : [];

            setDepartments(departmentList);

            return departmentList;
        } catch (err) {
            console.error("Failed to load departments:", err);

            setError(
                err.response?.data?.message ||
                "Failed to load departments"
            );

            return [];
        }
    };

    // ==========================================
    // Load exam when editing
    // ==========================================
    const loadExam = async (departmentList = []) => {
        try {
            setPageLoading(true);
            setError("");

            const response = await getExamById(examId);

            const exam = response.exam;

            if (!exam) {
                setError("Exam not found");
                return;
            }

            // Find the department belonging to this exam.
            const examDepartment = departmentList.find(
                (department) =>
                    Number(department.id) ===
                    Number(exam.department_id)
            );

            setFormData({
                title: exam.title || "",
                program_id: examDepartment?.program_id
                    ? String(examDepartment.program_id)
                    : "",
                department_id: String(exam.department_id || ""),
                academic_year: exam.academic_year || "",
                duration_minutes: exam.duration_minutes || "",
                total_questions: exam.total_questions || "",
                pass_mark: exam.pass_mark ?? "",
                start_at: formatDateTimeForInput(exam.start_at),
                end_at: formatDateTimeForInput(exam.end_at)
            });
        } catch (err) {
            console.error("Failed to load exam:", err);

            setError(
                err.response?.data?.message ||
                "Failed to load exam"
            );
        } finally {
            setPageLoading(false);
        }
    };

    // ==========================================
    // Load initial data
    // ==========================================
    useEffect(() => {
        const loadData = async () => {
            const departmentList = await loadDepartments();

            await loadPrograms();

            if (isEditMode) {
                await loadExam(departmentList);
            } else {
                setPageLoading(false);
            }
        };

        loadData();
    }, [examId]);

    // ==========================================
    // Convert backend date to datetime-local
    // ==========================================
    const formatDateTimeForInput = (date) => {
        if (!date) {
            return "";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "";
        }

        const year = parsedDate.getFullYear();

        const month = String(
            parsedDate.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            parsedDate.getDate()
        ).padStart(2, "0");

        const hours = String(
            parsedDate.getHours()
        ).padStart(2, "0");

        const minutes = String(
            parsedDate.getMinutes()
        ).padStart(2, "0");

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // ==========================================
    // Handle input and program selection
    // ==========================================
    const handleChange = (event) => {
        const { name, value } = event.target;

        // When program changes, clear the old department.
        if (name === "program_id") {
            setFormData((previous) => ({
                ...previous,
                program_id: value,
                department_id: ""
            }));

            return;
        }

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    // ==========================================
    // Submit
    // ==========================================
    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        // Basic frontend validation
        if (
            !formData.title.trim() ||
            !formData.program_id ||
            !formData.department_id ||
            !formData.academic_year ||
            !formData.duration_minutes ||
            !formData.total_questions ||
            formData.pass_mark === "" ||
            !formData.start_at ||
            !formData.end_at
        ) {
            setError("All exam fields are required.");
            return;
        }

        // Ensure selected department belongs to selected program.
        const selectedDepartment = departments.find(
            (department) =>
                Number(department.id) ===
                Number(formData.department_id)
        );

        if (
            !selectedDepartment ||
            Number(selectedDepartment.program_id) !==
                Number(formData.program_id)
        ) {
            setError(
                "Please select a department belonging to the selected program."
            );
            return;
        }

        if (Number(formData.duration_minutes) <= 0) {
            setError("Duration must be greater than 0.");
            return;
        }

        if (Number(formData.total_questions) <= 0) {
            setError("Total questions must be greater than 0.");
            return;
        }

        if (
            Number(formData.pass_mark) < 0 ||
            Number(formData.pass_mark) > 100
        ) {
            setError("Pass mark must be between 0 and 100.");
            return;
        }

        if (
            new Date(formData.start_at) >=
            new Date(formData.end_at)
        ) {
            setError(
                "Exam start time must be before end time."
            );
            return;
        }

        // Keep the existing backend payload.
        // Program is linked through department_id.
        const examData = {
            title: formData.title.trim(),
            department_id: Number(formData.department_id),
            academic_year: formData.academic_year,
            duration_minutes: Number(
                formData.duration_minutes
            ),
            total_questions: Number(
                formData.total_questions
            ),
            pass_mark: Number(formData.pass_mark),
            start_at: formData.start_at,
            end_at: formData.end_at
        };

        try {
            setLoading(true);

            if (isEditMode) {
                await updateExam(examId, examData);

                setSuccess("Exam updated successfully.");

                setTimeout(() => {
                    navigate("/admin/exams");
                }, 800);
            } else {
                await createExam(examData);

                setSuccess("Exam created successfully.");

                setTimeout(() => {
                    navigate("/admin/exams");
                }, 800);
            }
        } catch (err) {
            console.error("Save exam error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to save exam."
            );
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <div className="admin-exams-page">
                <div className="exam-loading">
                    Loading exam...
                </div>
            </div>
        );
    }

    return (
        <div className="admin-exams-page">

            <div className="exam-page-header">

                <div>
                    <h1>
                        {isEditMode
                            ? "Edit Exam"
                            : "Create Exam"}
                    </h1>

                    <p>
                        {isEditMode
                            ? "Update examination information."
                            : "Create a new college examination."}
                    </p>
                </div>

                <button
                    type="button"
                    className="exam-secondary-btn"
                    onClick={() => navigate("/admin/exams")}
                >
                    ← Back to Exams
                </button>

            </div>

            {error && (
                <div className="exam-error">
                    {error}
                </div>
            )}

            {success && (
                <div className="exam-success">
                    {success}
                </div>
            )}

            <div className="exam-form-card">

                <form onSubmit={handleSubmit}>

                    <div className="exam-form-grid">

                        {/* Title */}
                        <div className="exam-form-group full-width">
                            <label htmlFor="title">
                                Exam Title
                            </label>

                            <input
                                id="title"
                                name="title"
                                type="text"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g. Information Technology Final Exam"
                                disabled={loading}
                            />
                        </div>

                        {/* Program */}
                        <div className="exam-form-group">
                            <label htmlFor="program_id">
                                Program
                            </label>

                            <select
                                id="program_id"
                                name="program_id"
                                value={formData.program_id}
                                onChange={handleChange}
                                disabled={loading}
                                required
                            >
                                <option value="">
                                    Select program
                                </option>

                                {programs.map((program) => (
                                    <option
                                        key={program.id}
                                        value={String(program.id)}
                                    >
                                        {program.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Department */}
                        <div className="exam-form-group">
                            <label htmlFor="department_id">
                                Department
                            </label>

                            <select
                                id="department_id"
                                name="department_id"
                                value={formData.department_id}
                                onChange={handleChange}
                                disabled={
                                    loading || !formData.program_id
                                }
                                required
                            >
                                <option value="">
                                    {formData.program_id
                                        ? "Select department"
                                        : "Select program first"}
                                </option>

                                {departments
                                    .filter(
                                        (department) =>
                                            String(department.status ?? "").toLowerCase() !== "inactive" &&
                                            Number(department.program_id) ===
                                                Number(formData.program_id)
                                    )
                                    .map((department) => (
                                        <option
                                            key={department.id}
                                            value={String(department.id)}
                                        >
                                            {department.name}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        {/* Academic Year */}
                        <div className="exam-form-group">
                            <label htmlFor="academic_year">
                                Academic Year
                            </label>

                            <input
                                id="academic_year"
                                name="academic_year"
                                type="text"
                                value={formData.academic_year}
                                onChange={handleChange}
                                placeholder="e.g. 2026"
                                disabled={loading}
                            />
                        </div>

                        {/* Duration */}
                        <div className="exam-form-group">
                            <label htmlFor="duration_minutes">
                                Duration (minutes)
                            </label>

                            <input
                                id="duration_minutes"
                                name="duration_minutes"
                                type="number"
                                min="1"
                                value={formData.duration_minutes}
                                onChange={handleChange}
                                placeholder="60"
                                disabled={loading}
                            />
                        </div>

                        {/* Total Questions */}
                        <div className="exam-form-group">
                            <label htmlFor="total_questions">
                                Total Questions
                            </label>

                            <input
                                id="total_questions"
                                name="total_questions"
                                type="number"
                                min="1"
                                value={formData.total_questions}
                                onChange={handleChange}
                                placeholder="50"
                                disabled={loading}
                            />
                        </div>

                        {/* Pass Mark */}
                        <div className="exam-form-group">
                            <label htmlFor="pass_mark">
                                Pass Mark (%)
                            </label>

                            <input
                                id="pass_mark"
                                name="pass_mark"
                                type="number"
                                min="0"
                                max="100"
                                value={formData.pass_mark}
                                onChange={handleChange}
                                placeholder="50"
                                disabled={loading}
                            />
                        </div>

                        {/* Start */}
                        <div className="exam-form-group">
                            <label htmlFor="start_at">
                                Start Date &amp; Time
                            </label>

                            <input
                                id="start_at"
                                name="start_at"
                                type="datetime-local"
                                value={formData.start_at}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        {/* End */}
                        <div className="exam-form-group">
                            <label htmlFor="end_at">
                                End Date &amp; Time
                            </label>

                            <input
                                id="end_at"
                                name="end_at"
                                type="datetime-local"
                                value={formData.end_at}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                    </div>

                    <div className="exam-form-actions">

                        <button
                            type="button"
                            className="exam-secondary-btn"
                            onClick={() =>
                                navigate("/admin/exams")
                            }
                            disabled={loading}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="exam-submit-btn"
                            disabled={loading}
                        >
                            {loading
                                ? "Saving..."
                                : isEditMode
                                    ? "Update Exam"
                                    : "Create Exam"}
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
};

export default ExamForm;
