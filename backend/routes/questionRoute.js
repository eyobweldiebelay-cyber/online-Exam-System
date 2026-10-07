const express = require("express");

const {
    createQuestion,
    getQuestions,
    getQuestionById
} = require("../controller/questionController");

const router = express.Router();

router.post("/", createQuestion);

router.get("/", getQuestions);

router.get("/:id", getQuestionById);

module.exports = router;