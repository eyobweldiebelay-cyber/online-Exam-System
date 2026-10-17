
const teacherService = require("../services/teacherService");

async function getAllTeachers(req, res) {
    try {
        const teachers = await teacherService.getAllTeachers();
        return res.status(200).json({ teachers });
    } catch (error) {
        console.error("Get teachers error:", error);
        return res.status(500).json({ message: "Failed to load teachers" });
    }
}

async function createTeacher(req, res) {
    try {
        const { username, program_id, department_id } = req.body;

        if (!username || !program_id || !department_id) {
            return res.status(400).json({
                message: "Username, program and department are required"
            });
        }

        const result = await teacherService.createTeacher({
            username,
            program_id,
            department_id
        });

        return res.status(201).json(result);
    } catch (error) {
        const status = error.message.includes("already exists") ? 409 : 400;
        return res.status(status).json({ message: error.message });
    }
}

async function updateTeacher(req, res) {
    try {
        const result = await teacherService.updateTeacher(
            req.params.id,
            req.body
        );

        return res.status(200).json(result);
    } catch (error) {
        const status = error.message === "Teacher not found" ? 404 : 400;
        return res.status(status).json({ message: error.message });
    }
}

async function updateTeacherStatus(req, res) {
    try {
        const { is_active } = req.body;

        if (typeof is_active !== "boolean" && ![0, 1].includes(is_active)) {
            return res.status(400).json({
                message: "is_active must be true or false"
            });
        }

        const result = await teacherService.updateTeacherStatus(
            req.params.id,
            is_active,
            req.user.id
        );

        return res.status(200).json(result);
    } catch (error) {
        const status = error.message === "Teacher not found" ? 404 : 400;
        return res.status(status).json({ message: error.message });
    }
}
async function resetTeacherPassword(req, res) {
    try {
        const result = await teacherService.resetTeacherPassword(
            req.params.id
        );

        return res.status(200).json(result);
    } catch (error) {
        if (error.message === "Teacher not found") {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        console.error("Reset teacher password error:", error);

        return res.status(500).json({
            message: "Failed to reset teacher password"
        });
    }
}
module.exports = {
    getAllTeachers,
    createTeacher,
    updateTeacher,
    updateTeacherStatus,
    resetTeacherPassword
};
