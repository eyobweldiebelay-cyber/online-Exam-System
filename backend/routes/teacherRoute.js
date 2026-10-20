
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

// Every Teacher Management endpoint requires authentication.
router.use(authenticate);

// List existing Teacher accounts.
// Admin manages accounts; Academic Dean needs the list for assignments.
router.get(
    "/",
    authorize("admin", "academic_dean"),
    getAllTeachers
);

// Only Admin can create Teacher accounts.
router.post(
    "/",
    authorize("admin"),
    createTeacher
);

// Admin and Academic Dean can update teacher details.
// Academic Dean uses this endpoint to assign program and department.
router.put(
    "/:id",
    authorize("admin", "academic_dean"),
    updateTeacher
);

// Only Admin can change account status.
router.patch(
    "/:id/status",
    authorize("admin"),
    updateTeacherStatus
);

// Only Admin can reset a Teacher's password.
router.patch(
    "/:id/reset-password",
    authorize("admin"),
    resetTeacherPassword
);

module.exports = router;
