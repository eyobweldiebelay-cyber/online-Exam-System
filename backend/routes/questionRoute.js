const express = require("express");

const {
    createQuestion,
    getQuestions,
    getQuestionById,
    updateQuestion,
    deactivateQuestion,
    activateQuestion
} = require("../controller/questionController");

const router = express.Router();


// Create question
router.post(
    "/",
    createQuestion
);


// Get all questions
router.get(
    "/",
    getQuestions
);


// Get question by ID
router.get(
    "/:id",
    getQuestionById
);


// Update question
router.put(
    "/:id",
    updateQuestion
);


// Deactivate question
router.patch(
    "/:id/deactivate",
    deactivateQuestion
);


// Activate question
router.patch(
    "/:id/activate",
    activateQuestion
);


module.exports = router;