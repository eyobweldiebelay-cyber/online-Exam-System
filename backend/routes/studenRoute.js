const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    createStudent,
    getAllStudents,
    getStudentById,
    updateStudent,
    updateStudentStatus
} = require("../controller/studentController");

const router = express.Router();

// All student management routes require Admin
router.use(authenticate);
router.use(authorize("admin"));

router.post("/", createStudent);

router.get("/", getAllStudents);

router.get("/:id", getStudentById);

router.put("/:id", updateStudent);

router.patch("/:id/status", updateStudentStatus);

module.exports = router;