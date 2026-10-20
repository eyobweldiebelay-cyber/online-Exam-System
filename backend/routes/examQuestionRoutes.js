
const express = require("express");

const {
    addQuestionsToExam,
    getExamQuestions,
    getAvailableQuestions
} = require("../controller/examQuestionController");

const authenticate = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

// Academic Dean: get available questions for an exam
router.get(
    "/:examId/available-questions",
    authenticate,
    roleMiddleware("academic_dean"),
    getAvailableQuestions
);

// Academic Dean: assign questions to an exam
router.post(
    "/:examId/questions",
    authenticate,
    roleMiddleware("academic_dean"),
    addQuestionsToExam
);

// Academic Dean: view questions assigned to an exam
router.get(
    "/:examId/questions",
    authenticate,
    roleMiddleware("academic_dean"),
    getExamQuestions
);

module.exports = router;
