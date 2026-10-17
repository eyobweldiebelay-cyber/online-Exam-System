
const express = require("express");

const router = express.Router();

const authenticate = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const examController = require("../controller/examControlller");

// Admin routes
router.post(
    "/",
    authenticate,
    roleMiddleware("admin"),
    examController.createExam
);

router.get(
    "/",
    authenticate,
    roleMiddleware("admin"),
    examController.getAllExams
);

router.patch(
    "/:id/publish",
    authenticate,
    roleMiddleware("admin"),
    examController.publishExam
);

router.put(
    "/:id",
    authenticate,
    roleMiddleware("admin"),
    examController.updateExam
);

router.delete(
    "/:id",
    authenticate,
    roleMiddleware("admin"),
    examController.deleteExam
);

// Exam details
router.get(
    "/:id",
    authenticate,
    examController.getExamById
);

// Student routes
router.get(
    "/student/available",
    authenticate,
    roleMiddleware("student"),
    examController.getAvailableExamsForStudent);

module.exports = router;