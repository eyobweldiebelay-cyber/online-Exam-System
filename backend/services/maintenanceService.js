
const fs = require("fs/promises");
const path = require("path");

const configDirectory = path.join(__dirname, "../config");
const configFile = path.join(configDirectory, "maintenance.json");

let writeQueue = Promise.resolve();

async function getMaintenanceStatus() {
    try {
        const content = await fs.readFile(configFile, "utf8");
        const settings = JSON.parse(content);

        return {
            enabled: settings.enabled === true,
            message:
                settings.message ||
                "The system is temporarily under maintenance."
        };
    } catch (error) {
        if (error.code !== "ENOENT") {
            throw error;
        }

        return {
            enabled: false,
            message: "The system is temporarily under maintenance."
        };
    }
}

async function setMaintenanceStatus(enabled, message) {
    const settings = {
        enabled: enabled === true,
        message:
            typeof message === "string" && message.trim()
                ? message.trim()
                : "The system is temporarily under maintenance.",
        updated_at: new Date().toISOString()
    };

    const operation = async () => {
        await fs.mkdir(configDirectory, { recursive: true });

        const temporaryFile = `${configFile}.tmp`;

        await fs.writeFile(
            temporaryFile,
            JSON.stringify(settings, null, 2),
            "utf8"
        );

        await fs.rename(temporaryFile, configFile);
    };

    writeQueue = writeQueue.then(operation, operation);
    await writeQueue;

    return settings;
}

module.exports = {
    getMaintenanceStatus,
    setMaintenanceStatus
};
