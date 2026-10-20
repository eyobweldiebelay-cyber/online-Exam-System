
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Download, Upload } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

import {
    getQuestionById,
    updateQuestion,
    importQuestions
} from "../services/questionService";

import { getAllDepartments } from "../../pages/services/departmentService";
import { getAllPrograms } from "../../pages/services/programService";
import { getAllAcademicYears } from "../services/academicYearService";

import "../../css/teacher/question.css";

const emptyOptions = () => [
    { option_text: "", is_correct: true },
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false }
];

function TeacherQuestionForm() {
    const navigate = useNavigate();
    const { questionId } = useParams();
    const { user } = useAuth();

    const isEditMode = Boolean(questionId);

    let savedUser = null;

    try {
        savedUser = JSON.parse(localStorage.getItem("user") || "null");
    } catch (error) {
        console.error("Unable to read saved user:", error);
    }

    const departmentId =
        Number(user?.department_id ?? savedUser?.department_id) || 0;

    const [programs, setPrograms] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [academicYears, setAcademicYears] = useState([]);
    const [selectedAcademicYearId, setSelectedAcademicYearId] = useState("");
    const [academicYearLoading, setAcademicYearLoading] = useState(true);
    const [academicYearLoadError, setAcademicYearLoadError] = useState("");

    const [formData, setFormData] = useState({
        question_text: "",
        marks: 1
    });

    const [options, setOptions] = useState(emptyOptions());

    const [importFile, setImportFile] = useState(null);
    const [importResult, setImportResult] = useState(null);

    const [pageLoading, setPageLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const assignedDepartment = departments.find(
        (department) => Number(department.id) === departmentId
    );

    const assignedProgram = programs.find(
        (program) =>
            Number(program.id) === Number(assignedDepartment?.program_id)
    );

    // Load active academic years for importing questions.
    useEffect(() => {
        let cancelled = false;

        async function loadAcademicYears() {
            setAcademicYearLoading(true);
            setAcademicYearLoadError("");

            try {
                const result = await getAllAcademicYears();

                const yearList = Array.isArray(result)
                    ? result
                    : result?.academicYears ||
                      result?.academic_years ||
                      [];

                const activeYears = yearList.filter(
                    (year) =>
                        String(year.status).toLowerCase() === "active"
                );

                if (!cancelled) {
                    setAcademicYears(activeYears);
                }
            } catch (err) {
                console.error("Load academic years:", err);

                if (!cancelled) {
                    setAcademicYearLoadError(
                        err.response?.data?.message ||
                        "Unable to load academic years. Please refresh and try again."
                    );
                }
            } finally {
                if (!cancelled) {
                    setAcademicYearLoading(false);
                }
            }
        }

        loadAcademicYears();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function loadForm() {
            setPageLoading(true);
            setError("");

            try {
                const [programResult, departmentResult] =
                    await Promise.all([
                        getAllPrograms(),
                        getAllDepartments()
                    ]);

                const programList = Array.isArray(programResult)
                    ? programResult
                    : programResult?.programs || [];

                const departmentList = Array.isArray(departmentResult)
                    ? departmentResult
                    : departmentResult?.departments || [];

                if (cancelled) return;

                setPrograms(programList);
                setDepartments(departmentList);

                if (isEditMode) {
                    if (!departmentId) {
                        throw new Error(
                            "Your login response has no department_id. Please log in again and check your account assignment."
                        );
                    }

                    const question = await getQuestionById(questionId);

                    if (cancelled) return;

                    if (Number(question.department_id) !== departmentId) {
                        throw new Error(
                            "You cannot edit a question outside your assigned department."
                        );
                    }

                    setFormData({
                        question_text: question.question_text || "",
                        marks: question.marks ?? 1
                    });

                    if (
                        Array.isArray(question.options) &&
                        question.options.length > 0
                    ) {
                        setOptions(
                            question.options.map((option) => ({
                                option_text: option.option_text || "",
                                is_correct:
                                    option.is_correct === true ||
                                    Number(option.is_correct) === 1
                            }))
                        );
                    }
                } else if (departmentId) {
                    const myDepartment = departmentList.find(
                        (department) =>
                            Number(department.id) === departmentId
                    );

                    if (!myDepartment) {
                        throw new Error(
                            "Your assigned department was not found. Contact the administrator."
                        );
                    }
                }
            } catch (err) {
                if (!cancelled) {
                    console.error("Load Teacher question page:", err);

                    setError(
                        err.response?.data?.message ||
                        err.message ||
                        "Unable to load the page."
                    );
                }
            } finally {
                if (!cancelled) setPageLoading(false);
            }
        }

        loadForm();

        return () => {
            cancelled = true;
        };
    }, [questionId, isEditMode, departmentId]);

    const handleQuestionChange = (event) => {
        setFormData((previous) => ({
            ...previous,
            question_text: event.target.value
        }));
    };

    const handleMarksChange = (event) => {
        setFormData((previous) => ({
            ...previous,
            marks: event.target.value
        }));
    };

    const handleOptionChange = (index, value) => {
        setOptions((previous) =>
            previous.map((option, i) =>
                i === index
                    ? { ...option, option_text: value }
                    : option
            )
        );
    };

    const handleCorrectAnswer = (index) => {
        setOptions((previous) =>
            previous.map((option, i) => ({
                ...option,
                is_correct: i === index
            }))
        );
    };

    // Download the CSV template.
    const handleDownloadTemplate = () => {
        const headers = [
            "Question",
            "Option A",
            "Option B",
            "Option C",
            "Option D",
            "Correct Answer",
            "Marks"
        ];

        const csvContent =
            "\uFEFF" +
            headers.map((header) => `"${header}"`).join(",") +
            "\r\n";

        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "Teacher_Question_Import_Template.csv";

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    };

    // Validate the selected file before importing.
    const handleImportFileChange = (event) => {
        const file = event.target.files?.[0] || null;

        setError("");
        setImportResult(null);

        if (!file) {
            setImportFile(null);
            return;
        }

        if (!/\.(csv|xlsx)$/i.test(file.name)) {
            setImportFile(null);
            event.target.value = "";
            setError("Only CSV and Excel (.xlsx) files are supported.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setImportFile(null);
            event.target.value = "";
            setError("Maximum file size is 5 MB.");
            return;
        }

        setImportFile(file);
    };

    const handleImport = async (event) => {
        event.preventDefault();
        setError("");
        setImportResult(null);

        if (!departmentId || !assignedDepartment) {
            setError(
                "Your assigned department is unavailable. Please ask the administrator to verify your Teacher account assignment."
            );
            return;
        }

        if (!assignedProgram) {
            setError(
                "Your assigned program could not be found. Please contact the administrator."
            );
            return;
        }

        if (!selectedAcademicYearId) {
            setError("Please select an academic year.");
            return;
        }

        if (!importFile) {
            setError("Please select a CSV or Excel (.xlsx) file.");
            return;
        }

        if (!/\.(csv|xlsx)$/i.test(importFile.name)) {
            setError("Only CSV and XLSX files are supported.");
            return;
        }

        if (importFile.size > 5 * 1024 * 1024) {
            setError("Maximum file size is 5 MB.");
            return;
        }

        try {
            setSaving(true);

            const result = await importQuestions(
                importFile,
                assignedProgram.id,
                assignedDepartment.id,
                selectedAcademicYearId
            );

            setImportResult(result);
            setImportFile(null);

            const fileInput = document.getElementById(
                "teacher-import-file"
            );

            if (fileInput) {
                fileInput.value = "";
            }
        } catch (err) {
            console.error("Import Teacher questions:", err);

            setError(
                err.response?.data?.message ||
                "Failed to import questions. Check your spreadsheet and try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const validateEditForm = () => {
        if (!departmentId || !assignedDepartment) {
            return "Your assigned department is invalid.";
        }

        if (!formData.question_text.trim()) {
            return "Please enter the question.";
        }

        if (
            formData.marks === "" ||
            !Number.isFinite(Number(formData.marks)) ||
            Number(formData.marks) <= 0
        ) {
            return "Marks must be greater than zero.";
        }

        if (options.some((option) => !option.option_text.trim())) {
            return "Please complete all four answer options.";
        }

        if (options.filter((option) => option.is_correct).length !== 1) {
            return "Select exactly one correct answer.";
        }

        return "";
    };

    const handleEditSubmit = async (event) => {
        event.preventDefault();

        const validationError = validateEditForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setSaving(true);
            setError("");

            await updateQuestion(questionId, {
                department_id: departmentId,
                question_text: formData.question_text.trim(),
                marks: Number(formData.marks),
                options: options.map((option) => ({
                    option_text: option.option_text.trim(),
                    is_correct: option.is_correct
                }))
            });

            navigate("/teacher/questions");
        } catch (err) {
            console.error("Update Teacher question:", err);

            setError(
                err.response?.data?.message ||
                "Failed to update the question."
            );
        } finally {
            setSaving(false);
        }
    };

    if (pageLoading) {
        return (
            <main className="teacher-question-form-page">
                <p className="teacher-form-loading">Loading...</p>
            </main>
        );
    }

    return (
        <main className="teacher-question-form-page">
            <header className="teacher-form-header">
                <div>
                    <p className="teacher-form-eyebrow">
                        TEACHER WORKSPACE
                    </p>

                    <h1>
                        {isEditMode ? "Edit Question" : "Import Questions"}
                    </h1>

                    <p>
                        {isEditMode
                            ? "Manage multiple-choice questions for your assigned department."
                            : "Upload a spreadsheet containing multiple-choice questions."}
                    </p>
                </div>

                <button
                    type="button"
                    className="teacher-secondary-button"
                    onClick={() => navigate("/teacher/questions")}
                    disabled={saving}
                >
                    Back to Questions
                </button>
            </header>

            {error && (
                <div className="teacher-form-error" role="alert">
                    {error}
                </div>
            )}

            {!isEditMode ? (
                <form
                    className="teacher-question-form"
                    onSubmit={handleImport}
                >
                    <section className="teacher-form-section">
                        <h2>Question Information</h2>

                        <div className="teacher-form-grid">
                            <div className="teacher-field">
                                <label htmlFor="teacher-program">
                                    Program
                                </label>

                                <input
                                    id="teacher-program"
                                    value={
                                        assignedProgram?.name ||
                                        "Department assignment unavailable"
                                    }
                                    readOnly
                                />
                            </div>

                            <div className="teacher-field">
                                <label htmlFor="teacher-department">
                                    Assigned Department
                                </label>

                                <input
                                    id="teacher-department"
                                    value={
                                        assignedDepartment?.name ||
                                        "Department assignment unavailable"
                                    }
                                    readOnly
                                />
                            </div>

                            <div className="teacher-field">
                                <label htmlFor="teacher-academic-year">
                                    Academic Year
                                </label>

                                <select
                                    id="teacher-academic-year"
                                    value={selectedAcademicYearId}
                                    onChange={(event) => {
                                        setSelectedAcademicYearId(
                                            event.target.value
                                        );
                                        setError("");
                                        setImportResult(null);
                                    }}
                                    required
                                    disabled={
                                        saving ||
                                        academicYearLoading ||
                                        academicYears.length === 0
                                    }
                                >
                                    <option value="">
                                        {academicYearLoading
                                            ? "Loading academic years..."
                                            : "Select academic year"}
                                    </option>

                                    {academicYears.map((year) => (
                                        <option
                                            key={year.id}
                                            value={year.id}
                                        >
                                            {year.academic_year}
                                        </option>
                                    ))}
                                </select>

                                {academicYearLoadError && (
                                    <p
                                        className="teacher-form-error"
                                        role="alert"
                                    >
                                        {academicYearLoadError}
                                    </p>
                                )}

                                {!academicYearLoading &&
                                    !academicYearLoadError &&
                                    academicYears.length === 0 && (
                                        <p role="status">
                                            No active academic years are
                                            available. Ask the administrator
                                            to activate an academic year.
                                        </p>
                                    )}
                            </div>
                        </div>
                    </section>

                    <section className="teacher-form-section teacher-upload-section">
                        <h2>Upload question list</h2>

                        <p className="teacher-upload-description">
                            Supported formats: CSV and Excel (.xlsx)
                        </p>

                        <button
                            type="button"
                            className="teacher-template-link"
                            onClick={handleDownloadTemplate}
                            disabled={saving}
                        >
                            <Download size={16} />
                            Download CSV template
                        </button>

                        <div className="teacher-field">
                            <label htmlFor="teacher-import-file">
                                Choose a question list file
                            </label>

                            <label
                                htmlFor="teacher-import-file"
                                className="teacher-file-dropzone"
                            >
                                <Upload size={28} />

                                <span>
                                    {importFile
                                        ? importFile.name
                                        : "Click here to select a .csv or .xlsx file"}
                                </span>

                                <small>
                                    Maximum file size: 5 MB
                                </small>
                            </label>

                            <input
                                id="teacher-import-file"
                                type="file"
                                accept=".csv,.xlsx"
                                className="teacher-hidden-file-input"
                                onChange={handleImportFileChange}
                                disabled={saving}
                                required
                            />
                        </div>
                    </section>

                    {importResult && (
                        <div
                            className="teacher-form-success"
                            role="status"
                        >
                            <h3>Import Result</h3>
                            <p>
                                {importResult.message ||
                                    `Imported ${
                                        importResult.imported_count ??
                                        importResult.imported ??
                                        "the"
                                    } questions successfully.`}
                            </p>
                        </div>
                    )}

                    <footer className="teacher-form-actions">
                        <button
                            type="button"
                            className="teacher-secondary-button"
                            onClick={() => navigate("/teacher/questions")}
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="teacher-primary-button"
                            disabled={
                                saving ||
                                !departmentId ||
                                academicYearLoading ||
                                academicYears.length === 0
                            }
                        >
                            <Upload size={17} />
                            {saving ? "Importing..." : "Upload and import"}
                        </button>
                    </footer>
                </form>
            ) : (
                <form
                    className="teacher-question-form"
                    onSubmit={handleEditSubmit}
                >
                    <section className="teacher-form-section">
                        <h2>Question Information</h2>

                        <div className="teacher-form-grid">
                            <div className="teacher-field">
                                <label>Program</label>
                                <input
                                    value={assignedProgram?.name || ""}
                                    readOnly
                                />
                            </div>

                            <div className="teacher-field">
                                <label>Assigned Department</label>
                                <input
                                    value={assignedDepartment?.name || ""}
                                    readOnly
                                />
                            </div>
                        </div>

                        <div className="teacher-field">
                            <label htmlFor="teacher-question-text">
                                Question
                            </label>

                            <textarea
                                id="teacher-question-text"
                                value={formData.question_text}
                                onChange={handleQuestionChange}
                                placeholder="Enter the examination question..."
                                rows={5}
                                required
                                disabled={saving}
                            />
                        </div>

                        <div className="teacher-field teacher-marks-field">
                            <label htmlFor="teacher-question-marks">
                                Marks
                            </label>

                            <input
                                id="teacher-question-marks"
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={formData.marks}
                                onChange={handleMarksChange}
                                required
                                disabled={saving}
                            />
                        </div>
                    </section>

                    <section className="teacher-form-section">
                        <div className="teacher-options-heading">
                            <div>
                                <h2>Answer Options</h2>
                                <p>Choose exactly one correct answer.</p>
                            </div>

                            <span className="teacher-option-count">
                                {options.length} options
                            </span>
                        </div>

                        <div className="teacher-options-list">
                            {options.map((option, index) => {
                                const letter = String.fromCharCode(65 + index);

                                return (
                                    <div
                                        key={index}
                                        className={`teacher-option-row ${
                                            option.is_correct
                                                ? "teacher-option-correct"
                                                : ""
                                        }`}
                                    >
                                        <span className="teacher-option-letter">
                                            {letter}
                                        </span>

                                        <input
                                            type="text"
                                            value={option.option_text}
                                            onChange={(event) =>
                                                handleOptionChange(
                                                    index,
                                                    event.target.value
                                                )
                                            }
                                            placeholder={`Enter option ${letter}`}
                                            aria-label={`Option ${letter}`}
                                            required
                                            disabled={saving}
                                        />

                                        <label className="teacher-correct-choice">
                                            <input
                                                type="radio"
                                                name="teacher-correct-answer"
                                                checked={option.is_correct}
                                                onChange={() =>
                                                    handleCorrectAnswer(index)
                                                }
                                                disabled={saving}
                                            />
                                            Correct
                                        </label>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <footer className="teacher-form-actions">
                        <button
                            type="button"
                            className="teacher-secondary-button"
                            onClick={() => navigate("/teacher/questions")}
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="teacher-primary-button"
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </footer>
                </form>
            )}
        </main>
    );
}

export default TeacherQuestionForm;
