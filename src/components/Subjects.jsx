import { useState } from "react";

export default function Subjects({ state, dispatch, visibleDivisions }) {
  const [inputs, setInputs] = useState({});

  const handleAdd = (divId) => {
    const subject = (inputs[divId] || "").trim();
    if (!subject) return;
    dispatch({
      type: "ADD_SUBJECT",
      payload: { divisionId: divId, subject },
    });
    setInputs({ ...inputs, [divId]: "" });
  };

  if (visibleDivisions.length === 0) {
    return (
      <div className="tab-content">
        <h2>Subjects</h2>
        <div className="empty-state">
          Add divisions in the School Info tab first.
        </div>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <h2>Subjects</h2>
      <p className="tab-intro">
        Define the subjects taught in each division. These will be available in
        the Teachers and Subject Frequencies tabs.
      </p>

      {visibleDivisions.map((div) => {
        const subjects = state.subjects[div.id] || [];
        return (
          <div key={div.id} className="division-card">
            <div className="division-card-header">
              <h3>{div.name}</h3>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                {subjects.length} subject{subjects.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="form-row" style={{ marginBottom: 12 }}>
              <input
                type="text"
                className="form-input"
                placeholder="Subject name (e.g., Math, Hebrew)"
                value={inputs[div.id] || ""}
                onChange={(e) =>
                  setInputs({ ...inputs, [div.id]: e.target.value })
                }
                onKeyDown={(e) => e.key === "Enter" && handleAdd(div.id)}
                style={{ maxWidth: 250 }}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleAdd(div.id)}
              >
                Add Subject
              </button>
            </div>

            {subjects.length === 0 ? (
              <div className="empty-state" style={{ padding: "20px 0" }}>
                No subjects yet.
              </div>
            ) : (
              <div className="tag-list">
                {subjects.map((subject) => (
                  <span key={subject} className="tag" style={{ fontSize: "0.85rem", padding: "4px 10px" }}>
                    {subject}
                    <button
                      className="tag-remove"
                      onClick={() =>
                        dispatch({
                          type: "REMOVE_SUBJECT",
                          payload: { divisionId: div.id, subject },
                        })
                      }
                      title={`Remove ${subject}`}
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
