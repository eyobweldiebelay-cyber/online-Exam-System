
import api from "./api";

// Get all exams
export const getAllExams = async () => {
    const response = await api.get("/exams");
    return response.data;
};

// Get one exam
export const getExamById = async (id) => {
    const response = await api.get(`/exams/${id}`);
    return response.data;
};

// Create exam
export const createExam = async (examData) => {
    const response = await api.post("/exams", examData);
    return response.data;
};

// Update exam
export const updateExam = async (id, examData) => {
    const response = await api.put(`/exams/${id}`, examData);
    return response.data;
};

// Delete exam — retained for compatibility with Exam.jsx
export const deleteExam = async (id) => {
    const response = await api.delete(`/exams/${id}`);
    return response.data;
};

// Publish exam
export const publishExam = async (id) => {
    const response = await api.patch(`/exams/${id}/publish`);
    return response.data;
};

// Get questions already assigned to an exam
export const getExamQuestions = async (examId) => {
    const response = await api.get(`/exams/${examId}/questions`);
    return response.data;
};

// Get active questions available for assignment
export const getAvailableQuestions = async (examId) => {
    const response = await api.get(
        `/exams/${examId}/available-questions`
    );
    return response.data;
};

// Assign questions to an exam
export const addQuestionsToExam = async (examId, questions) => {
    const formattedQuestions = questions.map((question, index) => {
        const questionId =
            typeof question === "object" && question !== null
                ? question.question_id ?? question.id
                : question;

        return {
            question_id: Number(questionId),
            question_order: index + 1,
        };
    });

    const response = await api.post(
        `/exams/${examId}/questions`,
        { questions: formattedQuestions }
    );

    return response.data;
};
