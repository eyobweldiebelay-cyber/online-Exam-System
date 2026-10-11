const express = require("express");
const multer = require("multer");
const path = require("path");
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    createStudent,
    getAllStudents,
    getStudentById,
    updateStudent,
    updateStudentStatus,
    importStudents
} = require("../controller/studentController");

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();

        if (extension === ".csv" || extension === ".xlsx") {
            return callback(null, true);
        }

        return callback(null, false);
    }
});

// All student management routes require Admin
router.use(authenticate);
router.use(authorize("admin"));

router.post("/", createStudent);

router.get("/", getAllStudents);
router.post("/import", upload.single("file"), importStudents);

router.get("/:id", getStudentById);

router.put("/:id", updateStudent);

router.patch("/:id/status", updateStudentStatus);

module.exports = router;