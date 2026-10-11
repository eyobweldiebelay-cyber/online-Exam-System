
import { useRef, useState } from "react";
import {
    Upload,
    FileSpreadsheet,
    Download,
    CheckCircle,
    AlertCircle
} from "lucide-react";
import api from "../services/api";
import "../../css/admin/student-import.css";

export default function StudentImport() {
    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [summary, setSummary] = useState(null);

    function handleFileChange(event) {
        const selectedFile = event.target.files?.[0];

        setError("");
        setSuccess("");
        setSummary(null);

        if (!selectedFile) {
            setFile(null);
            return;
        }

        const extension = selectedFile.name
            .split(".")
            .pop()
            .toLowerCase();

        if (!["csv", "xlsx"].includes(extension)) {
            setFile(null);
            event.target.value = "";
            setError("Select a CSV or Excel (.xlsx) file.");
            return;
        }

        if (selectedFile.size > 5 * 1024 * 1024) {
            setFile(null);
            event.target.value = "";
            setError("The file must be smaller than 5 MB.");
            return;
        }

        setFile(selectedFile);
    }

    function downloadTemplate() {
        const csv = [
            "student_id,first_name,last_name,department,academic_year",
            "STTEST901,Abebe,Bekele,Information Technology,Year 1",
            "STTEST902,Hana,Tadesse,Management,Year 2"
        ].join("\r\n");

        const blob = new Blob(["\uFEFF" + csv], {
            type: "text/csv;charset=utf-8;"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "student-import-template.csv";

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (!file) {
            setError("Please choose a CSV or Excel file first.");
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");
        setSummary(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await api.post(
                "/students/import",
                formData,
                {
                    responseType: "blob"
                }
            );

            const blob = response.data;
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;

            // Backend generates an actual Excel workbook.
            link.download = "student-import-results.xlsx";

            document.body.appendChild(link);
            link.click();
            link.remove();

            // Allow the browser time to begin downloading.
            window.setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);

            const created = Number(
                response.headers["x-students-created"] ?? 0
            );

            const failed = Number(
                response.headers["x-students-failed"] ?? 0
            );

            setSummary({ created, failed });

            setSuccess(
                "Import finished. The Excel results file has been downloaded. Share temporary credentials privately and store the file securely."
            );

            setFile(null);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (err) {
            let message =
                "Student import failed. Please try again.";

            if (err.response?.data instanceof Blob) {
                try {
                    const text = await err.response.data.text();
                    const data = JSON.parse(text);
                    message = data.message || message;
                } catch {
                    // Keep the default error message.
                }
            } else {
                message =
                    err.response?.data?.message ||
                    err.message ||
                    message;
            }

            setError(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="student-import-page">
            <div className="student-import-heading">
                <div>
                    <span className="student-import-eyebrow">
                        ADMINISTRATION
                    </span>

                    <h1>Bulk Student Import</h1>

                    <p>
                        Import student records from Excel or CSV and
                        generate temporary login credentials.
                    </p>
                </div>

                <div className="student-import-heading-icon">
                    <FileSpreadsheet size={27} />
                </div>
            </div>

            <div className="student-import-info">
                <div className="student-import-info-icon">
                    <AlertCircle size={21} />
                </div>

                <div>
                    <strong>Before you upload</strong>

                    <p>
                        Make sure each department already exists in
                        the system. Student IDs must be unique.
                        Newly imported students must change their
                        temporary password after logging in. The
                        downloaded results file contains sensitive
                        temporary passwords. Store it securely and
                        share each student's credentials privately.
                    </p>
                </div>
            </div>

            <div className="student-import-card">
                <div className="student-import-card-heading">
                    <div className="student-import-card-icon">
                        <Upload size={22} />
                    </div>

                    <div>
                        <h2>Upload student list</h2>
                        <p>
                            Supported formats: CSV and Excel (.xlsx)
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    className="student-import-template-button"
                    onClick={downloadTemplate}
                >
                    <Download size={17} />
                    Download CSV template
                </button>

                <form onSubmit={handleSubmit}>
                    <label
                        className="student-import-dropzone"
                        htmlFor="student-import-file"
                    >
                        <div className="student-import-upload-icon">
                            <Upload size={27} />
                        </div>

                        <strong>
                            {file
                                ? file.name
                                : "Choose a student list file"}
                        </strong>

                        <span>
                            {file
                                ? `${(file.size / 1024).toFixed(1)} KB selected`
                                : "Click here to select a .csv or .xlsx file"}
                        </span>

                        <span className="student-import-file-limit">
                            Maximum file size: 5 MB
                        </span>

                        <input
                            ref={fileInputRef}
                            id="student-import-file"
                            type="file"
                            accept=".csv,.xlsx"
                            onChange={handleFileChange}
                        />
                    </label>

                    {error && (
                        <div className="student-import-message error">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="student-import-message success">
                            <CheckCircle size={18} />
                            <span>{success}</span>
                        </div>
                    )}

                    {summary && (
                        <div className="student-import-summary">
                            <div>
                                <span>Students created</span>
                                <strong>{summary.created}</strong>
                            </div>

                            <div>
                                <span>Rows with errors</span>
                                <strong>{summary.failed}</strong>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="student-import-submit"
                        disabled={!file || loading}
                    >
                        <Upload size={18} />

                        {loading
                            ? "Importing students..."
                            : "Upload and import"}
                    </button>
                </form>
            </div>

            <div className="student-import-requirements">
                <h2>Required spreadsheet columns</h2>

                <p>
                    Your first row must contain column headings.
                    Use these column names:
                </p>

                <div className="student-import-columns">
                    <code>student_id</code>
                    <code>first_name</code>
                    <code>last_name</code>
                    <code>department</code>
                    <code>academic_year</code>
                </div>

                <p className="student-import-note">
                    The academic year is optional. The department
                    must match an existing department name, or you
                    can use a numeric department_id instead.
                </p>
            </div>
        </div>
    );
}
