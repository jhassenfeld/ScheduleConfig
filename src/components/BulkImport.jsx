import { useState } from "react";

const IMPORT_TYPES = [
  { id: "teachers", label: "Teachers / Faculty" },
  { id: "subjects", label: "Subjects" },
];

const EXAMPLE_TEACHERS = `Name, Subject, Division
Sarah Cohen, Hebrew, Lower School
David Levy, Hebrew, Middle School
Rachel Green, Math, Middle School
Sarah Cohen, PE, Middle School`;

const EXAMPLE_SUBJECTS = `Division, Subject
Lower School, GS
Lower School, Hebrew
Lower School, PE
Middle School, Math
Middle School, Hebrew
Middle School, LA`;

function parseCsvRows(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) =>
      line.split(",").map((cell) => cell.trim())
    );
}

function findDivision(divisions, name) {
  const lower = name.toLowerCase();
  return divisions.find(
    (d) =>
      d.name.toLowerCase() === lower ||
      d.id.toLowerCase() === lower
  );
}

export default function BulkImport({ state, dispatch }) {
  const [importType, setImportType] = useState("teachers");
  const [textInput, setTextInput] = useState("");
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setTextInput(ev.target.result);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handlePreview = () => {
    setError(null);
    setPreview(null);

    const rows = parseCsvRows(textInput);
    if (rows.length === 0) {
      setError("No data found. Paste or upload a CSV.");
      return;
    }

    // Check if first row looks like a header
    const firstRow = rows[0];
    const isHeader =
      firstRow.some(
        (cell) =>
          /^(name|teacher|subject|division|dept)/i.test(cell)
      );
    const dataRows = isHeader ? rows.slice(1) : rows;

    if (dataRows.length === 0) {
      setError("Only a header row found. Add data rows.");
      return;
    }

    if (importType === "teachers") {
      const parsed = [];
      const errors = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (row.length < 3) {
          errors.push(`Row ${i + 1}: Expected 3 columns (Name, Subject, Division), got ${row.length}`);
          continue;
        }
        const [name, subject, divName] = row;
        const div = findDivision(state.divisions, divName);
        if (!div) {
          errors.push(`Row ${i + 1}: Division "${divName}" not found`);
          continue;
        }
        parsed.push({ name, subject, divisionId: div.id, divisionName: div.name });
      }

      setPreview({ type: "teachers", items: parsed, errors });
    } else if (importType === "subjects") {
      const parsed = [];
      const errors = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (row.length < 2) {
          errors.push(`Row ${i + 1}: Expected 2 columns (Division, Subject), got ${row.length}`);
          continue;
        }
        const [divName, subject] = row;
        const div = findDivision(state.divisions, divName);
        if (!div) {
          errors.push(`Row ${i + 1}: Division "${divName}" not found`);
          continue;
        }
        parsed.push({ subject, divisionId: div.id, divisionName: div.name });
      }

      setPreview({ type: "subjects", items: parsed, errors });
    }
  };

  const handleApply = () => {
    if (!preview) return;

    if (preview.type === "teachers") {
      for (const item of preview.items) {
        const id = item.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

        const existingIndex = state.teachers.findIndex((t) => t.id === id);
        if (existingIndex >= 0) {
          // Teacher exists — add division if not already there
          const existing = state.teachers[existingIndex];
          if (!existing.divisions.includes(item.divisionId)) {
            dispatch({
              type: "UPDATE_TEACHER",
              payload: {
                index: existingIndex,
                teacher: {
                  ...existing,
                  divisions: [...existing.divisions, item.divisionId],
                },
              },
            });
          }
        } else {
          // Also ensure the subject exists in this division
          const divSubjects = state.subjects[item.divisionId] || [];
          if (!divSubjects.includes(item.subject)) {
            dispatch({
              type: "ADD_SUBJECT",
              payload: { divisionId: item.divisionId, subject: item.subject },
            });
          }

          dispatch({
            type: "ADD_TEACHER",
            payload: {
              id,
              name: item.name,
              subject: item.subject,
              divisions: [item.divisionId],
              sectionIds: [],
            },
          });
        }
      }
    } else if (preview.type === "subjects") {
      for (const item of preview.items) {
        dispatch({
          type: "ADD_SUBJECT",
          payload: { divisionId: item.divisionId, subject: item.subject },
        });
      }
    }

    setTextInput("");
    setPreview(null);
    setError(null);
  };

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <h3>Bulk Import</h3>
      <p
        style={{
          fontSize: "0.85rem",
          color: "var(--text-secondary)",
          marginBottom: 12,
        }}
      >
        Paste a CSV or upload a file to bulk-import teachers or subjects.
      </p>

      <div className="form-row" style={{ marginBottom: 12 }}>
        <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>
          Import type:
        </label>
        {IMPORT_TYPES.map((t) => (
          <label
            key={t.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name="importType"
              checked={importType === t.id}
              onChange={() => {
                setImportType(t.id);
                setPreview(null);
                setError(null);
              }}
            />
            {t.label}
          </label>
        ))}
      </div>

      <div
        style={{
          fontSize: "0.75rem",
          color: "var(--text-secondary)",
          marginBottom: 8,
          background: "#F3F4F6",
          padding: "8px 12px",
          borderRadius: 6,
          fontFamily: "monospace",
          whiteSpace: "pre-line",
        }}
      >
        <strong>Example format:</strong>
        {"\n"}
        {importType === "teachers" ? EXAMPLE_TEACHERS : EXAMPLE_SUBJECTS}
      </div>

      <textarea
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
        placeholder={`Paste your ${importType} CSV here...`}
        style={{
          width: "100%",
          minHeight: 120,
          padding: "8px 12px",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          fontSize: "0.85rem",
          fontFamily: "monospace",
          resize: "vertical",
          marginBottom: 8,
        }}
      />

      <div className="form-row" style={{ gap: 8 }}>
        <label className="btn btn-outline btn-sm" style={{ cursor: "pointer" }}>
          Upload CSV
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
        </label>
        <button className="btn btn-secondary btn-sm" onClick={handlePreview}>
          Preview
        </button>
        {preview && preview.items.length > 0 && (
          <button className="btn btn-primary btn-sm" onClick={handleApply}>
            Import {preview.items.length} {preview.type}
          </button>
        )}
      </div>

      {error && (
        <div className="warning-item warning" style={{ marginTop: 8 }}>
          {error}
        </div>
      )}

      {preview && (
        <div style={{ marginTop: 12 }}>
          {preview.errors.length > 0 && (
            <div className="warning-list" style={{ marginBottom: 8 }}>
              {preview.errors.map((err, i) => (
                <div key={i} className="warning-item warning">
                  {err}
                </div>
              ))}
            </div>
          )}

          {preview.items.length > 0 && (
            <>
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                Ready to import ({preview.items.length} items):
              </div>
              <table className="config-table">
                <thead>
                  <tr>
                    {preview.type === "teachers" ? (
                      <>
                        <th>Name</th>
                        <th>Subject</th>
                        <th>Division</th>
                      </>
                    ) : (
                      <>
                        <th>Division</th>
                        <th>Subject</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {preview.items.map((item, i) => (
                    <tr key={i}>
                      {preview.type === "teachers" ? (
                        <>
                          <td style={{ fontWeight: 600 }}>{item.name}</td>
                          <td>{item.subject}</td>
                          <td>{item.divisionName}</td>
                        </>
                      ) : (
                        <>
                          <td>{item.divisionName}</td>
                          <td style={{ fontWeight: 600 }}>{item.subject}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
}
