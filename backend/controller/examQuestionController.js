
const examQuestionService = require("../services/examQuestionService");

// ========================================
// ADD QUESTIONS TO AN EXAM
// POST /api/exams/:examId/questions
// ========================================
const addQuestionsToExam = async (req, res) => {
    try {
        const { examId } = req.params;
        const { questions } = req.body;

        if (!Array.isArray(questions)) {
            return res.status(400).json({
                message: "questions must be an array"
            });
        }

        if (questions.length === 0) {
            return res.status(400).json({
                message: "At least one question is required"
            });
        }

        for (const question of questions) {
            if (
                !question ||
                !Number.isInteger(Number(question.question_id)) ||
                Number(question.question_id) <= 0 ||
                !Number.isInteger(Number(question.question_order)) ||
                Number(question.question_order) <= 0
            ) {
                return res.status(400).json({
                    message:
                        "Each question must have a valid question_id and question_order"
                });
            }
        }

        await examQuestionService.addQuestionsToExam(
            examId,
            questions
        );

        return res.status(201).json({
            message: "Questions added to exam successfully"
        });
    } catch (error) {
        console.error("Add exam questions error:", error);

        return res.status(error.statusCode || 500).json({
            message: error.message || "Server error"
        });
    }
};


// ========================================
// GET QUESTIONS ALREADY ASSIGNED TO AN EXAM
// GET /api/exams/:examId/questions
// ========================================
const getExamQuestions = async (req, res) => {
    try {
        const { examId } = req.params;

        const questions =
            await examQuestionService.getExamQuestions(examId);

        return res.status(200).json(questions);
    } catch (error) {
        console.error("Get exam questions error:", error);

        return res.status(error.statusCode || 500).json({
            message: error.message || "Server error"
        });
    }
};


// ========================================
// GET AVAILABLE QUESTIONS FOR AN EXAM
// GET /api/exams/:examId/available-questions
// ========================================
const getAvailableQuestions = async (req, res) => {
    try {
        const { examId } = req.params;

        if (!Number.isInteger(Number(examId)) || Number(examId) <= 0) {
            return res.status(400).json({
                message: "Invalid exam ID"
            });
        }

        const questions =
            await examQuestionService.getAvailableQuestions(examId);

        return res.status(200).json(questions);
    } catch (error) {
        console.error("Get available questions error:", error);

        return res.status(error.statusCode || 500).json({
            message: error.message || "Failed to retrieve available questions"
        });
    }
};


module.exports = {
    addQuestionsToExam,
    getExamQuestions,
    getAvailableQuestions
};