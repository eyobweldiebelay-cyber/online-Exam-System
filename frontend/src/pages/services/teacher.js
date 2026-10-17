
import api from "./api";

export const getAllTeachers = async () => {
    const response = await api.get("/teachers");
    return response.data;
};

export const createTeacher = async (teacherData) => {
    const response = await api.post("/teachers", teacherData);
    return response.data;
};

export const updateTeacher = async (teacherId, teacherData) => {
    const response = await api.put(`/teachers/${teacherId}`, teacherData);
    return response.data;
};

export const updateTeacherStatus = async (teacherId, isActive) => {
    const response = await api.patch(`/teachers/${teacherId}/status`, {
        is_active: isActive,
    });
    return response.data;
};
// Reset a Teacher's password (Admin only)
export const resetTeacherPassword = async (teacherId) => {
    const response = await api.patch(
        `/teachers/${teacherId}/reset-password`
    );

    return response.data;
};