
const express = require("express");
const router = express.Router();

const academicYearController = require("../controller/academicYearController");
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

router.use(authenticate);

// Admin and Teacher can list academic years for the import form.
router.get(
    "/",
    authorize("admin", "teacher"),
    academicYearController.getAllAcademicYears
);

// Only Admin can manage academic years.
router.get(
    "/:id",
    authorize("admin"),
    academicYearController.getAcademicYearById
);

router.post(
    "/",
    authorize("admin"),
    academicYearController.createAcademicYear
);

router.put(
    "/:id",
    authorize("admin"),
    academicYearController.updateAcademicYear
);

router.patch(
    "/:id/status",
    authorize("admin"),
    academicYearController.updateAcademicYearStatus
);

module.exports = router;
