
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    useParams,
} from "react-router-dom";

import Login from "./pages/auth/Login";
import ChangePassword from "./account/ChangePassword";
import ProtectedRoute from "./components/ProtectedRoute";

import PublicLayout from "./layouts/PublicLayout";
import StudentLayout from "./layouts/StudentLayoute";
import AdminLayout from "./layouts/AdminLayout";
import TeacherLayout from "./layouts/TeacherLayout";

import AvailableExams from "./pages/student/AvailableExams";
import ExamInstructions from "./pages/student/ExamInstraction";
import TakeExam from "./pages/student/TakeExam";
import Result from "./pages/student/Result";

import AdminDashboard from "./pages/admin/Dashboard";
import Exams from "./pages/admin/Exam";
import ExamForm from "./pages/admin/ExamForm";
import ExamQuestions from "./pages/admin/ExamQuestions";
import AdminQuestions from "./pages/admin/Question";
import QuestionForm from "./pages/admin/QuestionForm";
import Programs from "./pages/admin/Programs";
import Department from "./pages/admin/Departments";
import ResultAdmin from "./pages/admin/ResultAdmin";
import Students from "./pages/admin/Students";
import StudentImport from "./pages/admin/StudentImport";
import MaintenanceControl from "./components/MaintenanceControl";
import Teachers from "./pages/admin/Teachers";

// Teacher pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherQuestions from "./pages/teacher/Tquestions";
import TeacherQuestionForm from "./pages/teacher/TQuestionForm";
import TeacherStudents from "./pages/teacher/TeacherStudents";
import TeacherResults from "./pages/teacher/TeacherResults";
import TeacherProfile from "./pages/teacher/TeacherProfile";

// Public landing page
import LandingPage from "./components/Loanding";

function ExamEditRoute() {
    const { examId } = useParams();
    return <ExamForm examId={examId} />;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public pages share one navbar */}
                <Route element={<PublicLayout />}>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<Login />} />
                </Route>

                {/* Password change - Teacher keeps navbar and sidebar */}
                <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
                    <Route path="/change-password" element={<TeacherLayout />}>
                        <Route index element={<ChangePassword />} />
                    </Route>
                </Route>

                {/* Student routes */}
                <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
                    <Route path="/student" element={<StudentLayout />}>
                        <Route index element={<AvailableExams />} />

                        <Route
                            path="exam/:examId/instructions"
                            element={<ExamInstructions />}
                        />

                        <Route
                            path="result/:attemptId"
                            element={<Result />}
                        />
                    </Route>

                    <Route
                        path="/student/exam/:examId/take"
                        element={<TakeExam />}
                    />
                </Route>

                {/* Admin routes */}
                <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />

                        <Route path="programs" element={<Programs />} />
                        <Route path="departements" element={<Department />} />

                        <Route path="students" element={<Students />} />

                        <Route
                            path="student-import"
                            element={<StudentImport />}
                        />

                        {/* Admin Question Management */}
                        <Route
                            path="questions"
                            element={<AdminQuestions />}
                        />

                        <Route
                            path="questions/new"
                            element={<QuestionForm />}
                        />

                        <Route
                            path="questions/edit/:questionId"
                            element={<QuestionForm />}
                        />

                        {/* Exam Management */}
                        <Route path="exams" element={<Exams />} />

                        <Route
                            path="exams/create"
                            element={<ExamForm />}
                        />

                        <Route
                            path="exams/edit/:examId"
                            element={<ExamEditRoute />}
                        />

                        <Route
                            path="exams/:examId/questions"
                            element={<ExamQuestions />}
                        />

                        <Route path="teachers" element={<Teachers />} />

                        <Route path="results" element={<ResultAdmin />} />

                        <Route
                            path="MaintenanceControl"
                            element={<MaintenanceControl />}
                        />
                    </Route>
                </Route>

                {/* Teacher routes */}
                <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
                    <Route path="/teacher" element={<TeacherLayout />}>
                        <Route index element={<TeacherDashboard />} />

                        <Route
                            path="students"
                            element={<TeacherStudents />}
                        />

                        <Route
                            path="questions"
                            element={<TeacherQuestions />}
                        />

                        <Route
                            path="questions/new"
                            element={<TeacherQuestionForm />}
                        />

                        <Route
                            path="questions/edit/:questionId"
                            element={<TeacherQuestionForm />}
                        />

                        <Route
                            path="results"
                            element={<TeacherResults />}
                        />

                        <Route
                            path="profile"
                            element={<TeacherProfile />}
                        />
                    </Route>
                </Route>

                {/* Unknown paths */}
                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
