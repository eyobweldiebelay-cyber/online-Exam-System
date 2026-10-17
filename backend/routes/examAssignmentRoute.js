
const express = require("express");
const router = express.Router();

const examAssignmentController = require("../controller/examAssignmentController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// All assignment routes require a valid login.
router.use(authMiddleware);

// Only administrators can view all assignments, create assignments,
// or delete assignments.
router.get(
    "/",
    roleMiddleware(["admin"]),
    examAssignmentController.getAllAssignments
);

router.post(
    "/",
    roleMiddleware("admin"),
    examAssignmentController.createAssignment
);

router.delete(
    "/:id",
    roleMiddleware(["admin"]),
    examAssignmentController.deleteAssignment
);

// Students can view only their own assignments.
// Admins can view assignments for a selected student.
router.get(
    "/student/:studentId",
    (req, res, next) => {
        if (
            req.user.role === "admin" ||
            String(req.user.id) === String(req.params.studentId)
        ) {
            return next();
        }

        return res.status(403).json({
            message: "You are not authorized to view these assignments",
        });
    },
    examAssignmentController.getAssignmentsByStudentId
);

module.exports = router;
