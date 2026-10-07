const db = require("../config/db");

// Create question with options
const createQuestion = async ({
    department_id,
    question_text,
    marks,
    options
}) => {

    // Check department
    const [department] = await db.query(
        "SELECT id FROM departments WHERE id = ?",
        [department_id]
    );

    if (department.length === 0) {
        const error = new Error("Department not found");
        error.statusCode = 404;
        throw error;
    }

    // Create question
    const [questionResult] = await db.query(
        `INSERT INTO questions
        (department_id, question_text, marks)
        VALUES (?, ?, ?)`,
        [
            department_id,
            question_text,
            marks || 1
        ]
    );

    const questionId = questionResult.insertId;

    // Create options
    for (const option of options) {

        await db.query(
            `INSERT INTO question_options
            (question_id, option_text, is_correct)
            VALUES (?, ?, ?)`,
            [
                questionId,
                option.option_text,
                option.is_correct ? 1 : 0
            ]
        );
    }

    return questionId;
};


// Get all questions
const getQuestions = async () => {

    const [questions] = await db.query(`
        SELECT
            q.id,
            q.department_id,
            d.name AS department_name,
            q.question_text,
            q.marks,
            q.created_at
        FROM questions q
        JOIN departments d
            ON q.department_id = d.id
        ORDER BY q.id DESC
    `);

    return questions;
};


// Get one question with options
const getQuestionById = async (id) => {

    const [questions] = await db.query(
        `
        SELECT
            q.id,
            q.department_id,
            d.name AS department_name,
            q.question_text,
            q.marks,
            q.created_at
        FROM questions q
        JOIN departments d
            ON q.department_id = d.id
        WHERE q.id = ?
        `,
        [id]
    );

    if (questions.length === 0) {
        const error = new Error("Question not found");
        error.statusCode = 404;
        throw error;
    }

    const [options] = await db.query(
        `
        SELECT
            id,
            option_text,
            is_correct
        FROM question_options
        WHERE question_id = ?
        ORDER BY id
        `,
        [id]
    );

    return {
        ...questions[0],
        options
    };
};


module.exports = {
    createQuestion,
    getQuestions,
    getQuestionById
};