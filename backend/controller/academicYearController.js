
const academicYearService = require("../services/academicYearService");

const validDate = (value) => {
    if (value === null || value === undefined || value === "") {
        return true;
    }

    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        return false;
    }

    const date = new Date(`${value}T00:00:00Z`);

    return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
    );
};

const validateDates = (startDate, endDate) => {
    if (!validDate(startDate) || !validDate(endDate)) {
        return "Dates must use YYYY-MM-DD format.";
    }

    if (startDate && endDate && startDate > endDate) {
        return "Start date cannot be after end date.";
    }

    return null;
};

// Get all academic years
const getAllAcademicYears = async (req, res) => {
    try {
        const academicYears =
            await academicYearService.getAllAcademicYears();

        return res.status(200).json({
            message: "Academic years retrieved successfully",
            academicYears
        });
    } catch (error) {
        console.error("Get academic years error:", error);

        return res.status(500).json({
            message: "Failed to retrieve academic years"
        });
    }
};

// Get one academic year
const getAcademicYearById = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid academic year ID"
            });
        }

        const academicYear =
            await academicYearService.getAcademicYearById(id);

        if (!academicYear) {
            return res.status(404).json({
                message: "Academic year not found"
            });
        }

        return res.status(200).json({
            message: "Academic year retrieved successfully",
            academicYear
        });
    } catch (error) {
        console.error("Get academic year error:", error);

        return res.status(500).json({
            message: "Failed to retrieve academic year"
        });
    }
};

// Create academic year
const createAcademicYear = async (req, res) => {
    try {
        const { academic_year, start_date, end_date } = req.body;

        if (
            typeof academic_year !== "string" ||
            !academic_year.trim()
        ) {
            return res.status(400).json({
                message: "academic_year is required"
            });
        }

        const yearName = academic_year.trim();

        if (yearName.length > 20) {
            return res.status(400).json({
                message: "Academic year must not exceed 20 characters"
            });
        }

        const dateError = validateDates(start_date, end_date);

        if (dateError) {
            return res.status(400).json({ message: dateError });
        }

        const existing =
            await academicYearService.getAcademicYearByName(yearName);

        if (existing) {
            return res.status(409).json({
                message: "Academic year already exists"
            });
        }

        const id = await academicYearService.createAcademicYear({
            academic_year: yearName,
            start_date: start_date || null,
            end_date: end_date || null
        });

        const academicYear =
            await academicYearService.getAcademicYearById(id);

        return res.status(201).json({
            message: "Academic year created successfully",
            academicYear
        });
    } catch (error) {
        console.error("Create academic year error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Academic year already exists"
            });
        }

        return res.status(500).json({
            message: "Failed to create academic year"
        });
    }
};

// Update academic year details
const updateAcademicYear = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid academic year ID"
            });
        }

        const existing =
            await academicYearService.getAcademicYearById(id);

        if (!existing) {
            return res.status(404).json({
                message: "Academic year not found"
            });
        }

        const { academic_year, start_date, end_date, status } = req.body;

        if (
            typeof academic_year !== "string" ||
            !academic_year.trim()
        ) {
            return res.status(400).json({
                message: "academic_year is required"
            });
        }

        const yearName = academic_year.trim();

        if (yearName.length > 20) {
            return res.status(400).json({
                message: "Academic year must not exceed 20 characters"
            });
        }

        if (!["active", "inactive"].includes(status)) {
            return res.status(400).json({
                message: "status must be active or inactive"
            });
        }

        const normalizedStart = start_date || null;
        const normalizedEnd = end_date || null;

        const dateError = validateDates(normalizedStart, normalizedEnd);

        if (dateError) {
            return res.status(400).json({ message: dateError });
        }

        const duplicate =
            await academicYearService.getAcademicYearByName(yearName);

        if (duplicate && Number(duplicate.id) !== id) {
            return res.status(409).json({
                message: "Academic year already exists"
            });
        }

        await academicYearService.updateAcademicYear(id, {
            academic_year: yearName,
            start_date: normalizedStart,
            end_date: normalizedEnd,
            status
        });

        const academicYear =
            await academicYearService.getAcademicYearById(id);

        return res.status(200).json({
            message: "Academic year updated successfully",
            academicYear
        });
    } catch (error) {
        console.error("Update academic year error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Academic year already exists"
            });
        }

        return res.status(500).json({
            message: "Failed to update academic year"
        });
    }
};

// Activate or deactivate an academic year
const updateAcademicYearStatus = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { status } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid academic year ID"
            });
        }

        if (!["active", "inactive"].includes(status)) {
            return res.status(400).json({
                message: "status must be active or inactive"
            });
        }

        const existing =
            await academicYearService.getAcademicYearById(id);

        if (!existing) {
            return res.status(404).json({
                message: "Academic year not found"
            });
        }

        await academicYearService.updateAcademicYearStatus(id, status);

        const academicYear =
            await academicYearService.getAcademicYearById(id);

        return res.status(200).json({
            message: `Academic year ${status} successfully`,
            academicYear
        });
    } catch (error) {
        console.error("Update academic year status error:", error);

        return res.status(500).json({
            message: "Failed to update academic year status"
        });
    }
};

module.exports = {
    getAllAcademicYears,
    getAcademicYearById,
    createAcademicYear,
    updateAcademicYear,
    updateAcademicYearStatus
};
