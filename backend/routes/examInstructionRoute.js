
const express = require("express");
const router = express.Router();

const examInstructionController =
    require("../controller/examInstructionController");
const authenticate = require("../middleware/authMiddleware");
// GET all instructions
router.get("/", examInstructionController.getAllInstructions);

// GET instructions for one exam
router.get(
    "/exam/:examId",
    examInstructionController.getInstructionsByExamId
);

// CREATE instructions
router.post("/", examInstructionController.createInstructions);

// UPDATE instructions for an exam
router.put(
    "/exam/:examId",
    examInstructionController.updateInstructions
);

// DELETE instructions for an exam
router.delete(
    "/exam/:examId",
    examInstructionController.deleteInstructions
);

module.exports = router;
