
import { useEffect, useState } from "react";
import api from "../pages/services/api";
import "../css/admin/MaintenanceControl.css";

export default function MaintenanceControl() {
    const [enabled, setEnabled] = useState(false);
    const [message, setMessage] = useState(
        "The system is temporarily under maintenance."
    );
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadStatus() {
            try {
                const response = await api.get("/maintenance/status");
                const maintenance = response.data.maintenance;

                if (!cancelled) {
                    setEnabled(maintenance.enabled);
                    setMessage(maintenance.message);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                        "Could not load maintenance settings."
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadStatus();

        return () => {
            cancelled = true;
        };
    }, []);

    async function saveStatus(nextEnabled) {
        setSaving(true);
        setError("");
        setNotice("");

        try {
            const token = localStorage.getItem("token");

            const response = await api.post(
                "/maintenance",
                { enabled: nextEnabled, message },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setEnabled(response.data.maintenance.enabled);
            setMessage(response.data.maintenance.message);
            setNotice(response.data.message);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Could not update maintenance settings."
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <p>Loading maintenance settings...</p>;

    return (
        <section className="maintenance-control">
            <h2>System Maintenance</h2>
            <p>
                Control whether students can start new examinations.
                Existing examination submissions must remain available.
            </p>

            <label htmlFor="maintenance-message">
                Student notice
            </label>
            <textarea
                id="maintenance-message"
                value={message}
                maxLength={500}
                onChange={(event) => setMessage(event.target.value)}
                disabled={saving}
            />

            <p>
                Current status:{" "}
                <strong>
                    {enabled ? "Maintenance enabled" : "System available"}
                </strong>
            </p>

            {error && <p role="alert">{error}</p>}
            {notice && <p role="status">{notice}</p>}

            <button
                type="button"
                disabled={saving}
                onClick={() => saveStatus(!enabled)}
            >
                {saving
                    ? "Saving..."
                    : enabled
                        ? "Disable Maintenance"
                        : "Enable Maintenance"}
            </button>
        </section>
    );
}
