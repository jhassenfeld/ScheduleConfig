# Schedule Config Builder

A standalone web app for creating and editing school configuration files used by the Schedule Builder app. Built as a pure React frontend (no backend required) and hosted on Netlify.

---

## Purpose

The Schedule Builder app currently has its school configuration hardcoded in Python (`school_config.py`). The Config Builder replaces that with an interactive UI that exports a `school_config.json` file. That file is then uploaded into the Schedule Builder, which reads it instead of the hardcoded values.

This means the Schedule Builder can be used by any school — not just Stein Campus — without touching any code.

---

## Workflow

1. Open the Config Builder app
2. Fill in your school's configuration (see tabs below)
3. Click **Export JSON** → downloads `school_config.json`
4. Open the Schedule Builder app
5. Click **Upload Config** → select the downloaded file
6. Generate your schedule

The JSON file can be saved and re-opened in the Config Builder for future edits.

---

## App Structure

The app is a single-page React app with a tab-based layout, similar to the Schedule Builder. Each tab covers one section of the configuration.

### Tab 1: School Info

Basic metadata about the school:

- School name
- Divisions (e.g., Lower School, Middle School, Upper School)
  - Each division has a name and a list of grade levels it contains (e.g., MS = grades 6, 7, 8)
- Scheduling model per division: standard blocks vs. half-blocks (for younger grades like PreK/K)

### Tab 2: Sections

Define all the class sections:

- Add sections with flexible naming — supports both `1-1, 1-2` style and `6-Green, 6-Blue` style
- Assign each section to a grade and division
- Sections can be reordered or deleted

### Tab 3: Master Schedule

Define the daily block structure with start and end times:

- Add blocks with a name (e.g., "Block 1"), start time, and end time
- Mark any block as a **lunch block** or **recess block**
- Toggle **Friday schedule** on/off — if enabled, define a separate set of blocks for Fridays (different timing or fewer blocks)
- Visual preview shows the day as a timeline

### Tab 4: Teachers

Add teachers and assign them to sections:

- Add a teacher with name and subject (from a dropdown of defined subjects)
- For each teacher, select which sections they teach via a checklist
- Teachers with the same subject but different section assignments are supported (e.g., Hebrew-1 teaches Grade 1 only, Hebrew-2 teaches Grade 2 only)

### Tab 5: Subject Frequencies

Define how many blocks per week each subject meets, organized by division:

- For each division, add rows of: Subject → Blocks per Week
- Subjects can be added/removed (not locked to a fixed list)
- Supports half-block scheduling for divisions that use it (e.g., PreK/K specials = 1 half-block/week)

### Tab 6: Export

Review a summary of the full configuration and export:

- Summary view showing sections count, teacher count, subjects, block structure
- Validation warnings if anything looks incomplete (e.g., a teacher has no sections assigned, a subject has no frequency defined)
- **Export JSON** button → downloads `school_config.json`
- **Import JSON** button → loads a previously saved config file back into the editor for further changes

---

## Output Format

The exported `school_config.json` looks like this:

```json
{
  "school_name": "Stein Campus",
  "divisions": [
    {
      "id": "ls",
      "name": "Lower School",
      "grades": ["pk", "k", "1", "2", "3"],
      "half_block_grades": ["pk", "k"]
    }
  ],
  "sections": [
    { "id": "1-1", "grade": "1", "division": "ls" },
    { "id": "6-green", "grade": "6", "division": "ms" }
  ],
  "master_schedule": {
    "default": [
      { "block": 1, "label": "Block 1", "start": "8:00", "end": "9:00", "type": "academic" },
      { "block": 3, "label": "Lunch", "start": "11:00", "end": "12:00", "type": "lunch" }
    ],
    "friday": [
      { "block": 1, "label": "Block 1", "start": "8:00", "end": "8:45", "type": "academic" }
    ]
  },
  "teachers": [
    {
      "id": "hebrew-1",
      "name": "Hebrew Teacher Grade 1",
      "subject": "Hebrew",
      "section_ids": ["1-1", "1-2", "1-3"]
    }
  ],
  "subject_requirements": [
    { "division": "ls", "grades": ["1", "2", "3"], "subject": "GS", "blocks_per_week": 9 },
    { "division": "ls", "grades": ["pk", "k"], "subject": "Hebrew", "half_blocks_per_week": 5 }
  ]
}
```

---

## Schedule Builder Changes Required

To support uploaded configs, the Schedule Builder backend needs two small changes:

1. **New upload endpoint**: `POST /api/config/upload` — accepts a JSON body and saves it as `school_config.json` on the server (or in memory for the session)
2. **Config loading logic**: On startup, check for a `school_config.json` file and use it if present; otherwise fall back to the hardcoded `school_config.py` values

The frontend needs one small change:

- An **Upload Config** button (e.g., in the header or a settings area) that sends the file to the backend

---

## Tech Stack

- **Framework**: React + Vite (same as Schedule Builder)
- **Styling**: Plain CSS (same design system as Schedule Builder — reuse CSS variables and component patterns)
- **State**: React `useState` / `useReducer` — no backend, all state lives in the browser
- **Export**: `JSON.stringify` → Blob → download link
- **Import**: File input → `FileReader` → `JSON.parse` → populate state
- **Hosting**: Netlify (free tier, static deploy)
- **Repo**: Separate GitHub repo (e.g., `SteinScheduleConfig`)

---

## Future Ideas

- **Validation**: Warn if a subject has no teacher assigned, or a teacher has no sections
- **Templates**: Pre-built configs for common school structures (K-5, 6-8, K-12)
- **Direct sync**: Option B — send config directly to a running Schedule Builder instance via API instead of downloading/uploading
- **Versioning**: Stamp the JSON with a version number and school name so the Schedule Builder can show "currently loaded: Stein Campus v3"
