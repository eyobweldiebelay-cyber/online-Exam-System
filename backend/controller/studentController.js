
const studentService = require("../services/studentService");
const XLSX = require("xlsx");
const ExcelJS = require("exceljs");

// ==========================================
// CREATE STUDENT
// ==========================================

async function createStudent(req, res) {
    try {
        const {
            student_id,
            first_name,
            last_name,
            department_id,
            academic_year,
            password
        } = req.body;

        if (
            !student_id ||
            !first_name ||
            !last_name ||
            !department_id ||
            !password
        ) {
            return res.status(400).json({
                message:
                    "Student ID, name, department and password are required"
            });
        }

        const result = await studentService.createStudent({
            student_id,
            first_name,
            last_name,
            department_id,
            academic_year,
            password
        });

        return res.status(201).json(result);
    } catch (error) {
        return res.status(400).json({
            message: error.message
        });
    }
}

// ==========================================
// GET ALL STUDENTS
// ==========================================

async function getAllStudents(req, res) {
    try {
        const students = await studentService.getAllStudents();

        return res.status(200).json({ students });
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}

// ==========================================
// GET STUDENT BY ID
// ==========================================

async function getStudentById(req, res) {
    try {
        const student = await studentService.getStudentById(
            req.params.id
        );

        return res.status(200).json({ student });
    } catch (error) {
        return res.status(404).json({
            message: error.message
        });
    }
}

// ==========================================
// UPDATE STUDENT
// ==========================================

async function updateStudent(req, res) {
    try {
        const result = await studentService.updateStudent(
            req.params.id,
            req.body
        );

        return res.status(200).json(result);
    } catch (error) {
        return res.status(400).json({
            message: error.message
        });
    }
}

// ==========================================
// UPDATE STUDENT STATUS
// ==========================================

async function updateStudentStatus(req, res) {
    try {
        const { status } = req.body;

        const result = await studentService.updateStudentStatus(
            req.params.id,
            status
        );

        return res.status(200).json(result);
    } catch (error) {
        return res.status(400).json({
            message: error.message
        });
    }
}

// ==========================================
// CHANGE STUDENT PASSWORD
// ==========================================

async function changePassword(req, res) {
    try {
        const {
            current_password,
            new_password
        } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({
                message:
                    "Current password and new password are required"
            });
        }

        if (new_password.length < 6) {
            return res.status(400).json({
                message:
                    "New password must be at least 6 characters"
            });
        }

        const userId = req.user.user_id;

        await studentService.changeStudentPassword(
            userId,
            current_password,
            new_password
        );

        return res.status(200).json({
            message: "Password changed successfully"
        });
    } catch (error) {
        console.error("Change password error:", error);

        if (error.message === "Current password is incorrect") {
            return res.status(401).json({
                message: "Current password is incorrect"
            });
        }

        if (error.message === "Student account not found") {
            return res.status(404).json({
                message: "Student account not found"
            });
        }

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

// ==========================================
// IMPORT STUDENTS AND EXPORT EXCEL RESULTS
// ==========================================

async function importStudents(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({
                message:
                    "Please upload a CSV or Excel file (.csv or .xlsx)."
            });
        }

        // Read the uploaded CSV or Excel file.
        const workbook = XLSX.read(req.file.buffer, {
            type: "buffer"
        });

        const firstSheetName = workbook.SheetNames[0];

        if (!firstSheetName) {
            return res.status(400).json({
                message:
                    "The uploaded file contains no worksheet."
            });
        }

        const worksheet = workbook.Sheets[firstSheetName];

        const rawRows = XLSX.utils.sheet_to_json(worksheet, {
            defval: "",
            raw: false
        });

        if (rawRows.length === 0) {
            return res.status(400).json({
                message:
                    "The uploaded file contains no student records."
            });
        }

        // Normalize column names.
        const rows = rawRows.map((row) => {
            const normalizedRow = {};

            for (const [key, value] of Object.entries(row)) {
                const normalizedKey = key
                    .trim()
                    .toLowerCase()
                    .replace(/[\s-]+/g, "_");

                normalizedRow[normalizedKey] = value;
            }

            return normalizedRow;
        });

        // Import students using the existing service.
        const results = await studentService.importStudents(rows);

        // ==========================================
        // CREATE EXCELJS WORKBOOK
        // ==========================================

        const resultWorkbook = new ExcelJS.Workbook();

        resultWorkbook.creator = "Online Exam System";
        resultWorkbook.subject = "Student Import Results";
        resultWorkbook.title = "Student Import Results";
        resultWorkbook.created = new Date();

        const resultSheet = resultWorkbook.addWorksheet(
            "Import Results",
            {
                views: [
                    {
                        state: "frozen",
                        ySplit: 1
                    }
                ]
            }
        );

        resultSheet.columns = [
            {
                header: "Student ID",
                key: "student_id",
                width: 18
            },
            {
                header: "First Name",
                key: "first_name",
                width: 22
            },
            {
                header: "Last Name",
                key: "last_name",
                width: 22
            },
            {
                header: "Username",
                key: "username",
                width: 20
            },
            {
                header: "Temporary Password",
                key: "temporary_password",
                width: 30
            },
            {
                header: "Import Status",
                key: "status",
                width: 18
            },
            {
                header: "Message",
                key: "message",
                width: 55
            }
        ];

        // Format the header row.
        const headerRow = resultSheet.getRow(1);

        headerRow.height = 28;

        headerRow.eachCell((cell) => {
            cell.font = {
                bold: true,
                color: {
                    argb: "FFFFFFFF"
                },
                size: 11
            };

            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: {
                    argb: "FF1D4ED8"
                }
            };

            cell.alignment = {
                vertical: "middle",
                horizontal: "center",
                wrapText: true
            };

            cell.border = {
                bottom: {
                    style: "thin",
                    color: {
                        argb: "FFBFDBFE"
                    }
                }
            };
        });

        // Add one row for every imported student.
        for (const result of results) {
            const row = resultSheet.addRow({
                student_id: result.student_id || "",
                first_name: result.first_name || "",
                last_name: result.last_name || "",
                username: result.username || "",
                temporary_password:
                    result.temporary_password || "",
                status: result.status || "error",
                message: result.message || ""
            });

            row.height = 22;

            row.eachCell((cell) => {
                cell.alignment = {
                    vertical: "middle",
                    wrapText: true
                };

                cell.border = {
                    bottom: {
                        style: "hair",
                        color: {
                            argb: "FFE5E7EB"
                        }
                    }
                };
            });

            const statusCell = row.getCell("status");

            if (result.status === "created") {
                statusCell.font = {
                    bold: true,
                    color: {
                        argb: "FF166534"
                    }
                };

                statusCell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: {
                        argb: "FFDCFCE7"
                    }
                };
            } else {
                statusCell.font = {
                    bold: true,
                    color: {
                        argb: "FF991B1B"
                    }
                };

                statusCell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: {
                        argb: "FFFEE2E2"
                    }
                };
            }

            // Make temporary passwords easy to identify.
            const passwordCell = row.getCell("temporary_password");

            passwordCell.font = {
                name: "Consolas",
                size: 10
            };
        }

        // Enable filters for all result columns.
        resultSheet.autoFilter = {
            from: {
                row: 1,
                column: 1
            },
            to: {
                row: Math.max(1, resultSheet.rowCount),
                column: resultSheet.columnCount
            }
        };

        // Count successful and failed imports.
        const createdCount = results.filter(
            (result) => result.status === "created"
        ).length;

        const failedCount = results.length - createdCount;

        // Generate the actual .xlsx file in memory.
        const excelBuffer = await resultWorkbook.xlsx.writeBuffer();

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            'attachment; filename="student-import-results.xlsx"'
        );

        res.setHeader("Cache-Control", "no-store");

        res.setHeader(
            "X-Students-Created",
            String(createdCount)
        );

        res.setHeader(
            "X-Students-Failed",
            String(failedCount)
        );

        return res.status(200).send(Buffer.from(excelBuffer));
    } catch (error) {
        console.error("Student import failed:", error);

        return res.status(500).json({
            message: "Failed to import students."
        });
    }
}

// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
    createStudent,
    getAllStudents,
    getStudentById,
    updateStudent,
    updateStudentStatus,
    changePassword,
    importStudents
};
