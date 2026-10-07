const examQuestionService = require("../services/examQuestionService");

const addQuestionsToExam = async (req, res) => {
    try {
        const { examId } = req.params;
        const { questions } = req.body;

        if (!questions || !Array.isArray(questions)) {
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
                !question.question_id ||
                !question.question_order
            ) {
                return res.status(400).json({
                    message:
                        "Each question must have question_id and question_order"
                });
            }
        }

        await examQuestionService.addQuestionsToExam(
            examId,
            questions
        );

        res.status(201).json({
            message: "Questions added to exam successfully"
        });

    } catch (error) {
        console.error("Add exam questions error:", error);

        res.status(error.statusCode || 500).json({
            message: error.statusCode
                ? error.message
                : "Server error"
        });
    }
};


const getExamQuestions = async (req, res) => {
    try {
        const { examId } = req.params;

        const questions =
            await examQuestionService.getExamQuestions(examId);

        res.status(200).json(questions);

    } catch (error) {
        console.error("Get exam questions error:", error);

        res.status(error.statusCode || 500).json({
            message: error.statusCode
                ? error.message
                : "Server error"
        });
    }
};


module.exports = {
    addQuestionsToExam,
    getExamQuestions
};