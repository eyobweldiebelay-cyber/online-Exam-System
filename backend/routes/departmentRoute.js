const express = require("express");
const router = express.Router();

const departmentController = require("../controller/departmentController");
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

// Get all departments
router.get(
    "/",
    authenticate,
    authorize(["admin"]),
    departmentController.getAllDepartments
);

    departmentController.getAllDepartments

// Get one department
router.get(
    "/:id",
    authenticate,
    departmentController.getDepartmentById
);

// Create department
router.post(
    "/",
    authenticate,
    authorize(["admin"]),
    departmentController.createDepartment
);

// Update department
router.put(
    "/:id",
    authenticate,
    authorize(["admin"]),
    departmentController.updateDepartment
);

// Deactivate department
router.delete(
    "/:id",
    authenticate,
    authorize(["admin"]),
    departmentController.deactivateDepartment
);

module.exports = router;