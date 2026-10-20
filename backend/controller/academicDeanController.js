
const academicDeanService = require("../services/academicDeanService");

async function getAllAcademicDeans(req, res) {
    try {
        const deans = await academicDeanService.getAllAcademicDeans();

        return res.status(200).json({ academicDeans: deans });
    } catch (error) {
        console.error("Get Academic Deans error:", error);

        return res.status(500).json({
            message: "Failed to load Academic Dean accounts"
        });
    }
}

async function createAcademicDean(req, res) {
    try {
        const { full_name, username } = req.body;

        if (
            !String(full_name || "").trim() ||
            !String(username || "").trim()
        ) {
            return res.status(400).json({
                message: "Full name and username are required"
            });
        }

        const result =
            await academicDeanService.createAcademicDean({
                full_name,
                username
            });

        return res.status(201).json(result);
    } catch (error) {
        console.error("Create Academic Dean error:", error);

        if (error.message.includes("already exists")) {
            return res.status(409).json({ message: error.message });
        }

        return res.status(400).json({ message: error.message });
    }
}

async function updateAcademicDeanStatus(req, res) {
    try {
        const id = Number(req.params.id);
        const { is_active } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid Academic Dean account ID"
            });
        }

        if (
            ![true, false, 1, 0, "1", "0"].includes(is_active)
        ) {
            return res.status(400).json({
                message: "is_active must be true, false, 1, or 0"
            });
        }

        const result =
            await academicDeanService.updateAcademicDeanStatus(
                id,
                is_active === true ||
                    is_active === 1 ||
                    is_active === "1"
            );

        return res.status(200).json(result);
    } catch (error) {
        console.error("Update Academic Dean status error:", error);

        const status = error.message.includes("not found") ? 404 : 500;

        return res.status(status).json({ message: error.message });
    }
}

async function resetAcademicDeanPassword(req, res) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid Academic Dean account ID"
            });
        }

        const result =
            await academicDeanService.resetAcademicDeanPassword(id);

        return res.status(200).json(result);
    } catch (error) {
        console.error("Reset Academic Dean password error:", error);

        const status = error.message.includes("not found") ? 404 : 500;

        return res.status(status).json({ message: error.message });
    }
}

module.exports = {
    getAllAcademicDeans,
    createAcademicDean,
    updateAcademicDeanStatus,
    resetAcademicDeanPassword
};
