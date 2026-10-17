
const crypto = require("node:crypto");
const db = require("../config/db");
const { hashPassword } = require("../unils/password");

// List all Teacher accounts and their assigned program/department.
async function getAllTeachers() {
    const [teachers] = await db.execute(
        `SELECT
            u.id AS user_id,
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
    const [departments] = await db.execute(
        `SELECT id
         FROM departments
         WHERE id = ? AND program_id = ?
         LIMIT 1`,
        [departmentId, programId]
    );

    if (departments.length === 0) {
        throw new Error("The selected department does not belong to the selected program");
    }
}

// Create a Teacher account with a generated temporary password.
async function createTeacher(data) {
    const { username, program_id, department_id } = data;

    if (!username || !program_id || !department_id) {
        throw new Error("Username, program and department are required");
    }

    await validateDepartment(program_id, department_id);

    const [existingUsers] = await db.execute(
        "SELECT id FROM users WHERE username = ? LIMIT 1",
        [username.trim()]
    );

    if (existingUsers.length > 0) {
        throw new Error("Username already exists");
    }

    const temporaryPassword =
        `Teach@${crypto.randomBytes(6).toString("hex")}A1`;

    const hashedPassword = await hashPassword(temporaryPassword);

    const [result] = await db.execute(
        `INSERT INTO users
            (username, password, role, department_id, is_active, must_change_password)
         VALUES (?, ?, 'teacher', ?, 1, 1)`,
        [username.trim(), hashedPassword, Number(department_id)]
    );

    return {
        message: "Teacher account created successfully",
        user_id: result.insertId,
        username: username.trim(),
        temporary_password: temporaryPassword
    };
}

// Update username and department assignment.
async function updateTeacher(userId, data) {
    const { username, program_id, department_id } = data;

    if (!username || !program_id || !department_id) {
        throw new Error("Username, program and department are required");
    }

    await validateDepartment(program_id, department_id);

    const [teachers] = await db.execute(
        "SELECT id FROM users WHERE id = ? AND role = 'teacher' LIMIT 1",
        [userId]
    );

    if (teachers.length === 0) {
        throw new Error("Teacher not found");
    }

    const [duplicate] = await db.execute(
        `SELECT id FROM users
         WHERE username = ? AND id <> ?
         LIMIT 1`,
        [username.trim(), userId]
    );

    if (duplicate.length > 0) {
        throw new Error("Username already exists");
    }

    await db.execute(
        `UPDATE users
         SET username = ?, department_id = ?
         WHERE id = ? AND role = 'teacher'`,
        [username.trim(), Number(department_id), userId]
    );

    return { message: "Teacher updated successfully" };
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
        "SELECT id FROM users WHERE id = ? AND role = 'teacher' LIMIT 1",
        [userId]
    );

    if (teachers.length === 0) {
        throw new Error("Teacher not found");
    }

    await db.execute(
        "UPDATE users SET is_active = ? WHERE id = ? AND role = 'teacher'",
        [activeValue, userId]
    );

    return {
        message: `Teacher ${activeValue ? "activated" : "deactivated"} successfully`
    };
}
async function resetTeacherPassword(userId) {
    // Only reset accounts whose role is teacher.
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

    // Generate a new temporary password.
    const temporaryPassword =
        `Teach@${crypto.randomBytes(6).toString("hex")}A1`;

    // Store only the password hash.
    const hashedPassword = await hashPassword(temporaryPassword);

    await db.execute(
        `UPDATE users
         SET password = ?, must_change_password = 1
         WHERE id = ? AND role = 'teacher'`,
        [hashedPassword, userId]
    );

    // Return the plaintext password only for this one-time response.
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
