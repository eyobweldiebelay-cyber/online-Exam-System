
const express = require("express");
const multer = require("multer");
const path = require("path");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    getQuestions,
    getQuestionById,
    updateQuestion,
    deactivateQuestion,
    activateQuestion,
    importQuestions,
} = require("../controller/questionController");

const router = express.Router();

router.use(authenticate);

// View questions
router.get("/", authorize("academic_dean", "teacher"), getQuestions);
router.get("/:id", authorize("academic_dean", "teacher"), getQuestionById);

// academic_dean and Teacher can manage eligible questions.
// Department permissions must also be enforced in questionService.js.
router.put("/:id", authorize("academic_dean", "teacher"), updateQuestion);

router.patch(
    "/:id/deactivate",
    authorize("academic_dean", "teacher"),
    deactivateQuestion
);

router.patch(
    "/:id/activate",
    authorize("academic_dean", "teacher"),
    activateQuestion
);

// Teachers upload questions using CSV/XLS/XLSX only.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, callback) => {
        const allowedExtensions = [".csv", ".xlsx", ".xls"];
        const extension = path.extname(file.originalname).toLowerCase();

        if (!allowedExtensions.includes(extension)) {
            return callback(
                new Error("Only CSV, XLSX, and XLS files are allowed.")
            );
        }

        callback(null, true);
    },
});

router.post(
    "/import",
    authorize("teacher"),
    upload.single("file"),
    importQuestions
);

module.exports = router;
