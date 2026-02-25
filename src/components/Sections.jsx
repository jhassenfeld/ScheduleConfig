import { useState } from "react";

function generateGroupId(grade, name) {
  return `${grade}-${name}`.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
}

// ── Subject-based division: block group editor ───────────────────────────────

function BlockGroupEditor({ div, state, dispatch }) {
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGrade, setSelectedGrade] = useState(div.grades[0] || "");

  const divSubjects = state.subjects[div.id] || [];
  const groups = state.blockGroups[div.id] || [];

  // Get frequency for a subject from the SubjectRequirements tab
  const getDefaultFrequency = (subject) => {
    const req = state.subjectRequirements.find(
      (r) => r.division === div.id && r.subject === subject
    );
    return req ? req.blocksPerWeek : 0;
  };

  const handleAddGroup = () => {
    const name = newGroupName.trim();
    if (!name || !selectedGrade) return;
    const id = generateGroupId(selectedGrade, name);
    if (groups.some((g) => g.id === id)) return;

    dispatch({
      type: "ADD_BLOCK_GROUP",
      payload: {
        divisionId: div.id,
        group: { id, name, grade: selectedGrade, parallelSections: 3, subjects: [] },
      },
    });
    setNewGroupName("");
  };

  const toggleSubject = (groupId, subject) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    const existing = group.subjects.find((e) => e.subject === subject);
    let newSubjects;
    if (existing) {
      newSubjects = group.subjects.filter((e) => e.subject !== subject);
    } else {
      newSubjects = [
        ...group.subjects,
        { subject, frequency: getDefaultFrequency(subject) },
      ];
    }
    dispatch({
      type: "UPDATE_BLOCK_GROUP",
      payload: { divisionId: div.id, groupId, updates: { subjects: newSubjects } },
    });
  };

  const updateFrequency = (groupId, subject, frequency) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    const newSubjects = group.subjects.map((e) =>
      e.subject === subject ? { ...e, frequency } : e
    );
    dispatch({
      type: "UPDATE_BLOCK_GROUP",
      payload: { divisionId: div.id, groupId, updates: { subjects: newSubjects } },
    });
  };

  return (
    <>
      {divSubjects.length === 0 && (
        <div
          className="warning-item warning"
          style={{ marginBottom: 12, fontSize: "0.8rem" }}
        >
          Add subjects in the Subjects tab first, then create block groups here.
        </div>
      )}

      {/* Add group row */}
      <div className="form-row" style={{ marginBottom: 16 }}>
        <select
          className="form-select"
          value={selectedGrade}
          onChange={(e) => setSelectedGrade(e.target.value)}
        >
          {div.grades.map((g) => (
            <option key={g} value={g}>
              Grade {g.toUpperCase()}
            </option>
          ))}
        </select>
        <input
          type="text"
          className="form-input"
          placeholder='Block group name (e.g., "Purple")'
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddGroup()}
          style={{ maxWidth: 240 }}
        />
        <button className="btn btn-primary btn-sm" onClick={handleAddGroup}>
          Add Block Group
        </button>
      </div>

      {/* Groups as table per grade */}
      {div.grades.map((grade) => {
        const gradeGroups = groups.filter((g) => g.grade === grade);
        if (gradeGroups.length === 0) return null;

        return (
          <div key={grade} style={{ marginBottom: 24 }}>
            <div
              style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 8,
              }}
            >
              Grade {grade.toUpperCase()} — {gradeGroups.length} block group
              {gradeGroups.length !== 1 ? "s" : ""}
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="config-table" style={{ fontSize: "0.82rem" }}>
                <thead>
                  <tr>
                    <th style={{ minWidth: 100 }}>Block</th>
                    <th style={{ width: 60, textAlign: "center" }}>∥</th>
                    {divSubjects.map((subject) => (
                      <th
                        key={subject}
                        style={{ textAlign: "center", minWidth: 52 }}
                      >
                        {subject}
                      </th>
                    ))}
                    <th style={{ textAlign: "center", minWidth: 70 }}>Slots</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {gradeGroups.map((group) => {
                    const ps = group.parallelSections || 3;
                    const total = group.subjects.reduce(
                      (sum, e) => sum + (e.frequency || 0),
                      0
                    );
                    const target = ps * 5;
                    const isValid = total === target;
                    const isOver = total > target;

                    return (
                      <tr key={group.id}>
                        <td style={{ fontWeight: 700 }}>{group.name}</td>
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={ps}
                            onChange={(e) =>
                              dispatch({
                                type: "UPDATE_BLOCK_GROUP",
                                payload: {
                                  divisionId: div.id,
                                  groupId: group.id,
                                  updates: {
                                    parallelSections:
                                      parseInt(e.target.value) || 1,
                                  },
                                },
                              })
                            }
                            title="Parallel sections"
                            style={{
                              width: 40,
                              padding: "2px 4px",
                              border: "1px solid var(--border)",
                              borderRadius: 4,
                              fontSize: "0.8rem",
                              textAlign: "center",
                            }}
                          />
                        </td>
                        {divSubjects.map((subject) => {
                          const entry = group.subjects.find(
                            (e) => e.subject === subject
                          );
                          const isChecked = !!entry;
                          return (
                            <td
                              key={subject}
                              style={{ textAlign: "center", padding: "4px 2px" }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  gap: 2,
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() =>
                                    toggleSubject(group.id, subject)
                                  }
                                  style={{ cursor: "pointer" }}
                                />
                                {isChecked && (
                                  <input
                                    type="number"
                                    min={0}
                                    max={10}
                                    value={entry.frequency}
                                    onChange={(e) =>
                                      updateFrequency(
                                        group.id,
                                        subject,
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    title={`${subject}: times/week`}
                                    style={{
                                      width: 40,
                                      padding: "1px 3px",
                                      border: "1px solid var(--border)",
                                      borderRadius: 3,
                                      fontSize: "0.75rem",
                                      textAlign: "center",
                                    }}
                                  />
                                )}
                              </div>
                            </td>
                          );
                        })}
                        <td
                          style={{
                            textAlign: "center",
                            fontWeight: 700,
                            fontSize: "0.82rem",
                            color: isValid
                              ? "var(--success)"
                              : isOver
                              ? "var(--error-text)"
                              : "var(--warning)",
                          }}
                        >
                          {total}/{target}
                          {isValid ? " ✓" : ""}
                        </td>
                        <td>
                          <button
                            className="btn-icon"
                            title="Remove block group"
                            onClick={() =>
                              dispatch({
                                type: "REMOVE_BLOCK_GROUP",
                                payload: {
                                  divisionId: div.id,
                                  groupId: group.id,
                                },
                              })
                            }
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {groups.length === 0 && (
        <div className="empty-state" style={{ padding: "20px 0" }}>
          No block groups yet. Add a block group to define student cohorts.
        </div>
      )}

      {/* All generated sections summary */}
      {(() => {
        const divSections = state.sections.filter((s) => s.division === div.id);
        if (divSections.length === 0) return null;
        return (
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                marginBottom: 6,
                color: "var(--text-secondary)",
              }}
            >
              All Generated Sections ({divSections.length})
            </div>
            <div className="tag-list">
              {divSections.map((s) => (
                <span
                  key={s.id}
                  className="tag"
                  style={{ fontFamily: "monospace", fontSize: "0.78rem" }}
                >
                  {s.id}
                </span>
              ))}
            </div>
          </div>
        );
      })()}
    </>
  );
}

// ── Homeroom-based division: simple section adder ────────────────────────────

function HomeroomSectionEditor({ div, state, dispatch }) {
  const [grade, setGrade] = useState(div.grades[0] || "");
  const [label, setLabel] = useState("");

  const divSections = state.sections.filter((s) => s.division === div.id);

  const handleAdd = () => {
    const lbl = label.trim();
    if (!grade || !lbl) return;
    const id = `${grade}-${lbl}`;
    if (state.sections.some((s) => s.id === id)) return;
    dispatch({
      type: "ADD_SECTION",
      payload: { id, grade, division: div.id, subject: null, blockGroup: null },
    });
    setLabel("");
  };

  return (
    <>
      <div className="form-row" style={{ marginBottom: 12 }}>
        <select
          className="form-select"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
        >
          <option value="">Grade...</option>
          {div.grades.map((g) => (
            <option key={g} value={g}>
              {g.toUpperCase()}
            </option>
          ))}
        </select>
        <input
          type="text"
          className="form-input"
          placeholder='Label (e.g., "1", "2", "Blue")'
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          style={{ maxWidth: 180 }}
        />
        <span
          style={{
            fontSize: "0.8rem",
            color: "var(--text-secondary)",
            alignSelf: "center",
          }}
        >
          → <strong>{grade && label ? `${grade}-${label}` : "..."}</strong>
        </span>
        <button className="btn btn-primary btn-sm" onClick={handleAdd}>
          Add Section
        </button>
      </div>

      {divSections.length > 0 && (
        <table className="config-table">
          <thead>
            <tr>
              <th>Section ID</th>
              <th>Grade</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {divSections.map((section) => (
              <tr key={section.id}>
                <td style={{ fontWeight: 600, fontFamily: "monospace" }}>
                  {section.id}
                </td>
                <td>{section.grade.toUpperCase()}</td>
                <td>
                  <button
                    className="btn-icon"
                    onClick={() =>
                      dispatch({ type: "REMOVE_SECTION", payload: section.id })
                    }
                    title="Delete section"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {divSections.length === 0 && (
        <div className="empty-state" style={{ padding: "20px 0" }}>
          No sections yet.
        </div>
      )}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Sections({ state, dispatch, visibleDivisions }) {
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
        Define class sections for each division.{" "}
        <strong>Homeroom-based</strong> divisions use simple grade + label
        sections. <strong>Subject-based</strong> divisions use{" "}
        <em>block groups</em> — named cohorts of students (e.g., "Purple") with
        subjects and per-subject frequencies. Frequencies auto-populate from the
        Subject Frequencies tab.
      </p>

      {visibleDivisions.map((div) => {
        const divSections = state.sections.filter((s) => s.division === div.id);
        const isSubjectBased = div.sectionModel === "subject-based";

        return (
          <div key={div.id} className="division-card">
            <div className="division-card-header">
              <h3>
                {div.name}{" "}
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    fontWeight: 400,
                  }}
                >
                  ({isSubjectBased ? "subject-based" : "homeroom"})
                </span>
              </h3>
              <span
                style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}
              >
                {divSections.length} section
                {divSections.length !== 1 ? "s" : ""}
              </span>
            </div>

            {div.grades.length === 0 ? (
              <div className="empty-state" style={{ padding: "20px 0" }}>
                Add grades to this division in School Info first.
              </div>
            ) : isSubjectBased ? (
              <BlockGroupEditor div={div} state={state} dispatch={dispatch} />
            ) : (
              <HomeroomSectionEditor
                div={div}
                state={state}
                dispatch={dispatch}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
