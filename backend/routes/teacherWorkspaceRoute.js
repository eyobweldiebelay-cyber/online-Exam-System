
const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const teacherWorkspaceController = require(
    "../controller/teacherWorkspaceController"
);

// These routes are for Teachers only.
router.use(authenticate);
router.use(authorize("teacher"));

router.get("/dashboard", teacherWorkspaceController.getDashboard);
router.get("/students", teacherWorkspaceController.getStudents);
router.get("/results", teacherWorkspaceController.getResults);
router.get("/profile", teacherWorkspaceController.getProfile);

module.exports = router;
