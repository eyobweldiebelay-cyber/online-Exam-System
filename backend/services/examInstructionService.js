
const db = require("../config/db");

const getAllInstructions = async () => {
    const [rows] = await db.query(`
        SELECT
            ei.id,
            ei.exam_id,
            ei.instructions,
            ei.created_at
        FROM exam_instructions ei
        ORDER BY ei.id DESC
    `);

    return rows;
};

const getInstructionsByExamId = async (examId) => {
    const [rows] = await db.query(
        `SELECT id, exam_id, instructions, created_at
         FROM exam_instructions
         WHERE exam_id = ?`,
        [examId]
    );

    return rows[0] || null;
};

const createInstructions = async ({ exam_id, instructions }) => {
    const [result] = await db.query(
        `INSERT INTO exam_instructions (exam_id, instructions)
         VALUES (?, ?)`,
        [exam_id, instructions]
    );

    return result.insertId;
};

const updateInstructions = async (examId, instructions) => {
    const [result] = await db.query(
        `UPDATE exam_instructions
         SET instructions = ?
         WHERE exam_id = ?`,
        [instructions, examId]
    );

    return result.affectedRows;
};

const deleteInstructions = async (examId) => {
    const [result] = await db.query(
        `DELETE FROM exam_instructions
         WHERE exam_id = ?`,
        [examId]
    );

    return result.affectedRows;
};

module.exports = {
    getAllInstructions,
    getInstructionsByExamId,
    createInstructions,
    updateInstructions,
    deleteInstructions
};
