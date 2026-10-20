const bcrypt = require("bcryptjs");

async function hashPassword(password) {
    return await bcrypt.hash(password, 10);
    //hashPassword("Student@123").then(console.log); of student i am change to 1234 new
     //when you crate hash password use node -e "require('./unils/password').hashPassword('Teacher@123').then(console.log)" on terminal
     //username and password of academic dean const username = "academic";const password = "Academic@123";
     //for teacher username teacher pasword Teacher@123 
     //for student username ST002 password Student@1234
        
}

async function comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
}

module.exports = {
    hashPassword,
    comparePassword
};