// Subject color palette — cycles through these for dynamically created subjects
export const SUBJECT_COLOR_PALETTE = [
  { bg: "#DBEAFE", border: "#3B82F6", text: "#1E40AF" },
  { bg: "#D1FAE5", border: "#10B981", text: "#065F46" },
  { bg: "#EDE9FE", border: "#8B5CF6", text: "#5B21B6" },
  { bg: "#FFEDD5", border: "#F97316", text: "#9A3412" },
  { bg: "#FEE2E2", border: "#EF4444", text: "#991B1B" },
  { bg: "#FEF9C3", border: "#EAB308", text: "#854D0E" },
  { bg: "#FCE7F3", border: "#EC4899", text: "#9D174D" },
  { bg: "#CCFBF1", border: "#14B8A6", text: "#134E4A" },
  { bg: "#FFF7ED", border: "#FB923C", text: "#9A3412" },
  { bg: "#F0FDF4", border: "#22C55E", text: "#166534" },
];

export function getSubjectColor(index) {
  return SUBJECT_COLOR_PALETTE[index % SUBJECT_COLOR_PALETTE.length];
}
