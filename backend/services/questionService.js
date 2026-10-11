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
        (
            department_id,
            question_text,
            marks,
            status
        )
        VALUES (?, ?, ?, 'active')`,
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
            (
                question_id,
                option_text,
                is_correct
            )
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
            p.name AS program_name,
            d.name AS department_name,
            q.question_text,
            q.marks,
            q.status,
            q.created_at
        FROM questions q
        JOIN departments d
            ON q.department_id = d.id
        JOIN programs p
            ON d.program_id = p.id
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
            p.name AS program_name,
            d.name AS department_name,
            q.question_text,
            q.marks,
            q.status,
            q.created_at
        FROM questions q
        JOIN departments d
            ON q.department_id = d.id
        JOIN programs p
            ON d.program_id = p.id
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


// Update question with options
const updateQuestion = async (
    id,
    {
        department_id,
        question_text,
        marks,
        options
    }
) => {

    const connection = await db.getConnection();

    try {

        await connection.beginTransaction();

        // Check question
        const [questions] = await connection.query(
            `
            SELECT id
            FROM questions
            WHERE id = ?
            `,
            [id]
        );

        if (questions.length === 0) {
            const error = new Error("Question not found");
            error.statusCode = 404;
            throw error;
        }

        // Check department
        const [department] = await connection.query(
            `
            SELECT id
            FROM departments
            WHERE id = ?
            `,
            [department_id]
        );

        if (department.length === 0) {
            const error = new Error("Department not found");
            error.statusCode = 404;
            throw error;
        }

        // Update question
        await connection.query(
            `
            UPDATE questions
            SET
                department_id = ?,
                question_text = ?,
                marks = ?
            WHERE id = ?
            `,
            [
                department_id,
                question_text,
                marks || 1,
                id
            ]
        );

        // Remove old options
        await connection.query(
            `
            DELETE FROM question_options
            WHERE question_id = ?
            `,
            [id]
        );

        // Insert new options
        for (const option of options) {

            await connection.query(
                `
                INSERT INTO question_options
                (
                    question_id,
                    option_text,
                    is_correct
                )
                VALUES (?, ?, ?)
                `,
                [
                    id,
                    option.option_text,
                    option.is_correct ? 1 : 0
                ]
            );
        }

        await connection.commit();

    } catch (error) {

        await connection.rollback();

        throw error;

    } finally {

        connection.release();
    }
};


// Deactivate question
const deactivateQuestion = async (id) => {

    const [result] = await db.query(
        `
        UPDATE questions
        SET status = 'inactive'
        WHERE id = ?
        `,
        [id]
    );

    if (result.affectedRows === 0) {
        const error = new Error("Question not found");
        error.statusCode = 404;
        throw error;
    }

    return true;
};


// Activate question
const activateQuestion = async (id) => {

    const [result] = await db.query(
        `
        UPDATE questions
        SET status = 'active'
        WHERE id = ?
        `,
        [id]
    );

    if (result.affectedRows === 0) {
        const error = new Error("Question not found");
        error.statusCode = 404;
        throw error;
    }

    return true;
};


module.exports = {
    createQuestion,
    getQuestions,
    getQuestionById,
    updateQuestion,
    deactivateQuestion,
    activateQuestion
};