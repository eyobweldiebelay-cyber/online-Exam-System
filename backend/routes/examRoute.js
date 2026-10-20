
const express = require("express");

const router = express.Router();

const authenticate = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const examController = require("../controller/examControlller");

// academic_dean routes
router.post(
    "/",
    authenticate,
    roleMiddleware("academic_dean"),
    examController.createExam
);

router.get(
    "/",
    authenticate,
    roleMiddleware("academic_dean"),
    examController.getAllExams
);

router.patch(
    "/:id/publish",
    authenticate,
    roleMiddleware("academic_dean"),
    examController.publishExam
);

router.put(
    "/:id",
    authenticate,
    roleMiddleware("academic_dean"),
    examController.updateExam
);

router.delete(
    "/:id",
    authenticate,
    roleMiddleware("academic_dean"),
    examController.deleteExam
);

// Exam details chek it latter which role do it
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