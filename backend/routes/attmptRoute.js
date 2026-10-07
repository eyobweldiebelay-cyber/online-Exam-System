const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authMiddleware");
const attemptController = require("../controller/attemptController");

router.post(
    "/start/:examId",
    authenticate,
    attemptController.startExam
);
router.post(
    "/submit/:attemptId",
    authenticate,
    attemptController.submitExam
);

module.exports = router;