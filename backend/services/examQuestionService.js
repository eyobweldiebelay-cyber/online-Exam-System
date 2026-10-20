
const db = require("../config/db");

// Add questions to an exam
const addQuestionsToExam = async (examId, questions) => {
    const [exam] = await db.execute(
        "SELECT id, department_id FROM exams WHERE id = ?",
        [examId]
    );

    if (exam.length === 0) {
        const error = new Error("Exam not found");
        error.statusCode = 404;
        throw error;
    }

    const examDepartmentId = Number(exam[0].department_id);

    for (const item of questions) {
        const { question_id, question_order } = item;

        const [question] = await db.execute(
            `SELECT id, department_id
             FROM questions
             WHERE id = ?`,
            [question_id]
        );

        if (question.length === 0) {
            const error = new Error(
                `Question ${question_id} not found`
            );
            error.statusCode = 404;
            throw error;
        }

        if (
            Number(question[0].department_id) !== examDepartmentId
        ) {
            const error = new Error(
                `Question ${question_id} does not belong to the exam department`
            );
            error.statusCode = 400;
            throw error;
        }

        const [existing] = await db.execute(
            `SELECT id
             FROM exam_questions
             WHERE exam_id = ? AND question_id = ?`,
            [examId, question_id]
        );

        if (existing.length > 0) {
            const error = new Error(
                `Question ${question_id} is already added to this exam`
            );
            error.statusCode = 409;
            throw error;
        }

        await db.execute(
            `INSERT INTO exam_questions
                (exam_id, question_id, question_order)
             VALUES (?, ?, ?)`,
            [examId, question_id, question_order]
        );
    }

    return true;
};


// Get questions already assigned to an exam
const getExamQuestions = async (examId) => {
    const [exam] = await db.execute(
        "SELECT id FROM exams WHERE id = ?",
        [examId]
    );

    if (exam.length === 0) {
        const error = new Error("Exam not found");
        error.statusCode = 404;
        throw error;
    }

    const [questions] = await db.execute(
        `SELECT
            eq.id,
            eq.exam_id,
            eq.question_id,
            eq.question_order,
            q.question_text,
            q.marks
         FROM exam_questions eq
         JOIN questions q
            ON eq.question_id = q.id
         WHERE eq.exam_id = ?
         ORDER BY eq.question_order ASC`,
        [examId]
    );

    return questions;
};


// Get active questions from the same department
// that have not already been assigned to this exam.
const getAvailableQuestions = async (examId) => {
    const [examRows] = await db.execute(
        `SELECT id, department_id
         FROM exams
         WHERE id = ?`,
        [examId]
    );

    if (examRows.length === 0) {
        const error = new Error("Exam not found");
        error.statusCode = 404;
        throw error;
    }

    const departmentId = examRows[0].department_id;

    const [questions] = await db.execute(
        `SELECT
            q.id,
            q.id AS question_id,
            q.question_text,
            q.marks,
            q.department_id,
            q.status
         FROM questions q
         WHERE q.department_id = ?
           AND LOWER(q.status) = 'active'
           AND NOT EXISTS (
               SELECT 1
               FROM exam_questions eq
               WHERE eq.exam_id = ?
                 AND eq.question_id = q.id
           )
         ORDER BY q.id DESC`,
        [departmentId, examId]
    );

    return questions;
};


module.exports = {
    addQuestionsToExam,
    getExamQuestions,
    getAvailableQuestions
};