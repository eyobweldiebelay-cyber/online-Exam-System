const express = require("express");

const {
    addQuestionsToExam,
    getExamQuestions
} = require("../controller/examQuestionController");

const authenticate = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

// Admin: assign questions to an exam
router.post(
    "/:examId/questions",
    authenticate,
    roleMiddleware("admin"),
    addQuestionsToExam
);

// Admin: view questions assigned to an exam
router.get(
    "/:examId/questions",
    authenticate,
    roleMiddleware("admin"),
    getExamQuestions
);

module.exports = router;