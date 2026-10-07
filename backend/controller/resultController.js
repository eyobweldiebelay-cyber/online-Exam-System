const resultService = require("../services/resultServicce");

const getMyResults = async (req, res) => {
    try {
        const userId = req.user.id;

        const results = await resultService.getMyResults(userId);

        res.status(200).json({
            message: "Results retrieved successfully",
            results
        });

    } catch (error) {
        console.error("Get my results error:", error);

        res.status(error.statusCode || 500).json({
            message: error.message || "Failed to retrieve results"
        });
    }
};

const getMyResultByAttempt = async (req, res) => {
    try {
        const userId = req.user.id;
        const attemptId = req.params.attemptId;

        const result = await resultService.getMyResultByAttempt(
            userId,
            attemptId
        );

        res.status(200).json({
            message: "Result retrieved successfully",
            result
        });

    } catch (error) {
        console.error("Get my result error:", error);

        res.status(error.statusCode || 500).json({
            message: error.message || "Failed to retrieve result"
        });
    }
};

module.exports = {
    getMyResults,
    getMyResultByAttempt
};