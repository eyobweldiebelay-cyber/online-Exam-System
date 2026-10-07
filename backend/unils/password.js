const bcrypt = require("bcryptjs");

async function hashPassword(password) {
    return await bcrypt.hash(password, 10);
    //hashPassword("Student@123").then(console.log); of student
}

async function comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
}

module.exports = {
    hashPassword,
    comparePassword
};