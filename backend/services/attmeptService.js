const db = require("../config/db");

// ======================================================
// START EXAM
// ======================================================
const startExam = async (userId, examId) => {

    // 1. Find student
    const [students] = await db.execute(
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

    if (students.length === 0) {
        const error = new Error("Student profile not found");
        error.statusCode = 404;
        throw error;
    }

    const student = students[0];

    if (student.status !== "active") {
        const error = new Error("Student account is inactive");
        error.statusCode = 403;
        throw error;
    }

    // 2. Find exam
    const [exams] = await db.execute(
        `
        SELECT
            id,
            title,
            department_id,
            academic_year,
            duration_minutes,
            total_questions,
            pass_mark,
            start_at,
            end_at,
            status
        FROM exams
        WHERE id = ?
        `,
        [examId]
    );

    if (exams.length === 0) {
        const error = new Error("Exam not found");
        error.statusCode = 404;
        throw error;
    }

    const exam = exams[0];

    // 3. Check exam status
    if (exam.status !== "published") {
        const error = new Error("Exam is not published");
        error.statusCode = 400;
        throw error;
    }

    // 4. Check department
    if (student.department_id !== exam.department_id) {
        const error = new Error(
            "You are not eligible for this exam"
        );
        error.statusCode = 403;
        throw error;
    }

    // 5. Check academic year
    if (student.academic_year !== exam.academic_year) {
        const error = new Error(
            "You are not eligible for this exam"
        );
        error.statusCode = 403;
        throw error;
    }

    // 6. Check exam time
    const [databaseTime] = await db.execute(
        "SELECT NOW() AS exam_current_time"
    );

    const currentTime = databaseTime[0].exam_current_time;

    if (currentTime < exam.start_at) {
        const error = new Error(
            "Exam has not started yet"
        );
        error.statusCode = 400;
        throw error;
    }

    if (currentTime > exam.end_at) {
        const error = new Error(
            "Exam has ended"
        );
        error.statusCode = 400;
        throw error;
    }

    // 7. Check existing attempt
    const [existingAttempt] = await db.execute(
        `
        SELECT
            id,
            status
        FROM exam_attempts
        WHERE student_id = ?
          AND exam_id = ?
        `,
        [student.id, examId]
    );

    if (existingAttempt.length > 0) {
        const error = new Error(
            "You have already attempted this exam"
        );
        error.statusCode = 409;
        throw error;
    }

    // 8. Get exam questions
    // ORDER BY RAND() gives every student a different question order
    const [questions] = await db.execute(
        `
        SELECT
            q.id,
            q.question_text,
            q.marks
        FROM exam_questions eq
        JOIN questions q
            ON eq.question_id = q.id
        WHERE eq.exam_id = ?
        ORDER BY RAND()
        `,
        [examId]
    );

    if (questions.length === 0) {
        const error = new Error(
            "No questions are assigned to this exam"
        );
        error.statusCode = 400;
        throw error;
    }

    if (questions.length !== exam.total_questions) {
        const error = new Error(
            "Exam question count does not match"
        );
        error.statusCode = 400;
        throw error;
    }

    // 9. Create exam attempt
    const [attemptResult] = await db.execute(
        `
        INSERT INTO exam_attempts
        (
            student_id,
            exam_id,
            started_at,
            status
        )
        VALUES (?, ?, NOW(), 'in_progress')
        `,
        [student.id, examId]
    );

    const attemptId = attemptResult.insertId;

    // 10. Get options for every question
    for (const question of questions) {

        const [options] = await db.execute(
            `
            SELECT
                id,
                option_text
            FROM question_options
            WHERE question_id = ?
            ORDER BY RAND()
            `,
            [question.id]
        );

        question.options = options;
    }

    return {
        attempt_id: attemptId,

        exam: {
            id: exam.id,
            title: exam.title,
            duration_minutes: exam.duration_minutes,
            total_questions: exam.total_questions,
            pass_mark: exam.pass_mark,
            started_at: currentTime
        },

        questions
    };
};


// ======================================================
// SUBMIT EXAM
// ======================================================
const submitExam = async (userId, attemptId, answers) => {

    // Make sure answers is an array
    if (!Array.isArray(answers)) {
        const error = new Error(
            "Answers must be an array"
        );
        error.statusCode = 400;
        throw error;
    }

    // 1. Find student
    const [students] = await db.execute(
        `
        SELECT
            s.id,
            s.student_id,
            s.status,
            u.username
        FROM students s
        JOIN users u
            ON s.user_id = u.id
        WHERE s.user_id = ?
        `,
        [userId]
    );

    if (students.length === 0) {
        const error = new Error(
            "Student profile not found"
        );
        error.statusCode = 404;
        throw error;
    }

    const student = students[0];

    if (student.status !== "active") {
        const error = new Error(
            "Student account is inactive"
        );
        error.statusCode = 403;
        throw error;
    }

    // 2. Find attempt
    const [attempts] = await db.execute(
        `
        SELECT
            ea.id,
            ea.student_id,
            ea.exam_id,
            ea.started_at,
            ea.status,
            e.title AS exam_title,
            e.duration_minutes,
            e.pass_mark
        FROM exam_attempts ea
        JOIN exams e
            ON ea.exam_id = e.id
        WHERE ea.id = ?
        `,
        [attemptId]
    );

    if (attempts.length === 0) {
        const error = new Error(
            "Attempt not found"
        );
        error.statusCode = 404;
        throw error;
    }

    const attempt = attempts[0];

    // 3. Make sure attempt belongs to student
    if (attempt.student_id !== student.id) {
        const error = new Error(
            "You are not allowed to submit this attempt"
        );
        error.statusCode = 403;
        throw error;
    }

    // 4. Make sure attempt is still active
    if (attempt.status !== "in_progress") {
        const error = new Error(
            "This exam has already been submitted"
        );
        error.statusCode = 400;
        throw error;
    }

    // 5. Get current database time
    const [databaseTime] = await db.execute(
        "SELECT NOW() AS exam_current_time"
    );

    const currentTime =
        databaseTime[0].exam_current_time;

    // 6. Calculate exam end time
    const [timeCheck] = await db.execute(
        `
        SELECT
            started_at,
            DATE_ADD(
                started_at,
                INTERVAL duration_minutes MINUTE
            ) AS calculated_end_time
        FROM exam_attempts ea
        JOIN exams e
            ON ea.exam_id = e.id
        WHERE ea.id = ?
        `,
        [attemptId]
    );

    const calculatedEndTime =
        timeCheck[0].calculated_end_time;

    // 7. Get exam questions
    const [examQuestions] = await db.execute(
        `
        SELECT
            eq.question_id,
            q.marks
        FROM exam_questions eq
        JOIN questions q
            ON eq.question_id = q.id
        WHERE eq.exam_id = ?
        `,
        [attempt.exam_id]
    );

    if (examQuestions.length === 0) {
        const error = new Error(
            "No questions found for this exam"
        );
        error.statusCode = 400;
        throw error;
    }

    // ==================================================
    // Remove old answer rows for this attempt
    // ==================================================
    await db.execute(
        `
        DELETE FROM student_answers
        WHERE attempt_id = ?
        `,
        [attemptId]
    );

    // 8. Save and calculate answers
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let obtainedMarks = 0;

    for (const examQuestion of examQuestions) {

        // Find student's answer for this question
        const answer = answers.find(
            item =>
                Number(item.question_id) ===
                Number(examQuestion.question_id)
        );

        let selectedOptionId = null;
        let isCorrect = false;
        let marksObtained = 0;

        // ==================================================
        // Accept both formats
        // selected_option_id OR option_id
        // ==================================================
        if (answer) {

            if (
                answer.selected_option_id !== undefined &&
                answer.selected_option_id !== null &&
                answer.selected_option_id !== ""
            ) {
                selectedOptionId =
                    Number(answer.selected_option_id);

            } else if (
                answer.option_id !== undefined &&
                answer.option_id !== null &&
                answer.option_id !== ""
            ) {
                selectedOptionId =
                    Number(answer.option_id);
            }
        }

        // ==================================================
        // Student selected an option
        // ==================================================
        if (
            selectedOptionId !== null &&
            !Number.isNaN(selectedOptionId)
        ) {

            // Check that option belongs to this question
            const [options] = await db.execute(
                `
                SELECT
                    is_correct
                FROM question_options
                WHERE id = ?
                  AND question_id = ?
                `,
                [
                    selectedOptionId,
                    examQuestion.question_id
                ]
            );

            if (options.length > 0) {

                isCorrect =
                    Boolean(options[0].is_correct);

                if (isCorrect) {

                    correctAnswers++;

                    marksObtained =
                        Number(examQuestion.marks);

                    obtainedMarks += marksObtained;

                } else {

                    wrongAnswers++;
                }

            } else {

                // Invalid option for this question
                wrongAnswers++;

                selectedOptionId = null;
            }

        } else {

            // Student did not answer this question
            wrongAnswers++;
        }

        // ==================================================
        // Save student's answer
        // ==================================================
        await db.execute(
            `
            INSERT INTO student_answers
            (
                attempt_id,
                question_id,
                selected_option_id,
                is_correct,
                marks_obtained
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                attemptId,
                examQuestion.question_id,
                selectedOptionId,
                isCorrect ? 1 : 0,
                marksObtained
            ]
        );
    }

    // 9. Calculate total marks
    let totalMarks = 0;

    for (const question of examQuestions) {
        totalMarks += Number(question.marks);
    }

    // 10. Calculate percentage
    const percentage =
        totalMarks > 0
            ? (obtainedMarks / totalMarks) * 100
            : 0;

    // 11. Determine pass/fail
    const resultStatus =
        percentage >= Number(attempt.pass_mark)
            ? "pass"
            : "fail";

    // 12. Determine attempt status
    const finalStatus =
        currentTime > calculatedEndTime
            ? "expired"
            : "submitted";

    // 13. Update exam attempt
    await db.execute(
        `
        UPDATE exam_attempts
        SET
            submitted_at = ?,
            status = ?
        WHERE id = ?
        `,
        [
            currentTime,
            finalStatus,
            attemptId
        ]
    );

    // 14. Create result
    await db.execute(
        `
        INSERT INTO results
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            attemptId,
            examQuestions.length,
            correctAnswers,
            wrongAnswers,
            totalMarks,
            obtainedMarks,
            percentage,
            resultStatus
        ]
    );

    // 15. Return result
    return {
        attempt_id: attemptId,

        student_name: student.username,

        student_id: student.student_id,

        exam_title: attempt.exam_title,

        total_questions: examQuestions.length,

        correct_answers: correctAnswers,

        wrong_answers: wrongAnswers,

        total_marks: totalMarks,

        obtained_marks: obtainedMarks,

        percentage: Number(
            percentage.toFixed(2)
        ),

        result_status: resultStatus,

        attempt_status: finalStatus,

        completed_at: currentTime
    };
};


// ======================================================
// EXPORT
// ======================================================
module.exports = {
    startExam,
    submitExam
};