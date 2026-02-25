import { useState } from "react";

export default function Sections({ state, dispatch, visibleDivisions }) {
  const [formState, setFormState] = useState({});

  const getForm = (divId) =>
    formState[divId] || { grade: "", subject: "", label: "", batchCount: 1, batchLabels: [] };

  const updateForm = (divId, updates) => {
    setFormState({
      ...formState,
      [divId]: { ...getForm(divId), ...updates },
    });
  };

  const handleAddSection = (div) => {
    const form = getForm(div.id);
    if (!form.grade || !form.label) return;

    let sectionId;
    if (div.sectionModel === "subject-based") {
      if (!form.subject) return;
      sectionId = `${form.grade}-${form.subject}-${form.label}`;
    } else {
      sectionId = `${form.grade}-${form.label}`;
    }

    if (state.sections.some((s) => s.id === sectionId)) return;

    dispatch({
      type: "ADD_SECTION",
      payload: {
        id: sectionId,
        grade: form.grade,
        division: div.id,
        subject: div.sectionModel === "subject-based" ? form.subject : null,
      },
    });
    updateForm(div.id, { label: "" });
  };

  const handleBatchCreate = (div) => {
    const form = getForm(div.id);
    if (!form.grade || !form.subject) return;
    const labels = form.batchLabels.filter((l) => l.trim());
    if (labels.length === 0) return;

    const newSections = labels
      .map((label) => ({
        id: `${form.grade}-${form.subject}-${label.trim()}`,
        grade: form.grade,
        division: div.id,
        subject: form.subject,
      }))
      .filter((s) => !state.sections.some((existing) => existing.id === s.id));

    if (newSections.length > 0) {
      dispatch({ type: "ADD_SECTIONS", payload: newSections });
    }
    updateForm(div.id, { batchCount: 1, batchLabels: [] });
  };

  const [batchMode, setBatchMode] = useState({});

  if (visibleDivisions.length === 0) {
    return (
      <div className="tab-content">
        <h2>Sections</h2>
        <div className="empty-state">
          Add divisions in the School Info tab first.
        </div>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <h2>Sections</h2>
      <p className="tab-intro">
        Define class sections for each division. Homeroom-based divisions have
        sections per grade. Subject-based divisions have sections per grade per subject.
      </p>

      {visibleDivisions.map((div) => {
        const form = getForm(div.id);
        const divSections = state.sections.filter((s) => s.division === div.id);
        const divSubjects = state.subjects[div.id] || [];
        const isBatch = batchMode[div.id] || false;

        return (
          <div key={div.id} className="division-card">
            <div className="division-card-header">
              <h3>
                {div.name}{" "}
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 400 }}>
                  ({div.sectionModel === "subject-based" ? "subject-based" : "homeroom"})
                </span>
              </h3>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                {divSections.length} section{divSections.length !== 1 ? "s" : ""}
              </span>
            </div>

            {div.grades.length === 0 ? (
              <div className="empty-state" style={{ padding: "20px 0" }}>
                Add grades to this division in School Info first.
              </div>
            ) : (
              <>
                {div.sectionModel === "subject-based" && (
                  <div style={{ marginBottom: 8 }}>
                    <button
                      className={`btn btn-sm ${isBatch ? "btn-primary" : "btn-outline"}`}
                      onClick={() => setBatchMode({ ...batchMode, [div.id]: !isBatch })}
                    >
                      {isBatch ? "Single Add" : "Batch Add"}
                    </button>
                  </div>
                )}

                {/* Single add mode */}
                {!isBatch && (
                  <div className="form-row" style={{ marginBottom: 12 }}>
                    <select
                      className="form-select"
                      value={form.grade}
                      onChange={(e) => updateForm(div.id, { grade: e.target.value })}
                    >
                      <option value="">Grade...</option>
                      {div.grades.map((g) => (
                        <option key={g} value={g}>
                          {g.toUpperCase()}
                        </option>
                      ))}
                    </select>

                    {div.sectionModel === "subject-based" && (
                      <select
                        className="form-select"
                        value={form.subject}
                        onChange={(e) => updateForm(div.id, { subject: e.target.value })}
                      >
                        <option value="">Subject...</option>
                        {divSubjects.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    )}

                    <input
                      type="text"
                      className="form-input"
                      placeholder="Label (e.g., 1, Green, A)"
                      value={form.label}
                      onChange={(e) => updateForm(div.id, { label: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && handleAddSection(div)}
                      style={{ maxWidth: 180 }}
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleAddSection(div)}
                    >
                      Add
                    </button>
                  </div>
                )}

                {/* Batch add mode (subject-based only) */}
                {isBatch && div.sectionModel === "subject-based" && (
                  <div style={{ marginBottom: 12 }}>
                    <div className="form-row">
                      <select
                        className="form-select"
                        value={form.grade}
                        onChange={(e) => updateForm(div.id, { grade: e.target.value })}
                      >
                        <option value="">Grade...</option>
                        {div.grades.map((g) => (
                          <option key={g} value={g}>
                            {g.toUpperCase()}
                          </option>
                        ))}
                      </select>
                      <select
                        className="form-select"
                        value={form.subject}
                        onChange={(e) => updateForm(div.id, { subject: e.target.value })}
                      >
                        <option value="">Subject...</option>
                        {divSubjects.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <label style={{ fontSize: "0.8rem" }}>
                        Count:
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={form.batchCount}
                          onChange={(e) => {
                            const count = parseInt(e.target.value) || 1;
                            updateForm(div.id, {
                              batchCount: count,
                              batchLabels: Array.from(
                                { length: count },
                                (_, i) => form.batchLabels[i] || ""
                              ),
                            });
                          }}
                          style={{ width: 60, marginLeft: 4, padding: "4px 8px", border: "1px solid var(--border)", borderRadius: 4 }}
                        />
                      </label>
                    </div>
                    {form.batchCount > 0 && form.grade && form.subject && (
                      <div style={{ marginTop: 8 }}>
                        {Array.from({ length: form.batchCount }).map((_, i) => (
                          <div key={i} className="form-row">
                            <span style={{ fontSize: "0.8rem", minWidth: 120, color: "var(--text-secondary)" }}>
                              {form.grade}-{form.subject}-
                            </span>
                            <input
                              type="text"
                              className="form-input"
                              placeholder={`Label ${i + 1} (e.g., Green)`}
                              value={(form.batchLabels && form.batchLabels[i]) || ""}
                              onChange={(e) => {
                                const labels = [...(form.batchLabels || [])];
                                labels[i] = e.target.value;
                                updateForm(div.id, { batchLabels: labels });
                              }}
                              style={{ maxWidth: 150 }}
                            />
                          </div>
                        ))}
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleBatchCreate(div)}
                          style={{ marginTop: 8 }}
                        >
                          Create {form.batchCount} Sections
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Sections table */}
                {divSections.length > 0 && (
                  <table className="config-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Grade</th>
                        {div.sectionModel === "subject-based" && <th>Subject</th>}
                        <th style={{ width: 60 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {divSections.map((section) => (
                        <tr key={section.id}>
                          <td style={{ fontWeight: 600 }}>{section.id}</td>
                          <td>{section.grade.toUpperCase()}</td>
                          {div.sectionModel === "subject-based" && (
                            <td>{section.subject}</td>
                          )}
                          <td>
                            <button
                              className="btn-icon"
                              onClick={() =>
                                dispatch({
                                  type: "REMOVE_SECTION",
                                  payload: section.id,
                                })
                              }
                              title="Delete section"
                            >
                              x
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
