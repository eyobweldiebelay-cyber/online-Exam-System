const programModel = require("../services/programService");

// Get all programs
const getAllPrograms = async (req, res) => {
    try {
        const programs = await programModel.getAllPrograms();

        res.status(200).json({
            message: "Programs retrieved successfully",
            programs
        });
    } catch (error) {
        console.error("Get programs error:", error);

        res.status(500).json({
            message: "Failed to retrieve programs"
        });
    }
};


// Get one program
const getProgramById = async (req, res) => {
    try {
        const { id } = req.params;

        const program = await programModel.getProgramById(id);

        if (!program) {
            return res.status(404).json({
                message: "Program not found"
            });
        }

        res.status(200).json({
            message: "Program retrieved successfully",
            program
        });
    } catch (error) {
        console.error("Get program error:", error);

        res.status(500).json({
            message: "Failed to retrieve program"
        });
    }
};


// Create program
const createProgram = async (req, res) => {
    try {
        const { name, program_type } = req.body;

        // Validate required fields
        if (!name || !program_type) {
            return res.status(400).json({
                message: "name and program_type are required"
            });
        }

        // Validate program type
        if (!["degree", "diploma"].includes(program_type)) {
            return res.status(400).json({
                message: "program_type must be degree or diploma"
            });
        }

        // Check duplicate program
        const existingProgram =
            await programModel.getProgramByName(name.trim());

        if (existingProgram) {
            return res.status(409).json({
                message: "Program already exists"
            });
        }

        const programId = await programModel.createProgram(
            name.trim(),
            program_type
        );

        const program =
            await programModel.getProgramById(programId);

        res.status(201).json({
            message: "Program created successfully",
            program
        });
    } catch (error) {
        console.error("Create program error:", error);

        res.status(500).json({
            message: "Failed to create program"
        });
    }
};


// Update program
const updateProgram = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, program_type, status } = req.body;

        // Check program
        const program = await programModel.getProgramById(id);

        if (!program) {
            return res.status(404).json({
                message: "Program not found"
            });
        }

        // Validate required fields
        if (!name || !program_type || !status) {
            return res.status(400).json({
                message: "name, program_type and status are required"
            });
        }

        // Validate program type
        if (!["degree", "diploma"].includes(program_type)) {
            return res.status(400).json({
                message: "program_type must be degree or diploma"
            });
        }

        // Validate status
        if (!["active", "inactive"].includes(status)) {
            return res.status(400).json({
                message: "status must be active or inactive"
            });
        }

        // Check duplicate name
        const existingProgram =
            await programModel.getProgramByName(name.trim());

        if (
            existingProgram &&
            existingProgram.id !== Number(id)
        ) {
            return res.status(409).json({
                message: "Program already exists"
            });
        }

        await programModel.updateProgram(
            id,
            name.trim(),
            program_type,
            status
        );

        const updatedProgram =
            await programModel.getProgramById(id);

        res.status(200).json({
            message: "Program updated successfully",
            program: updatedProgram
        });
    } catch (error) {
        console.error("Update program error:", error);

        res.status(500).json({
            message: "Failed to update program"
        });
    }
};


// Deactivate program
const deactivateProgram = async (req, res) => {
    try {
        const { id } = req.params;

        const program = await programModel.getProgramById(id);

        if (!program) {
            return res.status(404).json({
                message: "Program not found"
            });
        }

        if (program.status === "inactive") {
            return res.status(400).json({
                message: "Program is already inactive"
            });
        }

        await programModel.deactivateProgram(id);

        res.status(200).json({
            message: "Program deactivated successfully"
        });
    } catch (error) {
        console.error("Deactivate program error:", error);

        res.status(500).json({
            message: "Failed to deactivate program"
        });
    }
};


module.exports = {
    getAllPrograms,
    getProgramById,
    createProgram,
    updateProgram,
    deactivateProgram
};