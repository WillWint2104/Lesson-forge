import { QUESTION_TYPES } from './schema.js'

/* ═══════════════════════════════════════════
   CORE — VALIDATION
═══════════════════════════════════════════ */
export function validateLesson(lesson) {
  const errors = [],
    warnings = []
  if (!lesson.lesson_title) warnings.push({ field: 'lesson_title', msg: 'Missing lesson_title' })
  if (!lesson.topic) warnings.push({ field: 'topic', msg: 'Missing topic' })
  if (!lesson.year) warnings.push({ field: 'year', msg: 'Missing year' })
  if (!lesson.version)
    warnings.push({ field: 'version', msg: 'Missing version — add "version":"1.0"' })
  if (!Array.isArray(lesson.questions) || !lesson.questions.length)
    errors.push({ field: 'questions', msg: 'No questions array found' })
  const ids = new Set()
  ;(lesson.questions || []).forEach((q, i) => {
    const loc = q.id ? `Q${i + 1}(${q.id})` : `Q${i + 1}`
    if (!q.id) warnings.push({ field: loc, msg: `${loc}: missing id` })
    if (ids.has(q.id)) errors.push({ field: loc, msg: `${loc}: duplicate id "${q.id}"` })
    if (q.id) ids.add(q.id)
    if (!q.type) errors.push({ field: loc, msg: `${loc}: missing type` })
    if (q.type && !QUESTION_TYPES.includes(q.type))
      errors.push({ field: loc, msg: `${loc}: unknown type "${q.type}"` })
    if (!q.instruction) warnings.push({ field: loc, msg: `${loc}: missing instruction` })
    if (!q.content) errors.push({ field: loc, msg: `${loc}: missing content block` })
    if (!q.answer) warnings.push({ field: loc, msg: `${loc}: missing answer block` })
    if (q.type === 'mcq' && q.content) {
      const opts = q.content.options
      if (!Array.isArray(opts) || opts.length < 2)
        errors.push({ field: loc, msg: `${loc}: mcq needs at least 2 options` })
      if (q.answer?.correct && opts && !opts.find((o) => o.key === q.answer.correct))
        errors.push({ field: loc, msg: `${loc}: answer.correct not in options` })
    }
    if (q.type === 'diagram' && q.content && !q.content.diagram)
      warnings.push({ field: loc, msg: `${loc}: diagram type but no content.diagram` })
    if (q.type === 'table' && q.content) {
      if (!q.content.columns) errors.push({ field: loc, msg: `${loc}: table missing columns` })
      if (!q.content.rows) errors.push({ field: loc, msg: `${loc}: table missing rows` })
    }
    if (q.type === 'classify' && q.content) {
      if (!q.content.categories)
        errors.push({ field: loc, msg: `${loc}: classify missing categories` })
      if (!q.content.items) errors.push({ field: loc, msg: `${loc}: classify missing items` })
    }
  })
  return { valid: errors.length === 0, errors, warnings }
}
