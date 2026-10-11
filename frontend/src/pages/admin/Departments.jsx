
import { useEffect, useState } from "react";
import api from "../../pages/services/api";

const Department = () => {
    const [departments, setDepartments] = useState([]);
    const [programs, setPrograms] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        program_id: "",
        name: "",
        status: "active"
    });

    // ===============================
    // LOAD DEPARTMENTS AND PROGRAMS
    // ===============================
    const loadData = async () => {
        setLoading(true);
        setError("");

        try {
            const [departmentResponse, programResponse] =
                await Promise.all([
                    api.get("/departments"),
                    api.get("/programs")
                ]);

            const departmentData = departmentResponse.data;
            const programData = programResponse.data;

            setDepartments(
                Array.isArray(departmentData)
                    ? departmentData
                    : departmentData.departments || []
            );

            setPrograms(
                Array.isArray(programData)
                    ? programData
                    : programData.programs || []
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to load departments and programs."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // ===============================
    // HANDLE FORM INPUTS
    // ===============================
    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    // ===============================
    // RESET FORM
    // ===============================
    const resetForm = () => {
        setFormData({
            program_id: "",
            name: "",
            status: "active"
        });

        setEditingId(null);
        setShowForm(false);
        setError("");
    };

    // ===============================
    // OPEN CREATE FORM
    // ===============================
    const handleAdd = () => {
        resetForm();
        setShowForm(true);
    };

    // ===============================
    // OPEN EDIT FORM
    // ===============================
    const handleEdit = (department) => {
        setError("");
        setSuccess("");

        setEditingId(department.id);

        setFormData({
            program_id: String(department.program_id || ""),
            name: department.name || "",
            status: department.status || "active"
        });

        setShowForm(true);
    };

    // ===============================
    // CREATE OR UPDATE DEPARTMENT
    // ===============================
    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!formData.program_id || !formData.name.trim()) {
            setError("Please select a program and enter a department name.");
            return;
        }

        setSaving(true);

        try {
            const payload = {
                program_id: Number(formData.program_id),
                name: formData.name.trim(),
                status: formData.status
            };

            if (editingId) {
                await api.put(`/departments/${editingId}`, payload);
                setSuccess("Department updated successfully.");
            } else {
                await api.post("/departments", payload);
                setSuccess("Department created successfully.");
            }

            resetForm();
            await loadData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to save department."
            );
        } finally {
            setSaving(false);
        }
    };

    // ===============================
    // DELETE DEPARTMENT
    // ===============================
    const handleDelete = async (department) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${department.name}"?`
        );

        if (!confirmed) return;

        setError("");
        setSuccess("");

        try {
            await api.delete(`/departments/${department.id}`);

            setSuccess("Department deleted successfully.");
            await loadData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to delete department. It may be in use."
            );
        }
    };

    // ===============================
    // RENDER PAGE
    // ===============================
    return (
        <div className="admin-page department-page">
            <div className="page-header">
                <div>
                    <h1>Department Management</h1>
                    <p>Manage departments and their associated programs.</p>
                </div>

                <button
                    type="button"
                    onClick={handleAdd}
                    className="btn btn-primary"
                >
                    + Add Department
                </button>
            </div>

            {error && (
                <div className="alert alert-error" role="alert">
                    {error}
                </div>
            )}

            {success && (
                <div className="alert alert-success" role="status">
                    {success}
                </div>
            )}

            {showForm && (
                <section className="department-form-card">
                    <h2>
                        {editingId ? "Edit Department" : "Create Department"}
                    </h2>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="program_id">Program</label>

                            <select
                                id="program_id"
                                name="program_id"
                                value={formData.program_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Program</option>

                                {programs.map((program) => (
                                    <option
                                        key={program.id}
                                        value={program.id}
                                    >
                                        {program.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="name">Department Name</label>

                            <input
                                id="name"
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter department name"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="status">Status</label>

                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                required
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <div className="form-actions">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId
                                        ? "Update Department"
                                        : "Create Department"}
                            </button>

                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={resetForm}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </section>
            )}

            <section className="department-table-card">
                <div className="table-header">
                    <h2>All Departments</h2>
                    <span>{departments.length} departments</span>
                </div>

                {loading ? (
                    <p>Loading departments...</p>
                ) : departments.length === 0 ? (
                    <p>No departments found.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Program</th>
                                    <th>Department</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {departments.map((department) => {
                                    const program = programs.find(
                                        (item) =>
                                            Number(item.id) ===
                                            Number(department.program_id)
                                    );

                                    return (
                                        <tr key={department.id}>
                                            <td>{department.id}</td>

                                            <td>
                                                {department.program_name ||
                                                    program?.name ||
                                                    "-"}
                                            </td>

                                            <td>{department.name}</td>

                                            <td>
                                                <span
                                                    className={`status-badge ${
                                                        department.status ===
                                                        "active"
                                                            ? "status-active"
                                                            : "status-inactive"
                                                    }`}
                                                >
                                                    {department.status}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="table-actions">
                                                    <button
                                                        type="button"
                                                        className="btn btn-edit"
                                                        onClick={() =>
                                                            handleEdit(department)
                                                        }
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn btn-delete"
                                                        onClick={() =>
                                                            handleDelete(
                                                                department
                                                            )
                                                        }
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
};

export default Department;
