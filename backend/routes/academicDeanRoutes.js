
const express = require("express");
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    getAllAcademicDeans,
    createAcademicDean,
    updateAcademicDeanStatus,
    resetAcademicDeanPassword
} = require("../controller/academicDeanController");

const router = express.Router();

router.use(authenticate);

// Only Admin can list Academic Dean accounts.
router.get(
    "/",
    authorize("admin"),
    getAllAcademicDeans
);

// Only Admin can create Academic Dean accounts.
router.post(
    "/",
    authorize("admin"),
    createAcademicDean
);

// Only Admin can activate or deactivate Academic Dean accounts.
router.patch(
    "/:id/status",
    authorize("admin"),
    updateAcademicDeanStatus
);

// Only Admin can reset Academic Dean passwords.
router.patch(
    "/:id/reset-password",
    authorize("admin"),
    resetAcademicDeanPassword
);

module.exports = router;
