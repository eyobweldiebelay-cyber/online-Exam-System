
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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

    const isEditMode = Boolean(questionId);

    const [programs, setPrograms] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [formData, setFormData] = useState({
        program_id: "",
        department_id: "",
        question_text: "",
        marks: 1
    });

    const [options, setOptions] = useState([
        {
            option_text: "",
            is_correct: true
        },
        {
            option_text: "",
            is_correct: false
        },
        {
            option_text: "",
            is_correct: false
        },
        {
            option_text: "",
            is_correct: false
        }
    ]);

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(isEditMode);
    const [error, setError] = useState("");

    // Load programs
    const loadPrograms = async () => {
        try {
            const data = await getAllPrograms();

            setPrograms(
                Array.isArray(data) ? data : []
            );
        } catch (error) {
            console.error("Get programs error:", error);

            setError(
                error.response?.data?.message ||
                "Failed to load programs"
            );
        }
    };

    // Load departments
    const loadDepartments = async () => {
        try {
            const data = await getAllDepartments();

            const departmentList = Array.isArray(data)
                ? data
                : data.departments || [];

            setDepartments(departmentList);

            return departmentList;
        } catch (error) {
            console.error("Get departments error:", error);

            setError(
                error.response?.data?.message ||
                "Failed to load departments"
            );

            return [];
        }
    };

    // Load question when editing
    const loadQuestion = async (departmentList = []) => {
        try {
            setPageLoading(true);
            setError("");

            const data = await getQuestionById(questionId);

            const questionDepartment = departmentList.find(
                (department) =>
                    Number(department.id) ===
                    Number(data.department_id)
            );

            setFormData({
                program_id: questionDepartment?.program_id
                    ? String(questionDepartment.program_id)
                    : "",
                department_id: String(data.department_id),
                question_text: data.question_text,
                marks: data.marks
            });

            if (
                Array.isArray(data.options) &&
                data.options.length > 0
            ) {
                setOptions(
                    data.options.map((option) => ({
                        option_text: option.option_text,
                        is_correct: Boolean(option.is_correct)
                    }))
                );
            }
        } catch (error) {
            console.error("Get question error:", error);

            setError(
                error.response?.data?.message ||
                "Failed to load question"
            );
        } finally {
            setPageLoading(false);
        }
    };

    // Load required data
    useEffect(() => {
        const loadData = async () => {
            const departmentList = await loadDepartments();

            await loadPrograms();

            if (isEditMode) {
                await loadQuestion(departmentList);
            } else {
                setPageLoading(false);
            }
        };

        loadData();
    }, [questionId, isEditMode]);

    // Handle normal inputs and program selection
    const handleChange = (event) => {
        const { name, value } = event.target;

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

    // Handle option text
    const handleOptionChange = (index, value) => {
        setOptions((previous) =>
            previous.map((option, optionIndex) =>
                optionIndex === index
                    ? {
                          ...option,
                          option_text: value
                      }
                    : option
            )
        );
    };

    // Select correct answer
    const handleCorrectAnswer = (index) => {
        setOptions((previous) =>
            previous.map((option, optionIndex) => ({
                ...option,
                is_correct: optionIndex === index
            }))
        );
    };

    // Validate form
    const validateForm = () => {
        if (!formData.program_id) {
            return "Please select a program";
        }

        if (!formData.department_id) {
            return "Please select a department";
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
            return "Please select a department belonging to the selected program";
        }

        if (!formData.question_text.trim()) {
            return "Please enter the question";
        }

        if (!formData.marks || Number(formData.marks) <= 0) {
            return "Marks must be greater than 0";
        }

        if (options.length < 2) {
            return "At least 2 options are required";
        }

        for (let i = 0; i < options.length; i++) {
            if (!options[i].option_text.trim()) {
                return `Please enter option ${String.fromCharCode(65 + i)}`;
            }
        }

        const correctAnswers = options.filter(
            (option) => option.is_correct
        );

        if (correctAnswers.length !== 1) {
            return "Please select exactly one correct answer";
        }

        return "";
    };

    // Submit form
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

            // Keep the existing backend payload structure.
            // The question belongs to a department, which
            // is already linked to its program in the database.
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
                await updateQuestion(
                    questionId,
                    questionData
                );
            } else {
                await createQuestion(questionData);
            }

            navigate("/admin/questions");
        } catch (error) {
            console.error("Save question error:", error);

            setError(
                error.response?.data?.message ||
                "Failed to save question"
            );
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <div className="question-form-page">
                <div className="question-form-loading">
                    Loading question...
                </div>
            </div>
        );
    }

    return (
        <div className="question-form-page">
            <div className="question-form-header">
                <div>
                    <h1>
                        {isEditMode
                            ? "Update Question"
                            : "Create Question"}
                    </h1>

                    <p>
                        {isEditMode
                            ? "Update the examination question and its options."
                            : "Create a new multiple-choice examination question."}
                    </p>
                </div>
            </div>

            {error && (
                <div className="question-form-error">
                    {error}
                </div>
            )}

            <form
                className="question-form"
                onSubmit={handleSubmit}
            >
                {/* Program */}
                <div className="form-group">
                    <label htmlFor="program_id">
                        Program well before create question select Program diploma or degree below
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
                            Select Program
                        </option>

                        {programs
                            .filter(
                                (program) =>
                                    program.status !== "inactive"
                            )
                            .map((program) => (
                                <option
                                    key={program.id}
                                    value={program.id}
                                >
                                    {program.name}
                                </option>
                            ))}
                    </select>
                </div>

                {/* Department */}
                <div className="form-group">
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
                                ? "Select Department"
                                : "Select Program First"}
                        </option>

                        {departments
                            .filter(
                                (department) =>
                                    department.status !== "inactive" &&
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
                </div>

                {/* Question */}
                <div className="form-group">
                    <label htmlFor="question_text">
                        Question
                    </label>

                    <textarea
                        id="question_text"
                        name="question_text"
                        value={formData.question_text}
                        onChange={handleChange}
                        placeholder="Enter the examination question"
                        rows="5"
                        disabled={loading}
                    />
                </div>

                {/* Marks */}
                <div className="form-group">
                    <label htmlFor="marks">
                        Marks
                    </label>

                    <input
                        id="marks"
                        name="marks"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={formData.marks}
                        onChange={handleChange}
                        disabled={loading}
                    />
                </div>

                {/* Options */}
                <div className="options-section">
                    <div className="options-header">
                        <div>
                            <h2>Answer Options</h2>

                            <p>
                                Select exactly one correct answer.
                            </p>
                        </div>
                    </div>

                    {options.map((option, index) => {
                        const letter =
                            String.fromCharCode(65 + index);

                        return (
                            <div
                                className={`option-row ${
                                    option.is_correct
                                        ? "correct-option"
                                        : ""
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

                {/* Buttons */}
                <div className="question-form-actions">
                    <button
                        type="button"
                        className="form-cancel-button"
                        onClick={() =>
                            navigate("/admin/questions")
                        }
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

