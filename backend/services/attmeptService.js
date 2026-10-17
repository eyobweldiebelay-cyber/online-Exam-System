
const db = require("../config/db");

// ======================================================
// HELPERS
// ======================================================

function createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function shuffle(items) {
    const result = [...items];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

// ======================================================
// START EXAM
// ======================================================

async function startExam(userId, examId) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Verify the authenticated student.
        const [students] = await connection.execute(
            `SELECT
                s.id,
                s.student_id,
                s.department_id,
                s.academic_year
             FROM students s
             INNER JOIN users u ON u.id = s.user_id
             WHERE u.id = ?
               AND u.role = 'student'
               AND u.is_active = 1
             LIMIT 1
             FOR UPDATE`,
            [userId]
        );

        if (students.length === 0) {
            throw createError(
                "Active student account not found",
                403
            );
        }

        const student = students[0];

        // 2. Load the exam.
        const [exams] = await connection.execute(
            `SELECT *
             FROM exams
             WHERE id = ?
             LIMIT 1
             FOR UPDATE`,
            [examId]
        );

        if (exams.length === 0) {
            throw createError("Exam not found", 404);
        }

        const exam = exams[0];

        if (exam.status !== "published") {
            throw createError(
                "This exam is not published",
                400
            );
        }

        // 3. Check the exam schedule.
        const now = new Date();

        if (
            exam.start_at &&
            now < new Date(exam.start_at)
        ) {
            throw createError(
                "This exam has not started yet",
                400
            );
        }

        if (
            exam.end_at &&
            now >= new Date(exam.end_at)
        ) {
            throw createError(
                "The exam deadline has passed",
                400
            );
        }

        // 4. Check department eligibility.
        if (
            exam.department_id != null &&
            Number(exam.department_id) !==
                Number(student.department_id)
        ) {
            throw createError(
                "You are not assigned to this exam",
                403
            );
        }

        // 5. Resume an existing attempt when possible.
        const [existingAttempts] = await connection.execute(
            `SELECT *
             FROM exam_attempts
             WHERE student_id = ?
               AND exam_id = ?
             LIMIT 1
             FOR UPDATE`,
            [student.id, exam.id]
        );

        let attempt;

        if (existingAttempts.length > 0) {
            attempt = existingAttempts[0];

            if (attempt.status !== "in_progress") {
                throw createError(
                    "You have already submitted this exam",
                    409
                );
            }
        } else {
            // 6. Load the questions assigned to this exam.
            const [examQuestions] = await connection.execute(
                `SELECT
                    eq.question_id,
                    COALESCE(eq.marks, q.marks, 1) AS marks
                 FROM exam_questions eq
                 INNER JOIN questions q
                    ON q.id = eq.question_id
                 WHERE eq.exam_id = ?`,
                [exam.id]
            );

            if (examQuestions.length === 0) {
                throw createError(
                    "No questions have been assigned to this exam",
                    400
                );
            }

            // 7. Randomize the question order for this attempt.
            const randomizedQuestions = shuffle(examQuestions);

            // 8. Create the attempt.
            const [attemptResult] = await connection.execute(
                `INSERT INTO exam_attempts
                    (student_id, exam_id, started_at, status)
                 VALUES (?, ?, NOW(), 'in_progress')`,
                [student.id, exam.id]
            );

            const attemptId = attemptResult.insertId;

            // 9. Persist the randomized question order.
            for (
                let index = 0;
                index < randomizedQuestions.length;
                index++
            ) {
                const question = randomizedQuestions[index];

                await connection.execute(
                    `INSERT INTO attempt_questions
                        (attempt_id, question_id, question_order, marks)
                     VALUES (?, ?, ?, ?)`,
                    [
                        attemptId,
                        question.question_id,
                        index + 1,
                        question.marks
                    ]
                );
            }

            attempt = {
                id: attemptId,
                student_id: student.id,
                exam_id: exam.id,
                started_at: new Date(),
                status: "in_progress"
            };
        }

        // 10. Retrieve the saved question order.
        const [savedQuestions] = await connection.execute(
            `SELECT
                aq.question_id,
                aq.question_order,
                aq.marks,
                q.question_text
             FROM attempt_questions aq
             INNER JOIN questions q
                ON q.id = aq.question_id
             WHERE aq.attempt_id = ?
             ORDER BY aq.question_order ASC`,
            [attempt.id]
        );

        if (savedQuestions.length === 0) {
            throw createError(
                "No questions were saved for this attempt",
                500
            );
        }

        // 11. Load options without exposing correct answers.
        const questions = [];

        for (const question of savedQuestions) {
            const [options] = await connection.execute(
                `SELECT id, option_text
                 FROM question_options
                 WHERE question_id = ?
                 ORDER BY id ASC`,
                [question.question_id]
            );

            questions.push({
                question_id: question.question_id,
                question_text: question.question_text,
                question_order: question.question_order,
                marks: Number(question.marks),
                options: options.map(option => ({
                    id: option.id,
                    option_text: option.option_text
                }))
            });
        }

        await connection.commit();

        return {
            attempt_id: attempt.id,
            exam_id: exam.id,
            exam_title: exam.title,
            started_at: attempt.started_at,
            duration_minutes: exam.duration_minutes,
            questions
        };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// ======================================================
// SUBMIT EXAM
// ======================================================

async function submitExam(userId, attemptId, answers) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Validate the request.
        if (
            !Number.isInteger(Number(attemptId)) ||
            Number(attemptId) <= 0
        ) {
            throw createError("Invalid exam attempt ID", 400);
        }

        if (!Array.isArray(answers)) {
            throw createError(
                "Answers must be provided as an array",
                400
            );
        }

        // Normalize the attempt ID.
        attemptId = Number(attemptId);

        // 2. Verify the authenticated student.
        const [students] = await connection.execute(
            `SELECT s.id
             FROM students s
             INNER JOIN users u ON u.id = s.user_id
             WHERE u.id = ?
               AND u.role = 'student'
               AND u.is_active = 1
             LIMIT 1`,
            [userId]
        );

        if (students.length === 0) {
            throw createError(
                "Active student account not found",
                403
            );
        }

        const studentId = students[0].id;

        // 3. Load and lock this student's attempt.
        const [attempts] = await connection.execute(
            `SELECT
                ea.*,
                e.pass_mark,
                e.duration_minutes,
                e.end_at
             FROM exam_attempts ea
             INNER JOIN exams e ON e.id = ea.exam_id
             WHERE ea.id = ?
               AND ea.student_id = ?
             LIMIT 1
             FOR UPDATE`,
            [attemptId, studentId]
        );

        if (attempts.length === 0) {
            throw createError(
                "Exam attempt not found",
                404
            );
        }

        const attempt = attempts[0];

        if (attempt.status !== "in_progress") {
            throw createError(
                "This exam has already been submitted",
                409
            );
        }

        // 4. Load only questions assigned to this attempt.
        const [questions] = await connection.execute(
            `SELECT question_id, marks
             FROM attempt_questions
             WHERE attempt_id = ?
             ORDER BY question_order ASC`,
            [attemptId]
        );

        if (questions.length === 0) {
            throw createError(
                "No questions found for this attempt",
                400
            );
        }

        // 5. Reject duplicate or unrelated question answers.
        const questionMap = new Map(
            questions.map(question => [
                Number(question.question_id),
                question
            ])
        );

        const answerMap = new Map();

        for (const answer of answers) {
            if (!answer || answer.question_id == null) {
                throw createError(
                    "Every answer must include a question ID",
                    400
                );
            }

            const questionId = Number(answer.question_id);

            if (!questionMap.has(questionId)) {
                throw createError(
                    "An answer refers to a question outside this attempt",
                    400
                );
            }

            if (answerMap.has(questionId)) {
                throw createError(
                    "Duplicate answers were provided for a question",
                    400
                );
            }

            answerMap.set(questionId, answer);
        }

        let score = 0;
        let totalMarks = 0;
        let correctAnswers = 0;

        // 6. Grade and save each assigned question.
        for (const question of questions) {
            const questionId = Number(question.question_id);
            const marks = Number(question.marks) || 0;

            if (marks < 0) {
                throw createError(
                    "Question marks cannot be negative",
                    500
                );
            }

            totalMarks += marks;

            const answer = answerMap.get(questionId);

            let selectedOptionId = null;
            let isCorrect = 0;
            let marksAwarded = 0;

            if (answer) {
                const rawOptionId =
                    answer.selected_option_id ??
                    answer.option_id ??
                    null;

                if (rawOptionId !== null) {
                    const optionId = Number(rawOptionId);

                    if (
                        !Number.isInteger(optionId) ||
                        optionId <= 0
                    ) {
                        throw createError(
                            "Invalid selected option ID",
                            400
                        );
                    }

                    selectedOptionId = optionId;
                }
            }

            if (selectedOptionId !== null) {
                // Verify the option belongs to this question.
                const [options] = await connection.execute(
                    `SELECT id, is_correct
                     FROM question_options
                     WHERE id = ?
                       AND question_id = ?
                     LIMIT 1`,
                    [selectedOptionId, questionId]
                );

                if (options.length === 0) {
                    throw createError(
                        "Selected option does not belong to its question",
                        400
                    );
                }

                isCorrect =
                    Number(options[0].is_correct) === 1 ? 1 : 0;

                if (isCorrect) {
                    marksAwarded = marks;
                    score += marks;
                    correctAnswers++;
                }
            }

            // Save the answer using the current column names
            // from the supplied service code.
            await connection.execute(
                `INSERT INTO student_answers
                    (
                        attempt_id,
                        question_id,
                        selected_option_id,
                        is_correct,
                        marks_obtained
                    )
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    selected_option_id = VALUES(selected_option_id),
                    is_correct = VALUES(is_correct),
                    marks_obtained = VALUES(marks_obtained)`,
                [
                    attemptId,
                    questionId,
                    selectedOptionId,
                    isCorrect,
                    marksAwarded
                ]
            );
        }

        // 7. Calculate marks and percentage.
        const wrongAnswers = questions.length - correctAnswers;

        const percentage = totalMarks > 0
            ? Number(((score / totalMarks) * 100).toFixed(2))
            : 0;

        const passMark = Number(attempt.pass_mark) || 0;

        const resultStatus = percentage >= passMark
            ? "pass"
            : "fail";

        // 8. Mark the attempt as submitted.
        await connection.execute(
            `UPDATE exam_attempts
             SET status = 'submitted',
                 submitted_at = NOW()
             WHERE id = ?
               AND student_id = ?
               AND status = 'in_progress'`,
            [attemptId, studentId]
        );

        // 9. Save the result using the actual results table schema.
        await connection.execute(
            `INSERT INTO results
                (
                    attempt_id,
                    total_questions,
                    correct_answers,
                    wrong_answers,
                    total_marks,
                    obtained_marks,
                    percentage,
                    result_status
                )
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                attemptId,
                questions.length,
                correctAnswers,
                wrongAnswers,
                totalMarks,
                score,
                percentage,
                resultStatus
            ]
        );

        await connection.commit();

        return {
            attempt_id: attemptId,
            exam_id: attempt.exam_id,
            total_questions: questions.length,
            correct_answers: correctAnswers,
            wrong_answers: wrongAnswers,
            score,
            total_marks: totalMarks,
            percentage,
            status: resultStatus
        };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// ======================================================
// EXPORT
// ======================================================

module.exports = {
    startExam,
    submitExam
};
