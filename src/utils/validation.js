export function validateConfig(state) {
  const warnings = [];

  // Check teachers with no sections
  for (const teacher of state.teachers) {
    if (!teacher.sectionIds || teacher.sectionIds.length === 0) {
      warnings.push({
        type: "warning",
        tab: "Teachers",
        message: `Teacher "${teacher.name}" has no sections assigned`,
      });
    }
  }

  // Check subjects with no teacher
  for (const [divId, subjects] of Object.entries(state.subjects)) {
    const div = state.divisions.find((d) => d.id === divId);
    const divName = div ? div.name : divId;
    for (const subject of subjects) {
      const hasTeacher = state.teachers.some(
        (t) => t.subject === subject && t.division === divId
      );
      if (!hasTeacher) {
        warnings.push({
          type: "warning",
          tab: "Teachers",
          message: `No teacher assigned for "${subject}" in ${divName}`,
        });
      }
    }
  }

  // Check subjects with no frequency defined
  for (const [divId, subjects] of Object.entries(state.subjects)) {
    const div = state.divisions.find((d) => d.id === divId);
    const divName = div ? div.name : divId;
    for (const subject of subjects) {
      const hasFreq = state.subjectRequirements.some(
        (r) => r.subject === subject && r.division === divId
      );
      if (!hasFreq) {
        warnings.push({
          type: "warning",
          tab: "Frequencies",
          message: `No frequency defined for "${subject}" in ${divName}`,
        });
      }
    }
  }

  // Check sections with no teacher
  for (const section of state.sections) {
    const hasTeacher = state.teachers.some(
      (t) => t.sectionIds && t.sectionIds.includes(section.id)
    );
    if (!hasTeacher) {
      warnings.push({
        type: "info",
        tab: "Sections",
        message: `Section "${section.id}" has no teacher assigned`,
      });
    }
  }

  // Check divisions with no sections
  for (const div of state.divisions) {
    const hasSections = state.sections.some((s) => s.division === div.id);
    if (!hasSections) {
      warnings.push({
        type: "warning",
        tab: "Sections",
        message: `Division "${div.name}" has no sections defined`,
      });
    }
  }

  // Check divisions with no master schedule
  for (const div of state.divisions) {
    const sched = state.masterSchedule[div.id];
    if (!sched || !sched.default || sched.default.length === 0) {
      warnings.push({
        type: "warning",
        tab: "Schedule",
        message: `Division "${div.name}" has no block schedule defined`,
      });
    }
  }

  return warnings;
}

export function exportToJSON(state) {
  return {
    school_name: state.schoolName,
    divisions: state.divisions.map((d) => ({
      id: d.id,
      name: d.name,
      grades: d.grades,
      half_block_grades: d.halfBlockGrades,
      section_model: d.sectionModel,
    })),
    subjects: state.subjects,
    sections: state.sections.map((s) => {
      const out = { id: s.id, grade: s.grade, division: s.division };
      if (s.subject) out.subject = s.subject;
      return out;
    }),
    master_schedule: Object.fromEntries(
      Object.entries(state.masterSchedule).map(([divId, sched]) => [
        divId,
        {
          default: sched.default || [],
          friday: sched.friday || null,
        },
      ])
    ),
    teachers: state.teachers.map((t) => ({
      id: t.id,
      name: t.name,
      subject: t.subject,
      division: t.division,
      section_ids: t.sectionIds,
    })),
    subject_requirements: state.subjectRequirements.map((r) => {
      const out = {
        division: r.division,
        grades: r.grades,
        subject: r.subject,
      };
      if (r.blocksPerWeek) out.blocks_per_week = r.blocksPerWeek;
      if (r.halfBlocksPerWeek) out.half_blocks_per_week = r.halfBlocksPerWeek;
      return out;
    }),
  };
}

export function importFromJSON(json) {
  return {
    schoolName: json.school_name || "",
    divisions: (json.divisions || []).map((d) => ({
      id: d.id,
      name: d.name,
      grades: d.grades || [],
      halfBlockGrades: d.half_block_grades || [],
      sectionModel: d.section_model || "homeroom",
    })),
    subjects: json.subjects || {},
    sections: (json.sections || []).map((s) => ({
      id: s.id,
      grade: s.grade,
      division: s.division,
      subject: s.subject || null,
    })),
    masterSchedule: Object.fromEntries(
      Object.entries(json.master_schedule || {}).map(([divId, sched]) => [
        divId,
        {
          default: sched.default || [],
          friday: sched.friday || null,
        },
      ])
    ),
    teachers: (json.teachers || []).map((t) => ({
      id: t.id,
      name: t.name,
      subject: t.subject,
      division: t.division,
      sectionIds: t.section_ids || [],
    })),
    subjectRequirements: (json.subject_requirements || []).map((r) => ({
      division: r.division,
      grades: r.grades || [],
      subject: r.subject,
      blocksPerWeek: r.blocks_per_week || 0,
      halfBlocksPerWeek: r.half_blocks_per_week || 0,
    })),
  };
}
