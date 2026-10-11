
const express = require("express");
const cors = require("cors");



const app = express();

app.use(
    cors({
        exposedHeaders: [
            "X-Students-Created",
            "X-Students-Failed"
        ]
    })
);
app.use(express.json());

const authRoutes = require("./routes/authRoute");
app.use("/api/auth", authRoutes);
const studentRoutes = require("./routes/studenRoute");
app.use("/api/students", studentRoutes);
//exaam route
const examRoute=require("./routes/examRoute")
app.use("/api/exams",examRoute)
//question route
const questionRoute=require("./routes/questionRoute")
app.use("/api/questions",questionRoute)
const examQuestionRoutes =require("./routes/examQuestionRoutes");
app.use("/api/exams", examQuestionRoutes);
const attemptRoutes = require("./routes/attmptRoute");
app.use("/api/attempts", attemptRoutes);
const resultRoutes = require("./routes/resulteRoute");
app.use("/api/results", resultRoutes);
const departmentRoutes = require("./routes/departmentRoute");
const programRoutes = require("./routes/programRoute");
app.use("/api/programs", programRoutes);

app.use("/api/departments", departmentRoutes);
module.exports = app;
