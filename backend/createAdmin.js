require("dotenv").config();

const db = require("./config/db");
const bcrypt = require("bcryptjs");

async function createAdmin() {
    try {
        const username = "admin";
        const password = "Admin@123";
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.execute(
            `INSERT INTO users
            (username, password, role, is_active)
            VALUES (?, ?, ?, ?)`,
            [username, hashedPassword, "admin", 1]
        );

        console.log("Admin created successfully");
        console.log("Username:", username);
        console.log("Password:", password);

        process.exit(0);
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

createAdmin();