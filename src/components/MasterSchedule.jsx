import { useState } from "react";

export default function MasterSchedule({ state, dispatch, visibleDivisions }) {
  const [fridayEnabled, setFridayEnabled] = useState({});

  const getSchedule = (divId) =>
    state.masterSchedule[divId] || { default: [], friday: null };

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
                <option value="lunch">Lunch</option>
                <option value="recess">Recess</option>
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

        return (
          <div key={div.id} className="division-card">
            <div className="division-card-header">
              <h3>{div.name}</h3>
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
          </div>
        );
      })}
    </div>
  );
}
