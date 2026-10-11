const bcrypt = require("bcryptjs");

async function hashPassword(password) {
    return await bcrypt.hash(password, 10);
    //hashPassword("Student@123").then(console.log); of student i am change to 1234 new
}

async function comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
}

module.exports = {
    hashPassword,
    comparePassword
};