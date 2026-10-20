
import api from "./api";

// These endpoints must be implemented in the backend and protected
// so only Admin users can manage Academic Dean accounts.

export const getAllAcademicDeans = () =>
  api.get("/academic-deans");

export const createAcademicDean = (data) =>
  api.post("/academic-deans", data);

export const updateAcademicDeanStatus = (id, isActive) =>
  api.patch(`/academic-deans/${id}/status`, {
    is_active: isActive,
  });

export const resetAcademicDeanPassword = (id) =>
  api.patch(`/academic-deans/${id}/reset-password`);
