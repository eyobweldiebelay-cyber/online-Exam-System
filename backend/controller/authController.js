const {
    loginAuth,
    changePasswordAuth
} = require("../services/authService");


// ==========================================
// LOGIN
// ==========================================

async function login(req, res) {
    try {
        const {
            username,
            password
        } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required"
            });
        }

        const result = await loginAuth(
            username,
            password
        );

        res.status(200).json({
            message: "Login successful",
            ...result
        });

    } catch (error) {
        res.status(401).json({
            message: error.message
        });
    }
}


// ==========================================
// CHANGE PASSWORD
// ==========================================

async function changePassword(req, res) {
    try {
        const {
            current_password,
            new_password
        } = req.body;

        // Required fields
        if (!current_password || !new_password) {
            return res.status(400).json({
                message:
                    "Current password and new password are required"
            });
        }

        // Password length
        if (new_password.length < 6) {
            return res.status(400).json({
                message:
                    "New password must be at least 6 characters"
            });
        }

        // User ID comes from JWT
        //const userId = req.user.user_id;
        const userId = req.user.id;

        const result = await changePasswordAuth(
            userId,
            current_password,
            new_password
        );

        return res.status(200).json(result);

    } catch (error) {
        console.error(
            "Change password error:",
            error
        );

        if (
            error.message ===
            "Current password is incorrect"
        ) {
            return res.status(401).json({
                message:
                    "Current password is incorrect"
            });
        }

        if (
            error.message ===
            "User not found"
        ) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (
            error.message ===
            "Your account is inactive"
        ) {
            return res.status(403).json({
                message:
                    "Your account is inactive"
            });
        }

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}


module.exports = {
    login,
    changePassword
};