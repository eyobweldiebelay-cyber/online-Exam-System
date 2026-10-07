const express = require("express");
const router = express.Router();

const programController = require("../controller/programController");
const authenticate = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/roleMiddleware");

// Get all programs
router.get(
    "/",
    authenticate,
 isAdmin("admin"),
    programController.getAllPrograms
);

// Get one program
router.get(
    "/:id",
    authenticate,
    isAdmin("admin"),
    programController.getProgramById
);

// Create program
router.post(
    "/",
    authenticate,
    isAdmin("admin"),
    programController.createProgram
);

// Update program
router.put(
    "/:id",
    authenticate,
    isAdmin,
    programController.updateProgram
);

// Deactivate program
router.delete(
    "/:id",
    authenticate,
    isAdmin("admin"),
    programController.deactivateProgram
);

module.exports = router;