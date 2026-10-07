const db = require("../config/db");
const {
    hashPassword,
    comparePassword
} = require("../unils/password");

async function createStudent(data) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const {
            student_id,
            first_name,
            last_name,
            department_id,
            academic_year,
            password
        } = data;

        // Check student ID
        const [existingStudent] = await connection.execute(
            "SELECT id FROM students WHERE student_id = ?",
            [student_id]
        );

        if (existingStudent.length > 0) {
            throw new Error("Student ID already exists");
        }

        // Check department
        const [department] = await connection.execute(
            "SELECT id FROM departments WHERE id = ?",
            [department_id]
        );

        if (department.length === 0) {
            throw new Error("Department not found");
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user account
        const [userResult] = await connection.execute(
            `INSERT INTO users
            (username, password, role, is_active)
            VALUES (?, ?, 'student', 1)`,
            [student_id, hashedPassword]
        );

        const userId = userResult.insertId;

        // Create student
        await connection.execute(
            `INSERT INTO students
            (
                user_id,
                student_id,
                first_name,
                last_name,
                department_id,
                academic_year,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, 'active')`,
            [
                userId,
                student_id,
                first_name,
                last_name,
                department_id,
                academic_year || null
            ]
        );

        await connection.commit();

        return {
            message: "Student created successfully",
            student_id
        };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}


async function getAllStudents() {
    const [students] = await db.execute(
        `SELECT
            s.id,
            s.student_id,
            s.first_name,
            s.last_name,
            s.department_id,
            d.name AS department_name,
            p.name AS program_name,
            s.academic_year,
            s.status,
            s.created_at
        FROM students s
        INNER JOIN departments d
            ON s.department_id = d.id
        INNER JOIN programs p
            ON d.program_id = p.id
        ORDER BY s.id DESC`
    );

    return students;
}


async function getStudentById(id) {
    const [students] = await db.execute(
        `SELECT
            s.id,
            s.student_id,
            s.first_name,
            s.last_name,
            s.department_id,
            d.name AS department_name,
            p.name AS program_name,
            s.academic_year,
            s.status,
            s.created_at
        FROM students s
        INNER JOIN departments d
            ON s.department_id = d.id
        INNER JOIN programs p
            ON d.program_id = p.id
        WHERE s.id = ?`,
        [id]
    );

    if (students.length === 0) {
        throw new Error("Student not found");
    }

    return students[0];
}


async function updateStudent(id, data) {
    const {
        first_name,
        last_name,
        department_id,
        academic_year
    } = data;

    const [result] = await db.execute(
        `UPDATE students
         SET
            first_name = ?,
            last_name = ?,
            department_id = ?,
            academic_year = ?
         WHERE id = ?`,
        [
            first_name,
            last_name,
            department_id,
            academic_year || null,
            id
        ]
    );

    if (result.affectedRows === 0) {
        throw new Error("Student not found");
    }

    return {
        message: "Student updated successfully"
    };
}


async function updateStudentStatus(id, status) {
    if (!["active", "inactive"].includes(status)) {
        throw new Error("Invalid status");
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [student] = await connection.execute(
            "SELECT user_id FROM students WHERE id = ?",
            [id]
        );

        if (student.length === 0) {
            throw new Error("Student not found");
        }

        const userId = student[0].user_id;

        await connection.execute(
            `UPDATE students
             SET status = ?
             WHERE id = ?`,
            [status, id]
        );

        await connection.execute(
            `UPDATE users
             SET is_active = ?
             WHERE id = ?`,
            [status === "active" ? 1 : 0, userId]
        );

        await connection.commit();

        return {
            message: `Student ${status} successfully`
        };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}


/* =========================================
   CHANGE STUDENT PASSWORD
========================================= */

async function changeStudentPassword(
    userId,
    currentPassword,
    newPassword
) {
    // Get current password from users table
    const [users] = await db.execute(
        `SELECT id, password
         FROM users
         WHERE id = ? AND role = 'student'`,
        [userId]
    );

    if (users.length === 0) {
       throw new Error("Student account not found");
    }

    const user = users[0];

    // Check current password
    const passwordMatch = await comparePassword(
        currentPassword,
        user.password
    );

    if (!passwordMatch) {
        throw new Error("Current password is incorrect");
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await db.execute(
        `UPDATE users
         SET password = ?
         WHERE id = ?`,
        [hashedPassword, userId]
    );

    return {
        message: "Password changed successfully"
    };
}


module.exports = {
    createStudent,
    getAllStudents,
    getStudentById,
    updateStudent,
    updateStudentStatus,
    changeStudentPassword
};