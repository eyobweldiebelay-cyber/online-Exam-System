
const db = require("../config/db");

// Get results for the logged-in student
const getMyResults = async (userId) => {
    const [students] = await db.execute(
        `SELECT id FROM students WHERE user_id = ?`,
        [userId]
    );

    if (students.length === 0) {
        const error = new Error("Student profile not found");
        error.statusCode = 404;
        throw error;
    }

    const studentId = students[0].id;

    const [results] = await db.execute(
        `
        SELECT
            r.id,
            r.attempt_id,
            e.id AS exam_id,
            e.title AS exam_title,
            r.total_questions,
            r.correct_answers,
            r.wrong_answers,
            r.total_marks,
            r.obtained_marks,
            r.percentage,
            r.result_status,
            r.created_at
        FROM results r
        JOIN exam_attempts ea ON r.attempt_id = ea.id
        JOIN exams e ON ea.exam_id = e.id
        WHERE ea.student_id = ?
        ORDER BY r.created_at DESC
        `,
        [studentId]
    );

    return results;
};

// Get one result belonging to the logged-in student
const getMyResultByAttempt = async (userId, attemptId) => {
    const [students] = await db.execute(
        `SELECT id FROM students WHERE user_id = ?`,
        [userId]
    );

    if (students.length === 0) {
        const error = new Error("Student profile not found");
        error.statusCode = 404;
        throw error;
    }

    const studentId = students[0].id;

    const [results] = await db.execute(
        
        `
        SELECT
            r.id,
            r.attempt_id,
            s.student_id AS student_id,
            CONCAT_WS(' ', s.first_name, s.last_name) AS student_name,
            e.id AS exam_id,
            e.title AS exam_title,
            ea.submitted_at AS completed_at,
            r.total_questions,
            r.correct_answers,
            r.wrong_answers,
            r.total_marks,
            r.obtained_marks,
            r.percentage,
            r.result_status,
            r.created_at
        FROM results r
        JOIN exam_attempts ea ON r.attempt_id = ea.id
        JOIN exams e ON ea.exam_id = e.id
        JOIN students s ON ea.student_id = s.id
        WHERE r.attempt_id = ?
          AND ea.student_id = ?
        `,

        [attemptId, studentId]
    );

    if (results.length === 0) {
        const error = new Error("Result not found");
        error.statusCode = 404;
        throw error;
    }

    return results[0];
};

// Admin: retrieve all results with filters
const getAllResults = async (filters = {}) => {
    const conditions = [];
    const params = [];

    if (filters.search) {
        conditions.push(
            "(u.username LIKE ? OR s.first_name LIKE ? OR s.last_name LIKE ?)"
        );

        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.program) {
        conditions.push("p.name = ?");
        params.push(filters.program);
    }

    if (filters.department) {
        conditions.push("d.name = ?");
        params.push(filters.department);
    }

    if (filters.status) {
        conditions.push("LOWER(r.result_status) = ?");
        params.push(String(filters.status).toLowerCase());
    }

    const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const [results] = await db.execute(
        `
        SELECT
            r.id,
            r.attempt_id,
            u.username,
            CONCAT_WS(' ', s.first_name, s.last_name) AS student_name,
            e.title AS exam_title,
            d.name AS department_name,
            p.name AS program_name,
            r.total_questions,
            r.correct_answers,
            r.wrong_answers,
            r.total_marks,
            r.obtained_marks,
            r.percentage,
            r.result_status,
            r.created_at
        FROM results r
        JOIN exam_attempts ea ON r.attempt_id = ea.id
        JOIN exams e ON ea.exam_id = e.id
        JOIN students s ON ea.student_id = s.id
        JOIN users u ON s.user_id = u.id
        LEFT JOIN departments d ON s.department_id = d.id
        LEFT JOIN programs p ON d.program_id = p.id
        ${whereClause}
        ORDER BY r.created_at DESC
        `,
        params
    );

    return results;
};

module.exports = {
    getMyResults,
    getMyResultByAttempt,
    getAllResults
};