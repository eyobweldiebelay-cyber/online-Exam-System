
const db = require("../config/db");

// Get all academic years
const getAllAcademicYears = async () => {
    const [rows] = await db.query(`
        SELECT id, academic_year, start_date, end_date, status, created_at
        FROM academic_years
        ORDER BY id DESC
    `);

    return rows;
};

// Get one academic year
const getAcademicYearById = async (id) => {
    const [rows] = await db.query(
        `SELECT id, academic_year, start_date, end_date, status, created_at
         FROM academic_years
         WHERE id = ?`,
        [id]
    );

    return rows[0] || null;
};

// Find academic year by name
const getAcademicYearByName = async (academicYear) => {
    const [rows] = await db.query(
        `SELECT id, academic_year
         FROM academic_years
         WHERE academic_year = ?`,
        [academicYear]
    );

    return rows[0] || null;
};

// Create academic year
const createAcademicYear = async ({
    academic_year,
    start_date,
    end_date
}) => {
    const [result] = await db.query(
        `INSERT INTO academic_years
            (academic_year, start_date, end_date)
         VALUES (?, ?, ?)`,
        [academic_year, start_date, end_date]
    );

    return result.insertId;
};

// Update academic year
const updateAcademicYear = async (
    id,
    { academic_year, start_date, end_date, status }
) => {
    await db.query(
        `UPDATE academic_years
         SET academic_year = ?,
             start_date = ?,
             end_date = ?,
             status = ?
         WHERE id = ?`,
        [academic_year, start_date, end_date, status, id]
    );
};

// Update active/inactive status
const updateAcademicYearStatus = async (id, status) => {
    await db.query(
        `UPDATE academic_years
         SET status = ?
         WHERE id = ?`,
        [status, id]
    );
};

module.exports = {
    getAllAcademicYears,
    getAcademicYearById,
    getAcademicYearByName,
    createAcademicYear,
    updateAcademicYear,
    updateAcademicYearStatus
};
