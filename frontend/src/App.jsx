
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
import AcademicDeanLayout from "./layouts/AcademicDeanLayout";
import TeacherLayout from "./layouts/TeacherLayout";
import AdminLayout from "./layouts/AdminLayout";

// Student pages
import AvailableExams from "./pages/student/AvailableExams";
import ExamInstructions from "./pages/student/ExamInstraction";
import TakeExam from "./pages/student/TakeExam";
import Result from "./pages/student/Result";

// Academic Dean pages
import AdminDashboard from "./pages/Academicdean/Dashboard";
import Exams from "./pages/Academicdean/Exam";
import ExamForm from "./pages/Academicdean/ExamForm";
import ExamQuestions from "./pages/Academicdean/ExamQuestions";
import AdminQuestions from "./pages/Academicdean/Question";
import QuestionForm from "./pages/Academicdean/QuestionForm";
import Programs from "./pages/Academicdean/Programs";
import Department from "./pages/Academicdean/Departments";
import ResultAdmin from "./pages/Academicdean/ResultAdmin";
import Students from "./pages/Academicdean/Students";
import StudentImport from "./pages/admin/StudentImport";
import TeacherAssignments from "./pages/Academicdean/TeacherAssignments";

// Admin pages
import AdminSystemDashboard from "./pages/admin/Dashboard";
import TeacherManagement from "./pages/admin/Teachers";
import AcademicDeans from "./pages/admin/AcademicDeans";
import MaintenanceControl from "./components/MaintenanceControl";

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
                {/* Public pages */}
                <Route element={<PublicLayout />}>
                    <Route
                        path="/"
                        element={<LandingPage />}
                    />

                    <Route
                        path="/login"
                        element={<Login />}
                    />
                </Route>

                {/* Password change for all authenticated roles */}
                <Route
                    element={
                        <ProtectedRoute
                            allowedRoles={[
                                "admin",
                                "academic_dean",
                                "teacher",
                                "student",
                            ]}
                        />
                    }
                >
                    <Route
                        path="/change-password"
                        element={<ChangePassword />}
                    />
                </Route>

                {/* Admin routes */}
                <Route
                    element={
                        <ProtectedRoute
                            allowedRoles={["admin"]}
                        />
                    }
                >
                    <Route
                        path="/admin"
                        element={<AdminLayout />}
                    >
                        {/* Default Admin page */}
                        <Route
                            index
                            element={<AdminSystemDashboard />}
                        />

                        {/* Explicit Dashboard URL */}
                        <Route
                            path="dashboard"
                            element={<AdminSystemDashboard />}
                        />

                        <Route
                            path="students"
                            element={<Students />}
                        />

                        <Route
                            path="student-import"
                            element={<StudentImport />}
                        />

                        <Route
                            path="teachers"
                            element={<TeacherManagement />}
                        />

                        <Route
                            path="academic-deans"
                            element={<AcademicDeans />}
                        />

                        <Route
                            path="maintenance"
                            element={<MaintenanceControl />}
                        />
                    </Route>
                </Route>

                {/* Student routes */}
                <Route
                    element={
                        <ProtectedRoute
                            allowedRoles={["student"]}
                        />
                    }
                >
                    <Route
                        path="/student"
                        element={<StudentLayout />}
                    >
                        <Route
                            index
                            element={<AvailableExams />}
                        />

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

                {/* Academic Dean routes */}
                <Route
                    element={
                        <ProtectedRoute
                            allowedRoles={["academic_dean"]}
                        />
                    }
                >
                    <Route
                        path="/academic-dean"
                        element={<AcademicDeanLayout />}
                    >
                        <Route
                            index
                            element={<AdminDashboard />}
                        />

                        <Route
                            path="programs"
                            element={<Programs />}
                        />

                        <Route
                            path="departements"
                            element={<Department />}
                        />

                        <Route
                            path="students"
                            element={<Students />}
                        />

                        <Route
                            path="student-import"
                            element={<StudentImport />}
                        />

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

                        <Route
                            path="exams"
                            element={<Exams />}
                        />

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

                        <Route
                            path="teachers"
                            element={<TeacherAssignments />}
                        />

                        <Route
                            path="results"
                            element={<ResultAdmin />}
                        />

                        <Route
                            path="MaintenanceControl"
                            element={<MaintenanceControl />}
                        />
                    </Route>
                </Route>

                {/* Teacher routes */}
                <Route
                    element={
                        <ProtectedRoute
                            allowedRoles={["teacher"]}
                        />
                    }
                >
                    <Route
                        path="/teacher"
                        element={<TeacherLayout />}
                    >
                        <Route
                            index
                            element={<TeacherDashboard />}
                        />

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
