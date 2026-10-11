import api from "../../pages/services/api";

// Get all questions - Admin
export const getAllQuestions = async () => {
    const response = await api.get("/questions");
    return response.data;
};

// Get one question - Admin
export const getQuestionById = async (id) => {
    const response = await api.get(`/questions/${id}`);
    return response.data;
};

// Create question - Admin
export const createQuestion = async (questionData) => {
    const response = await api.post("/questions", questionData);
    return response.data;
};

// Update question - Admin
export const updateQuestion = async (id, questionData) => {
    const response = await api.put(`/questions/${id}`, questionData);
    return response.data;
};

// Deactivate question - Admin
export const deactivateQuestion = async (id) => {
    const response = await api.patch(
        `/questions/${id}/deactivate`
    );
    return response.data;
};

// Activate question - Admin
export const activateQuestion = async (id) => {
    const response = await api.patch(
        `/questions/${id}/activate`
    );
    return response.data;
};