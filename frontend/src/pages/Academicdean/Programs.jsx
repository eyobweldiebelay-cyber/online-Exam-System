
import { useCallback, useEffect, useState } from "react";
import {
  getAllPrograms,
  createProgram,
  updateProgram,
  deactivateProgram,
} from "../services/programService";
import api from "../services/api";
import "../../css/academicdean/program.css";

const initialForm = {
  name: "",
  program_type: "degree",
  status: "active",
};

// Retained from your existing frontend.
const knownDepartments = {
  degree: ["Information Technology", "Computer Science", "Management"],
  diploma: ["Nursing", "Database", "Pharmacy"],
};

function getList(data, keys) {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  // Support common wrapped API responses, such as { data: { students: [] } }.
  if (data?.data && typeof data.data === "object") {
    if (Array.isArray(data.data)) return data.data;

    for (const key of keys) {
      if (Array.isArray(data.data?.[key])) {
        return data.data[key];
      }
    }
  }

  return null;
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function departmentBelongsToProgram(department, program) {
  const departmentProgramId =
    department.program_id ??
    department.programId ??
    department.program?.id;

  if (departmentProgramId != null) {
    return Number(departmentProgramId) === Number(program.id);
  }

  const departmentProgramType =
    department.program_type ??
    department.programType ??
    department.program?.program_type ??
    department.program?.type;

  if (departmentProgramType) {
    return (
      normalize(departmentProgramType) ===
      normalize(program.program_type)
    );
  }

  const departmentProgramName =
    department.program_name ??
    department.programName ??
    department.program?.name;

  if (departmentProgramName) {
    return normalize(departmentProgramName) === normalize(program.name);
  }

  // Keep the fallback from the original frontend for existing records
  // that do not expose an explicit program relationship.
  const name = normalize(department.name);

  return (knownDepartments[normalize(program.program_type)] || []).some(
    (knownName) => normalize(knownName) === name
  );
}

function getStudentDepartmentId(student) {
  return (
    student.department_id ??
    student.departmentId ??
    student.department?.id ??
    null
  );
}

function Programs() {
  const [programs, setPrograms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [students, setStudents] = useState([]);

  const [departmentDataAvailable, setDepartmentDataAvailable] =
    useState(false);
  const [studentDataAvailable, setStudentDataAvailable] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled([
        getAllPrograms(),
        api.get("/departments"),
        api.get("/students"),
      ]);

      const [programResult, departmentResult, studentResult] = results;

      if (programResult.status === "fulfilled") {
        const programList = getList(programResult.value, [
          "programs",
          "data",
          "items",
        ]);

        setPrograms(programList || []);

        if (!programList) {
          setError("The programs API returned an unexpected response.");
        }
      } else {
        setPrograms([]);
        setError(
          programResult.reason?.response?.data?.message ||
            "Unable to load programs."
        );
      }

      if (departmentResult.status === "fulfilled") {
        const departmentList = getList(departmentResult.value.data, [
          "departments",
          "data",
          "items",
        ]);

        setDepartments(departmentList || []);
        setDepartmentDataAvailable(Array.isArray(departmentList));

        if (!departmentList) {
          setError((current) =>
            current ||
            "The departments API returned an unexpected response."
          );
        }
      } else {
        setDepartments([]);
        setDepartmentDataAvailable(false);
        setError((current) =>
          current ||
          departmentResult.reason?.response?.data?.message ||
          "Unable to load departments."
        );
      }

      if (studentResult.status === "fulfilled") {
        const studentList = getList(studentResult.value.data, [
          "students",
          "data",
          "items",
        ]);

        setStudents(studentList || []);
        setStudentDataAvailable(Array.isArray(studentList));

        if (!studentList) {
          setError((current) =>
            current ||
            "The students API returned an unexpected response."
          );
        }
      } else {
        setStudents([]);
        setStudentDataAvailable(false);
        setError((current) =>
          current ||
          studentResult.reason?.response?.data?.message ||
          "Unable to load students."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load academic information."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(initialForm);
    setError("");
    setSuccess("");
    setFormOpen(true);
  };

  const openEditForm = (program) => {
    setEditingId(program.id);
    setForm({
      name: program.name || "",
      program_type: program.program_type || "degree",
      status: program.status || "active",
    });
    setError("");
    setSuccess("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(initialForm);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const name = form.name.trim();

    if (!name) {
      setError("Enter a program name.");
      return;
    }

    try {
      setSaving(true);

      if (editingId !== null) {
        await updateProgram(editingId, {
          name,
          program_type: form.program_type,
          status: form.status,
        });

        setSuccess("Program updated successfully.");
      } else {
        await createProgram({
          name,
          program_type: form.program_type,
        });

        setSuccess("Program created successfully.");
      }

      closeForm();
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save the program."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (program) => {
    const confirmed = window.confirm(
      `Deactivate ${program.name}? This does not permanently delete it.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await deactivateProgram(program.id);
      setSuccess(`${program.name} was deactivated.`);
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to deactivate this program."
      );
    }
  };

  const getProgramDepartments = (program) =>
    departments.filter((department) =>
      departmentBelongsToProgram(department, program)
    );

  const getDepartmentStudentCount = (department) => {
    if (!studentDataAvailable) return null;

    return students.filter(
      (student) =>
        Number(getStudentDepartmentId(student)) === Number(department.id)
    ).length;
  };

  const getProgramStudentCount = (program) => {
    if (!studentDataAvailable || !departmentDataAvailable) return null;

    const departmentIds = new Set(
      getProgramDepartments(program).map((department) =>
        String(department.id)
      )
    );

    return students.filter((student) =>
      departmentIds.has(String(getStudentDepartmentId(student)))
    ).length;
  };

  const getProgramTypeStudentCount = (programType) => {
    if (!studentDataAvailable || !departmentDataAvailable) return null;

    const departmentIds = new Set();

    programs
      .filter(
        (program) =>
          normalize(program.program_type) === normalize(programType)
      )
      .forEach((program) => {
        getProgramDepartments(program).forEach((department) => {
          departmentIds.add(String(department.id));
        });
      });

    return students.filter((student) =>
      departmentIds.has(String(getStudentDepartmentId(student)))
    ).length;
  };

  const degreeStudentCount = getProgramTypeStudentCount("degree");
  const diplomaStudentCount = getProgramTypeStudentCount("diploma");

  return (
    <main className="programs-page">
      <header className="programs-heading">
        <div>
          <div className="programs-eyebrow">ACADEMIC MANAGEMENT</div>
          <h1>Program Management</h1>
          <p>
            Manage academic programs and view their departments and students.
          </p>
        </div>

        <button
          type="button"
          className="program-refresh-btn"
          onClick={loadData}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </header>

      {error && (
        <div className="program-alert program-alert-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="program-alert program-alert-success" role="status">
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess("")}>
            ×
          </button>
        </div>
      )}

      <section className="program-overview">
        <div>
          <span className="program-overview-number">
            {programs.length}
          </span>
          <span className="program-overview-label">Academic programs</span>
        </div>

        <div>
          <span className="program-overview-number">
            {departmentDataAvailable ? departments.length : "—"}
          </span>
          <span className="program-overview-label">Departments</span>
        </div>

        <div>
          <span className="program-overview-number">
            {studentDataAvailable ? students.length : "—"}
          </span>
          <span className="program-overview-label">Total students</span>
        </div>

        <div>
          <span className="program-overview-number">
            {degreeStudentCount === null ? "—" : degreeStudentCount}
          </span>
          <span className="program-overview-label">Degree students</span>
        </div>

        <div>
          <span className="program-overview-number">
            {diplomaStudentCount === null ? "—" : diplomaStudentCount}
          </span>
          <span className="program-overview-label">Diploma students</span>
        </div>

        <button
          type="button"
          className="program-primary-btn"
          onClick={openCreateForm}
        >
          + Add Program
        </button>
      </section>

      {formOpen && (
        <section className="program-form-card">
          <div className="program-section-heading">
            <div>
              <h2>{editingId !== null ? "Edit Program" : "Add Program"}</h2>
              <p>Enter the program details below.</p>
            </div>

            <button
              type="button"
              className="program-close-btn"
              onClick={closeForm}
              aria-label="Close form"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="program-form-grid">
              <div className="program-field">
                <label htmlFor="program-name">Program Name</label>
                <input
                  id="program-name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Degree"
                  maxLength={150}
                  required
                />
              </div>

              <div className="program-field">
                <label htmlFor="program-type">Program Type</label>
                <select
                  id="program-type"
                  name="program_type"
                  value={form.program_type}
                  onChange={handleChange}
                  required
                >
                  <option value="degree">Degree</option>
                  <option value="diploma">Diploma</option>
                </select>
              </div>

              {editingId !== null && (
                <div className="program-field">
                  <label htmlFor="program-status">Status</label>
                  <select
                    id="program-status"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}
            </div>

            <div className="program-form-actions">
              <button
                type="submit"
                className="program-primary-btn"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Save Changes"
                    : "Create Program"}
              </button>

              <button
                type="button"
                className="program-cancel-btn"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="program-list-section">
        <div className="program-section-heading">
          <div>
            <h2>Academic Programs</h2>
            <p>Each program and its associated academic departments.</p>
          </div>

          <span className="program-record-count">
            {programs.length} programs
          </span>
        </div>

        {loading ? (
          <div className="program-message">
            Loading academic information...
          </div>
        ) : programs.length === 0 ? (
          <div className="program-message">
            No programs found. Add a program to get started.
          </div>
        ) : (
          <div className="program-cards">
            {programs.map((program) => {
              const programDepartments = getProgramDepartments(program);
              const departmentCount = programDepartments.length;
              const studentCount = getProgramStudentCount(program);

              return (
                <article className="program-card" key={program.id}>
                  <div className="program-card-header">
                    <div className="program-card-symbol">
                      {normalize(program.program_type) === "diploma"
                        ? "D"
                        : "B"}
                    </div>

                    <div className="program-card-title">
                      <h3>{program.name}</h3>
                      <span>
                        {normalize(program.program_type) === "degree"
                          ? "Degree program"
                          : "Diploma program"}
                      </span>
                    </div>

                    <span
                      className={`program-status-badge ${program.status}`}
                    >
                      {program.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="program-card-summary">
                    <div>
                      <strong>
                        {departmentDataAvailable ? departmentCount : "—"}
                      </strong>
                      <span>Departments</span>
                    </div>

                    <div>
                      <strong>
                        {studentCount === null ? "—" : studentCount}
                      </strong>
                      <span>Students</span>
                    </div>
                  </div>

                  <div className="program-departments">
                    <h4>Departments</h4>

                    {!departmentDataAvailable ? (
                      <p className="program-muted">
                        Department information could not be loaded.
                      </p>
                    ) : departmentCount === 0 ? (
                      <p className="program-muted">
                        No departments linked to this program.
                      </p>
                    ) : (
                      <ul>
                        {programDepartments.map((department) => {
                          const count = getDepartmentStudentCount(department);

                          return (
                            <li key={department.id}>
                              <span>{department.name}</span>
                              <span className="program-department-count">
                                {count === null
                                  ? "Students: —"
                                  : `${count} students`}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  <div className="program-card-footer">
                    <span className="program-card-id">
                      Program ID: {program.id}
                    </span>

                    <div className="program-actions">
                      <button
                        type="button"
                        className="program-edit-btn"
                        onClick={() => openEditForm(program)}
                      >
                        Edit
                      </button>

                      {program.status === "active" && (
                        <button
                          type="button"
                          className="program-deactivate-btn"
                          onClick={() => handleDeactivate(program)}
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default Programs;
