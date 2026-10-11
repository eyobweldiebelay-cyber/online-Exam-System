
const express = require("express");
const router = express.Router();

const departmentController = require("../controller/departmentController");
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

router.get(
    "/",
    authenticate,
    authorize("admin"),
    departmentController.getAllDepartments
);

router.get(
    "/:id",
    authenticate,
    authorize("admin"),
    departmentController.getDepartmentById
);

router.post(
    "/",
    authenticate,
    authorize("admin"),
    departmentController.createDepartment
);

router.put(
    "/:id",
    authenticate,
    authorize("admin"),
    departmentController.updateDepartment
);

router.delete(
    "/:id",
    authenticate,
    authorize("admin"),
    departmentController.deactivateDepartment
);

module.exports = router;