const attemptService = require("../services/attmeptService");

// ======================================================
// START EXAM
// ======================================================
const startExam = async (req, res) => {
    try {
        const userId = req.user.id;
        const examId = req.params.examId;

        const result = await attemptService.startExam(
            userId,
            examId
        );

        res.status(201).json({
            message: "Exam started successfully",
            ...result
        });

    } catch (error) {
        console.error("Start exam error:", error);

        res.status(error.statusCode || 500).json({
            message: error.message || "Failed to start exam"
        });
    }
};


// ======================================================
// SUBMIT EXAM
// ======================================================
const submitExam = async (req, res) => {
    try {
        const userId = req.user.id;
        const attemptId = req.params.attemptId;

        const { answers } = req.body;

        // Make sure answers exists and is an array
        if (!Array.isArray(answers)) {
            return res.status(400).json({
                message: "Answers must be an array"
            });
        }

        // Make sure the array is not empty
        if (answers.length === 0) {
            return res.status(400).json({
                message: "At least one answer is required"
            });
        }

        // Validate each answer
        for (const answer of answers) {

            if (
                answer.question_id === undefined ||
                answer.question_id === null
            ) {
                return res.status(400).json({
                    message: "Each answer must contain question_id"
                });
            }

            // Accept selected_option_id
            // OR option_id
            if (
                answer.selected_option_id === undefined &&
                answer.option_id === undefined
            ) {
                return res.status(400).json({
                    message:
                        "Each answer must contain selected_option_id"
                });
            }
        }

        // Submit exam
        const result = await attemptService.submitExam(
            userId,
            attemptId,
            answers
        );

        res.status(200).json({
            message: "Exam submitted successfully",
            result
        });

    } catch (error) {
        console.error("Submit exam error:", error);

        res.status(error.statusCode || 500).json({
            message: error.message || "Failed to submit exam"
        });
    }
};


// ======================================================
// EXPORT
// ======================================================
module.exports = {
    startExam,
    submitExam
};