const express = require("express");
const router = express.Router();

const programController = require("../controller/programController");
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

// All program routes require authentication.
router.use(authenticate);

// Admin and Teacher can read programs for their respective workflows.
router.get(
    "/",
    authorize("admin", "teacher"),
    programController.getAllPrograms
);

router.get(
    "/:id",
    authorize("admin", "teacher"),
    programController.getProgramById
);

// Only Admin can manage programs.
router.post(
    "/",
    authorize("admin"),
    programController.createProgram
);

router.put(
    "/:id",
    authorize("admin"),
    programController.updateProgram
);

router.delete(
    "/:id",
    authorize("admin"),
    programController.deactivateProgram
);

module.exports = router;