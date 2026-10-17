
const db = require("../config/db");

// Create consistent errors for the controller.
const createError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

// Check whether the user can access a question's department.
const checkDepartmentAccess = (user, departmentId) => {
    if (!user) {
        throw createError("Authentication required", 401);
    }

    const role = String(user.role || "").toLowerCase();

    if (role === "admin") {
        return;
    }

    if (role === "teacher") {
        if (
            !user.department_id ||
            Number(user.department_id) !== Number(departmentId)
        ) {
            throw createError(
                "You are not authorized to access this department's questions.",
                403
            );
        }

        return;
    }

    throw createError("You are not authorized to manage questions.", 403);
};

// Get all questions.
// Admin sees all departments; Teacher sees their assigned department.
const getQuestions = async (user) => {
    if (!user) {
        throw createError("Authentication required", 401);
    }

    const role = String(user.role || "").toLowerCase();

    if (!["admin", "teacher"].includes(role)) {
        throw createError("You are not authorized to view questions.", 403);
    }

    if (role === "teacher" && !user.department_id) {
        throw createError(
            "Your account has no assigned department.",
            403
        );
    }

    let sql = `
        SELECT
            q.id,
            q.department_id,
            q.academic_year_id,
            ay.academic_year AS academic_year,
            p.name AS program_name,
            d.name AS department_name,
            q.question_text,
            q.marks,
            q.status,
            q.created_at,
            q.created_by,
            creator.username AS created_by_username,
            CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM exam_questions eq
                    WHERE eq.question_id = q.id
                )
                OR EXISTS (
                    SELECT 1
                    FROM attempt_questions aq
                    WHERE aq.question_id = q.id
                )
                THEN 1
                ELSE 0
            END AS is_exam_locked
        FROM questions q
        JOIN departments d
            ON d.id = q.department_id
        JOIN programs p
            ON p.id = d.program_id
        LEFT JOIN academic_years ay
            ON ay.id = q.academic_year_id
        LEFT JOIN users creator
            ON creator.id = q.created_by
    `;

    const params = [];

    if (role === "teacher") {
        sql += " WHERE q.department_id = ?";
        params.push(user.department_id);
    }

    sql += " ORDER BY q.created_at DESC, q.id DESC";

    const [rows] = await db.query(sql, params);

    return rows;
};

// Get one question and its options.
const getQuestionById = async (id, user) => {
    if (!user) {
        throw createError("Authentication required", 401);
    }

    const role = String(user.role || "").toLowerCase();

    if (!["admin", "teacher"].includes(role)) {
        throw createError("You are not authorized to view questions.", 403);
    }

    const [rows] = await db.query(
        `
        SELECT
            q.id,
            q.department_id,
            q.academic_year_id,
            ay.academic_year AS academic_year,
            p.name AS program_name,
            d.name AS department_name,
            q.question_text,
            q.marks,
            q.status,
            q.created_at,
            q.created_by,
            creator.username AS created_by_username,
            CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM exam_questions eq
                    WHERE eq.question_id = q.id
                )
                OR EXISTS (
                    SELECT 1
                    FROM attempt_questions aq
                    WHERE aq.question_id = q.id
                )
                THEN 1
                ELSE 0
            END AS is_exam_locked
        FROM questions q
        JOIN departments d
            ON d.id = q.department_id
        JOIN programs p
            ON p.id = d.program_id
        LEFT JOIN academic_years ay
            ON ay.id = q.academic_year_id
        LEFT JOIN users creator
            ON creator.id = q.created_by
        WHERE q.id = ?
        LIMIT 1
        `,
        [id]
    );

    if (!rows.length) {
        throw createError("Question not found.", 404);
    }

    const question = rows[0];

    checkDepartmentAccess(user, question.department_id);

    const [options] = await db.query(
        `
        SELECT id, option_text, is_correct
        FROM question_options
        WHERE question_id = ?
        ORDER BY id
        `,
        [id]
    );

    question.options = options;

    return question;
};

// Update an existing question.
// Questions linked to exams or attempts cannot be edited.
const updateQuestion = async (id, data) => {
    const {
        department_id,
        question_text,
        marks,
        options,
        user
    } = data;

    if (!user) {
        throw createError("Authentication required", 401);
    }

    const role = String(user.role || "").toLowerCase();

    if (!["admin", "teacher"].includes(role)) {
        throw createError(
            "You are not authorized to update questions.",
            403
        );
    }

    const [rows] = await db.query(
        `
        SELECT id, department_id
        FROM questions
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    if (!rows.length) {
        throw createError("Question not found.", 404);
    }

    const existingQuestion = rows[0];

    checkDepartmentAccess(user, existingQuestion.department_id);

    // Preserve the existing department; moving questions is not allowed.
    if (
        Number(department_id) !==
        Number(existingQuestion.department_id)
    ) {
        throw createError(
            "A question cannot be moved to another department.",
            400
        );
    }

    const [departments] = await db.query(
        `
        SELECT id
        FROM departments
        WHERE id = ? AND status = 'active'
        LIMIT 1
        `,
        [existingQuestion.department_id]
    );

    if (!departments.length) {
        throw createError(
            "The question's department is inactive or unavailable.",
            400
        );
    }

    const [lockedRows] = await db.query(
        `
        SELECT
            EXISTS (
                SELECT 1
                FROM exam_questions
                WHERE question_id = ?
            )
            OR EXISTS (
                SELECT 1
                FROM attempt_questions
                WHERE question_id = ?
            ) AS is_locked
        `,
        [id, id]
    );

    if (Number(lockedRows[0].is_locked) === 1) {
        throw createError(
            "This question is already linked to an exam or attempt and cannot be edited.",
            409
        );
    }

    await db.query(
        `
        UPDATE questions
        SET question_text = ?, marks = ?
        WHERE id = ?
        `,
        [question_text, marks, id]
    );

    await db.query(
        "DELETE FROM question_options WHERE question_id = ?",
        [id]
    );

    for (const option of options) {
        await db.query(
            `
            INSERT INTO question_options
                (question_id, option_text, is_correct)
            VALUES (?, ?, ?)
            `,
            [
                id,
                option.option_text.trim(),
                option.is_correct === true ||
                option.is_correct === 1 ||
                option.is_correct === "1"
                    ? 1
                    : 0
            ]
        );
    }

    return { message: "Question updated successfully" };
};

// Deactivate a question.
const deactivateQuestion = async (id, user) => {
    if (!user) {
        throw createError("Authentication required", 401);
    }

    const role = String(user.role || "").toLowerCase();

    if (!["admin", "teacher"].includes(role)) {
        throw createError(
            "You are not authorized to deactivate questions.",
            403
        );
    }

    const [rows] = await db.query(
        `
        SELECT id, department_id
        FROM questions
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    if (!rows.length) {
        throw createError("Question not found.", 404);
    }

    checkDepartmentAccess(user, rows[0].department_id);

    await db.query(
        `
        UPDATE questions
        SET status = 'inactive'
        WHERE id = ?
        `,
        [id]
    );

    return { message: "Question deactivated successfully" };
};

// Activate a question.
const activateQuestion = async (id, user) => {
    if (!user) {
        throw createError("Authentication required", 401);
    }

    const role = String(user.role || "").toLowerCase();

    if (!["admin", "teacher"].includes(role)) {
        throw createError(
            "You are not authorized to activate questions.",
            403
        );
    }

    const [rows] = await db.query(
        `
        SELECT id, department_id
        FROM questions
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    if (!rows.length) {
        throw createError("Question not found.", 404);
    }

    checkDepartmentAccess(user, rows[0].department_id);

    await db.query(
        `
        UPDATE questions
        SET status = 'active'
        WHERE id = ?
        `,
        [id]
    );

    return { message: "Question activated successfully" };
};

// Validate an active program and its department.
// Teachers may import only into their assigned department.
const validateImportTarget = async (
    programId,
    departmentId,
    user
) => {
    if (!user) {
        throw createError("Authentication required", 401);
    }

    const role = String(user.role || "").toLowerCase();

    if (role !== "teacher") {
        throw createError(
            "Only teachers can import questions.",
            403
        );
    }

    if (
        !Number.isInteger(Number(programId)) ||
        Number(programId) <= 0 ||
        !Number.isInteger(Number(departmentId)) ||
        Number(departmentId) <= 0
    ) {
        throw createError(
            "A valid program and department are required."
        );
    }

    checkDepartmentAccess(user, departmentId);

    const [rows] = await db.query(
        `
        SELECT
            d.id AS department_id,
            d.program_id,
            p.id AS active_program_id
        FROM departments d
        JOIN programs p
            ON p.id = d.program_id
        WHERE d.id = ?
          AND d.program_id = ?
          AND d.status = 'active'
          AND p.status = 'active'
        LIMIT 1
        `,
        [departmentId, programId]
    );

    if (!rows.length) {
        throw createError(
            "The selected program or department is inactive, unavailable, or does not match."
        );
    }

    return rows[0];
};

// Validate that an academic year exists and is active.
const validateAcademicYear = async (academicYearId) => {
    if (
        !Number.isInteger(Number(academicYearId)) ||
        Number(academicYearId) <= 0
    ) {
        throw createError("A valid academic year is required.");
    }

    const [rows] = await db.query(
        `
        SELECT id, academic_year, status
        FROM academic_years
        WHERE id = ?
          AND status = 'active'
        LIMIT 1
        `,
        [academicYearId]
    );

    if (!rows.length) {
        throw createError(
            "The selected academic year does not exist or is inactive."
        );
    }

    return rows[0];
};

// Import a question and its options.
// Academic year is saved on the existing questions table.
const importQuestion = async ({
    department_id,
    academic_year_id,
    question_text,
    marks,
    options,
    user
}) => {
    if (!user) {
        throw createError("Authentication required", 401);
    }

    if (String(user.role || "").toLowerCase() !== "teacher") {
        throw createError(
            "Only teachers can import questions.",
            403
        );
    }

    checkDepartmentAccess(user, department_id);

    await validateAcademicYear(academic_year_id);

    const [departmentRows] = await db.query(
        `
        SELECT id
        FROM departments
        WHERE id = ? AND status = 'active'
        LIMIT 1
        `,
        [department_id]
    );

    if (!departmentRows.length) {
        throw createError(
            "The selected department is inactive or unavailable."
        );
    }

    if (!String(question_text || "").trim()) {
        throw createError("Question text is required.");
    }

    if (!Number.isFinite(Number(marks)) || Number(marks) <= 0) {
        throw createError("Marks must be greater than zero.");
    }

    if (!Array.isArray(options) || options.length < 2) {
        throw createError(
            "A question must have at least two options."
        );
    }

    const correctOptions = options.filter(
        option =>
            option.is_correct === true ||
            option.is_correct === 1 ||
            option.is_correct === "1"
    );

    if (correctOptions.length !== 1) {
        throw createError(
            "A question must have exactly one correct answer."
        );
    }

    const [result] = await db.query(
        `
        INSERT INTO questions
            (
                department_id,
                academic_year_id,
                created_by,
                question_text,
                marks,
                status
            )
        VALUES (?, ?, ?, ?, ?, 'active')
        `,
        [
            department_id,
            academic_year_id,
            user.id,
            String(question_text).trim(),
            Number(marks)
        ]
    );

    for (const option of options) {
        await db.query(
            `
            INSERT INTO question_options
                (question_id, option_text, is_correct)
            VALUES (?, ?, ?)
            `,
            [
                result.insertId,
                String(option.option_text).trim(),
                option.is_correct === true ||
                option.is_correct === 1 ||
                option.is_correct === "1"
                    ? 1
                    : 0
            ]
        );
    }

    return {
        id: result.insertId,
        message: "Question imported successfully"
    };
};

module.exports = {
    getQuestions,
    getQuestionById,
    updateQuestion,
    deactivateQuestion,
    activateQuestion,
    validateImportTarget,
    validateAcademicYear,
    importQuestion
};
