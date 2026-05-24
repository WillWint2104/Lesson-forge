/* ═══════════════════════════════════════════
   CORE — SCHEMA
═══════════════════════════════════════════ */
export const QUESTION_TYPES = ['mcq', 'short_answer', 'diagram', 'table', 'graph', 'classify']
export const TYPE_META = {
  mcq: { label: 'Multiple Choice', icon: '🔘' },
  short_answer: { label: 'Short Answer', icon: '✏️' },
  diagram: { label: 'Diagram', icon: '📐' },
  table: { label: 'Table', icon: '📊' },
  graph: { label: 'Graph', icon: '📈' },
  classify: { label: 'Classify', icon: '🏷️' },
}
