import { TYPE_META } from './schema.js'
import { C, SERIF, SANS, MONO, Instruction, PartLabel, WorkArea, WorkedAnswer } from './ui.jsx'
import { MathExpr } from './math.jsx'
import { DiagramBlock } from './diagram-block.jsx'
import { GraphRenderer } from '../domains/graph.jsx'
import { ClassifyRenderer } from '../domains/algebra.jsx'

// Re-export DiagramBlock so callers that already import it from this
// module (the historical location) keep working without churn.
export { DiagramBlock }

/* ═══════════════════════════════════════════
   CORE — RENDERER REGISTRY
═══════════════════════════════════════════ */
const _renderers = {}
export function registerRenderer(type, Comp) {
  _renderers[type] = Comp
}
export function getRenderer(type) {
  return _renderers[type] || ShortAnswerRenderer
}

/* ═══════════════════════════════════════════
   CORE — RENDERERS
═══════════════════════════════════════════ */
export function McqRenderer({ q, isAnswer, worksheet }) {
  const opts = q.content?.options || [],
    correct = q.answer?.correct
  return (
    <div>
      <Instruction text={q.instruction} worksheet={worksheet} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {opts.map((opt) => {
          const hit = isAnswer && opt.key === correct
          return (
            <div
              key={opt.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                background: hit ? '#EDF7F3' : '#FAFAFA',
                border: `1px solid ${hit ? '#A3D9C6' : '#E5E7EB'}`,
                borderRadius: '8px',
              }}
            >
              <span
                style={{
                  color: hit ? '#3D9A7E' : '#64748B',
                  fontFamily: MONO,
                  fontSize: '13px',
                  minWidth: '20px',
                  flexShrink: 0,
                }}
              >
                {opt.key}
              </span>
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: '14px',
                  lineHeight: 1.5,
                  color: '#1E293B',
                  flex: 1,
                }}
              >
                <MathExpr text={opt.text} />
              </span>
              {hit && (
                <span
                  style={{
                    color: '#3D9A7E',
                    fontWeight: 700,
                    fontSize: '14px',
                    flexShrink: 0,
                    marginLeft: 'auto',
                  }}
                >
                  ✓
                </span>
              )}
            </div>
          )
        })}
      </div>
      {isAnswer && q.answer?.explanation && (
        <div
          style={{
            marginTop: '12px',
            padding: '10px 14px',
            background: '#F0FBF7',
            borderLeft: '3px solid #5CB89B',
            borderRadius: '0 6px 6px 0',
            fontSize: '13px',
            fontFamily: SANS,
            color: '#374151',
            lineHeight: 1.5,
          }}
        >
          {q.answer.explanation}
        </div>
      )}
    </div>
  )
}

function cleanPrompt(text) {
  return (text || '')
    .replace(/\s*\([^)]*first[^)]*\)/gi, '')
    .replace(/\s*\[[^\]]*\]/g, '')
    .trim()
}

function MethodBox({ method }) {
  if (!method || typeof method !== 'string' || !method.trim()) return null
  return (
    <div
      style={{
        background: '#F0FBF7',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
      }}
    >
      <div
        style={{
          width: '28px',
          height: '28px',
          background: '#5CB89B',
          color: '#fff',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: '13px',
          flexShrink: 0,
        }}
      >
        ✓
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: MONO,
            fontSize: '10px',
            fontWeight: 700,
            color: '#3D9A7E',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '4px',
          }}
        >
          METHOD
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontSize: '13px',
            color: '#374151',
            lineHeight: 1.5,
          }}
        >
          {method}
        </div>
      </div>
    </div>
  )
}

const SUB_CARD_STYLE = {
  background: '#FAFAFA',
  border: '1px solid #E5E7EB',
  borderRadius: '10px',
  padding: '16px 18px',
}

const PART_PROMPT_STYLE = {
  fontFamily: SERIF,
  fontSize: '15px',
  color: '#1E293B',
  lineHeight: 1.5,
  marginTop: '4px',
}

export function ShortAnswerRenderer({ q, isAnswer, worksheet }) {
  const parts = q.content?.parts,
    responses = q.answer?.responses || []
  if (!parts || parts.length === 0) {
    const resp = responses[0]
    return (
      <div>
        <Instruction text={q.instruction} worksheet={worksheet} />
        <DiagramBlock diagram={q.content?.diagram} />
        {isAnswer && <MethodBox method={q.answer?.method} />}
        {isAnswer && resp ? (
          <WorkedAnswer resp={resp} />
        ) : (
          !isAnswer && <WorkArea worksheet={worksheet} />
        )}
      </div>
    )
  }
  const multi = parts.length >= 2
  return (
    <div>
      <Instruction text={q.instruction} worksheet={worksheet} />
      <DiagramBlock diagram={q.content?.diagram} />
      {isAnswer && <MethodBox method={q.answer?.method} />}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: multi ? '1fr 1fr' : '1fr',
          gap: '12px',
          marginTop: '8px',
        }}
      >
        {parts.map((part, pi) => {
          const resp = responses.find((r) => r.label === part.label),
            mainP = cleanPrompt(part.prompt)
          const hint =
            part.hint ||
            (part.prompt !== mainP ? part.prompt.match(/\(([^)]+first[^)]*)\)/i)?.[1] : null)
          return (
            <div key={pi} style={SUB_CARD_STYLE}>
              <PartLabel label={part.label} />
              <div style={PART_PROMPT_STYLE}>
                <MathExpr text={mainP} />
              </div>
              {hint && !isAnswer && (
                <div
                  style={{
                    fontSize: '12px',
                    color: C.slate,
                    fontFamily: SANS,
                    fontStyle: 'italic',
                    marginTop: '6px',
                  }}
                >
                  Hint: {hint}
                </div>
              )}
              {isAnswer && resp ? (
                <div style={{ marginTop: '8px' }}>
                  <WorkedAnswer resp={resp} />
                </div>
              ) : (
                !isAnswer && <WorkArea worksheet={worksheet} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function DiagramRenderer({ q, isAnswer, worksheet }) {
  const parts = q.content?.parts,
    responses = q.answer?.responses || []
  const multi = parts && parts.length >= 2
  return (
    <div>
      <Instruction text={q.instruction} worksheet={worksheet} />
      <DiagramBlock diagram={q.content?.diagram} />
      {isAnswer && <MethodBox method={q.answer?.method} />}
      {parts && parts.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: multi ? '1fr 1fr' : '1fr',
            gap: '12px',
            marginTop: '8px',
          }}
        >
          {parts.map((part, pi) => {
            const resp = responses.find((r) => r.label === part.label)
            return (
              <div key={pi} style={SUB_CARD_STYLE}>
                <PartLabel label={part.label} />
                <div style={PART_PROMPT_STYLE}>
                  <MathExpr text={part.prompt} />
                </div>
                {isAnswer && resp ? (
                  <div style={{ marginTop: '8px' }}>
                    <WorkedAnswer resp={resp} />
                  </div>
                ) : (
                  !isAnswer && <WorkArea worksheet={worksheet} />
                )}
              </div>
            )
          })}
        </div>
      ) : isAnswer && q.answer?.text ? (
        <div
          style={{
            marginTop: '10px',
            padding: '10px 14px',
            background: '#F0FBF7',
            borderLeft: '3px solid #5CB89B',
            borderRadius: '0 6px 6px 0',
            fontFamily: SERIF,
            fontSize: '14px',
            color: '#1E293B',
            lineHeight: 1.6,
          }}
        >
          {q.answer.text}
        </div>
      ) : !isAnswer ? (
        <WorkArea worksheet={worksheet} />
      ) : null}
    </div>
  )
}

export function TableRenderer({ q, isAnswer, worksheet }) {
  const cols = q.content?.columns || [],
    qRows = q.content?.rows || [],
    aRows = q.answer?.rows || []
  const display = isAnswer && aRows.length ? aRows : qRows,
    blanks = new Set()
  // `== null` catches both null and undefined. Numeric 0 is NOT a blank.
  qRows.forEach((row, ri) =>
    row.forEach((cell, ci) => {
      if (cell === '' || cell == null) blanks.add(`${ri}-${ci}`)
    })
  )
  return (
    <div>
      <Instruction text={q.instruction} worksheet={worksheet} />
      <div style={{ overflowX: 'auto', marginTop: '8px' }}>
        <table
          style={{ borderCollapse: 'collapse', width: '100%', fontFamily: SANS, fontSize: '13px' }}
        >
          <thead>
            <tr>
              {cols.map((col, ci) => (
                <th
                  key={ci}
                  style={{
                    padding: '8px 14px',
                    background: '#1E293B',
                    color: '#fff',
                    fontWeight: 700,
                    textAlign: 'left',
                    border: '1px solid #1E293B',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {display.map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#F9FAFB' }}>
                {row.map((cell, ci) => {
                  const was = blanks.has(`${ri}-${ci}`)
                  // Explicit blank check — `cell ? ...` would render numeric 0
                  // as the ▢ placeholder, which is wrong when 0 is a valid value.
                  const isBlank = cell === '' || cell == null
                  const filled = isAnswer && was
                  return (
                    <td
                      key={ci}
                      style={{
                        padding: '8px 14px',
                        border: '1px solid #E5E7EB',
                        minWidth: '80px',
                        background: filled ? '#EDF7F3' : undefined,
                        fontWeight: filled ? 700 : 400,
                        color: filled ? '#3D9A7E' : '#1E293B',
                      }}
                    >
                      {isBlank ? isAnswer ? '' : '▢' : <MathExpr text={String(cell)} />}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* Register all domain renderers */
registerRenderer('mcq', McqRenderer)
registerRenderer('short_answer', ShortAnswerRenderer)
registerRenderer('diagram', DiagramRenderer)
registerRenderer('table', TableRenderer)
registerRenderer('graph', GraphRenderer)
registerRenderer('classify', ClassifyRenderer)

/* ═══════════════════════════════════════════
   CORE — QUESTION CARD
═══════════════════════════════════════════ */
export function QuestionCard({ q, index, isAnswer, issues, worksheet, year }) {
  if (!q) return null
  const meta = TYPE_META[q.type] || { label: 'Unknown', icon: '?' },
    // Renderer is a stable lookup into the renderer registry (registerRenderer
    // / getRenderer in this same file) — the identity is constant per q.type.
    // The two <Renderer ... /> render sites below each carry a local
    // eslint-disable for react-hooks/static-components, which can't see the
    // identity stability through the registry indirection.
    Renderer = getRenderer(q.type)
  // Anchored field matching — `.includes(q.id)` would let `Q1` falsely capture
  // issues whose field mentioned `Q10`, `Q11`, etc. Match exact id, id followed
  // by '(' (e.g. `Q1(parts[0])`), the synthesized `Q<n>` fallback, or that
  // fallback followed by '('.
  const cardIssues = ((!worksheet && issues) || []).filter((v) => {
    if (!v.field) return false
    const fallback = `Q${index + 1}`
    return (
      v.field === q.id ||
      (q.id && v.field.startsWith(q.id + '(')) ||
      v.field === fallback ||
      v.field.startsWith(fallback + '(')
    )
  })

  const hasYear = year !== undefined && year !== null && String(year).trim() !== ''
  const hasSection = !!q.section
  let subtitle = ''
  if (hasYear && hasSection) subtitle = `Year ${year} · ${q.section}`
  else if (hasYear) subtitle = `Year ${year}`
  else if (hasSection) subtitle = q.section

  const sectionLabelText = q.section || q.type || ''
  const showSectionLabel = !!sectionLabelText

  const cardShell = {
    background: '#FFFFFF',
    borderRadius: '12px',
    borderTop: `2px solid ${cardIssues.length ? '#DC2626' : '#5CB89B'}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    padding: worksheet ? '20px 24px' : '24px 28px',
  }

  if (worksheet)
    return (
      <div style={cardShell}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            paddingBottom: '14px',
            marginBottom: '16px',
            borderBottom: '1px solid #F1F5F9',
          }}
        >
          <span
            style={{
              fontFamily: SANS,
              fontSize: '14px',
              fontWeight: 700,
              color: '#1E293B',
              flexShrink: 0,
            }}
          >
            {index + 1}.
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontFamily: SANS,
                fontSize: '16px',
                fontWeight: 700,
                color: '#1E293B',
              }}
            >
              Question {index + 1}
            </div>
            {subtitle && (
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: '13px',
                  color: '#94A3B8',
                  marginTop: '2px',
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
          <span
            style={{
              background: '#fff',
              border: '1px solid #D1D5DB',
              color: '#64748B',
              fontFamily: MONO,
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '6px',
              marginLeft: 'auto',
            }}
          >
            {meta.icon} {meta.label}
          </span>
        </div>
        {showSectionLabel && (
          <div
            style={{
              fontFamily: SANS,
              fontSize: '10px',
              letterSpacing: '0.1em',
              color: '#94A3B8',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}
          >
            {sectionLabelText}
          </div>
        )}
        {/* eslint-disable-next-line react-hooks/static-components */}
        <Renderer q={q} isAnswer={isAnswer} worksheet={worksheet} />
      </div>
    )
  return (
    <div style={cardShell}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          paddingBottom: '14px',
          marginBottom: '16px',
          borderBottom: '1px solid #F1F5F9',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            background: '#5CB89B',
            color: '#fff',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '16px',
            fontFamily: MONO,
            flexShrink: 0,
          }}
        >
          {index + 1}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            flex: 1,
            marginLeft: '12px',
          }}
        >
          <div
            style={{
              fontFamily: SANS,
              fontSize: '16px',
              fontWeight: 700,
              color: '#1E293B',
            }}
          >
            Question {index + 1}
          </div>
          {subtitle && (
            <div
              style={{
                fontFamily: SANS,
                fontSize: '13px',
                color: '#94A3B8',
                marginTop: '2px',
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
        <span
          style={{
            background: '#fff',
            border: '1px solid #D1D5DB',
            color: '#64748B',
            fontFamily: MONO,
            fontSize: '11px',
            padding: '4px 10px',
            borderRadius: '6px',
            flexShrink: 0,
          }}
        >
          {meta.icon} {meta.label}
        </span>
        {q.meta?.difficulty && (
          <span
            style={{
              background: '#5CB89B',
              color: '#fff',
              fontFamily: MONO,
              fontWeight: 700,
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '6px',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}
          >
            {q.meta.difficulty}
          </span>
        )}
      </div>
      {cardIssues.map((iss, ii) => (
        <div
          key={ii}
          style={{
            fontSize: '11px',
            color: C.orange,
            fontFamily: MONO,
            background: C.orangeLt,
            padding: '4px 10px',
            marginBottom: '8px',
            border: `1px solid ${C.orangeMd}`,
            borderRadius: '6px',
          }}
        >
          ⚠ {iss.msg}
        </div>
      ))}
      {showSectionLabel && (
        <div
          style={{
            fontFamily: SANS,
            fontSize: '10px',
            letterSpacing: '0.1em',
            color: '#94A3B8',
            textTransform: 'uppercase',
            marginBottom: '6px',
          }}
        >
          {sectionLabelText}
        </div>
      )}
      {/* eslint-disable-next-line react-hooks/static-components */}
      <Renderer q={q} isAnswer={isAnswer} worksheet={worksheet} />
    </div>
  )
}
