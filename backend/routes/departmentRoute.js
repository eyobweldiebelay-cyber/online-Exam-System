const express = require("express");
const router = express.Router();

const departmentController = require("../controller/departmentController");
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

// All department routes require authentication.
router.use(authenticate);

// academic_dean and Teacher can read departments for their respective workflows.
router.get("/",
    authorize("academic_dean", "teacher"),
    departmentController.getAllDepartments
);

router.get(
    "/:id",
    authorize("academic_dean", "teacher"),
    departmentController.getDepartmentById
);

// Only academic_dean can manage departments.
router.post(
    "/",
    authorize("academic_dean"),
    departmentController.createDepartment
);

router.put(
    "/:id",
    authorize("academic_dean"),
    departmentController.updateDepartment
);

router.delete(
    "/:id",
    authorize("academic_dean"),
    departmentController.deactivateDepartment
);

module.exports = router;