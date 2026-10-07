const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authMiddleware");
const resultController = require("../controller/resultController");

router.get(
    "/my",
    authenticate,
    resultController.getMyResults
);

router.get(
    "/my/attempt/:attemptId",
    authenticate,
    resultController.getMyResultByAttempt
);

module.exports = router;