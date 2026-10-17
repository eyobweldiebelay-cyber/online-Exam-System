
import api from "./api";

// Get all questions - Admin and Teacher
export const getAllQuestions = async () => {
    const response = await api.get("/questions");
    return response.data;
};

// Get one question - Admin and Teacher
export const getQuestionById = async (id) => {
    const response = await api.get(`/questions/${id}`);
    return response.data;
};

// Create question - Teacher only
export const createQuestion = async (questionData) => {
    const response = await api.post("/questions", questionData);
    return response.data;
};

// Update question - Teacher only
export const updateQuestion = async (id, questionData) => {
    const response = await api.put(`/questions/${id}`, questionData);
    return response.data;
};

// Deactivate question - Teacher only
export const deactivateQuestion = async (id) => {
    const response = await api.patch(
        `/questions/${id}/deactivate`
    );
    return response.data;
};

// Activate question - Teacher only
export const activateQuestion = async (id) => {
    const response = await api.patch(
        `/questions/${id}/activate`
    );
    return response.data;
};

// Import questions from CSV or Excel - Teacher only
export const importQuestions = async (
    file,
    programId,
    departmentId,
    academicYearId
) => {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("program_id", String(programId));
    formData.append("department_id", String(departmentId));
    formData.append("academic_year_id", String(academicYearId));

    const response = await api.post(
        "/questions/import",
        formData
    );

    return response.data;
};
