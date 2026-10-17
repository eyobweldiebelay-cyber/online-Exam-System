
const db = require("../config/db");

// Get all assignments
const getAllAssignments = async () => {
  const [rows] = await db.query(`
    SELECT
      ea.id,
      ea.exam_id,
      ea.student_id,
      ea.assigned_by,
      ea.assigned_at
    FROM exam_assignments ea
    ORDER BY ea.assigned_at DESC
  `);

  return rows;
};

// Get assignments for one student
const getAssignmentsByStudentId = async (studentId) => {
  const [rows] = await db.query(
    `SELECT
       ea.id,
       ea.exam_id,
       ea.student_id,
       ea.assigned_by,
       ea.assigned_at
     FROM exam_assignments ea
     WHERE ea.student_id = ?
     ORDER BY ea.assigned_at DESC`,
    [studentId]
  );

  return rows;
};

// Assign an exam to a student
const createAssignment = async (examId, studentId, assignedBy) => {
  const [result] = await db.query(
    `INSERT INTO exam_assignments
       (exam_id, student_id, assigned_by)
     VALUES (?, ?, ?)`,
    [examId, studentId, assignedBy]
  );

  return {
    id: result.insertId,
    exam_id: examId,
    student_id: studentId,
    assigned_by: assignedBy,
  };
};

// Remove an assignment
const deleteAssignment = async (assignmentId) => {
  const [result] = await db.query(
    "DELETE FROM exam_assignments WHERE id = ?",
    [assignmentId]
  );

  return result.affectedRows > 0;
};

module.exports = {
  getAllAssignments,
  getAssignmentsByStudentId,
  createAssignment,
  deleteAssignment,
};
