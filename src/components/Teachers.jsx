import { useState } from "react";

export default function Teachers({ state, dispatch, visibleDivisions }) {
  const [formState, setFormState] = useState({});
  const [expanded, setExpanded] = useState({});

  const getForm = (divId) =>
    formState[divId] || { name: "", subject: "" };

  const updateForm = (divId, updates) => {
    setFormState({ ...formState, [divId]: { ...getForm(divId), ...updates } });
  };

  const handleAdd = (divId) => {
    const form = getForm(divId);
    const name = form.name.trim();
    if (!name || !form.subject) return;

    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    // If teacher already exists, add this division to their divisions list
    const existingIndex = state.teachers.findIndex((t) => t.id === id);
    if (existingIndex >= 0) {
      const existing = state.teachers[existingIndex];
      if (!existing.divisions.includes(divId)) {
        dispatch({
          type: "UPDATE_TEACHER",
          payload: {
            index: existingIndex,
            teacher: { ...existing, divisions: [...existing.divisions, divId] },
          },
        });
      }
      updateForm(divId, { name: "", subject: "" });
      return;
    }

    dispatch({
      type: "ADD_TEACHER",
      payload: {
        id,
        name,
        subject: form.subject,
        divisions: [divId],
        sectionIds: [],
      },
    });
    updateForm(divId, { name: "", subject: "" });
  };

  const toggleSection = (teacherIndex, sectionId) => {
    const teacher = state.teachers[teacherIndex];
    const sectionIds = teacher.sectionIds.includes(sectionId)
      ? teacher.sectionIds.filter((id) => id !== sectionId)
      : [...teacher.sectionIds, sectionId];
    dispatch({
      type: "UPDATE_TEACHER",
      payload: { index: teacherIndex, teacher: { ...teacher, sectionIds } },
    });
  };

  const toggleDivision = (teacherIndex, divId) => {
    const teacher = state.teachers[teacherIndex];
    const divisions = teacher.divisions.includes(divId)
      ? teacher.divisions.filter((d) => d !== divId)
      : [...teacher.divisions, divId];
    if (divisions.length === 0) return; // Must belong to at least one
    // When removing a division, also remove sections from that division
    const removedDivSections = !divisions.includes(divId)
      ? state.sections.filter((s) => s.division === divId).map((s) => s.id)
      : [];
    const sectionIds = removedDivSections.length > 0
      ? teacher.sectionIds.filter((id) => !removedDivSections.includes(id))
      : teacher.sectionIds;
    dispatch({
      type: "UPDATE_TEACHER",
      payload: { index: teacherIndex, teacher: { ...teacher, divisions, sectionIds } },
    });
  };

  const removeTeacher = (teacherIndex, divId) => {
    const teacher = state.teachers[teacherIndex];
    if (teacher.divisions.length <= 1) {
      // Last division — remove teacher entirely
      dispatch({ type: "REMOVE_TEACHER", payload: teacherIndex });
    } else {
      // Remove from this division only
      const divSectionIds = state.sections
        .filter((s) => s.division === divId)
        .map((s) => s.id);
      dispatch({
        type: "UPDATE_TEACHER",
        payload: {
          index: teacherIndex,
          teacher: {
            ...teacher,
            divisions: teacher.divisions.filter((d) => d !== divId),
            sectionIds: teacher.sectionIds.filter((id) => !divSectionIds.includes(id)),
          },
        },
      });
    }
  };

  if (visibleDivisions.length === 0) {
    return (
      <div className="tab-content">
        <h2>Teachers</h2>
        <div className="empty-state">
          Add divisions in the School Info tab first.
        </div>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <h2>Teachers</h2>
      <p className="tab-intro">
        Add teachers, assign them a subject, and select which sections they
        teach. Teachers can belong to multiple divisions.
      </p>

      {visibleDivisions.map((div) => {
        const form = getForm(div.id);
        const divSubjects = state.subjects[div.id] || [];
        const divTeachers = state.teachers
          .map((t, i) => ({ ...t, _index: i }))
          .filter((t) => t.divisions.includes(div.id));
        const divSections = state.sections.filter((s) => s.division === div.id);

        return (
          <div key={div.id} className="division-card">
            <div className="division-card-header">
              <h3>{div.name}</h3>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                {divTeachers.length} teacher{divTeachers.length !== 1 ? "s" : ""}
              </span>
            </div>

            {divSubjects.length === 0 ? (
              <div className="empty-state" style={{ padding: "20px 0" }}>
                Add subjects in the Subjects tab first.
              </div>
            ) : (
              <div className="form-row" style={{ marginBottom: 12 }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Teacher name"
                  value={form.name}
                  onChange={(e) => updateForm(div.id, { name: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd(div.id)}
                  style={{ maxWidth: 200 }}
                />
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
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleAdd(div.id)}
                >
                  Add Teacher
                </button>
              </div>
            )}

            {divTeachers.length > 0 && (
              <table className="config-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Subject</th>
                    <th>Divisions</th>
                    <th>Sections</th>
                    <th style={{ width: 60 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {divTeachers.map((teacher) => {
                    const isExpanded = expanded[teacher.id];
                    // Get sections from ALL of this teacher's divisions
                    const allTeacherSections = state.sections.filter(
                      (s) => teacher.divisions.includes(s.division)
                    );
                    // For subject-based divisions, filter to matching subject
                    const relevantSections = allTeacherSections.filter((s) => {
                      const sDiv = state.divisions.find((d) => d.id === s.division);
                      if (sDiv && sDiv.sectionModel === "subject-based") {
                        return s.subject === teacher.subject;
                      }
                      return true;
                    });

                    const divNames = teacher.divisions.map((dId) => {
                      const d = state.divisions.find((x) => x.id === dId);
                      return d ? d.name : dId;
                    });

                    return [
                      <tr
                        key={teacher.id}
                        className={isExpanded ? "teacher-row-expanded" : ""}
                      >
                        <td style={{ fontWeight: 600 }}>{teacher.name}</td>
                        <td>{teacher.subject}</td>
                        <td>
                          <div className="tag-list">
                            {divNames.map((name) => (
                              <span key={name} className="tag" style={{ fontSize: "0.72rem" }}>
                                {name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span
                            className="expand-toggle"
                            onClick={() =>
                              setExpanded({ ...expanded, [teacher.id]: !isExpanded })
                            }
                            style={{ color: "var(--primary)", fontSize: "0.85rem" }}
                          >
                            {teacher.sectionIds.length} section
                            {teacher.sectionIds.length !== 1 ? "s" : ""}{" "}
                            {isExpanded ? "▲" : "▼"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-icon"
                            onClick={() => removeTeacher(teacher._index, div.id)}
                            title={
                              teacher.divisions.length > 1
                                ? `Remove from ${div.name}`
                                : "Delete teacher"
                            }
                          >
                            ✕
                          </button>
                        </td>
                      </tr>,
                      isExpanded && (
                        <tr key={`${teacher.id}-detail`}>
                          <td colSpan={5} className="teacher-sections-detail">
                            {/* Division membership */}
                            {state.divisions.length > 1 && (
                              <div style={{ marginBottom: 10 }}>
                                <div
                                  style={{
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    color: "var(--text-secondary)",
                                    marginBottom: 4,
                                  }}
                                >
                                  Divisions:
                                </div>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  {state.divisions.map((d) => (
                                    <label
                                      key={d.id}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 4,
                                        fontSize: "0.8rem",
                                        cursor: "pointer",
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={teacher.divisions.includes(d.id)}
                                        onChange={() => toggleDivision(teacher._index, d.id)}
                                      />
                                      {d.name}
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Section assignment */}
                            <div
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                color: "var(--text-secondary)",
                                marginBottom: 4,
                              }}
                            >
                              Sections:
                            </div>
                            {relevantSections.length === 0 ? (
                              <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                                No sections available. Create sections first.
                              </span>
                            ) : (
                              <div className="checkbox-list">
                                {relevantSections.map((section) => (
                                  <label key={section.id}>
                                    <input
                                      type="checkbox"
                                      checked={teacher.sectionIds.includes(section.id)}
                                      onChange={() =>
                                        toggleSection(teacher._index, section.id)
                                      }
                                    />
                                    {section.id}
                                    {teacher.divisions.length > 1 && (
                                      <span
                                        style={{
                                          fontSize: "0.7rem",
                                          color: "var(--text-secondary)",
                                          marginLeft: 4,
                                        }}
                                      >
                                        ({state.divisions.find((d) => d.id === section.division)?.name})
                                      </span>
                                    )}
                                  </label>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ),
                    ];
                  })}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}
