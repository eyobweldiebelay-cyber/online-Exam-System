const express = require("express");
const router = express.Router();

const departmentController = require("../controller/departmentController");
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

// All department routes require authentication.
router.use(authenticate);

// Admin and Teacher can read departments for their respective workflows.
router.get(
    "/",
    authorize("admin", "teacher"),
    departmentController.getAllDepartments
);

router.get(
    "/:id",
    authorize("admin", "teacher"),
    departmentController.getDepartmentById
);

// Only Admin can manage departments.
router.post(
    "/",
    authorize("admin"),
    departmentController.createDepartment
);

router.put(
    "/:id",
    authorize("admin"),
    departmentController.updateDepartment
);

router.delete(
    "/:id",
    authorize("admin"),
    departmentController.deactivateDepartment
);

module.exports = router;