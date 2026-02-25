import { useRef } from "react";
import { validateConfig, exportToJSON, importFromJSON } from "../utils/validation";

export default function ExportImport({ state, dispatch }) {
  const fileInputRef = useRef(null);
  const warnings = validateConfig(state);

  const handleExport = () => {
    const json = exportToJSON(state);
    const blob = new Blob([JSON.stringify(json, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "school_config.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        const imported = importFromJSON(json);
        dispatch({ type: "IMPORT_STATE", payload: imported });
      } catch (err) {
        alert("Failed to parse JSON file: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const totalSections = state.sections.length;
  const totalTeachers = state.teachers.length;
  const totalSubjects = Object.values(state.subjects).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  return (
    <div className="tab-content">
      <h2>Export / Import</h2>
      <p className="tab-intro">
        Review your configuration summary, check for warnings, and export or
        import your config file.
      </p>

      {/* Summary cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-value">{state.divisions.length}</div>
          <div className="card-label">Divisions</div>
        </div>
        <div className="summary-card">
          <div className="card-value">{totalSections}</div>
          <div className="card-label">Sections</div>
        </div>
        <div className="summary-card">
          <div className="card-value">{totalTeachers}</div>
          <div className="card-label">Teachers</div>
        </div>
        <div className="summary-card">
          <div className="card-value">{totalSubjects}</div>
          <div className="card-label">Subjects</div>
        </div>
      </div>

      {/* Per-division summary */}
      {state.divisions.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3>Division Details</h3>
          <table className="config-table">
            <thead>
              <tr>
                <th>Division</th>
                <th>Grades</th>
                <th>Sections</th>
                <th>Teachers</th>
                <th>Subjects</th>
                <th>Blocks</th>
              </tr>
            </thead>
            <tbody>
              {state.divisions.map((div) => {
                const divSections = state.sections.filter(
                  (s) => s.division === div.id
                );
                const divTeachers = state.teachers.filter(
                  (t) => t.division === div.id
                );
                const divSubjects = state.subjects[div.id] || [];
                const sched = state.masterSchedule[div.id];
                const blockCount = sched && sched.default ? sched.default.length : 0;

                return (
                  <tr key={div.id}>
                    <td style={{ fontWeight: 600 }}>{div.name}</td>
                    <td>{div.grades.map((g) => g.toUpperCase()).join(", ")}</td>
                    <td>{divSections.length}</td>
                    <td>{divTeachers.length}</td>
                    <td>{divSubjects.length}</td>
                    <td>{blockCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Validation */}
      <h3>Validation</h3>
      {warnings.length === 0 ? (
        <div className="warning-item success" style={{ marginBottom: 24 }}>
          Configuration looks complete. No warnings.
        </div>
      ) : (
        <div className="warning-list">
          {warnings.map((w, i) => (
            <div key={i} className={`warning-item ${w.type}`}>
              <span style={{ fontWeight: 600 }}>[{w.tab}]</span> {w.message}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="form-row" style={{ gap: 12 }}>
        <button className="btn btn-primary" onClick={handleExport}>
          Export JSON
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => fileInputRef.current?.click()}
        >
          Import JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}
