
const db = require("../config/db");

// Get Teacher workspace summary for the assigned department.
async function getDashboard(departmentId) {
    const [[studentCount]] = await db.execute(
        `SELECT COUNT(*) AS total
         FROM students
         WHERE department_id = ?`,
        [departmentId]
    );

    const [[questionCount]] = await db.execute(
        `SELECT COUNT(*) AS total
         FROM questions
         WHERE department_id = ?
           AND status = 'active'`,
        [departmentId]
    );

    const [[resultCounts]] = await db.execute(
        `SELECT
            COUNT(*) AS total_results,
            SUM(
                CASE
                    WHEN LOWER(r.result_status) IN ('pass', 'passed')
                    THEN 1 ELSE 0
                END
            ) AS passed,
            SUM(
                CASE
                    WHEN LOWER(r.result_status) IN ('fail', 'failed')
                    THEN 1 ELSE 0
                END
            ) AS failed
         FROM results r
         JOIN exam_attempts ea ON r.attempt_id = ea.id
         JOIN students s ON ea.student_id = s.id
         WHERE s.department_id = ?`,
        [departmentId]
    );

    return {
        students: Number(studentCount.total) || 0,
        questions: Number(questionCount.total) || 0,
        passed: Number(resultCounts.passed) || 0,
        failed: Number(resultCounts.failed) || 0
    };
}

// List only students belonging to the Teacher's department.
async function getDepartmentStudents(departmentId) {
    const [students] = await db.execute(
        `SELECT
            s.id,
            s.student_id,
            s.student_id AS student_code,
            s.first_name,
            s.last_name,
            CONCAT_WS(' ', s.first_name, s.last_name) AS full_name,
            u.username,
            d.name AS department_name,
            p.name AS program_name,
            s.academic_year,
            s.status
         FROM students s
         JOIN users u ON s.user_id = u.id
         JOIN departments d ON s.department_id = d.id
         JOIN programs p ON d.program_id = p.id
         WHERE s.department_id = ?
         ORDER BY s.first_name ASC, s.last_name ASC`,
        [departmentId]
    );

    return students;
}

// List only results belonging to students in the Teacher's department.
async function getDepartmentResults(departmentId, filters = {}) {
    const conditions = ["s.department_id = ?"];
    const params = [departmentId];

    if (filters.status) {
        const status = String(filters.status).toLowerCase();

        if (["pass", "passed"].includes(status)) {
            conditions.push(
                "LOWER(r.result_status) IN ('pass', 'passed')"
            );
        } else if (["fail", "failed"].includes(status)) {
            conditions.push(
                "LOWER(r.result_status) IN ('fail', 'failed')"
            );
        }
    }

    if (filters.search) {
        conditions.push(
            `(u.username LIKE ?
              OR s.student_id LIKE ?
              OR s.first_name LIKE ?
              OR s.last_name LIKE ?
              OR e.title LIKE ?)`
        );

        const search = `%${String(filters.search).trim()}%`;
        params.push(search, search, search, search, search);
    }

    const [results] = await db.execute(
        `SELECT
            r.id,
            r.attempt_id,
            s.student_id,
            s.student_id AS student_code,
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
         JOIN departments d ON s.department_id = d.id
         JOIN programs p ON d.program_id = p.id
         WHERE ${conditions.join(" AND ")}
         ORDER BY r.created_at DESC`,
        params
    );

    return results;
}
// Get the logged-in Teacher's profile and academic assignment.
async function getTeacherProfile(userId, departmentId) {
    const [rows] = await db.execute(
        `SELECT
            u.id,
            u.username,
            u.role,
            d.name AS department_name,
            p.name AS program_name
         FROM users u
         JOIN departments d ON u.department_id = d.id
         JOIN programs p ON d.program_id = p.id
         WHERE u.id = ?
           AND u.department_id = ?
         LIMIT 1`,
        [userId, departmentId]
    );

    return rows[0] || null;
}

module.exports = {
    getDashboard,
    getDepartmentStudents,
    getDepartmentResults,
    getTeacherProfile
};
