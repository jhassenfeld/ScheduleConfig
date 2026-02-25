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
    if (state.teachers.some((t) => t.id === id)) return;

    dispatch({
      type: "ADD_TEACHER",
      payload: {
        id,
        name,
        subject: form.subject,
        division: divId,
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
        Add teachers, assign them a subject, and select which sections they teach.
      </p>

      {visibleDivisions.map((div) => {
        const form = getForm(div.id);
        const divSubjects = state.subjects[div.id] || [];
        const divTeachers = state.teachers
          .map((t, i) => ({ ...t, _index: i }))
          .filter((t) => t.division === div.id);
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
                    <th>Sections</th>
                    <th style={{ width: 60 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {divTeachers.map((teacher) => {
                    const isExpanded = expanded[teacher.id];
                    // For subject-based divisions, only show sections matching teacher's subject
                    const relevantSections =
                      div.sectionModel === "subject-based"
                        ? divSections.filter((s) => s.subject === teacher.subject)
                        : divSections;

                    return [
                      <tr
                        key={teacher.id}
                        className={isExpanded ? "teacher-row-expanded" : ""}
                      >
                        <td style={{ fontWeight: 600 }}>{teacher.name}</td>
                        <td>{teacher.subject}</td>
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
                            onClick={() =>
                              dispatch({
                                type: "REMOVE_TEACHER",
                                payload: teacher._index,
                              })
                            }
                            title="Delete teacher"
                          >
                            x
                          </button>
                        </td>
                      </tr>,
                      isExpanded && (
                        <tr key={`${teacher.id}-sections`}>
                          <td colSpan={4} className="teacher-sections-detail">
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
