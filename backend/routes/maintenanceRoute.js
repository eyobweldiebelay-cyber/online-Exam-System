
const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authMiddleware");
const {
    getStatus,
    updateStatus
} = require("../controller/maintenanceController");

// Anyone can read the current maintenance status.
router.get("/status", getStatus);

// Only authenticated Admin users can change maintenance mode.
router.post("/", authenticate, updateStatus);

module.exports = router;
