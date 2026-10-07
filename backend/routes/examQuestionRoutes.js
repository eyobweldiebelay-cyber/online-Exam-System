

const express = require("express");

const {
    addQuestionsToExam,
    getExamQuestions
} = require("../controller/examQuestionController");

const router = express.Router();

router.post("/:examId/questions", addQuestionsToExam);

router.get("/:examId/questions", getExamQuestions);

module.exports = router;