
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GraduationCap,
  Search,
  UserPlus,
  RefreshCw,
  ShieldCheck,
  KeyRound,
  UserCheck,
  UserX,
  Copy,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";

import "../../css/admin/Teachers.css";
import {
  getAllAcademicDeans,
  createAcademicDean,
  updateAcademicDeanStatus,
  resetAcademicDeanPassword,
} from "../services/academicDean";

const getResponseData = (response) => response?.data ?? response;

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  "Something went wrong. Please try again.";

const getTemporaryPassword = (data) =>
  data?.temporary_password ||
  data?.temporaryPassword ||
  data?.tempPassword ||
  data?.password ||
  data?.data?.temporary_password ||
  data?.data?.temporaryPassword ||
  data?.data?.password ||
  "";

const getDeanUsername = (dean) =>
  dean?.username || dean?.user?.username || "Unknown";

const getDeanName = (dean) =>
  dean?.full_name ||
  dean?.fullName ||
  dean?.name ||
  dean?.user?.full_name ||
  dean?.user?.name ||
  "";

const getDeanId = (dean) =>
  dean?.id ?? dean?.user_id ?? dean?.user?.id;

const isDeanActive = (dean) => {
  const value =
    dean?.is_active ??
    dean?.isActive ??
    dean?.active;

  if (value !== undefined && value !== null) {
    return value === true || value === 1 || value === "1";
  }

  return String(dean?.status || "").toLowerCase() === "active";
};

const getDeanList = (response) => {
  const data = getResponseData(response);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.academicDeans)) return data.academicDeans;
  if (Array.isArray(data?.academic_deans)) return data.academic_deans;
  if (Array.isArray(data?.deans)) return data.deans;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.data)) return data.data;

  return [];
};

export default function AcademicDeans() {
  const [deans, setDeans] = useState([]);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [workingId, setWorkingId] = useState(null);
  const [resettingId, setResettingId] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loadDeans = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getAllAcademicDeans();
      setDeans(getDeanList(response));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeans();
  }, [loadDeans]);

  const stats = useMemo(() => {
    const active = deans.filter(isDeanActive).length;

    return {
      total: deans.length,
      active,
      inactive: deans.length - active,
    };
  }, [deans]);

  const filteredDeans = useMemo(() => {
    const query = search.trim().toLowerCase();

    return deans.filter((dean) => {
      const matchesSearch =
        !query ||
        getDeanUsername(dean).toLowerCase().includes(query) ||
        getDeanName(dean).toLowerCase().includes(query) ||
        String(getDeanId(dean) ?? "").includes(query);

      const active = isDeanActive(dean);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && active) ||
        (statusFilter === "inactive" && !active);

      return matchesSearch && matchesStatus;
    });
  }, [deans, search, statusFilter]);

  const handleCreate = async (event) => {
    event.preventDefault();

    const cleanName = fullName.trim();
    const cleanUsername = username.trim();

    if (!cleanName) {
      setError("Enter the Academic Dean's full name.");
      return;
    }

    if (!cleanUsername) {
      setError("Enter a username for the Academic Dean account.");
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");
    setTemporaryPassword("");
    setShowPassword(false);

    try {
      const response = await createAcademicDean({
        full_name: cleanName,
        username: cleanUsername,
      });

      const data = getResponseData(response);
      const password = getTemporaryPassword(data);

      setFullName("");
      setUsername("");

      setMessage(
        data?.message ||
          "Academic Dean account created successfully."
      );

      if (password) {
        setTemporaryPassword(password);
      }

      await loadDeans();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (dean) => {
    const id = getDeanId(dean);

    if (id == null) {
      setError("This account does not contain a valid user ID.");
      return;
    }

    const currentlyActive = isDeanActive(dean);
    const action = currentlyActive ? "deactivate" : "activate";

    if (
      !window.confirm(
        `Are you sure you want to ${action} ${getDeanUsername(dean)}?`
      )
    ) {
      return;
    }

    setWorkingId(id);
    setError("");
    setMessage("");

    try {
      const response = await updateAcademicDeanStatus(
        id,
        !currentlyActive
      );

      const data = getResponseData(response);

      setMessage(
        data?.message ||
          `Academic Dean account ${action}d successfully.`
      );

      await loadDeans();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setWorkingId(null);
    }
  };

  const handleResetPassword = async (dean) => {
    const id = getDeanId(dean);

    if (id == null) {
      setError("This account does not contain a valid user ID.");
      return;
    }

    if (
      !window.confirm(
        `Reset the password for ${getDeanUsername(dean)}?`
      )
    ) {
      return;
    }

    setResettingId(id);
    setError("");
    setMessage("");
    setTemporaryPassword("");
    setShowPassword(false);

    try {
      const response = await resetAcademicDeanPassword(id);
      const data = getResponseData(response);
      const password = getTemporaryPassword(data);

      if (password) {
        setTemporaryPassword(password);
        setMessage(data?.message || "Password reset successfully.");
      } else {
        setMessage(
          (data?.message || "Password reset successfully.") +
            " The server did not return a temporary password."
        );
      }

      await loadDeans();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setResettingId(null);
    }
  };

  const handleCopyPassword = async () => {
    if (!temporaryPassword) return;

    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setMessage("Temporary password copied to clipboard.");
      setError("");
    } catch {
      setError(
        "Could not copy automatically. Select and copy the password manually."
      );
    }
  };

  return (
    <section className="admin-teachers-page">
      <header className="admin-teachers-header">
        <div className="admin-teachers-heading">
          <span className="admin-teachers-eyebrow">
            ADMINISTRATION
          </span>

          <div className="admin-teachers-title-row">
            <span className="teacher-heading-icon">
              <GraduationCap size={26} />
            </span>

            <div>
              <h1>Academic Dean Account Management</h1>
              <p>
                Create and manage Academic Dean login accounts.
                Academic responsibilities are managed separately.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="teacher-refresh-button"
          onClick={loadDeans}
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={loading ? "teacher-spin" : ""}
          />
          Refresh
        </button>
      </header>

      <div className="teacher-summary-grid">
        <article className="teacher-summary-card">
          <span className="teacher-summary-icon teacher-summary-icon--blue">
            <GraduationCap size={22} />
          </span>
          <div>
            <p>Total Academic Deans</p>
            <strong>{stats.total}</strong>
          </div>
        </article>

        <article className="teacher-summary-card">
          <span className="teacher-summary-icon teacher-summary-icon--green">
            <UserCheck size={22} />
          </span>
          <div>
            <p>Active Accounts</p>
            <strong>{stats.active}</strong>
          </div>
        </article>

        <article className="teacher-summary-card">
          <span className="teacher-summary-icon teacher-summary-icon--orange">
            <UserX size={22} />
          </span>
          <div>
            <p>Inactive Accounts</p>
            <strong>{stats.inactive}</strong>
          </div>
        </article>
      </div>

      {error && (
        <div className="teacher-alert teacher-alert-error" role="alert">
          <AlertCircle size={19} />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {message && (
        <div
          className="teacher-alert teacher-alert-success"
          role="status"
        >
          <CheckCircle size={19} />
          <span>{message}</span>
          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      {temporaryPassword && (
        <section className="teacher-temporary-password">
          <div className="teacher-password-heading">
            <KeyRound size={20} />
            <div>
              <strong>Temporary password</strong>
              <p>
                Provide this password securely to the account holder.
                They should change it at first login.
              </p>
            </div>
          </div>

          <div className="teacher-password-copy-row">
            <code>
              {showPassword
                ? temporaryPassword
                : "•".repeat(
                    Math.min(temporaryPassword.length, 16)
                  )}
            </code>

            <button
              type="button"
              className="teacher-action-neutral"
              onClick={() => setShowPassword((value) => !value)}
              title={showPassword ? "Hide password" : "Show password"}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff size={17} />
              ) : (
                <Eye size={17} />
              )}
            </button>

            <button
              type="button"
              className="teacher-action-neutral"
              onClick={handleCopyPassword}
            >
              <Copy size={16} />
              Copy
            </button>
          </div>
        </section>
      )}

      <div className="teacher-management-grid">
        <section className="teacher-panel teacher-form-panel">
          <div className="teacher-section-heading">
            <span className="teacher-section-icon">
              <UserPlus size={21} />
            </span>
            <div>
              <h2>Create Academic Dean Account</h2>
              <p className="teacher-panel-description">
                Create a login account with the Academic Dean role.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreate}>
            <div className="teacher-form-grid">
              <div className="teacher-form-field">
                <label htmlFor="academic-dean-full-name">
                  Full Name
                </label>
                <input
                  id="academic-dean-full-name"
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Enter full name"
                  autoComplete="name"
                  maxLength={200}
                  required
                />
              </div>

              <div className="teacher-form-field">
                <label htmlFor="academic-dean-username">
                  Username
                </label>
                <input
                  id="academic-dean-username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Enter a unique username"
                  autoComplete="off"
                  maxLength={100}
                  required
                />
              </div>
            </div>

            <p className="teacher-form-help">
              A temporary password is generated by the backend.
              The account should require a password change at first login.
            </p>

            <div className="teacher-form-actions">
              <button
                type="submit"
                className="teacher-primary-button"
                disabled={submitting}
              >
                <UserPlus size={17} />
                {submitting ? "Creating account..." : "Create Academic Dean"}
              </button>
            </div>
          </form>
        </section>

        <section className="teacher-panel teacher-list-panel">
          <div className="teacher-list-heading">
            <div>
              <h2>Academic Dean Accounts</h2>
              <p className="teacher-panel-description">
                Search accounts and manage their access.
              </p>
            </div>

            <span className="teacher-count">
              {filteredDeans.length} accounts
            </span>
          </div>

          <div className="teacher-toolbar">
            <div className="teacher-search">
              <Search size={18} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, username, or ID..."
                aria-label="Search Academic Dean accounts"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by account status"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {loading ? (
            <div className="teacher-empty-state">
              <RefreshCw size={22} className="teacher-spin" />
              <p>Loading Academic Dean accounts...</p>
            </div>
          ) : filteredDeans.length === 0 ? (
            <div className="teacher-empty-state">
              <ShieldCheck size={29} />
              <strong>No Academic Dean accounts found</strong>
              <p>
                Create an account or change the search and status filters.
              </p>
            </div>
          ) : (
            <div className="teacher-table-wrapper">
              <table className="teacher-table">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Status</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredDeans.map((dean, index) => {
                    const id = getDeanId(dean);
                    const active = isDeanActive(dean);
                    const name = getDeanName(dean);
                    const accountUsername = getDeanUsername(dean);

                    return (
                      <tr key={id ?? accountUsername ?? index}>
                        <td>
                          <div className="teacher-user">
                            <span className="teacher-user-avatar">
                              {(name || accountUsername)
                                .charAt(0)
                                .toUpperCase()}
                            </span>

                            <div>
                              <strong>
                                {name || accountUsername}
                              </strong>
                              {name && (
                                <small>@{accountUsername}</small>
                              )}
                              <small>ID: {id ?? "Not provided"}</small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`teacher-status ${
                              active ? "is-active" : "is-inactive"
                            }`}
                          >
                            {active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td>
                          <span className="teacher-role-label">
                            Academic Dean
                          </span>
                        </td>

                        <td>
                          <div className="teacher-row-actions">
                            <button
                              type="button"
                              className={
                                active
                                  ? "teacher-action-danger"
                                  : "teacher-action-success"
                              }
                              onClick={() => handleStatusChange(dean)}
                              disabled={workingId === id || id == null}
                            >
                              {workingId === id
                                ? "Saving..."
                                : active
                                  ? "Deactivate"
                                  : "Activate"}
                            </button>

                            <button
                              type="button"
                              className="teacher-action-neutral"
                              onClick={() => handleResetPassword(dean)}
                              disabled={resettingId === id || id == null}
                              title="Reset password"
                            >
                              <KeyRound size={15} />
                              {resettingId === id ? "Resetting..." : "Reset"}
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
    </section>
  );
}
