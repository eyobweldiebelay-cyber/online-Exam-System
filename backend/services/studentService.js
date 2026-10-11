
const crypto = require("node:crypto");
const db = require("../config/db");
const {
    hashPassword,
    comparePassword
} = require("../unils/password");

// ==========================================
// CREATE STUDENT
// ==========================================

async function createStudent(data) {
    const connection = await db.getConnection();
    let transactionStarted = false;

    try {
        await connection.beginTransaction();
        transactionStarted = true;

        const {
            student_id,
            first_name,
            last_name,
            department_id,
            academic_year,
            password
        } = data;

        const [existingStudent] = await connection.execute(
            "SELECT id FROM students WHERE student_id = ?",
            [student_id]
        );

        if (existingStudent.length > 0) {
            throw new Error("Student ID already exists");
        }

        const [department] = await connection.execute(
            "SELECT id FROM departments WHERE id = ?",
            [department_id]
        );

        if (department.length === 0) {
            throw new Error("Department not found");
        }

        const hashedPassword = await hashPassword(password);

        const [userResult] = await connection.execute(
            `INSERT INTO users
                (username, password, role, is_active)
             VALUES (?, ?, 'student', 1)`,
            [student_id, hashedPassword]
        );

        await connection.execute(
            `INSERT INTO students
                (user_id, student_id, first_name, last_name,
                 department_id, academic_year, status)
             VALUES (?, ?, ?, ?, ?, ?, 'active')`,
            [
                userResult.insertId,
                student_id,
                first_name,
                last_name,
                department_id,
                academic_year || null
            ]
        );

        await connection.commit();
        transactionStarted = false;

        return {
            message: "Student created successfully",
            student_id
        };
    } catch (error) {
        if (transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Student creation rollback failed:",
                    rollbackError.message
                );
            }
        }

        throw error;
    } finally {
        connection.release();
    }
}

// ==========================================
// GET ALL STUDENTS
// ==========================================

async function getAllStudents() {
    const [students] = await db.execute(
        `SELECT
            s.id,
            s.student_id,
            s.first_name,
            s.last_name,
            s.department_id,
            d.name AS department_name,
            p.name AS program_name,
            s.academic_year,
            s.status,
            s.created_at
         FROM students s
         INNER JOIN departments d
            ON s.department_id = d.id
         INNER JOIN programs p
            ON d.program_id = p.id
         ORDER BY s.id DESC`
    );

    return students;
}

// ==========================================
// GET STUDENT BY ID
// ==========================================

async function getStudentById(id) {
    const [students] = await db.execute(
        `SELECT
            s.id,
            s.student_id,
            s.first_name,
            s.last_name,
            s.department_id,
            d.name AS department_name,
            p.name AS program_name,
            s.academic_year,
            s.status,
            s.created_at
         FROM students s
         INNER JOIN departments d
            ON s.department_id = d.id
         INNER JOIN programs p
            ON d.program_id = p.id
         WHERE s.id = ?`,
        [id]
    );

    if (students.length === 0) {
        throw new Error("Student not found");
    }

    return students[0];
}

// ==========================================
// UPDATE STUDENT
// ==========================================

async function updateStudent(id, data) {
    const {
        first_name,
        last_name,
        department_id,
        academic_year
    } = data;

    const [result] = await db.execute(
        `UPDATE students
         SET
            first_name = ?,
            last_name = ?,
            department_id = ?,
            academic_year = ?
         WHERE id = ?`,
        [
            first_name,
            last_name,
            department_id,
            academic_year || null,
            id
        ]
    );

    if (result.affectedRows === 0) {
        throw new Error("Student not found");
    }

    return {
        message: "Student updated successfully"
    };
}

// ==========================================
// UPDATE STUDENT STATUS
// ==========================================

async function updateStudentStatus(id, status) {
    if (!["active", "inactive"].includes(status)) {
        throw new Error("Invalid status");
    }

    const connection = await db.getConnection();
    let transactionStarted = false;

    try {
        await connection.beginTransaction();
        transactionStarted = true;

        const [student] = await connection.execute(
            "SELECT user_id FROM students WHERE id = ?",
            [id]
        );

        if (student.length === 0) {
            throw new Error("Student not found");
        }

        const userId = student[0].user_id;

        await connection.execute(
            `UPDATE students
             SET status = ?
             WHERE id = ?`,
            [status, id]
        );

        await connection.execute(
            `UPDATE users
             SET is_active = ?
             WHERE id = ?`,
            [status === "active" ? 1 : 0, userId]
        );

        await connection.commit();
        transactionStarted = false;

        return {
            message: `Student ${status} successfully`
        };
    } catch (error) {
        if (transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Student status rollback failed:",
                    rollbackError.message
                );
            }
        }

        throw error;
    } finally {
        connection.release();
    }
}

// ==========================================
// CHANGE STUDENT PASSWORD
// ==========================================

async function changeStudentPassword(
    userId,
    currentPassword,
    newPassword
) {
    const [users] = await db.execute(
        `SELECT id, password
         FROM users
         WHERE id = ? AND role = 'student'`,
        [userId]
    );

    if (users.length === 0) {
        throw new Error("Student account not found");
    }

    const user = users[0];

    const passwordMatch = await comparePassword(
        currentPassword,
        user.password
    );

    if (!passwordMatch) {
        throw new Error("Current password is incorrect");
    }

    const hashedPassword = await hashPassword(newPassword);

    await db.execute(
        `UPDATE users
         SET password = ?
         WHERE id = ?`,
        [hashedPassword, userId]
    );

    return {
        message: "Password changed successfully"
    };
}

// ==========================================
// IMPORT STUDENTS FROM CSV OR EXCEL
// ==========================================

async function importStudents(rows) {
    if (!Array.isArray(rows)) {
        throw new Error(
            "Invalid import data. Expected an array of student rows."
        );
    }

    const results = [];

    for (const row of rows) {
        let connection;
        let transactionStarted = false;

        const getValue = (...keys) => {
            for (const key of keys) {
                const value = row?.[key];

                if (
                    value !== undefined &&
                    value !== null &&
                    String(value).trim() !== ""
                ) {
                    return String(value).trim();
                }
            }

            return "";
        };

        const student_id = getValue(
            "student_id",
            "studentid",
            "student_id_number"
        );

        const first_name = getValue(
            "first_name",
            "firstname",
            "first"
        );

        const last_name = getValue(
            "last_name",
            "lastname",
            "last"
        );

        const departmentValue = getValue(
            "department_id",
            "department",
            "department_name",
            "departmentname"
        );

        const academic_year = getValue(
            "academic_year",
            "academicyear",
            "year"
        );

        try {
            if (
                !student_id ||
                !first_name ||
                !last_name ||
                !departmentValue
            ) {
                throw new Error(
                    "Student ID, first name, last name and department are required."
                );
            }

            connection = await db.getConnection();

            await connection.beginTransaction();
            transactionStarted = true;

            // Check for an existing student.
            const [existingStudent] = await connection.execute(
                `SELECT id
                 FROM students
                 WHERE student_id = ?
                 LIMIT 1`,
                [student_id]
            );

            if (existingStudent.length > 0) {
                throw new Error("Student ID already exists.");
            }

            // Check for an existing username.
            const [existingUser] = await connection.execute(
                `SELECT id
                 FROM users
                 WHERE username = ?
                 LIMIT 1`,
                [student_id]
            );

            if (existingUser.length > 0) {
                throw new Error("Username already exists.");
            }

            // Find department by ID or name.
            let department;

            if (/^\d+$/.test(departmentValue)) {
                const [departments] = await connection.execute(
                    `SELECT id
                     FROM departments
                     WHERE id = ?
                     LIMIT 1`,
                    [Number(departmentValue)]
                );

                department = departments[0];
            } else {
                const [departments] = await connection.execute(
                    `SELECT id
                     FROM departments
                     WHERE LOWER(name) = LOWER(?)
                     LIMIT 1`,
                    [departmentValue]
                );

                department = departments[0];
            }

            if (!department) {
                throw new Error(
                    `Department "${departmentValue}" was not found.`
                );
            }

            // Generate a temporary password.
            const temporaryPassword =
                `Stu@${crypto.randomBytes(6).toString("hex")}A1`;

            const hashedPassword = await hashPassword(
                temporaryPassword
            );

            // Insert using the existing users schema.
            // Do not assume must_change_password exists.
            const [userResult] = await connection.execute(
                `INSERT INTO users
                    (username, password, role, is_active)
                 VALUES (?, ?, 'student', 1)`,
                [student_id, hashedPassword]
            );

            // Insert the student profile.
            await connection.execute(
                `INSERT INTO students
                    (user_id, student_id, first_name, last_name,
                     department_id, academic_year, status)
                 VALUES (?, ?, ?, ?, ?, ?, 'active')`,
                [
                    userResult.insertId,
                    student_id,
                    first_name,
                    last_name,
                    department.id,
                    academic_year || null
                ]
            );

            await connection.commit();
            transactionStarted = false;

            results.push({
                student_id,
                first_name,
                last_name,
                username: student_id,
                temporary_password: temporaryPassword,
                status: "created",
                message: "Student account created successfully."
            });
        } catch (error) {
            if (connection && transactionStarted) {
                try {
                    await connection.rollback();
                    transactionStarted = false;
                } catch (rollbackError) {
                    console.error(
                        "Import rollback failed:",
                        rollbackError.message
                    );
                }
            }

            console.error(
                `Student import failed for ${student_id || "unknown student"}:`,
                error.message
            );

            results.push({
                student_id,
                first_name,
                last_name,
                username: "",
                temporary_password: "",
                status: "error",
                message:
                    error?.message || "An unexpected import error occurred."
            });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    return results;
}

// ==========================================
// EXPORT SERVICES
// ==========================================

module.exports = {
    createStudent,
    getAllStudents,
    getStudentById,
    updateStudent,
    updateStudentStatus,
    changeStudentPassword,
    importStudents
};
