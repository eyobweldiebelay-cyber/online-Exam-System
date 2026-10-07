import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import Login from "./pages/auth/Login";
import StudentLayout from "./layouts/StudentLayoute";
import AvailableExams from "./pages/student/AvailableExams";
import ExamInstructions from "./pages/student/ExamInstraction";
import TakeExam from "./pages/student/TakeExam";
import Result from "./pages/student/Result";

function App() {
    return (
        <BrowserRouter>

            <Routes>

                <Route
                    path="/"
                    element={<Login />}
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

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
    path="exam/:examId/take"
    element={<TakeExam />}
/>
<Route
    path="/student/result/:attemptId"
    element={<Result />}
/>
                </Route>

            </Routes>

        </BrowserRouter>
    );
}

export default App;