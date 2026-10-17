
import api from "./api";

export const getAllAcademicYears = async () => {
    const response = await api.get("/academic-years");
    const data = response.data;

    const years = Array.isArray(data)
        ? data
        : Array.isArray(data?.academicYears)
            ? data.academicYears
            : Array.isArray(data?.academic_years)
                ? data.academic_years
                : [];

    return years.filter(
        (year) => String(year.status).toLowerCase() === "active"
    );
};
