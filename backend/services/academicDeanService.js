
const crypto = require("node:crypto");
const db = require("../config/db");
const { hashPassword } = require("../unils/password");

async function getAllAcademicDeans() {
    const [deans] = await db.execute(
        `SELECT
            id AS user_id,
            full_name,
            username,
            is_active,
            must_change_password,
            created_at
         FROM users
         WHERE role = 'academic_dean'
         ORDER BY id DESC`
    );

    return deans;
}

async function createAcademicDean(data) {
    const fullName = String(data.full_name || "").trim();
    const username = String(data.username || "").trim();

    if (!fullName || !username) {
        throw new Error("Full name and username are required");
    }

    const [existingUsers] = await db.execute(
        "SELECT id FROM users WHERE username = ? LIMIT 1",
        [username]
    );

    if (existingUsers.length > 0) {
        throw new Error("Username already exists");
    }

    const temporaryPassword =
        `Dean@${crypto.randomBytes(6).toString("hex")}A1`;

    const hashedPassword = await hashPassword(temporaryPassword);

    const [result] = await db.execute(
        `INSERT INTO users
            (full_name, username, password, role, department_id,
             is_active, must_change_password)
         VALUES (?, ?, ?, 'academic_dean', NULL, 1, 1)`,
        [fullName, username, hashedPassword]
    );

    return {
        message: "Academic Dean account created successfully",
        user_id: result.insertId,
        full_name: fullName,
        username,
        temporary_password: temporaryPassword
    };
}

async function updateAcademicDeanStatus(id, isActive) {
    const [result] = await db.execute(
        `UPDATE users
         SET is_active = ?
         WHERE id = ? AND role = 'academic_dean'`,
        [isActive ? 1 : 0, id]
    );

    if (result.affectedRows === 0) {
        const [existing] = await db.execute(
            `SELECT id FROM users
             WHERE id = ? AND role = 'academic_dean'
             LIMIT 1`,
            [id]
        );

        if (existing.length === 0) {
            throw new Error("Academic Dean account not found");
        }
    }

    return {
        message: `Academic Dean account ${
            isActive ? "activated" : "deactivated"
        } successfully`
    };
}

async function resetAcademicDeanPassword(id) {
    const [deans] = await db.execute(
        `SELECT id FROM users
         WHERE id = ? AND role = 'academic_dean'
         LIMIT 1`,
        [id]
    );

    if (deans.length === 0) {
        throw new Error("Academic Dean account not found");
    }

    const temporaryPassword =
        `Dean@${crypto.randomBytes(6).toString("hex")}A1`;

    const hashedPassword = await hashPassword(temporaryPassword);

    await db.execute(
        `UPDATE users
         SET password = ?, must_change_password = 1
         WHERE id = ? AND role = 'academic_dean'`,
        [hashedPassword, id]
    );

    return {
        message: "Academic Dean password reset successfully",
        temporary_password: temporaryPassword
    };
}

module.exports = {
    getAllAcademicDeans,
    createAcademicDean,
    updateAcademicDeanStatus,
    resetAcademicDeanPassword
};
