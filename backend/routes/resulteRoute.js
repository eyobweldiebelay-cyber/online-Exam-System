
const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authMiddleware");
const resultController = require("../controller/resultController");

// Student: retrieve their own results
router.get(
    "/my",
    authenticate,
    resultController.getMyResults
);

// Student: retrieve their own result for a specific attempt
router.get(
    "/my/attempt/:attemptId",
    authenticate,
    resultController.getMyResultByAttempt
);

// Admin and Academic Dean: retrieve all results
router.get(
    "/",
    authenticate,
    (req, res, next) => {
        const role = String(req.user?.role || "")
            .toLowerCase()
            .replace(/-/g, "_");

        if (!["admin", "academic_dean"].includes(role)) {
            return res.status(403).json({
                message: "Access denied. Academic results are restricted."
            });
        }

        next();
    },
    resultController.getAllResults
);

module.exports = router;
