
const crypto = require("node:crypto");
const db = require("../config/db");
const { hashPassword } = require("../unils/password");

// List all Teacher accounts and their assigned program/department.
async function getAllTeachers() {
    const [teachers] = await db.execute(
        `SELECT
    u.id AS user_id,
    u.full_name,
    u.username,
    u.department_id,
    u.is_active,
    u.must_change_password,
    u.created_at,
    d.name AS department_name,
    d.program_id,
    p.name AS program_name
 FROM users u
 LEFT JOIN departments d ON d.id = u.department_id
 LEFT JOIN programs p ON p.id = d.program_id
 WHERE u.role = 'teacher'
 ORDER BY u.id DESC`
    );

    return teachers;
}

// Validate that the selected department belongs to the selected program.
async function validateDepartment(programId, departmentId) {
    if (!programId || !departmentId) {
        throw new Error("Program and department are required");
    }

    const [departments] = await db.execute(
        `SELECT id
         FROM departments
         WHERE id = ? AND program_id = ?
         LIMIT 1`,
        [departmentId, programId]
    );

    if (departments.length === 0) {
        throw new Error(
            "The selected department does not belong to the selected program"
        );
    }
}

// Create a Teacher login account before academic assignment.
// The Academic Dean assigns the program and department separately.
async function createTeacher(data) {
    const { full_name, username } = data;

    const cleanName = String(full_name || "").trim();
    const cleanUsername = String(username || "").trim();

    if (!cleanName || !cleanUsername) {
        throw new Error("Full name and username are required");
    }

    const [existingUsers] = await db.execute(
        "SELECT id FROM users WHERE username = ? LIMIT 1",
        [cleanUsername]
    );

    if (existingUsers.length > 0) {
        throw new Error("Username already exists");
    }

    const temporaryPassword =
        `Teach@${crypto.randomBytes(6).toString("hex")}A1`;

    const hashedPassword = await hashPassword(temporaryPassword);

    const [result] = await db.execute(
        `INSERT INTO users
            (full_name, username, password, role, department_id,
             is_active, must_change_password)
         VALUES (?, ?, ?, 'teacher', NULL, 1, 1)`,
        [cleanName, cleanUsername, hashedPassword]
    );

    return {
        message: "Teacher account created successfully",
        user_id: result.insertId,
        full_name: cleanName,
        username: cleanUsername,
        temporary_password: temporaryPassword
    };
}

// Update a Teacher's username and academic assignment.
// Keep assignment validation for this existing operation.
async function updateTeacher(userId, data) {
    const username =
        typeof data.username === "string" ? data.username.trim() : "";

    const { program_id, department_id } = data;

    if (!username) {
        throw new Error("Username is required");
    }

    await validateDepartment(program_id, department_id);

    const [teachers] = await db.execute(
        `SELECT id
         FROM users
         WHERE id = ? AND role = 'teacher'
         LIMIT 1`,
        [userId]
    );

    if (teachers.length === 0) {
        throw new Error("Teacher not found");
    }

    const [duplicate] = await db.execute(
        `SELECT id
         FROM users
         WHERE username = ? AND id <> ?
         LIMIT 1`,
        [username, userId]
    );

    if (duplicate.length > 0) {
        throw new Error("Username already exists");
    }

    await db.execute(
        `UPDATE users
         SET username = ?, department_id = ?
         WHERE id = ? AND role = 'teacher'`,
        [username, Number(department_id), userId]
    );

    return {
        message: "Teacher updated successfully"
    };
}

// Activate or deactivate a Teacher account without deleting its data.
async function updateTeacherStatus(userId, isActive, currentAdminId) {
    if (typeof isActive !== "boolean" && ![0, 1].includes(isActive)) {
        throw new Error("is_active must be true or false");
    }

    const activeValue = isActive === true || isActive === 1 ? 1 : 0;

    if (Number(userId) === Number(currentAdminId)) {
        throw new Error("You cannot change your own account status here");
    }

    const [teachers] = await db.execute(
        `SELECT id
         FROM users
         WHERE id = ? AND role = 'teacher'
         LIMIT 1`,
        [userId]
    );

    if (teachers.length === 0) {
        throw new Error("Teacher not found");
    }

    await db.execute(
        `UPDATE users
         SET is_active = ?
         WHERE id = ? AND role = 'teacher'`,
        [activeValue, userId]
    );

    return {
        message: `Teacher ${activeValue ? "activated" : "deactivated"} successfully`
    };
}

// Reset a Teacher's password.
async function resetTeacherPassword(userId) {
    const [teachers] = await db.execute(
        `SELECT id
         FROM users
         WHERE id = ? AND role = 'teacher'
         LIMIT 1`,
        [userId]
    );

    if (teachers.length === 0) {
        throw new Error("Teacher not found");
    }

    const temporaryPassword =
        `Teach@${crypto.randomBytes(6).toString("hex")}A1`;

    const hashedPassword = await hashPassword(temporaryPassword);

    await db.execute(
        `UPDATE users
         SET password = ?, must_change_password = 1
         WHERE id = ? AND role = 'teacher'`,
        [hashedPassword, userId]
    );

    return {
        message: "Teacher password reset successfully",
        user_id: Number(userId),
        temporary_password: temporaryPassword
    };
}

module.exports = {
    getAllTeachers,
    createTeacher,
    updateTeacher,
    updateTeacherStatus,
    resetTeacherPassword
};
