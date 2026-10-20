
import api from "./api";

// Get all questions - Admin and Teacher
export const getAllQuestions = async () => {
    const response = await api.get("/questions");
    return response.data;
};

// Get one question with its options - Admin and Teacher
export const getQuestionById = async (id) => {
    if (!id) {
        throw new Error("Question ID is required.");
    }

    const response = await api.get(`/questions/${id}`);
    const data = response.data;

    // Support common backend response structures.
    if (data?.question) {
        return data;
    }

    if (data?.data?.question) {
        return data.data;
    }

    return data;
};

// Create question - preserve existing endpoint
export const createQuestion = async (questionData) => {
    const response = await api.post("/questions", questionData);
    return response.data;
};

// Update question - preserve existing endpoint
export const updateQuestion = async (id, questionData) => {
    if (!id) {
        throw new Error("Question ID is required.");
    }

    const response = await api.put(
        `/questions/${id}`,
        questionData
    );

    return response.data;
};

// Deactivate question
export const deactivateQuestion = async (id) => {
    if (!id) {
        throw new Error("Question ID is required.");
    }

    const response = await api.patch(
        `/questions/${id}/deactivate`
    );

    return response.data;
};

// Activate question
export const activateQuestion = async (id) => {
    if (!id) {
        throw new Error("Question ID is required.");
    }

    const response = await api.patch(
        `/questions/${id}/activate`
    );

    return response.data;
};

// Import questions from CSV or Excel
export const importQuestions = async (
    file,
    programId,
    departmentId,
    academicYearId
) => {
    if (!file) {
        throw new Error("Please select a question file.");
    }

    if (!programId || !departmentId || !academicYearId) {
        throw new Error(
            "Program, department, and academic year are required."
        );
    }

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
