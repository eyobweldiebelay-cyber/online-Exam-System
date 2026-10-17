
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import {
    createQuestion,
    getQuestionById,
    updateQuestion
} from "../services/questionService";

import { getAllDepartments } from "../services/departmentService";
import { getAllPrograms } from "../services/programService";

import "../../css/admin/question.css";

const QuestionForm = () => {
    const navigate = useNavigate();
    const { questionId } = useParams();
    const { user } = useAuth();

    const isEditMode = Boolean(questionId);
    const role = String(user?.role || "").toLowerCase();
    const isTeacher = role === "teacher";

    const assignedDepartmentId = user?.department_id
        ? Number(user.department_id)
        : null;

    const [programs, setPrograms] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [formData, setFormData] = useState({
        program_id: "",
        department_id: "",
        question_text: "",
        marks: 1
    });

    const [options, setOptions] = useState([
        { option_text: "", is_correct: true },
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false }
    ]);

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState("");

    // Teachers may only select their assigned department.
    const availableDepartments = departments.filter((department) => {
        const isActive = department.status !== "inactive";

        if (isTeacher) {
            return (
                isActive &&
                assignedDepartmentId !== null &&
                Number(department.id) === assignedDepartmentId
            );
        }

        return isActive;
    });

    const availablePrograms = programs.filter((program) => {
        const isActive = program.status !== "inactive";

        if (!isTeacher) {
            return isActive;
        }

        const teacherDepartment = departments.find(
            (department) =>
                Number(department.id) === assignedDepartmentId
        );

        return (
            isActive &&
            teacherDepartment &&
            Number(program.id) ===
                Number(teacherDepartment.program_id)
        );
    });

    const getQuestionsPage = () =>
        isTeacher ? "/teacher/questions" : "/admin/questions";

    // Load programs and departments.
    const loadReferenceData = async () => {
        const [programResult, departmentResult] =
            await Promise.allSettled([
                getAllPrograms(),
                getAllDepartments()
            ]);

        if (programResult.status === "fulfilled") {
            const programData = programResult.value;
            setPrograms(Array.isArray(programData) ? programData : []);
        } else {
            throw programResult.reason;
        }

        if (departmentResult.status === "fulfilled") {
            const departmentData = departmentResult.value;

            const departmentList = Array.isArray(departmentData)
                ? departmentData
                : departmentData?.departments || [];

            setDepartments(departmentList);
            return departmentList;
        }

        throw departmentResult.reason;
    };

    // Load a question for editing.
    const loadQuestion = async (departmentList) => {
        const data = await getQuestionById(questionId);

        if (
            isTeacher &&
            (
                !assignedDepartmentId ||
                Number(data.department_id) !== assignedDepartmentId
            )
        ) {
            throw new Error(
                "You cannot edit questions outside your assigned department."
            );
        }

        const questionDepartment = departmentList.find(
            (department) =>
                Number(department.id) === Number(data.department_id)
        );

        if (!questionDepartment) {
            throw new Error(
                "The department for this question could not be found."
            );
        }

        setFormData({
            program_id: String(questionDepartment.program_id),
            department_id: String(data.department_id),
            question_text: data.question_text || "",
            marks: data.marks ?? 1
        });

        if (Array.isArray(data.options) && data.options.length > 0) {
            setOptions(
                data.options.map((option) => ({
                    option_text: option.option_text || "",
                    is_correct:
                        option.is_correct === true ||
                        Number(option.is_correct) === 1
                }))
            );
        }
    };

    useEffect(() => {
        let cancelled = false;

        const loadData = async () => {
            setPageLoading(true);
            setError("");

            try {
                const departmentList = await loadReferenceData();

                if (cancelled) return;

                if (isTeacher) {
                    if (!assignedDepartmentId) {
                        throw new Error(
                            "Your Teacher account is not assigned to a department. Contact the administrator."
                        );
                    }

                    const assignedDepartment = departmentList.find(
                        (department) =>
                            Number(department.id) === assignedDepartmentId
                    );

                    if (!assignedDepartment) {
                        throw new Error(
                            "Your assigned department could not be found. Contact the administrator."
                        );
                    }

                    setFormData((previous) => ({
                        ...previous,
                        program_id: String(
                            assignedDepartment.program_id
                        ),
                        department_id: String(
                            assignedDepartment.id
                        )
                    }));
                }

                if (isEditMode) {
                    await loadQuestion(departmentList);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error("Load question form error:", err);

                    setError(
                        err.response?.data?.message ||
                        err.message ||
                        "Failed to load question form data."
                    );
                }
            } finally {
                if (!cancelled) {
                    setPageLoading(false);
                }
            }
        };

        loadData();

        return () => {
            cancelled = true;
        };
    }, [questionId, isEditMode, isTeacher, assignedDepartmentId]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        if (isTeacher) {
            // Teacher program and department are assigned by the system.
            return;
        }

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

    const handleOptionChange = (index, value) => {
        setOptions((previous) =>
            previous.map((option, optionIndex) =>
                optionIndex === index
                    ? { ...option, option_text: value }
                    : option
            )
        );
    };

    const handleCorrectAnswer = (index) => {
        setOptions((previous) =>
            previous.map((option, optionIndex) => ({
                ...option,
                is_correct: optionIndex === index
            }))
        );
    };

    const validateForm = () => {
        if (!formData.program_id) {
            return "Please select a program.";
        }

        if (!formData.department_id) {
            return "Please select a department.";
        }

        if (isTeacher) {
            if (!assignedDepartmentId) {
                return "Your account has no assigned department.";
            }

            if (
                Number(formData.department_id) !== assignedDepartmentId
            ) {
                return "You can only manage questions in your assigned department.";
            }
        }

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
            return "Select a department belonging to the selected program.";
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

        if (options.length < 2) {
            return "At least two answer options are required.";
        }

        for (let index = 0; index < options.length; index++) {
            if (!options[index].option_text.trim()) {
                return `Please enter option ${String.fromCharCode(65 + index)}.`;
            }
        }

        const correctAnswers = options.filter(
            (option) => option.is_correct
        );

        if (correctAnswers.length !== 1) {
            return "Please select exactly one correct answer.";
        }

        return "";
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const validationError = validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setLoading(true);
            setError("");

            // Preserve the existing backend payload.
            const questionData = {
                department_id: Number(formData.department_id),
                question_text: formData.question_text.trim(),
                marks: Number(formData.marks),
                options: options.map((option) => ({
                    option_text: option.option_text.trim(),
                    is_correct: option.is_correct
                }))
            };

            if (isEditMode) {
                await updateQuestion(questionId, questionData);
            } else {
                await createQuestion(questionData);
            }

            navigate(getQuestionsPage());
        } catch (err) {
            console.error("Save question error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to save the question."
            );
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <div className="question-form-page">
                <div className="question-form-loading">
                    Loading question form...
                </div>
            </div>
        );
    }

    return (
        <div className="question-form-page">
            <div className="question-form-header">
                <div>
                    <h1>
                        {isEditMode ? "Update Question" : "Create Question"}
                    </h1>

                    <p>
                        {isEditMode
                            ? "Update the examination question and its options."
                            : "Create a new multiple-choice examination question."}
                    </p>
                </div>
            </div>

            {error && (
                <div className="question-form-error" role="alert">
                    {error}
                </div>
            )}

            <form className="question-form" onSubmit={handleSubmit}>
                {/* Program */}
                <div className="form-group">
                    <label htmlFor="program_id">Program</label>

                    <select
                        id="program_id"
                        name="program_id"
                        value={formData.program_id}
                        onChange={handleChange}
                        disabled={loading || isTeacher}
                        required
                    >
                        <option value="">Select Program</option>

                        {availablePrograms.map((program) => (
                            <option key={program.id} value={program.id}>
                                {program.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Department */}
                <div className="form-group">
                    <label htmlFor="department_id">Department</label>

                    <select
                        id="department_id"
                        name="department_id"
                        value={formData.department_id}
                        onChange={handleChange}
                        disabled={
                            loading ||
                            isTeacher ||
                            !formData.program_id
                        }
                        required
                    >
                        <option value="">Select Department</option>

                        {availableDepartments
                            .filter(
                                (department) =>
                                    Number(department.program_id) ===
                                    Number(formData.program_id)
                            )
                            .map((department) => (
                                <option
                                    key={department.id}
                                    value={department.id}
                                >
                                    {department.name}
                                </option>
                            ))}
                    </select>

                    {isTeacher && (
                        <small>
                            Your assigned department is selected automatically.
                        </small>
                    )}
                </div>

                {/* Question text */}
                <div className="form-group">
                    <label htmlFor="question_text">Question</label>

                    <textarea
                        id="question_text"
                        name="question_text"
                        value={formData.question_text}
                        onChange={handleChange}
                        placeholder="Enter the examination question"
                        rows={5}
                        disabled={loading}
                        required
                    />
                </div>

                {/* Marks */}
                <div className="form-group">
                    <label htmlFor="marks">Marks</label>

                    <input
                        id="marks"
                        name="marks"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={formData.marks}
                        onChange={handleChange}
                        disabled={loading}
                        required
                    />
                </div>

                {/* Answer options */}
                <div className="options-section">
                    <div className="options-header">
                        <div>
                            <h2>Answer Options</h2>
                            <p>Select exactly one correct answer.</p>
                        </div>
                    </div>

                    {options.map((option, index) => {
                        const letter = String.fromCharCode(65 + index);

                        return (
                            <div
                                className={`option-row ${
                                    option.is_correct ? "correct-option" : ""
                                }`}
                                key={index}
                            >
                                <div className="option-label">
                                    {letter}
                                </div>

                                <input
                                    type="text"
                                    value={option.option_text}
                                    onChange={(event) =>
                                        handleOptionChange(
                                            index,
                                            event.target.value
                                        )
                                    }
                                    placeholder={`Option ${letter}`}
                                    disabled={loading}
                                    required
                                />

                                <label className="correct-answer">
                                    <input
                                        type="radio"
                                        name="correct_answer"
                                        checked={option.is_correct}
                                        onChange={() =>
                                            handleCorrectAnswer(index)
                                        }
                                        disabled={loading}
                                    />
                                    Correct
                                </label>
                            </div>
                        );
                    })}
                </div>

                {/* Actions */}
                <div className="question-form-actions">
                    <button
                        type="button"
                        className="form-cancel-button"
                        onClick={() => navigate(getQuestionsPage())}
                        disabled={loading}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="form-submit-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Saving..."
                            : isEditMode
                            ? "Update Question"
                            : "Create Question"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default QuestionForm;
