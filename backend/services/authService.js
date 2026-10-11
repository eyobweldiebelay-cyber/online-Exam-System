
const db = require("../config/db");
const {
    hashPassword,
    comparePassword
} = require("../unils/password");
const { generateToken } = require("../unils/jwt");

// LOGIN
async function loginAuth(username, password) {
    const [users] = await db.execute(
        `SELECT id, username, password, role, is_active, must_change_password
         FROM users
         WHERE username = ?
         LIMIT 1`,
        [username]
    );

    if (users.length === 0) {
        throw new Error("Invalid username or password");
    }

    const user = users[0];

    if (!user.is_active) {
        throw new Error("Your account is inactive");
    }

    const passwordMatch = await comparePassword(password, user.password);

    if (!passwordMatch) {
        throw new Error("Invalid username or password");
    }

    const token = generateToken(user);

    return {
        token,
        user: {
            id: user.id,
            username: user.username,
            role: user.role,
            must_change_password: Boolean(user.must_change_password)
        }
    };
}

// CHANGE PASSWORD
async function changePasswordAuth(userId, currentPassword, newPassword) {
    const [users] = await db.execute(
        `SELECT id, password, is_active
         FROM users
         WHERE id = ?
         LIMIT 1`,
        [userId]
    );

    if (users.length === 0) {
        throw new Error("User not found");
    }

    const user = users[0];

    if (!user.is_active) {
        throw new Error("Your account is inactive");
    }

    const passwordMatch = await comparePassword(
        currentPassword,
        user.password
    );

    if (!passwordMatch) {
        throw new Error("Current password is incorrect");
    }

    const hashedPassword = await hashPassword(newPassword);

    await db.execute(
        `UPDATE users
         SET password = ?, must_change_password = 0
         WHERE id = ?`,
        [hashedPassword, userId]
    );

    return {
        message: "Password changed successfully"
    };
}

module.exports = {
    loginAuth,
    changePasswordAuth
};
