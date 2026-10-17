
import api from "./api";

// ===============================
// START EXAM ATTEMPT
// ===============================
export const startAttempt = async (examId) => {
    if (!examId) {
        throw new Error("Exam ID is required");
    }

    const response = await api.post(
        `/attempts/start/${examId}`
    );

    return response.data;
};

// ===============================
// SUBMIT EXAM ATTEMPT
// ===============================
export const submitAttempt = async (attemptId, answers) => {
    if (!attemptId) {
        throw new Error("Attempt ID is required");
    }

    const response = await api.post(
        `/attempts/submit/${attemptId}`,
        { answers }
    );

    return response.data;
};
