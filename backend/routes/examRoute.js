const express = require("express");

const router = express.Router();
const authenticate = require("../middleware/authMiddleware");

const examController = require("../controller/examControlller");

router.post("/", examController.createExam);

router.get("/", examController.getAllExams);

router.patch("/:id/publish", examController.publishExam);
router.get("/student/available",authenticate,examController.getAvailableExamsForStudent);

router.get("/:id", examController.getExamById);

router.put("/:id", examController.updateExam);

router.delete("/:id", examController.deleteExam);

module.exports = router;