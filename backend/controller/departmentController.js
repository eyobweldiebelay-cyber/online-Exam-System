const departmentModel = require("../services/departmentService");

// Get all departments
const getAllDepartments = async (req, res) => {
    try {
        const departments = await departmentModel.getAllDepartments();

        res.status(200).json({
            message: "Departments retrieved successfully",
            departments
        });
    } catch (error) {
        console.error("Get departments error:", error);

        res.status(500).json({
            message: "Failed to retrieve departments"
        });
    }
};

// Get one department
const getDepartmentById = async (req, res) => {
    try {
        const { id } = req.params;

        const department = await departmentModel.getDepartmentById(id);

        if (!department) {
            return res.status(404).json({
                message: "Department not found"
            });
        }

        res.status(200).json({
            message: "Department retrieved successfully",
            department
        });
    } catch (error) {
        console.error("Get department error:", error);

        res.status(500).json({
            message: "Failed to retrieve department"
        });
    }
};

// Create department
const createDepartment = async (req, res) => {
    try {
        const { program_id, name } = req.body;

        // Validate required fields
        if (!program_id || !name) {
            return res.status(400).json({
                message: "program_id and name are required"
            });
        }

        // Check program
        const program = await departmentModel.getProgramById(program_id);

        if (!program) {
            return res.status(404).json({
                message: "Program not found"
            });
        }

        // Program must be active
        if (program.status !== "active") {
            return res.status(400).json({
                message: "Program is inactive"
            });
        }

        // Check duplicate department
        const existingDepartment =
            await departmentModel.getDepartmentByName(name);

        if (existingDepartment) {
            return res.status(409).json({
                message: "Department already exists"
            });
        }

        const departmentId = await departmentModel.createDepartment(
            program_id,
            name.trim()
        );

        const department =
            await departmentModel.getDepartmentById(departmentId);

        res.status(201).json({
            message: "Department created successfully",
            department
        });
    } catch (error) {
        console.error("Create department error:", error);

        res.status(500).json({
            message: "Failed to create department"
        });
    }
};

// Update department
const updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { program_id, name, status } = req.body;

        // Check department
        const department = await departmentModel.getDepartmentById(id);

        if (!department) {
            return res.status(404).json({
                message: "Department not found"
            });
        }

        // Validate fields
        if (!program_id || !name || !status) {
            return res.status(400).json({
                message: "program_id, name and status are required"
            });
        }

        // Validate status
        if (!["active", "inactive"].includes(status)) {
            return res.status(400).json({
                message: "Status must be active or inactive"
            });
        }

        // Check program
        const program = await departmentModel.getProgramById(program_id);

        if (!program) {
            return res.status(404).json({
                message: "Program not found"
            });
        }

        // Check duplicate name
        const existingDepartment =
            await departmentModel.getDepartmentByName(name);

        if (
            existingDepartment &&
            existingDepartment.id !== Number(id)
        ) {
            return res.status(409).json({
                message: "Department already exists"
            });
        }

        await departmentModel.updateDepartment(
            id,
            program_id,
            name.trim(),
            status
        );

        const updatedDepartment =
            await departmentModel.getDepartmentById(id);

        res.status(200).json({
            message: "Department updated successfully",
            department: updatedDepartment
        });
    } catch (error) {
        console.error("Update department error:", error);

        res.status(500).json({
            message: "Failed to update department"
        });
    }
};

// Deactivate department
const deactivateDepartment = async (req, res) => {
    try {
        const { id } = req.params;

        const department = await departmentModel.getDepartmentById(id);

        if (!department) {
            return res.status(404).json({
                message: "Department not found"
            });
        }

        if (department.status === "inactive") {
            return res.status(400).json({
                message: "Department is already inactive"
            });
        }

        await departmentModel.deactivateDepartment(id);

        res.status(200).json({
            message: "Department deactivated successfully"
        });
    } catch (error) {
        console.error("Deactivate department error:", error);

        res.status(500).json({
            message: "Failed to deactivate department"
        });
    }
};

module.exports = {
    getAllDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deactivateDepartment
};