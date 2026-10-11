import api from "../../pages/services/api";

// Get all departments - Admin
export const getAllDepartments = async () => {
    const response = await api.get("/departments");
    return response.data;
};