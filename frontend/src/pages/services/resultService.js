import api from "./api";

// Get results for the logged-in student
export const getMyResults = async () => {
const response = await api.get("/results/my");
return response.data;
};

// Get one result belonging to the logged-in student
export const getMyResultByAttempt = async (attemptId) => {
if (!attemptId) {
throw new Error("Attempt ID is required");
}

const response = await api.get(
`/results/my/attempt/${attemptId}`
);

return response.data;
};

// Get all results for admin management.
// This requires a corresponding admin endpoint in the backend.
export const getAllResults = async (filters = {}) => {
const response = await api.get("/results/admin", {
params: filters,
});

return response.data;
};
