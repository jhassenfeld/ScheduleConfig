export default function SubjectFrequencies({ state, dispatch, visibleDivisions }) {
  const getReq = (divId, subject) =>
    state.subjectRequirements.find(
      (r) => r.division === divId && r.subject === subject
    );

  const updateReq = (divId, subject, field, value) => {
    const div = state.divisions.find((d) => d.id === divId);
    const existing = state.subjectRequirements.find(
      (r) => r.division === divId && r.subject === subject
    );

    let newReqs;
    if (existing) {
      newReqs = state.subjectRequirements.map((r) =>
        r.division === divId && r.subject === subject
          ? { ...r, [field]: value }
          : r
      );
    } else {
      newReqs = [
        ...state.subjectRequirements,
        {
          division: divId,
          grades: div ? div.grades : [],
          subject,
          blocksPerWeek: 0,
          halfBlocksPerWeek: 0,
          [field]: value,
        },
      ];
    }
    dispatch({ type: "SET_REQUIREMENTS", payload: newReqs });
  };

  if (visibleDivisions.length === 0) {
    return (
      <div className="tab-content">
        <h2>Subject Frequencies</h2>
        <div className="empty-state">
          Add divisions in the School Info tab first.
        </div>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <h2>Subject Frequencies</h2>
      <p className="tab-intro">
        Define how many blocks per week each subject meets. Defaults to all
        grades in the division.
      </p>

      {visibleDivisions.map((div) => {
        const divSubjects = state.subjects[div.id] || [];
        const hasHalfBlock = div.halfBlockGrades && div.halfBlockGrades.length > 0;

        return (
          <div key={div.id} className="division-card">
            <div className="division-card-header">
              <h3>{div.name}</h3>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                Grades: {div.grades.map((g) => g.toUpperCase()).join(", ")}
              </span>
            </div>

            {divSubjects.length === 0 ? (
              <div className="empty-state" style={{ padding: "20px 0" }}>
                Add subjects in the Subjects tab first.
              </div>
            ) : (
              <table className="config-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Blocks / Week</th>
                    {hasHalfBlock && <th>Half-Blocks / Week</th>}
                    <th>Grades</th>
                  </tr>
                </thead>
                <tbody>
                  {divSubjects.map((subject) => {
                    const req = getReq(div.id, subject);
                    const blocksPerWeek = req ? req.blocksPerWeek : 0;
                    const halfBlocksPerWeek = req ? req.halfBlocksPerWeek : 0;
                    const grades = req ? req.grades : div.grades;

                    return (
                      <tr key={subject}>
                        <td style={{ fontWeight: 600 }}>{subject}</td>
                        <td>
                          <input
                            type="number"
                            min={0}
                            max={30}
                            value={blocksPerWeek}
                            onChange={(e) =>
                              updateReq(
                                div.id,
                                subject,
                                "blocksPerWeek",
                                parseInt(e.target.value) || 0
                              )
                            }
                            style={{
                              width: 70,
                              padding: "4px 8px",
                              border: "1px solid var(--border)",
                              borderRadius: 4,
                              fontSize: "0.85rem",
                            }}
                          />
                        </td>
                        {hasHalfBlock && (
                          <td>
                            <input
                              type="number"
                              min={0}
                              max={30}
                              value={halfBlocksPerWeek}
                              onChange={(e) =>
                                updateReq(
                                  div.id,
                                  subject,
                                  "halfBlocksPerWeek",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              style={{
                                width: 70,
                                padding: "4px 8px",
                                border: "1px solid var(--border)",
                                borderRadius: 4,
                                fontSize: "0.85rem",
                              }}
                            />
                          </td>
                        )}
                        <td>
                          <div className="tag-list">
                            {div.grades.map((g) => (
                              <button
                                key={g}
                                className="tag"
                                style={{
                                  background: grades.includes(g) ? "#DBEAFE" : undefined,
                                  borderColor: grades.includes(g) ? "#3B82F6" : undefined,
                                  color: grades.includes(g) ? "#1E40AF" : undefined,
                                  cursor: "pointer",
                                  fontSize: "0.7rem",
                                }}
                                onClick={() => {
                                  const newGrades = grades.includes(g)
                                    ? grades.filter((x) => x !== g)
                                    : [...grades, g];
                                  updateReq(div.id, subject, "grades", newGrades);
                                }}
                              >
                                {g.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
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
