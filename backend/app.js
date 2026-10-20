
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

const academicYearRoutes = require("./routes/academicYearRoute");
app.use("/api/academic-years", academicYearRoutes);
const examInstructionRoute = require("./routes/examInstructionRoute");
app.use("/api/exam-instructions", examInstructionRoute);
const examAssignmentRoute = require("./routes/examAssignmentRoute");
app.use("/api/exam-assignments", examAssignmentRoute);
const maintenanceRoute = require("./routes/maintenanceRoute");

app.use("/api/maintenance", maintenanceRoute);
const teacherRoute = require("./routes/teacherRoute");
app.use("/api/teachers", teacherRoute);

const teacerWorkspace = require("./routes/teacherWorkspaceRoute");
app.use("/api/teacher-workspace", teacerWorkspace);

app.use("/api/academic-deans",require("./routes/academicDeanRoutes"));

module.exports = app;
