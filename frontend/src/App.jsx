
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    useParams
} from "react-router-dom";

import Login from "./pages/auth/Login";
import ChangePassword from "./account/ChangePassword";
import ProtectedRoute from "./components/ProtectedRoute";

import StudentLayout from "./layouts/StudentLayoute";
import AvailableExams from "./pages/student/AvailableExams";
import ExamInstructions from "./pages/student/ExamInstraction";
import TakeExam from "./pages/student/TakeExam";
import Result from "./pages/student/Result";

import AdminDashboard from "./pages/admin/Dashboard";
import Exams from "./pages/admin/Exam";
import ExamForm from "./pages/admin/ExamForm";
import ExamQuestions from "./pages/admin/ExamQuestions";
import Questions from "./pages/admin/Question";
import QuestionForm from "./pages/admin/QuestionForm";
import Programs from "./pages/admin/Programs";
import Department from "./pages/admin/Departments";
import ResultAdmin from "./pages/admin/ResultAdmin";
import StudentImport from "./pages/admin/StudentImport";

function ExamEditRoute() {
    const { examId } = useParams();
    return <ExamForm examId={examId} />;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public login pages */}
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />

                {/* Change password: accessible to logged-in users */}
                <Route
                    path="/change-password"
                    element={
                        <ProtectedRoute>
                            <ChangePassword />
                        </ProtectedRoute>
                    }
                />

                {/* Student pages: students only */}
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

                {/* Admin pages: admins only */}
                <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                    <Route path="/admin" element={<AdminDashboard />} />

                    <Route path="/admin/exams" element={<Exams />} />

                    <Route
                        path="/admin/exams/create"
                        element={<ExamForm />}
                    />

                    <Route
                        path="/admin/exams/edit/:examId"
                        element={<ExamEditRoute />}
                    />

                    <Route
                        path="/admin/exams/:examId/questions"
                        element={<ExamQuestions />}
                    />

                    <Route
                        path="/admin/questions"
                        element={<Questions />}
                    />

                    <Route
                        path="/admin/questions/create"
                        element={<QuestionForm />}
                    />

                    <Route
                        path="/admin/questions/edit/:questionId"
                        element={<QuestionForm />}
                    />

                    <Route path="/admin/programs" element={<Programs />} />

                    <Route
                        path="/admin/departements"
                        element={<Department />}
                    />

                    <Route path="/admin/results" element={<ResultAdmin />} />

                    <Route
                        path="/admin/student-import"
                        element={<StudentImport />}
                    />
                </Route>

                {/* Unknown paths */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
