import { useState } from "react";

const COMMON_GRADES = [
  "pk", "k", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12",
];

function generateId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 20);
}

export default function SchoolInfo({ state, dispatch }) {
  const [newDivName, setNewDivName] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);

  const handleAddDivision = () => {
    const name = newDivName.trim();
    if (!name) return;
    const id = generateId(name);
    if (state.divisions.some((d) => d.id === id)) return;
    dispatch({
      type: "ADD_DIVISION",
      payload: {
        id,
        name,
        grades: [],
        halfBlockGrades: [],
        sectionModel: "homeroom",
      },
    });
    setNewDivName("");
  };

  const toggleGrade = (divIndex, grade) => {
    const div = state.divisions[divIndex];
    const grades = div.grades.includes(grade)
      ? div.grades.filter((g) => g !== grade)
      : [...div.grades, grade].sort(
          (a, b) => COMMON_GRADES.indexOf(a) - COMMON_GRADES.indexOf(b)
        );
    const halfBlockGrades = div.halfBlockGrades.filter((g) =>
      grades.includes(g)
    );
    dispatch({
      type: "UPDATE_DIVISION",
      payload: { index: divIndex, division: { ...div, grades, halfBlockGrades } },
    });
  };

  const toggleHalfBlock = (divIndex, grade) => {
    const div = state.divisions[divIndex];
    const halfBlockGrades = div.halfBlockGrades.includes(grade)
      ? div.halfBlockGrades.filter((g) => g !== grade)
      : [...div.halfBlockGrades, grade];
    dispatch({
      type: "UPDATE_DIVISION",
      payload: { index: divIndex, division: { ...div, halfBlockGrades } },
    });
  };

  const setSectionModel = (divIndex, model) => {
    const div = state.divisions[divIndex];
    dispatch({
      type: "UPDATE_DIVISION",
      payload: { index: divIndex, division: { ...div, sectionModel: model } },
    });
  };

  const updateDivName = (divIndex, newName) => {
    const div = state.divisions[divIndex];
    dispatch({
      type: "UPDATE_DIVISION",
      payload: { index: divIndex, division: { ...div, name: newName } },
    });
  };

  return (
    <div className="tab-content">
      <h2>School Info</h2>
      <p className="tab-intro">
        Set your school name and define divisions with their grade levels.
      </p>

      <div className="form-group">
        <label>School Name</label>
        <input
          type="text"
          className="form-input"
          placeholder="e.g., Stein Campus"
          value={state.schoolName}
          onChange={(e) =>
            dispatch({ type: "SET_SCHOOL_NAME", payload: e.target.value })
          }
        />
      </div>

      <h3>Divisions</h3>
      <div className="form-row" style={{ marginBottom: 16 }}>
        <input
          type="text"
          className="form-input"
          placeholder="Division name (e.g., Lower School)"
          value={newDivName}
          onChange={(e) => setNewDivName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddDivision()}
          style={{ maxWidth: 300 }}
        />
        <button className="btn btn-primary btn-sm" onClick={handleAddDivision}>
          Add Division
        </button>
      </div>

      {state.divisions.length === 0 && (
        <div className="empty-state">
          No divisions yet. Add a division to get started.
        </div>
      )}

      {state.divisions.map((div, i) => (
        <div key={div.id} className="division-card">
          <div className="division-card-header">
            {editingIndex === i ? (
              <input
                type="text"
                className="form-input"
                value={div.name}
                onChange={(e) => updateDivName(i, e.target.value)}
                onBlur={() => setEditingIndex(null)}
                onKeyDown={(e) => e.key === "Enter" && setEditingIndex(null)}
                autoFocus
                style={{ maxWidth: 250 }}
              />
            ) : (
              <h3
                className="expand-toggle"
                onClick={() => setEditingIndex(i)}
                title="Click to rename"
              >
                {div.name}{" "}
                <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                  ({div.id})
                </span>
              </h3>
            )}
            <button
              className="btn btn-danger btn-sm"
              onClick={() =>
                dispatch({ type: "REMOVE_DIVISION", payload: div.id })
              }
            >
              Remove
            </button>
          </div>

          <div className="form-group">
            <label>Grades</label>
            <div className="tag-list">
              {COMMON_GRADES.map((grade) => (
                <button
                  key={grade}
                  className={`tag ${div.grades.includes(grade) ? "" : ""}`}
                  style={{
                    background: div.grades.includes(grade) ? "#DBEAFE" : undefined,
                    borderColor: div.grades.includes(grade) ? "#3B82F6" : undefined,
                    color: div.grades.includes(grade) ? "#1E40AF" : undefined,
                    cursor: "pointer",
                  }}
                  onClick={() => toggleGrade(i, grade)}
                >
                  {grade.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {div.grades.length > 0 && (
            <div className="form-group">
              <label>Half-Block Grades (shorter time slots)</label>
              <div className="tag-list">
                {div.grades.map((grade) => (
                  <button
                    key={grade}
                    className="tag"
                    style={{
                      background: div.halfBlockGrades.includes(grade)
                        ? "#FEF3C7"
                        : undefined,
                      borderColor: div.halfBlockGrades.includes(grade)
                        ? "#F59E0B"
                        : undefined,
                      color: div.halfBlockGrades.includes(grade)
                        ? "#92400E"
                        : undefined,
                      cursor: "pointer",
                    }}
                    onClick={() => toggleHalfBlock(i, grade)}
                  >
                    {grade.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Section Model</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name={`model-${div.id}`}
                  checked={div.sectionModel === "homeroom"}
                  onChange={() => setSectionModel(i, "homeroom")}
                />
                Homeroom-based (students stay together)
              </label>
              <label>
                <input
                  type="radio"
                  name={`model-${div.id}`}
                  checked={div.sectionModel === "subject-based"}
                  onChange={() => setSectionModel(i, "subject-based")}
                />
                Subject-based (different sections per subject)
              </label>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
