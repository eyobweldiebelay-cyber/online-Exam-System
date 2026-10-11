const questionService = require("../services/questionService");


// Validate question data
const validateQuestionData = (req, res) => {

    const {
        department_id,
        question_text,
        options
    } = req.body;

    if (!department_id || !question_text || !options) {
        return "department_id, question_text and options are required";
    }

    if (!Array.isArray(options)) {
        return "options must be an array";
    }

    if (options.length < 2) {
        return "A question must have at least 2 options";
    }

    for (const option of options) {

        if (!option.option_text) {
            return "Each option must have option_text";
        }
    }

    const correctOptions = options.filter(
        option => option.is_correct === true
    );

    if (correctOptions.length !== 1) {
        return "A question must have exactly one correct answer";
    }

    return null;
};


// Create question
const createQuestion = async (req, res) => {

    try {

        const {
            department_id,
            question_text,
            marks,
            options
        } = req.body;

        const validationError = validateQuestionData(req, res);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const questionId = await questionService.createQuestion({
            department_id,
            question_text,
            marks,
            options
        });

        res.status(201).json({
            message: "Question created successfully",
            question_id: questionId
        });

    } catch (error) {

        console.error("Create question error:", error);

        res.status(error.statusCode || 500).json({
            message: error.statusCode
                ? error.message
                : "Server error"
        });
    }
};


// Get all questions
const getQuestions = async (req, res) => {

    try {

        const questions = await questionService.getQuestions();

        res.status(200).json(questions);

    } catch (error) {

        console.error("Get questions error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// Get question by ID
const getQuestionById = async (req, res) => {

    try {

        const { id } = req.params;

        const question = await questionService.getQuestionById(id);

        res.status(200).json(question);

    } catch (error) {

        console.error("Get question error:", error);

        res.status(error.statusCode || 500).json({
            message: error.statusCode
                ? error.message
                : "Server error"
        });
    }
};


// Update question
const updateQuestion = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            department_id,
            question_text,
            marks,
            options
        } = req.body;

        const validationError = validateQuestionData(req, res);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        await questionService.updateQuestion(
            id,
            {
                department_id,
                question_text,
                marks,
                options
            }
        );

        res.status(200).json({
            message: "Question updated successfully"
        });

    } catch (error) {

        console.error("Update question error:", error);

        res.status(error.statusCode || 500).json({
            message: error.statusCode
                ? error.message
                : "Server error"
        });
    }
};


// Deactivate question
const deactivateQuestion = async (req, res) => {

    try {

        const { id } = req.params;

        await questionService.deactivateQuestion(id);

        res.status(200).json({
            message: "Question deactivated successfully"
        });

    } catch (error) {

        console.error("Deactivate question error:", error);

        res.status(error.statusCode || 500).json({
            message: error.statusCode
                ? error.message
                : "Server error"
        });
    }
};


// Activate question
const activateQuestion = async (req, res) => {

    try {

        const { id } = req.params;

        await questionService.activateQuestion(id);

        res.status(200).json({
            message: "Question activated successfully"
        });

    } catch (error) {

        console.error("Activate question error:", error);

        res.status(error.statusCode || 500).json({
            message: error.statusCode
                ? error.message
                : "Server error"
        });
    }
};


module.exports = {
    createQuestion,
    getQuestions,
    getQuestionById,
    updateQuestion,
    deactivateQuestion,
    activateQuestion
};