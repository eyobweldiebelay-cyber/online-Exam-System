
const maintenanceService = require("../services/maintenanceService");

async function getStatus(req, res) {
    try {
        const status =
            await maintenanceService.getMaintenanceStatus();

        return res.status(200).json({
            success: true,
            maintenance: status
        });
    } catch (error) {
        console.error("Get maintenance status error:", error);
        console.error("Get maintenance status error:", error.message, error.stack);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve maintenance status."
        });
    }
}

async function updateStatus(req, res) {
    try {
        // This controller must be protected by authentication
        // and the existing Admin-only authorization middleware.
        if (!req.user || String(req.user.role).toLowerCase() !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only Admin can change maintenance mode."
            });
        }

        const { enabled, message } = req.body;

        if (typeof enabled !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "'enabled' must be true or false."
            });
        }

        if (
            message !== undefined &&
            (typeof message !== "string" || message.length > 500)
        ) {
            return res.status(400).json({
                success: false,
                message: "Maintenance message must be 500 characters or fewer."
            });
        }

        const maintenance =
            await maintenanceService.setMaintenanceStatus(
                enabled,
                message
            );

        return res.status(200).json({
            success: true,
            message: enabled
                ? "Maintenance mode enabled."
                : "Maintenance mode disabled.",
            maintenance
        });
    } catch (error) {
        console.error("Update maintenance status error:", error.message, error.stack);
        console.error("Update maintenance status error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update maintenance mode."
        });
    }
}

module.exports = {
    getStatus,
    updateStatus
};
