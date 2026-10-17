
const examInstructionService = require("../services/examInstructionService");

const getAllInstructions = async (req, res) => {
    try {
        const instructions =
            await examInstructionService.getAllInstructions();

        return res.status(200).json({
            success: true,
            data: instructions
        });
    } catch (error) {
        console.error("Get instructions error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve exam instructions"
        });
    }
};

const getInstructionsByExamId = async (req, res) => {
    try {
        const examId = Number(req.params.examId);

        if (!Number.isInteger(examId) || examId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid exam ID"
            });
        }

        const instructions =
            await examInstructionService.getInstructionsByExamId(examId);

        if (!instructions) {
            return res.status(404).json({
                success: false,
                message: "Exam instructions not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: instructions
        });
    } catch (error) {
        console.error("Get exam instructions error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve exam instructions"
        });
    }
};

const createInstructions = async (req, res) => {
    try {
        const exam_id = Number(req.body.exam_id);
        const instructions = req.body.instructions;

        if (!Number.isInteger(exam_id) || exam_id <= 0) {
            return res.status(400).json({
                success: false,
                message: "A valid exam_id is required"
            });
        }

        if (
            typeof instructions !== "string" ||
            !instructions.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Instructions are required"
            });
        }

        const existing =
            await examInstructionService.getInstructionsByExamId(exam_id);

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "Instructions already exist for this exam"
            });
        }

        const id = await examInstructionService.createInstructions({
            exam_id,
            instructions: instructions.trim()
        });

        const data =
            await examInstructionService.getInstructionsByExamId(exam_id);

        return res.status(201).json({
            success: true,
            message: "Exam instructions created successfully",
            data: { id, ...data }
        });
    } catch (error) {
        console.error("Create exam instructions error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Instructions already exist for this exam"
            });
        }

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({
                success: false,
                message: "The specified exam does not exist"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create exam instructions"
        });
    }
};

const updateInstructions = async (req, res) => {
    try {
        const examId = Number(req.params.examId);
        const instructions = req.body.instructions;

        if (!Number.isInteger(examId) || examId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid exam ID"
            });
        }

        if (
            typeof instructions !== "string" ||
            !instructions.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Instructions are required"
            });
        }

        const affectedRows =
            await examInstructionService.updateInstructions(
                examId,
                instructions.trim()
            );

        if (!affectedRows) {
            const existing =
                await examInstructionService.getInstructionsByExamId(examId);

            if (!existing) {
                return res.status(404).json({
                    success: false,
                    message: "Exam instructions not found"
                });
            }
        }

        const data =
            await examInstructionService.getInstructionsByExamId(examId);

        return res.status(200).json({
            success: true,
            message: "Exam instructions updated successfully",
            data
        });
    } catch (error) {
        console.error("Update exam instructions error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update exam instructions"
        });
    }
};

const deleteInstructions = async (req, res) => {
    try {
        const examId = Number(req.params.examId);

        if (!Number.isInteger(examId) || examId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid exam ID"
            });
        }

        const deleted =
            await examInstructionService.deleteInstructions(examId);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Exam instructions not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Exam instructions deleted successfully"
        });
    } catch (error) {
        console.error("Delete exam instructions error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete exam instructions"
        });
    }
};

module.exports = {
    getAllInstructions,
    getInstructionsByExamId,
    createInstructions,
    updateInstructions,
    deleteInstructions
};
