
const express = require("express");
const multer = require("multer");
const path = require("path");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    createStudent,
    getAllStudents,
    getStudentCount,
    getStudentById,
    updateStudent,
    updateStudentStatus,
    importStudents,
    resetStudentPassword, // NEW
} = require("../controller/studentController");

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();

        if (extension === ".csv" || extension === ".xlsx") {
            return callback(null, true);
        }

        return callback(
            new Error("Only CSV and XLSX files are allowed.")
        );
    },
});

router.use(authenticate);

// Normalize role names, supporting "academic_dean" and "academic-dean".
function allowAcademicReporting(req, res, next) {
    const role = String(req.user?.role || "")
        .toLowerCase()
        .replace(/-/g, "_");

    if (!["admin", "academic_dean"].includes(role)) {
        return res.status(403).json({
            message: "You are not authorized to access academic student records.",
        });
    }

    return next();
}

// Admin and Academic Dean: view student count.
router.get(
    "/count",
    allowAcademicReporting,
    getStudentCount
);

// Admin and Academic Dean: view student academic records.
router.get(
    "/academic-list",
    allowAcademicReporting,
    getAllStudents
);

// Admin and Academic Dean: activate/deactivate student accounts.
router.patch(
    "/:id/status",
    allowAcademicReporting,
    updateStudentStatus
);

// Admin and Academic Dean: edit academic details only.
router.put(
    "/:id/academic",
    allowAcademicReporting,
    (req, res) => {
        return res.status(501).json({
            message: "Academic details update endpoint has not been implemented yet.",
        });
    }
);

// Admin-only student account management.
router.post(
    "/",
    authorize("admin"),
    createStudent
);

router.get(
    "/",
    authorize("admin"),
    getAllStudents
);

router.post(
    "/import",
    authorize("admin"),
    upload.single("file"),
    importStudents
);

// Admin-only: reset a student's forgotten password.
router.patch(
    "/:id/reset-password",
    authorize("admin"),
    resetStudentPassword
);

router.get(
    "/:id",
    authorize("admin"),
    getStudentById
);

router.put(
    "/:id",
    authorize("admin"),
    updateStudent
);

module.exports = router;
