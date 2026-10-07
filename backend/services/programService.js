const db = require("../config/db");

// Get all programs
const getAllPrograms = async () => {
    const [rows] = await db.query(`
        SELECT
            id,
            name,
            program_type,
            status,
            created_at
        FROM programs
        ORDER BY id ASC
    `);

    return rows;
};

// Get program by ID
const getProgramById = async (id) => {
    const [rows] = await db.query(
        `SELECT
            id,
            name,
            program_type,
            status,
            created_at
         FROM programs
         WHERE id = ?`,
        [id]
    );

    return rows[0];
};

// Check duplicate program name
const getProgramByName = async (name) => {
    const [rows] = await db.query(
        "SELECT id FROM programs WHERE name = ?",
        [name]
    );

    return rows[0];
};

// Create program
const createProgram = async (name, programType) => {
    const [result] = await db.query(
        `INSERT INTO programs (name, program_type)
         VALUES (?, ?)`,
        [name, programType]
    );

    return result.insertId;
};

// Update program
const updateProgram = async (id, name, programType, status) => {
    await db.query(
        `UPDATE programs
         SET name = ?, program_type = ?, status = ?
         WHERE id = ?`,
        [name, programType, status, id]
    );
};

// Deactivate program
const deactivateProgram = async (id) => {
    await db.query(
        `UPDATE programs
         SET status = 'inactive'
         WHERE id = ?`,
        [id]
    );
};

module.exports = {
    getAllPrograms,
    getProgramById,
    getProgramByName,
    createProgram,
    updateProgram,
    deactivateProgram
};