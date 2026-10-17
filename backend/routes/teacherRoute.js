
const express = require("express");
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    getAllTeachers,
    createTeacher,
    updateTeacher,
    updateTeacherStatus,
    resetTeacherPassword
} = require("../controller/teacherController");

const router = express.Router();

// Every Teacher Management endpoint requires an Admin account.
router.use(authenticate);
router.use(authorize("admin"));

// List and create Teacher accounts.
router.get("/", getAllTeachers);
router.post("/", createTeacher);

// Update Teacher details and account status.
router.put("/:id", updateTeacher);
router.patch("/:id/status", updateTeacherStatus);

// Reset a Teacher's password.
router.patch("/:id/reset-password", resetTeacherPassword);

module.exports = router;
