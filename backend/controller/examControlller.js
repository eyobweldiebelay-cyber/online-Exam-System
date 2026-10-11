const examService = require("../services/examService");


// ===============================
// CREATE EXAM
// ===============================
const createExam = async (req, res) => {
    try {
        const {
            title,
            department_id,
            academic_year,
            duration_minutes,
            total_questions,
            pass_mark,
            start_at,
            end_at
        } = req.body;

        // Basic validation
        if (
            !title ||
            !department_id ||
            !academic_year ||
            !duration_minutes ||
            !total_questions ||
            pass_mark === undefined ||
            !start_at ||
            !end_at
        ) {
            return res.status(400).json({
                message: "All exam fields are required"
            });
        }

        if (duration_minutes <= 0) {
            return res.status(400).json({
                message: "Duration must be greater than 0"
            });
        }

        if (total_questions <= 0) {
            return res.status(400).json({
                message: "Total questions must be greater than 0"
            });
        }

        if (pass_mark < 0 || pass_mark > 100) {
            return res.status(400).json({
                message: "Pass mark must be between 0 and 100"
            });
        }

        const exam = await examService.createExam({
            title,
            department_id,
            academic_year,
            duration_minutes,
            total_questions,
            pass_mark,
            start_at,
            end_at,
            created_by: req.user.id
        });

        return res.status(201).json({
            message: "Exam created successfully",
            exam
        });

    } catch (error) {
        console.error("Create exam error:", error);

        return res.status(error.statusCode || 500).json({
            message: error.message || "Failed to create exam"
        });
    }
};


// ===============================
// GET ALL EXAMS
// ===============================
const getAllExams = async (req, res) => {
    try {
        const exams = await examService.getAllExams();

        return res.status(200).json({
            message: "Exams retrieved successfully",
            exams
        });

    } catch (error) {
        console.error("Get exams error:", error);

        return res.status(error.statusCode || 500).json({
            message: error.message || "Failed to retrieve exams"
        });
    }
};


// ===============================
// GET EXAM BY ID
// ===============================
const getExamById = async (req, res) => {
    try {
        const exam = await examService.getExamById(req.params.id);

        if (!exam) {
            return res.status(404).json({
                message: "Exam not found"
            });
        }

        return res.status(200).json({
            message: "Exam retrieved successfully",
            exam
        });

    } catch (error) {
        console.error("Get exam error:", error);

        return res.status(error.statusCode || 500).json({
            message: error.message || "Failed to retrieve exam"
        });
    }
};


// ===============================
// UPDATE EXAM
// ===============================
const updateExam = async (req, res) => {
    try {
        const examId = req.params.id;

        const affectedRows = await examService.updateExam(
            examId,
            req.body
        );

        if (affectedRows === 0) {
            return res.status(404).json({
                message: "Exam not found"
            });
        }

        return res.status(200).json({
            message: "Exam updated successfully"
        });

    } catch (error) {
        console.error("Update exam error:", error);

        return res.status(error.statusCode || 500).json({
            message: error.message || "Failed to update exam"
        });
    }
};


// ===============================
// DELETE EXAM
// ===============================
const deleteExam = async (req, res) => {
    try {
        const examId = req.params.id;

        const affectedRows = await examService.deleteExam(examId);

        if (affectedRows === 0) {
            return res.status(404).json({
                message: "Exam not found"
            });
        }

        return res.status(200).json({
            message: "Exam deleted successfully"
        });

    } catch (error) {
        console.error("Delete exam error:", error);

        return res.status(error.statusCode || 500).json({
            message: error.message || "Failed to delete exam"
        });
    }
};


// ===============================
// PUBLISH EXAM
// ===============================
const publishExam = async (req, res) => {
    try {
        const examId = req.params.id;

        const result = await examService.publishExam(examId);

        return res.status(200).json({
            message: "Exam published successfully",
            exam: result
        });

    } catch (error) {
        console.error("Publish exam error:", error);

        return res.status(error.statusCode || 500).json({
            message: error.message || "Failed to publish exam"
        });
    }
};


// ===============================
// GET AVAILABLE EXAMS FOR STUDENT
// ===============================
const getAvailableExamsForStudent = async (req, res) => {
    try {
        const userId = req.user.id;

        const exams = await examService.getAvailableExamsForStudent(
            userId
        );

        return res.status(200).json({
            message: "Available exams retrieved successfully",
            exams
        });

    } catch (error) {
        console.error("Get available exams error:", error);

        return res.status(error.statusCode || 500).json({
            message: error.message || "Failed to retrieve available exams"
        });
    }
};


module.exports = {
    createExam,
    getAllExams,
    getExamById,
    updateExam,
    deleteExam,
    publishExam,
    getAvailableExamsForStudent
};