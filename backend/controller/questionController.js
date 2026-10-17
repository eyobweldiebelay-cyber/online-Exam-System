
const questionService = require("../services/questionService");
const XLSX = require("xlsx");

// Validate question data for editing.
// Manual question creation is not supported.
const validateQuestionData = (req) => {
    const {
        department_id,
        question_text,
        options
    } = req.body;

    if (
        !department_id ||
        !question_text ||
        !String(question_text).trim() ||
        !options
    ) {
        return "department_id, question_text and options are required";
    }

    if (
        !Number.isInteger(Number(department_id)) ||
        Number(department_id) <= 0
    ) {
        return "A valid department is required";
    }

    if (!Array.isArray(options)) {
        return "options must be an array";
    }

    if (options.length < 2) {
        return "A question must have at least 2 options";
    }

    for (const option of options) {
        if (
            !option ||
            typeof option.option_text !== "string" ||
            !option.option_text.trim()
        ) {
            return "Each option must have option_text";
        }
    }

    const correctOptions = options.filter(
        option =>
            option.is_correct === true ||
            option.is_correct === 1 ||
            option.is_correct === "1"
    );

    if (correctOptions.length !== 1) {
        return "A question must have exactly one correct answer";
    }

    return null;
};

// Get questions — Admin sees all; Teacher sees assigned department.
const getQuestions = async (req, res) => {
    try {
        const questions = await questionService.getQuestions(req.user);
        return res.status(200).json(questions);
    } catch (error) {
        console.error("Get questions error:", error);

        return res.status(error.statusCode || 500).json({
            message: error.statusCode
                ? error.message
                : "Server error"
        });
    }
};

// Get one question — service enforces role and department access.
const getQuestionById = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid question ID"
            });
        }

        const question = await questionService.getQuestionById(
            id,
            req.user
        );

        return res.status(200).json(question);
    } catch (error) {
        console.error("Get question error:", error);

        return res.status(error.statusCode || 500).json({
            message: error.statusCode
                ? error.message
                : "Server error"
        });
    }
};

// Update an existing question.
// Service retains department restrictions and exam/attempt protections.
const updateQuestion = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid question ID"
            });
        }

        const {
            department_id,
            question_text,
            marks,
            options
        } = req.body;

        const validationError = validateQuestionData(req);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        if (
            marks !== undefined &&
            marks !== null &&
            marks !== "" &&
            (!Number.isFinite(Number(marks)) || Number(marks) <= 0)
        ) {
            return res.status(400).json({
                message: "Marks must be greater than zero"
            });
        }

        await questionService.updateQuestion(id, {
            department_id: Number(department_id),
            question_text: String(question_text).trim(),
            marks: marks === "" || marks == null ? 1 : Number(marks),
            options,
            user: req.user
        });

        return res.status(200).json({
            message: "Question updated successfully"
        });
    } catch (error) {
        console.error("Update question error:", error);

        return res.status(error.statusCode || 500).json({
            message: error.statusCode
                ? error.message
                : "Server error"
        });
    }
};

// Deactivate question.
const deactivateQuestion = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid question ID"
            });
        }

        await questionService.deactivateQuestion(id, req.user);

        return res.status(200).json({
            message: "Question deactivated successfully"
        });
    } catch (error) {
        console.error("Deactivate question error:", error);

        return res.status(error.statusCode || 500).json({
            message: error.statusCode
                ? error.message
                : "Server error"
        });
    }
};

// Activate question.
const activateQuestion = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid question ID"
            });
        }

        await questionService.activateQuestion(id, req.user);

        return res.status(200).json({
            message: "Question activated successfully"
        });
    } catch (error) {
        console.error("Activate question error:", error);

        return res.status(error.statusCode || 500).json({
            message: error.statusCode
                ? error.message
                : "Server error"
        });
    }
};

// Import questions from CSV, XLSX, or XLS.
// Teacher-only access remains enforced by the route and service.
const importQuestions = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            message: "Please upload a CSV or Excel file"
        });
    }

    const program_id = Number(req.body.program_id);
    const department_id = Number(req.body.department_id);
    const academic_year_id = Number(req.body.academic_year_id);

    if (
        !Number.isInteger(program_id) ||
        program_id <= 0 ||
        !Number.isInteger(department_id) ||
        department_id <= 0 ||
        !Number.isInteger(academic_year_id) ||
        academic_year_id <= 0
    ) {
        return res.status(400).json({
            message:
                "Select a valid program, department, and academic year before importing."
        });
    }

    try {
        // Keep existing program/department and Teacher permission checks.
        await questionService.validateImportTarget(
            program_id,
            department_id,
            req.user
        );

        // Only registered active academic years may be selected.
        await questionService.validateAcademicYear(academic_year_id);

        const workbook = XLSX.read(req.file.buffer, {
            type: "buffer"
        });

        const firstSheetName = workbook.SheetNames[0];
        const firstSheet = firstSheetName
            ? workbook.Sheets[firstSheetName]
            : null;

        if (!firstSheet) {
            return res.status(400).json({
                message: "The uploaded file contains no worksheet"
            });
        }

        const rows = XLSX.utils.sheet_to_json(firstSheet, {
            defval: "",
            raw: false
        });

        if (rows.length === 0) {
            return res.status(400).json({
                message: "The uploaded file contains no questions"
            });
        }

        const normalizeHeader = (value) =>
            String(value)
                .trim()
                .toLowerCase()
                .replace(/[\s-]+/g, "_");

        let imported = 0;
        const errors = [];

        for (let index = 0; index < rows.length; index++) {
            const rowNumber = index + 2;

            try {
                const row = {};

                for (const [key, value] of Object.entries(rows[index])) {
                    row[normalizeHeader(key)] = value;
                }

                const question_text = String(
                    row.question_text || ""
                ).trim();

                const marks =
                    row.marks === "" || row.marks == null
                        ? 1
                        : Number(row.marks);

                if (!question_text) {
                    throw new Error("Question text is required");
                }

                if (!Number.isFinite(marks) || marks <= 0) {
                    throw new Error("Marks must be greater than zero");
                }

                const letters = ["A", "B", "C", "D", "E", "F"];

                const options = letters
                    .map((letter) => ({
                        letter,
                        option_text: String(
                            row[`option_${letter.toLowerCase()}`] || ""
                        ).trim()
                    }))
                    .filter((option) => option.option_text !== "");

                if (options.length < 2) {
                    throw new Error("At least two options are required");
                }

                const correctLetter = String(
                    row.correct_option || ""
                ).trim().toUpperCase();

                if (!letters.includes(correctLetter)) {
                    throw new Error(
                        "correct_option must be a letter from A to F"
                    );
                }

                if (
                    !options.some(
                        (option) => option.letter === correctLetter
                    )
                ) {
                    throw new Error(
                        "The correct option refers to an empty option"
                    );
                }

                const formattedOptions = options.map((option) => ({
                    option_text: option.option_text,
                    is_correct: option.letter === correctLetter
                }));

                await questionService.importQuestion({
                    department_id,
                    academic_year_id,
                    question_text,
                    marks,
                    options: formattedOptions,
                    user: req.user
                });

                imported++;
            } catch (error) {
                errors.push({
                    row: rowNumber,
                    message: error.message || "Import failed"
                });
            }
        }

        return res.status(200).json({
            message: "Question import completed",
            imported_count: imported,
            failed_count: errors.length,
            errors
        });
    } catch (error) {
        console.error("Import questions error:", error);

        return res.status(error.statusCode || 400).json({
            message:
                error.message ||
                "Unable to read the file. Check its CSV or Excel format."
        });
    }
};

module.exports = {
    getQuestions,
    getQuestionById,
    updateQuestion,
    deactivateQuestion,
    activateQuestion,
    importQuestions
};
