const questionService = require("../services/questionService");

// Create question
const createQuestion = async (req, res) => {

    try {

        const {
            department_id,
            question_text,
            marks,
            options
        } = req.body;

        // Required fields
        if (!department_id || !question_text || !options) {
            return res.status(400).json({
                message: "department_id, question_text and options are required"
            });
        }

        // Options must be array
        if (!Array.isArray(options)) {
            return res.status(400).json({
                message: "options must be an array"
            });
        }

        // Multiple choice needs at least 2 options
        if (options.length < 2) {
            return res.status(400).json({
                message: "A question must have at least 2 options"
            });
        }

        // Validate option text
        for (const option of options) {

            if (!option.option_text) {
                return res.status(400).json({
                    message: "Each option must have option_text"
                });
            }
        }

        // Exactly one correct answer
        const correctOptions = options.filter(
            option => option.is_correct === true
        );

        if (correctOptions.length !== 1) {
            return res.status(400).json({
                message: "A question must have exactly one correct answer"
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


module.exports = {
    createQuestion,
    getQuestions,
    getQuestionById
};