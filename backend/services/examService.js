
const db = require("../config/db");

// ===============================
// CREATE EXAM
// ===============================
const createExam = async (examData) => {
    const {
        title,
        department_id,
        academic_year,
        duration_minutes,
        total_questions,
        pass_mark,
        start_at,
        end_at,
        created_by
    } = examData;

    const [result] = await db.execute(
        `INSERT INTO exams
        (
            title,
            department_id,
            academic_year,
            duration_minutes,
            total_questions,
            pass_mark,
            start_at,
            end_at,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            title,
            department_id,
            academic_year,
            duration_minutes,
            total_questions,
            pass_mark,
            start_at,
            end_at,
            created_by
        ]
    );

    return {
        id: result.insertId,
        title,
        department_id,
        academic_year,
        duration_minutes,
        total_questions,
        pass_mark,
        start_at,
        end_at,
        status: "draft",
        created_by
    };
};

// ===============================
// GET ALL EXAMS
// ===============================
const getAllExams = async () => {
    const [rows] = await db.execute(`
        SELECT
            e.id,
            e.title,
            e.department_id,
            p.name AS program_name,
            d.name AS department_name,
            e.academic_year,
            e.duration_minutes,
            e.total_questions,
            e.pass_mark,
            e.start_at,
            e.end_at,
            e.status,
            e.created_by,
            e.created_at
        FROM exams e
        LEFT JOIN departments d
            ON e.department_id = d.id
        LEFT JOIN programs p
            ON d.program_id = p.id
        ORDER BY e.created_at DESC
    `);

    return rows;
};

// ===============================
// GET EXAM BY ID
// ===============================
const getExamById = async (id) => {
    const [rows] = await db.execute(
        `
        SELECT
            e.id,
            e.title,
            e.department_id,
            p.name AS program_name,
            d.name AS department_name,
            e.academic_year,
            e.duration_minutes,
            e.total_questions,
            e.pass_mark,
            e.start_at,
            e.end_at,
            e.status,
            e.created_by,
            e.created_at
        FROM exams e
        LEFT JOIN departments d
            ON e.department_id = d.id
        LEFT JOIN programs p
            ON d.program_id = p.id
        WHERE e.id = ?
        `,
        [id]
    );

    return rows[0];
};

// ===============================
// UPDATE EXAM
// ===============================
const updateExam = async (id, examData) => {
    const {
        title,
        department_id,
        academic_year,
        duration_minutes,
        total_questions,
        pass_mark,
        start_at,
        end_at
    } = examData;

    const [result] = await db.execute(
        `
        UPDATE exams
        SET
            title = ?,
            department_id = ?,
            academic_year = ?,
            duration_minutes = ?,
            total_questions = ?,
            pass_mark = ?,
            start_at = ?,
            end_at = ?
        WHERE id = ?
        `,
        [
            title,
            department_id,
            academic_year,
            duration_minutes,
            total_questions,
            pass_mark,
            start_at,
            end_at,
            id
        ]
    );

    return result.affectedRows;
};

// ===============================
// DELETE EXAM
// ===============================
const deleteExam = async (id) => {
    // Check whether students have attempted this exam
    const [attempts] = await db.execute(
        `
        SELECT id
        FROM exam_attempts
        WHERE exam_id = ?
        LIMIT 1
        `,
        [id]
    );

    if (attempts.length > 0) {
        const error = new Error(
            "Cannot delete an exam that already has student attempts"
        );

        error.statusCode = 400;
        throw error;
    }

    const [result] = await db.execute(
        "DELETE FROM exams WHERE id = ?",
        [id]
    );

    return result.affectedRows;
};

// ===============================
// PUBLISH EXAM
// ===============================
const publishExam = async (id) => {
    // Get exam
    const [exams] = await db.execute(
        `
        SELECT
            id,
            department_id,
            academic_year,
            total_questions,
            duration_minutes,
            pass_mark,
            start_at,
            end_at,
            status
        FROM exams
        WHERE id = ?
        `,
        [id]
    );

    if (exams.length === 0) {
        const error = new Error("Exam not found");
        error.statusCode = 404;
        throw error;
    }

    const exam = exams[0];

    // Only draft exams can be published
    if (exam.status !== "draft") {
        const error = new Error(
            "Only draft exams can be published"
        );

        error.statusCode = 400;
        throw error;
    }

    // Validate exam settings
    if (exam.duration_minutes <= 0) {
        const error = new Error(
            "Exam duration must be greater than 0"
        );

        error.statusCode = 400;
        throw error;
    }

    if (exam.total_questions <= 0) {
        const error = new Error(
            "Total questions must be greater than 0"
        );

        error.statusCode = 400;
        throw error;
    }

    if (exam.pass_mark < 0 || exam.pass_mark > 100) {
        const error = new Error(
            "Pass mark must be between 0 and 100"
        );

        error.statusCode = 400;
        throw error;
    }

    if (
        !exam.start_at ||
        !exam.end_at ||
        new Date(exam.start_at) >= new Date(exam.end_at)
    ) {
        const error = new Error(
            "Exam start time must be before end time"
        );

        error.statusCode = 400;
        throw error;
    }

    // Get questions assigned to this exam
    const [questions] = await db.execute(
        `
        SELECT
            eq.question_id,
            q.department_id
        FROM exam_questions eq
        JOIN questions q
            ON eq.question_id = q.id
        WHERE eq.exam_id = ?
        `,
        [id]
    );

    // Exam must have questions
    if (questions.length === 0) {
        const error = new Error(
            "Cannot publish an exam without questions"
        );

        error.statusCode = 400;
        throw error;
    }

    // Number of questions must match
    if (questions.length !== exam.total_questions) {
        const error = new Error(
            `Exam requires ${exam.total_questions} questions, but ${questions.length} are assigned`
        );

        error.statusCode = 400;
        throw error;
    }

    // Every question must belong to the exam department
    for (const question of questions) {
        if (Number(question.department_id) !== Number(exam.department_id)) {
            const error = new Error(
                `Question ${question.question_id} does not belong to the exam department`
            );

            error.statusCode = 400;
            throw error;
        }
    }

    // Publish exam
    await db.execute(
        `
        UPDATE exams
        SET status = 'published'
        WHERE id = ?
        `,
        [id]
    );

    return {
        id: exam.id,
        status: "published"
    };
};

// ===============================
// GET AVAILABLE EXAMS FOR STUDENT
// ===============================
const getAvailableExamsForStudent = async (userId) => {
    const [student] = await db.execute(
        `
        SELECT
            s.id,
            s.student_id,
            s.department_id,
            s.academic_year,
            s.status
        FROM students s
        WHERE s.user_id = ?
        `,
        [userId]
    );

    if (student.length === 0) {
        const error = new Error("Student profile not found");
        error.statusCode = 404;
        throw error;
    }

    if (student[0].status !== "active") {
        return [];
    }

    const [exams] = await db.execute(
        `
        SELECT
            e.id,
            e.title,
            e.department_id,
            d.name AS department_name,
            e.academic_year,
            e.duration_minutes,
            e.total_questions,
            e.pass_mark,
            e.start_at,
            e.end_at,
            e.status
        FROM exams e
        JOIN departments d
            ON e.department_id = d.id
        WHERE e.department_id = ?
          AND e.academic_year = ?
          AND e.status = 'published'
          AND NOW() >= e.start_at
          AND NOW() <= e.end_at
        ORDER BY e.start_at ASC
        `,
        [
            student[0].department_id,
            student[0].academic_year
        ]
    );

    return exams;
};

// ===============================
// EXPORT FUNCTIONS
// ===============================
module.exports = {
    createExam,
    getAllExams,
    getExamById,
    updateExam,
    deleteExam,
    publishExam,
    getAvailableExamsForStudent
};

