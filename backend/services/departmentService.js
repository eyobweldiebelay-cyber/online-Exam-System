const db = require("../config/db");

// Get all departments
const getAllDepartments = async () => {
    const [rows] = await db.query(`
        SELECT 
            d.id,
            d.program_id,
            p.name AS program_name,
            p.program_type,
            d.name,
            d.status,
            d.created_at
        FROM departments d
        JOIN programs p ON d.program_id = p.id
        ORDER BY d.id ASC
    `);

    return rows;
};

// Get department by ID
const getDepartmentById = async (id) => {
    const [rows] = await db.query(`
        SELECT 
            d.id,
            d.program_id,
            p.name AS program_name,
            p.program_type,
            d.name,
            d.status,
            d.created_at
        FROM departments d
        JOIN programs p ON d.program_id = p.id
        WHERE d.id = ?
    `, [id]);

    return rows[0];
};

// Check whether program exists
const getProgramById = async (programId) => {
    const [rows] = await db.query(
        "SELECT id, name, program_type, status FROM programs WHERE id = ?",
        [programId]
    );

    return rows[0];
};

// Check duplicate department name
const getDepartmentByName = async (name) => {
    const [rows] = await db.query(
        "SELECT id FROM departments WHERE name = ?",
        [name]
    );

    return rows[0];
};

// Create department
const createDepartment = async (programId, name) => {
    const [result] = await db.query(
        `INSERT INTO departments (program_id, name)
         VALUES (?, ?)`,
        [programId, name]
    );

    return result.insertId;
};

// Update department
const updateDepartment = async (id, programId, name, status) => {
    await db.query(
        `UPDATE departments
         SET program_id = ?, name = ?, status = ?
         WHERE id = ?`,
        [programId, name, status, id]
    );
};

// Delete/deactivate department
const deactivateDepartment = async (id) => {
    await db.query(
        `UPDATE departments
         SET status = 'inactive'
         WHERE id = ?`,
        [id]
    );
};

module.exports = {
    getAllDepartments,
    getDepartmentById,
    getProgramById,
    getDepartmentByName,
    createDepartment,
    updateDepartment,
    deactivateDepartment
};