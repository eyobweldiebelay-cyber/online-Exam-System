const db = require("../config/db");

const getMyResults = async (userId) => {

    // 1. Find student
    const [students] = await db.execute(
        `
        SELECT id
        FROM students
        WHERE user_id = ?
        `,
        [userId]
    );

    if (students.length === 0) {
        const error = new Error("Student profile not found");
        error.statusCode = 404;
        throw error;
    }

    const studentId = students[0].id;

    // 2. Get student's results
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
        JOIN exam_attempts ea
            ON r.attempt_id = ea.id
        JOIN exams e
            ON ea.exam_id = e.id
        WHERE ea.student_id = ?
        ORDER BY r.created_at DESC
        `,
        [studentId]
    );

    return results;
};

const getMyResultByAttempt = async (userId, attemptId) => {

    // 1. Find student
    const [students] = await db.execute(
        `
        SELECT id
        FROM students
        WHERE user_id = ?
        `,
        [userId]
    );

    if (students.length === 0) {
        const error = new Error("Student profile not found");
        error.statusCode = 404;
        throw error;
    }

    const studentId = students[0].id;

    // 2. Get specific result
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
        JOIN exam_attempts ea
            ON r.attempt_id = ea.id
        JOIN exams e
            ON ea.exam_id = e.id
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

module.exports = {
    getMyResults,
    getMyResultByAttempt
};