
const { verifyToken } = require("../unils/jwt");
const db = require("../config/db");

async function authenticate(req, res, next) {
    let decoded;

    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        const token = authHeader.split(" ")[1];
        decoded = verifyToken(token);
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }

    try {
        const [users] = await db.execute(
            `SELECT id, role, department_id, is_active, must_change_password
             FROM users
            WHERE id = ?
           LIMIT 1`,
            [decoded.id]
        );

        if (users.length === 0 || !users[0].is_active) {
            return res.status(401).json({
                message: "Account not found or inactive"
            });
        }

        const user = users[0];

        // Use the current database role, not the role stored in the token.
       req.user = {
    ...decoded,
    id: user.id,
    role: user.role,
    department_id: user.department_id
};
        const isChangePasswordRequest =
            req.originalUrl.split("?")[0].endsWith("/change-password");

       if (
    ["student", "teacher"].includes(user.role) &&
    user.must_change_password &&
    !isChangePasswordRequest
) {
            return res.status(403).json({
                code: "PASSWORD_CHANGE_REQUIRED",
                message: "Change your temporary password before continuing."
            });
        }

        next();
    } catch (error) {
        console.error("Authentication check failed:", error);

        return res.status(500).json({
            message: "Authentication check failed"
        });
    }
}

module.exports = authenticate;
