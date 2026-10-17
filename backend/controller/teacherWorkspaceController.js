
const teacherWorkspaceService = require("../services/teacherWorkspaceService");

function getDepartmentId(req, res) {
    const departmentId = Number(req.user?.department_id);

    if (!Number.isInteger(departmentId) || departmentId <= 0) {
        res.status(403).json({
            message: "Your Teacher account has no assigned department."
        });

        return null;
    }

    return departmentId;
}

async function getDashboard(req, res) {
    try {
        const departmentId = getDepartmentId(req, res);
        if (!departmentId) return;

        const summary = await teacherWorkspaceService.getDashboard(
            departmentId
        );

        return res.status(200).json({ summary });
    } catch (error) {
        console.error("Teacher dashboard error:", error);

        return res.status(500).json({
            message: "Failed to load Teacher dashboard."
        });
    }
}

async function getStudents(req, res) {
    try {
        const departmentId = getDepartmentId(req, res);
        if (!departmentId) return;

        const students =
            await teacherWorkspaceService.getDepartmentStudents(
                departmentId
            );

        return res.status(200).json({ students });
    } catch (error) {
        console.error("Teacher students error:", error);

        return res.status(500).json({
            message: "Failed to load department students."
        });
    }
}

async function getResults(req, res) {
    try {
        const departmentId = getDepartmentId(req, res);
        if (!departmentId) return;

        const results =
            await teacherWorkspaceService.getDepartmentResults(
                departmentId,
                req.query
            );

        return res.status(200).json({ results });
    } catch (error) {
        console.error("Teacher results error:", error);

        return res.status(500).json({
            message: "Failed to load department results."
        });
    }
}
async function getProfile(req, res) {
    try {
        const departmentId = getDepartmentId(req, res);
        if (!departmentId) return;

        const userId = Number(req.user?.id ?? req.user?.user_id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(401).json({
                message: "Unable to identify the logged-in Teacher."
            });
        }

        const profile = await teacherWorkspaceService.getTeacherProfile(
            userId,
            departmentId
        );

        if (!profile) {
            return res.status(404).json({
                message: "Teacher profile not found."
            });
        }

        return res.status(200).json({ profile });
    } catch (error) {
        console.error("Teacher profile error:", error);

        return res.status(500).json({
            message: "Failed to load Teacher profile."
        });
    }
}
module.exports = {
    getDashboard,
    getStudents,
    getResults,
    getProfile
};
