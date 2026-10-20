
require("dotenv").config();

const db = require("./config/db");
const bcrypt = require("bcryptjs");

async function createAcademicDean() {
    try {
        const username = "academic";
        const password = "Academic@123";

        const [existing] = await db.execute(
            "SELECT id FROM users WHERE username = ?",
            [username]
        );

        if (existing.length > 0) {
            console.log("Academic Dean username already exists.");
            process.exitCode = 1;
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.execute(
            `INSERT INTO users
            (username, password, role, is_active, must_change_password)
            VALUES (?, ?, ?, ?, ?)`,
            [username, hashedPassword, "academic_dean", 1, 1]
        );

        console.log("Academic Dean created successfully");
        console.log("Username:", username);
        console.log("Temporary password:", password);

    } catch (error) {
        console.error("Error:", error.message);
        process.exitCode = 1;
    } finally {
        await db.end();
    }
}

createAcademicDean();
