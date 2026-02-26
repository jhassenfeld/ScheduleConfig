import { useState } from "react";

const DAYS = ["mon", "tue", "wed", "thu", "fri"];
const DAY_LABELS = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday" };

export default function MasterSchedule({ state, dispatch, visibleDivisions }) {
  const [fridayEnabled, setFridayEnabled] = useState({});
  const [newOverride, setNewOverride] = useState({});

  const getSchedule = (divId) =>
    state.masterSchedule[divId] || { default: [], friday: null, dayOverrides: [] };

  const setBlockCount = (divId, count, key = "default") => {
    const sched = getSchedule(divId);
    const existing = sched[key] || [];
    let blocks;
    if (count > existing.length) {
      blocks = [
        ...existing,
        ...Array.from({ length: count - existing.length }, (_, i) => ({
          block: existing.length + i + 1,
          label: `Block ${existing.length + i + 1}`,
          start: "",
          end: "",
          type: "academic",
        })),
      ];
    } else {
      blocks = existing.slice(0, count);
    }
    dispatch({
      type: "SET_SCHEDULE",
      payload: {
        divisionId: divId,
        schedule: { ...sched, [key]: blocks },
      },
    });
  };

  const updateBlock = (divId, blockIndex, field, value, key = "default") => {
    const sched = getSchedule(divId);
    const blocks = [...(sched[key] || [])];
    blocks[blockIndex] = { ...blocks[blockIndex], [field]: value };
    dispatch({
      type: "SET_SCHEDULE",
      payload: {
        divisionId: divId,
        schedule: { ...sched, [key]: blocks },
      },
    });
  };

  const toggleFriday = (divId) => {
    const sched = getSchedule(divId);
    const enabled = !fridayEnabled[divId];
    setFridayEnabled({ ...fridayEnabled, [divId]: enabled });
    if (!enabled) {
      dispatch({
        type: "SET_SCHEDULE",
        payload: {
          divisionId: divId,
          schedule: { ...sched, friday: null },
        },
      });
    } else if (!sched.friday) {
      // Copy default schedule as starting point for Friday
      dispatch({
        type: "SET_SCHEDULE",
        payload: {
          divisionId: divId,
          schedule: {
            ...sched,
            friday: (sched.default || []).map((b) => ({ ...b })),
          },
        },
      });
    }
  };

  const addDayOverride = (divId, day, block, type) => {
    const sched = getSchedule(divId);
    const existing = sched.dayOverrides || [];
    if (existing.some((o) => o.day === day && o.block === block)) return;
    dispatch({
      type: "SET_SCHEDULE",
      payload: {
        divisionId: divId,
        schedule: {
          ...sched,
          dayOverrides: [...existing, { day, block: parseInt(block), type }],
        },
      },
    });
  };

  const removeDayOverride = (divId, day, block) => {
    const sched = getSchedule(divId);
    dispatch({
      type: "SET_SCHEDULE",
      payload: {
        divisionId: divId,
        schedule: {
          ...sched,
          dayOverrides: (sched.dayOverrides || []).filter(
            (o) => !(o.day === day && o.block === block)
          ),
        },
      },
    });
  };

  const TEACHABLE_TYPES = new Set(["academic", "class"]);

  const renderBlockBudget = (div) => {
    const sched = getSchedule(div.id);
    const defaultBlocks = sched.default || [];
    const fridayBlocks = sched.friday;

    if (defaultBlocks.length === 0 || div.grades.length === 0) return null;

    // Count teachable (academic) blocks per day
    const defaultAcademic = defaultBlocks.filter(
      (b) => TEACHABLE_TYPES.has(b.type)
    ).length;
    const fridayAcademic = fridayBlocks
      ? fridayBlocks.filter((b) => TEACHABLE_TYPES.has(b.type)).length
      : defaultAcademic;

    // Subtract day overrides that target teachable blocks
    const overrides = sched.dayOverrides || [];
    const academicBlockNums = new Set(
      defaultBlocks.filter((b) => TEACHABLE_TYPES.has(b.type)).map((b) => b.block)
    );
    const fridayAcademicBlockNums = fridayBlocks
      ? new Set(fridayBlocks.filter((b) => TEACHABLE_TYPES.has(b.type)).map((b) => b.block))
      : academicBlockNums;
    const overrideReductions = overrides.filter((o) => {
      if (o.day === "fri") return fridayAcademicBlockNums.has(o.block);
      return academicBlockNums.has(o.block);
    }).length;
    const totalTeachable = defaultAcademic * 4 + fridayAcademic - overrideReductions;

    const divSubjects = state.subjects[div.id] || [];
    if (divSubjects.length === 0) return null;

    const rows = div.grades.map((grade) => {
      const isHalfBlock = (div.halfBlockGrades || []).includes(grade);
      // Sum full-block frequencies for subjects that apply to this grade
      const assigned = state.subjectRequirements
        .filter((r) => r.division === div.id && r.grades.includes(grade))
        .reduce((sum, r) => sum + (r.blocksPerWeek || 0), 0);
      const diff = totalTeachable - assigned;

      return { grade, isHalfBlock, assigned, diff };
    });

    // Don't render if nothing is assigned yet
    const anyAssigned = rows.some((r) => r.assigned > 0);
    if (!anyAssigned) return null;

    return (
      <div style={{ marginTop: 20 }}>
        <h4 style={{ fontSize: "0.85rem", marginBottom: 8, color: "var(--text-secondary)" }}>
          Block Budget
        </h4>
        <table className="config-table" style={{ maxWidth: 460 }}>
          <thead>
            <tr>
              <th style={{ width: 70 }}>Grade</th>
              <th style={{ width: 120 }}>Teachable / wk</th>
              <th style={{ width: 120 }}>Assigned / wk</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ grade, isHalfBlock, assigned, diff }) => (
              <tr key={grade}>
                <td style={{ fontWeight: 600 }}>
                  {grade.toUpperCase()}
                  {isHalfBlock ? " *" : ""}
                </td>
                <td>{totalTeachable}</td>
                <td>{assigned}</td>
                <td
                  style={{
                    color:
                      diff === 0
                        ? "#059669"
                        : diff > 0
                        ? "#D97706"
                        : "#DC2626",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                  }}
                >
                  {diff === 0
                    ? "\u2713 Balanced"
                    : diff > 0
                    ? `${diff} open`
                    : `${Math.abs(diff)} over`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {div.halfBlockGrades?.length > 0 && (
          <p
            style={{
              fontSize: "0.72rem",
              color: "var(--text-secondary)",
              marginTop: 4,
            }}
          >
            * Half-block grade — budget shown is for full blocks only.
          </p>
        )}
      </div>
    );
  };

  if (visibleDivisions.length === 0) {
    return (
      <div className="tab-content">
        <h2>Master Schedule</h2>
        <div className="empty-state">
          Add divisions in the School Info tab first.
        </div>
      </div>
    );
  }

  const renderBlockTable = (divId, blocks, key) => (
    <table className="config-table">
      <thead>
        <tr>
          <th style={{ width: 50 }}>#</th>
          <th>Label</th>
          <th>Start</th>
          <th>End</th>
          <th>Type</th>
        </tr>
      </thead>
      <tbody>
        {blocks.map((block, i) => (
          <tr key={i}>
            <td style={{ textAlign: "center", fontWeight: 600 }}>{block.block}</td>
            <td>
              <input
                type="text"
                className="form-input"
                value={block.label}
                onChange={(e) => updateBlock(divId, i, "label", e.target.value, key)}
                style={{ maxWidth: 200 }}
              />
            </td>
            <td>
              <input
                type="time"
                className="form-input"
                value={block.start}
                onChange={(e) => updateBlock(divId, i, "start", e.target.value, key)}
                style={{ maxWidth: 140 }}
              />
            </td>
            <td>
              <input
                type="time"
                className="form-input"
                value={block.end}
                onChange={(e) => updateBlock(divId, i, "end", e.target.value, key)}
                style={{ maxWidth: 140 }}
              />
            </td>
            <td>
              <select
                className="form-select"
                value={block.type}
                onChange={(e) => updateBlock(divId, i, "type", e.target.value, key)}
              >
                <option value="academic">Academic</option>
                <option value="class">Class</option>
                <option value="lunch">Lunch</option>
                <option value="recess">Recess</option>
                <option value="tefillot">Tefillot</option>
                <option value="assembly">Assembly</option>
                <option value="advisory">Advisory</option>
                <option value="break">Break</option>
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderTimeline = (blocks) => {
    if (!blocks || blocks.length === 0) return null;
    return (
      <div className="timeline-preview">
        {blocks.map((block, i) => (
          <div key={i} className={`timeline-block ${block.type}`}>
            <span className="timeline-time">
              {block.start || "?"} - {block.end || "?"}
            </span>
            <span className="timeline-label">{block.label}</span>
            <span className="timeline-type">{block.type}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="tab-content">
      <h2>Master Schedule</h2>
      <p className="tab-intro">
        Define the daily block structure with times for each division.
      </p>

      {visibleDivisions.map((div) => {
        const sched = getSchedule(div.id);
        const defaultBlocks = sched.default || [];
        const fridayBlocks = sched.friday;
        const hasFriday = fridayEnabled[div.id] || !!fridayBlocks;

        const otherDivs = visibleDivisions.filter(
          (d) =>
            d.id !== div.id &&
            (state.masterSchedule[d.id]?.default || []).length > 0
        );

        const copyFrom = (sourceId) => {
          const source = state.masterSchedule[sourceId];
          if (!source) return;
          const copied = {
            default: (source.default || []).map((b) => ({ ...b })),
            friday: source.friday
              ? source.friday.map((b) => ({ ...b }))
              : null,
          };
          dispatch({
            type: "SET_SCHEDULE",
            payload: { divisionId: div.id, schedule: copied },
          });
          if (copied.friday) {
            setFridayEnabled({ ...fridayEnabled, [div.id]: true });
          }
        };

        return (
          <div key={div.id} className="division-card">
            <div className="division-card-header">
              <h3>{div.name}</h3>
              {otherDivs.length > 0 && (
                <select
                  className="form-select"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) copyFrom(e.target.value);
                  }}
                  style={{ fontSize: "0.8rem", width: "auto" }}
                >
                  <option value="">Copy from...</option>
                  {otherDivs.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-row" style={{ marginBottom: 12 }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                Number of blocks:
              </label>
              <input
                type="number"
                min={0}
                max={20}
                value={defaultBlocks.length}
                onChange={(e) =>
                  setBlockCount(div.id, parseInt(e.target.value) || 0)
                }
                style={{
                  width: 70,
                  padding: "6px 10px",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  fontSize: "0.85rem",
                }}
              />
            </div>

            {defaultBlocks.length > 0 && (
              <>
                <h3 style={{ fontSize: "0.9rem", marginBottom: 8 }}>
                  Default Schedule (Mon-Thu)
                </h3>
                {renderBlockTable(div.id, defaultBlocks, "default")}
                {renderTimeline(defaultBlocks)}
              </>
            )}

            <div style={{ marginTop: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={hasFriday}
                  onChange={() => toggleFriday(div.id)}
                />
                Different Friday schedule
              </label>
            </div>

            {hasFriday && fridayBlocks && (
              <div style={{ marginTop: 12 }}>
                <div className="form-row" style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                    Friday blocks:
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={fridayBlocks.length}
                    onChange={(e) =>
                      setBlockCount(div.id, parseInt(e.target.value) || 0, "friday")
                    }
                    style={{
                      width: 70,
                      padding: "6px 10px",
                      border: "1px solid var(--border)",
                      borderRadius: 4,
                      fontSize: "0.85rem",
                    }}
                  />
                </div>
                {fridayBlocks.length > 0 && (
                  <>
                    <h3 style={{ fontSize: "0.9rem", marginBottom: 8 }}>
                      Friday Schedule
                    </h3>
                    {renderBlockTable(div.id, fridayBlocks, "friday")}
                    {renderTimeline(fridayBlocks)}
                  </>
                )}
              </div>
            )}

            {renderBlockBudget(div)}

            {/* Day-Specific Overrides */}
            {defaultBlocks.length > 0 && (() => {
              const overrides = sched.dayOverrides || [];
              const overrideForm = newOverride[div.id] || { day: "", block: "", type: "advisory" };
              const selectedDay = overrideForm.day;
              const dayBlocks = selectedDay === "fri" && fridayBlocks ? fridayBlocks : defaultBlocks;
              const availableBlocks = dayBlocks.filter(
                (b) =>
                  TEACHABLE_TYPES.has(b.type) &&
                  !overrides.some((o) => o.day === selectedDay && o.block === b.block)
              );

              return (
                <div style={{ marginTop: 20 }}>
                  <h4 style={{ fontSize: "0.85rem", marginBottom: 4, color: "var(--text-secondary)" }}>
                    Day-Specific Overrides
                  </h4>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: 8 }}>
                    Make a normally academic block non-academic on a specific day (e.g., Tuesday Block 2 → Advisory).
                  </p>

                  {overrides.length > 0 && (
                    <table className="config-table" style={{ maxWidth: 500, marginBottom: 12 }}>
                      <thead>
                        <tr>
                          <th>Day</th>
                          <th>Block</th>
                          <th>Type</th>
                          <th style={{ width: 70 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {overrides.map((o, i) => (
                          <tr key={i}>
                            <td>{DAY_LABELS[o.day] || o.day}</td>
                            <td>Block {o.block}</td>
                            <td style={{ textTransform: "capitalize" }}>{o.type}</td>
                            <td>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => removeDayOverride(div.id, o.day, o.block)}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  <div className="form-row" style={{ gap: 8, alignItems: "center" }}>
                    <select
                      className="form-select"
                      value={overrideForm.day}
                      onChange={(e) =>
                        setNewOverride({
                          ...newOverride,
                          [div.id]: { ...overrideForm, day: e.target.value, block: "" },
                        })
                      }
                      style={{ width: 130, fontSize: "0.8rem" }}
                    >
                      <option value="">Day...</option>
                      {DAYS.map((d) => (
                        <option key={d} value={d}>
                          {DAY_LABELS[d]}
                        </option>
                      ))}
                    </select>
                    <select
                      className="form-select"
                      value={overrideForm.block}
                      onChange={(e) =>
                        setNewOverride({
                          ...newOverride,
                          [div.id]: { ...overrideForm, block: e.target.value },
                        })
                      }
                      style={{ width: 170, fontSize: "0.8rem" }}
                      disabled={!selectedDay}
                    >
                      <option value="">Block...</option>
                      {availableBlocks.map((b) => (
                        <option key={b.block} value={b.block}>
                          Block {b.block} — {b.label}
                        </option>
                      ))}
                    </select>
                    <select
                      className="form-select"
                      value={overrideForm.type}
                      onChange={(e) =>
                        setNewOverride({
                          ...newOverride,
                          [div.id]: { ...overrideForm, type: e.target.value },
                        })
                      }
                      style={{ width: 130, fontSize: "0.8rem" }}
                    >
                      <option value="advisory">Advisory</option>
                      <option value="assembly">Assembly</option>
                      <option value="tefillot">Tefillot</option>
                      <option value="recess">Recess</option>
                      <option value="break">Break</option>
                      <option value="lunch">Lunch</option>
                      <option value="fixed">Fixed</option>
                    </select>
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={!overrideForm.day || !overrideForm.block}
                      onClick={() => {
                        addDayOverride(div.id, overrideForm.day, overrideForm.block, overrideForm.type || "advisory");
                        setNewOverride({ ...newOverride, [div.id]: { day: "", block: "", type: "advisory" } });
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })}
    </div>
  );
}
