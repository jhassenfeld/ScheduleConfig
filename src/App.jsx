import { useReducer } from "react";
import SchoolInfo from "./components/SchoolInfo";
import Sections from "./components/Sections";
import Subjects from "./components/Subjects";
import MasterSchedule from "./components/MasterSchedule";
import Teachers from "./components/Teachers";
import SubjectFrequencies from "./components/SubjectFrequencies";
import ExportImport from "./components/ExportImport";
import "./App.css";

const VIEW_TABS = [
  { id: "school-info", label: "School Info" },
  { id: "sections", label: "Sections" },
  { id: "subjects", label: "Subjects" },
  { id: "schedule", label: "Master Schedule" },
  { id: "teachers", label: "Teachers" },
  { id: "frequencies", label: "Subject Frequencies" },
  { id: "export", label: "Export / Import" },
];

const initialState = {
  schoolName: "",
  divisions: [],
  subjects: {},
  sections: [],
  masterSchedule: {},
  teachers: [],
  subjectRequirements: [],
  activeDivision: "all",
  activeTab: "school-info",
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_TAB":
      return { ...state, activeTab: action.payload };
    case "SET_ACTIVE_DIVISION":
      return { ...state, activeDivision: action.payload };
    case "SET_SCHOOL_NAME":
      return { ...state, schoolName: action.payload };

    // Divisions
    case "ADD_DIVISION": {
      const div = action.payload;
      return {
        ...state,
        divisions: [...state.divisions, div],
        subjects: { ...state.subjects, [div.id]: [] },
        masterSchedule: {
          ...state.masterSchedule,
          [div.id]: { default: [], friday: null },
        },
      };
    }
    case "UPDATE_DIVISION": {
      const { index, division } = action.payload;
      const oldDiv = state.divisions[index];
      const newDivisions = [...state.divisions];
      newDivisions[index] = division;

      let newSubjects = { ...state.subjects };
      let newSchedule = { ...state.masterSchedule };
      let newSections = state.sections;
      let newTeachers = state.teachers;
      let newReqs = state.subjectRequirements;

      if (oldDiv.id !== division.id) {
        newSubjects[division.id] = newSubjects[oldDiv.id] || [];
        delete newSubjects[oldDiv.id];
        newSchedule[division.id] = newSchedule[oldDiv.id] || { default: [], friday: null };
        delete newSchedule[oldDiv.id];
        newSections = state.sections.map((s) =>
          s.division === oldDiv.id ? { ...s, division: division.id } : s
        );
        newTeachers = state.teachers.map((t) =>
          t.division === oldDiv.id ? { ...t, division: division.id } : t
        );
        newReqs = state.subjectRequirements.map((r) =>
          r.division === oldDiv.id ? { ...r, division: division.id } : r
        );
      }

      return {
        ...state,
        divisions: newDivisions,
        subjects: newSubjects,
        masterSchedule: newSchedule,
        sections: newSections,
        teachers: newTeachers,
        subjectRequirements: newReqs,
      };
    }
    case "REMOVE_DIVISION": {
      const divId = action.payload;
      const newSubjects = { ...state.subjects };
      delete newSubjects[divId];
      const newSchedule = { ...state.masterSchedule };
      delete newSchedule[divId];
      return {
        ...state,
        divisions: state.divisions.filter((d) => d.id !== divId),
        subjects: newSubjects,
        masterSchedule: newSchedule,
        sections: state.sections.filter((s) => s.division !== divId),
        teachers: state.teachers.filter((t) => t.division !== divId),
        subjectRequirements: state.subjectRequirements.filter((r) => r.division !== divId),
        activeDivision:
          state.activeDivision === divId ? "all" : state.activeDivision,
      };
    }

    // Subjects
    case "ADD_SUBJECT": {
      const { divisionId, subject } = action.payload;
      const divSubjects = state.subjects[divisionId] || [];
      if (divSubjects.includes(subject)) return state;
      return {
        ...state,
        subjects: {
          ...state.subjects,
          [divisionId]: [...divSubjects, subject],
        },
      };
    }
    case "REMOVE_SUBJECT": {
      const { divisionId, subject } = action.payload;
      return {
        ...state,
        subjects: {
          ...state.subjects,
          [divisionId]: (state.subjects[divisionId] || []).filter(
            (s) => s !== subject
          ),
        },
        sections: state.sections.filter(
          (s) => !(s.division === divisionId && s.subject === subject)
        ),
        teachers: state.teachers.filter(
          (t) => !(t.division === divisionId && t.subject === subject)
        ),
        subjectRequirements: state.subjectRequirements.filter(
          (r) => !(r.division === divisionId && r.subject === subject)
        ),
      };
    }

    // Sections
    case "ADD_SECTION":
      return { ...state, sections: [...state.sections, action.payload] };
    case "ADD_SECTIONS":
      return { ...state, sections: [...state.sections, ...action.payload] };
    case "REMOVE_SECTION": {
      const sectionId = action.payload;
      return {
        ...state,
        sections: state.sections.filter((s) => s.id !== sectionId),
        teachers: state.teachers.map((t) => ({
          ...t,
          sectionIds: t.sectionIds.filter((id) => id !== sectionId),
        })),
      };
    }

    // Master Schedule
    case "SET_SCHEDULE": {
      const { divisionId, schedule } = action.payload;
      return {
        ...state,
        masterSchedule: {
          ...state.masterSchedule,
          [divisionId]: schedule,
        },
      };
    }

    // Teachers
    case "ADD_TEACHER":
      return { ...state, teachers: [...state.teachers, action.payload] };
    case "UPDATE_TEACHER": {
      const { index, teacher } = action.payload;
      const newTeachers = [...state.teachers];
      newTeachers[index] = teacher;
      return { ...state, teachers: newTeachers };
    }
    case "REMOVE_TEACHER": {
      const idx = action.payload;
      return {
        ...state,
        teachers: state.teachers.filter((_, i) => i !== idx),
      };
    }

    // Subject Requirements
    case "SET_REQUIREMENTS":
      return { ...state, subjectRequirements: action.payload };

    // Import full state
    case "IMPORT_STATE":
      return { ...action.payload, activeTab: state.activeTab, activeDivision: "all" };

    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const visibleDivisions =
    state.activeDivision === "all"
      ? state.divisions
      : state.divisions.filter((d) => d.id === state.activeDivision);

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Schedule Config Builder</h1>
          <p className="app-subtitle">
            {state.schoolName || "Configure your school schedule"}
          </p>
        </div>
        {state.divisions.length > 0 && (
          <div className="division-selector">
            <label>Division:</label>
            <button
              className={`division-pill ${state.activeDivision === "all" ? "active" : ""}`}
              onClick={() => dispatch({ type: "SET_ACTIVE_DIVISION", payload: "all" })}
            >
              All
            </button>
            {state.divisions.map((div) => (
              <button
                key={div.id}
                className={`division-pill ${state.activeDivision === div.id ? "active" : ""}`}
                onClick={() =>
                  dispatch({ type: "SET_ACTIVE_DIVISION", payload: div.id })
                }
              >
                {div.name}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="view-tabs">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${state.activeTab === tab.id ? "active" : ""}`}
            onClick={() => dispatch({ type: "SET_TAB", payload: tab.id })}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="main-content">
        {state.activeTab === "school-info" && (
          <SchoolInfo state={state} dispatch={dispatch} />
        )}
        {state.activeTab === "sections" && (
          <Sections
            state={state}
            dispatch={dispatch}
            visibleDivisions={visibleDivisions}
          />
        )}
        {state.activeTab === "subjects" && (
          <Subjects
            state={state}
            dispatch={dispatch}
            visibleDivisions={visibleDivisions}
          />
        )}
        {state.activeTab === "schedule" && (
          <MasterSchedule
            state={state}
            dispatch={dispatch}
            visibleDivisions={visibleDivisions}
          />
        )}
        {state.activeTab === "teachers" && (
          <Teachers
            state={state}
            dispatch={dispatch}
            visibleDivisions={visibleDivisions}
          />
        )}
        {state.activeTab === "frequencies" && (
          <SubjectFrequencies
            state={state}
            dispatch={dispatch}
            visibleDivisions={visibleDivisions}
          />
        )}
        {state.activeTab === "export" && (
          <ExportImport state={state} dispatch={dispatch} />
        )}
      </div>
    </div>
  );
}
