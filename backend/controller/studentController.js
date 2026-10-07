const studentService = require("../services/studentService");


// ==========================================
// CREATE STUDENT
// ==========================================

async function createStudent(req, res) {
    try {
        const {
            student_id,
            first_name,
            last_name,
            department_id,
            academic_year,
            password
        } = req.body;

        if (
            !student_id ||
            !first_name ||
            !last_name ||
            !department_id ||
            !password
        ) {
            return res.status(400).json({
                message: "Student ID, name, department and password are required"
            });
        }

        const result = await studentService.createStudent({
            student_id,
            first_name,
            last_name,
            department_id,
            academic_year,
            password
        });

        res.status(201).json(result);

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
}


// ==========================================
// GET ALL STUDENTS
// ==========================================

async function getAllStudents(req, res) {
    try {
        const students = await studentService.getAllStudents();

        res.status(200).json({
            students
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
}


// ==========================================
// GET STUDENT BY ID
// ==========================================

async function getStudentById(req, res) {
    try {
        const student = await studentService.getStudentById(
            req.params.id
        );

        res.status(200).json({
            student
        });

    } catch (error) {
        res.status(404).json({
            message: error.message
        });
    }
}


// ==========================================
// UPDATE STUDENT
// ==========================================

async function updateStudent(req, res) {
    try {
        const result = await studentService.updateStudent(
            req.params.id,
            req.body
        );

        res.status(200).json(result);

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
}


// ==========================================
// UPDATE STUDENT STATUS
// ==========================================

async function updateStudentStatus(req, res) {
    try {
        const { status } = req.body;

        const result = await studentService.updateStudentStatus(
            req.params.id,
            status
        );

        res.status(200).json(result);

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
}


// ==========================================
// CHANGE STUDENT PASSWORD
// ==========================================

async function changePassword(req, res) {
    try {
        const {
            current_password,
            new_password
        } = req.body;

        // Check required fields
        if (!current_password || !new_password) {
            return res.status(400).json({
                message: "Current password and new password are required"
            });
        }

        // Check password length
        if (new_password.length < 6) {
            return res.status(400).json({
                message: "New password must be at least 6 characters"
            });
        }

        // Get logged-in user's ID from JWT
        const userId = req.user.user_id;

        // Change password
        await studentService.changeStudentPassword(
            userId,
            current_password,
            new_password
        );

        return res.status(200).json({
            message: "Password changed successfully"
        });

    } catch (error) {
        console.error("Change password error:", error);

        if (error.message === "Current password is incorrect") {
            return res.status(401).json({
                message: "Current password is incorrect"
            });
        }

        if (error.message === "Student account not found") {
            return res.status(404).json({
                message: "Student account not found"
            });
        }

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}


// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
    createStudent,
    getAllStudents,
    getStudentById,
    updateStudent,
    updateStudentStatus,
    changePassword
};