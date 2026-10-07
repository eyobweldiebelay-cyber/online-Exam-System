const express = require("express");

const authenticate = require("../middleware/authMiddleware");

const {
    login,
    changePassword
} = require("../controller/authController");

const router = express.Router();


// ==========================================
// LOGIN
// ==========================================

router.post("/login", login);


// ==========================================
// CHANGE PASSWORD
// ==========================================

router.patch(
    "/change-password",
    authenticate,
    changePassword
);


module.exports = router;