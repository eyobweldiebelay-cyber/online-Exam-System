const express = require("express");
const router = express.Router();

const programController = require("../controller/programController");
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

// All program routes require authentication.
router.use(authenticate);

// academic_dean and Teacher can read programs for their respective workflows.
router.get(
    "/",
    authorize("academic_dean", "teacher"),
    programController.getAllPrograms
);

router.get(
    "/:id",
    authorize("academic_dean", "teacher"),
    programController.getProgramById
);

// Only academic_dean can manage programs.
router.post(
    "/",
    authorize("academic_dean"),
    programController.createProgram
);

router.put(
    "/:id",
    authorize("academic_dean"),
    programController.updateProgram
);

router.delete(
    "/:id",
    authorize("academic_dean"),
    programController.deactivateProgram
);

module.exports = router;