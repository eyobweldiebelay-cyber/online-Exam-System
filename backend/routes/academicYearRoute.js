
const express = require("express");
const router = express.Router();

const academicYearController = require("../controller/academicYearController");
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

router.use(authenticate);

// academic_dean and Teacher can list academic years for the import form.
router.get(
    "/",
    authorize("academic_dean", "teacher"),
    academicYearController.getAllAcademicYears
);

// Only academic_dean  can manage academic years.
router.get(
    "/:id",
    authorize("academic_dean"),
    academicYearController.getAcademicYearById
);

router.post(
    "/",
    authorize("academic_dean"),
    academicYearController.createAcademicYear
);

router.put(
    "/:id",
    authorize("academic_dean"),
    academicYearController.updateAcademicYear
);

router.patch(
    "/:id/status",
    authorize("academic_dean"),
    academicYearController.updateAcademicYearStatus
);

module.exports = router;
