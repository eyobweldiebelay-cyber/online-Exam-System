import api from "./api";

// Get all exams - Admin
export const getAllExams = async () => {
    const response = await api.get("/exams");
    return response.data;
};

// Get one exam - Admin
export const getExamById = async (id) => {
    const response = await api.get(`/exams/${id}`);
    return response.data;
};

// Create exam - Admin
export const createExam = async (examData) => {
    const response = await api.post("/exams", examData);
    return response.data;
};

// Update exam - Admin
export const updateExam = async (id, examData) => {
    const response = await api.put(`/exams/${id}`, examData);
    return response.data;
};

// Delete exam - Admin
export const deleteExam = async (id) => {
    const response = await api.delete(`/exams/${id}`);
    return response.data;
};

// Publish exam - Admin
export const publishExam = async (id) => {
    const response = await api.patch(`/exams/${id}/publish`);
    return response.data;
    
};

 // Get questions assigned to an exam - Admin
export const getExamQuestions = async (examId) => {
    const response = await api.get(`/exams/${examId}/questions`);
    return response.data;
};

// Assign questions to an exam - Admin
export const addQuestionsToExam = async (examId, questions) => {
    const response = await api.post(
        `/exams/${examId}/questions`,
        { questions }
    );
    return response.data;
};
