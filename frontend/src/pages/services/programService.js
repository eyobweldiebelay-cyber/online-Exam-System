
import api from "../../pages/services/api";

export const getAllPrograms = async () => {
  const response = await api.get("/programs");
  return response.data.programs;
};

export const getProgramById = async (id) => {
  const response = await api.get(`/programs/${id}`);
  return response.data.program;
};

export const createProgram = async (programData) => {
  const response = await api.post("/programs", programData);
  return response.data;
};

export const updateProgram = async (id, programData) => {
  const response = await api.put(`/programs/${id}`, programData);
  return response.data;
};

export const deactivateProgram = async (id) => {
  const response = await api.delete(`/programs/${id}`);
  return response.data;
};