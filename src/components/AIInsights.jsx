import React, { useState } from "react";

const questions = [
  { label: "Total Employees", key: "total_employees" },
  { label: "Average Salary", key: "average_salary" },
  { label: "Top Department", key: "top_department" },
  { label: "Average Experience", key: "average_experience" },
  { label: "Active Employees", key: "active_employees" },
];

export default function AIInsights() {
  const [insights, setInsights] = useState(questions.map(q => ({ ...q, status: "idle", answer: "" })));
  const [running, setRunning] = useState(false);

  const runAnalysis = async () => {
    setRunning(true);
    setInsights(questions.map(q => ({ ...q, status: "loading", answer: "" })));

    try {
      // fire all requests in parallel
      const results = await Promise.all(
        questions.map(async (q) => {
          const res = await fetch(
            `http://localhost:8000/ai-insights/employees?question=${q.key}`
          );
          if (!res.ok) throw new Error(`Request failed (${res.status})`);
          const data = await res.json();
          return { ...q, status: "ready", answer: data.answer };
        })
      );
      setInsights(results);
    } catch (err) {
      setInsights(prev =>
        prev.map(item =>
          item.status === "loading"
            ? { ...item, status: "error", answer: err.message || "Error" }
            : item
        )
      );
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>AI Insights</h3>
          <p style={styles.subtitle}>One-click overview of key employee metrics</p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={running}
          style={{ ...styles.button, ...(running ? styles.buttonDisabled : {}) }}
        >
          {running ? "Analyzing…" : "Run Analysis"}
        </button>
      </div>

      <div style={styles.grid}>
        {insights.map(item => (
          <div key={item.key} style={styles.tile}>
            <div style={styles.tileLabel}>{item.label}</div>
            <div style={styles.tileAnswer}>
              {item.status === "idle" && <span style={styles.muted}>Not run yet</span>}
              {item.status === "loading" && <span style={styles.muted}>Analyzing…</span>}
              {item.status === "ready" && item.answer}
              {item.status === "error" && <span style={styles.error}>Error: {item.answer}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  card: {
    padding: 20,
    borderRadius: 12,
    background: "#fff",
    border: "1px solid #e5e7eb",
    boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { margin: 0, fontSize: 20, fontWeight: 700, color: "#111827" },
  subtitle: { margin: "4px 0 0", color: "#6b7280" },
  button: {
    padding: "10px 16px",
    borderRadius: 10,
    border: "none",
    color: "#fff",
    background: "linear-gradient(135deg,#4f46e5,#22c55e)",
    cursor: "pointer",
    fontWeight: 600,
    boxShadow: "0 4px 12px rgba(79,70,229,0.3)",
  },
  buttonDisabled: { opacity: 0.65, cursor: "not-allowed" },
  grid: {
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  },
  tile: {
    padding: 12,
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    minHeight: 90,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  tileLabel: { fontWeight: 700, color: "#111827", marginBottom: 6 },
  tileAnswer: { color: "#374151", lineHeight: 1.4, fontSize: 14 },
  muted: { color: "#9ca3af" },
  error: { color: "#dc2626" },
};