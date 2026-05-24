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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {opts.map((opt) => {
          const hit = isAnswer && opt.key === correct
          return (
            <div
              key={opt.key}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '8px 12px',
                background: hit ? C.greenLt : '#FAFAFA',
                border: `1.5px solid ${hit ? C.green : '#E2E8F0'}`,
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  color: hit ? C.greenDk : C.slate,
                  fontFamily: MONO,
                  fontSize: '13px',
                  minWidth: '20px',
                  flexShrink: 0,
                }}
              >
                {opt.key}
              </span>
              <span style={{ fontSize: '14px', lineHeight: 1.5, flex: 1 }}>
                <MathExpr text={opt.text} />
              </span>
              {hit && (
                <span
                  style={{ color: C.greenDk, fontWeight: 700, fontSize: '13px', flexShrink: 0 }}
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
            marginTop: '10px',
            padding: '9px 13px',
            background: C.greenLt,
            borderLeft: `3px solid ${C.green}`,
            fontSize: '13px',
            fontFamily: SANS,
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

export function ShortAnswerRenderer({ q, isAnswer, worksheet }) {
  const parts = q.content?.parts,
    responses = q.answer?.responses || []
  if (!parts || parts.length === 0) {
    const resp = responses[0]
    return (
      <div>
        <Instruction text={q.instruction} worksheet={worksheet} />
        <DiagramBlock diagram={q.content?.diagram} />
        {isAnswer && resp ? (
          <WorkedAnswer resp={resp} />
        ) : (
          !isAnswer && <WorkArea worksheet={worksheet} />
        )}
      </div>
    )
  }
  return (
    <div>
      <Instruction text={q.instruction} worksheet={worksheet} />
      <DiagramBlock diagram={q.content?.diagram} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
        {parts.map((part, pi) => {
          const resp = responses.find((r) => r.label === part.label),
            mainP = cleanPrompt(part.prompt)
          const hint =
            part.hint ||
            (part.prompt !== mainP ? part.prompt.match(/\(([^)]+first[^)]*)\)/i)?.[1] : null)
          return (
            <div key={pi} style={{ padding: '10px 0', borderBottom: `1px solid ${C.slateLt}` }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <PartLabel label={part.label} />
                <MathExpr text={mainP} />
              </div>
              {hint && !isAnswer && (
                <div
                  style={{
                    marginLeft: '32px',
                    fontSize: '12px',
                    color: C.slate,
                    fontFamily: SANS,
                    fontStyle: 'italic',
                    marginTop: '2px',
                  }}
                >
                  Hint: {hint}
                </div>
              )}
              {isAnswer && resp ? (
                <div style={{ marginLeft: '32px', marginTop: '4px' }}>
                  <WorkedAnswer resp={resp} />
                </div>
              ) : (
                !isAnswer && (
                  <div style={{ marginLeft: '32px' }}>
                    <WorkArea worksheet={worksheet} />
                  </div>
                )
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
  return (
    <div>
      <Instruction text={q.instruction} worksheet={worksheet} />
      <DiagramBlock diagram={q.content?.diagram} />
      {parts && parts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', marginTop: '8px' }}>
          {parts.map((part, pi) => {
            const resp = responses.find((r) => r.label === part.label)
            return (
              <div key={pi} style={{ padding: '8px 0', borderBottom: `1px solid ${C.slateLt}` }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '10px',
                    marginBottom: isAnswer && resp ? '6px' : 0,
                  }}
                >
                  <PartLabel label={part.label} />
                  <span style={{ fontSize: '14px', flex: 1, lineHeight: 1.5 }}>
                    <MathExpr text={part.prompt} />
                  </span>
                </div>
                {isAnswer && resp ? (
                  <div style={{ marginLeft: '32px' }}>
                    <WorkedAnswer resp={resp} />
                  </div>
                ) : (
                  !isAnswer && (
                    <div style={{ marginLeft: '32px' }}>
                      <WorkArea worksheet={worksheet} />
                    </div>
                  )
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
            background: C.greenLt,
            borderLeft: `3px solid ${C.green}`,
            fontFamily: SERIF,
            fontSize: '14px',
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
                    background: C.black,
                    color: '#fff',
                    fontWeight: 700,
                    textAlign: 'left',
                    border: `1px solid ${C.black}`,
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {display.map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : C.slateXlt }}>
                {row.map((cell, ci) => {
                  const was = blanks.has(`${ri}-${ci}`)
                  // Explicit blank check — `cell ? ...` would render numeric 0
                  // as the ▢ placeholder, which is wrong when 0 is a valid value.
                  const isBlank = cell === '' || cell == null
                  return (
                    <td
                      key={ci}
                      style={{
                        padding: '8px 14px',
                        border: '1px solid #E2E8F0',
                        minWidth: '80px',
                        background: isAnswer && was ? C.greenLt : undefined,
                        fontWeight: isAnswer && was ? 700 : 400,
                        color: isAnswer && was ? C.greenDk : C.black,
                      }}
                    >
                      {isBlank ? (
                        isAnswer ? (
                          ''
                        ) : (
                          '▢'
                        )
                      ) : (
                        <MathExpr text={String(cell)} />
                      )}
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
export function QuestionCard({ q, index, isAnswer, issues, worksheet }) {
  if (!q) return null
  const meta = TYPE_META[q.type] || { label: 'Unknown', icon: '?' },
    // Renderer is a stable lookup into the renderer registry (registerRenderer
    // / getRenderer in this same file) — the identity is constant per q.type.
    // The two <Renderer ... /> render sites below each carry a local
    // eslint-disable for react-hooks/static-components, which can't see the
    // identity stability through the registry indirection.
    Renderer = getRenderer(q.type)
  const cardIssues = ((!worksheet && issues) || []).filter(
    (v) => v.field && v.field.includes(q.id || `Q${index + 1}`)
  )
  if (worksheet)
    return (
      <div style={{ background: 'white', border: '1.5px solid #E2E8F0', padding: '16px 20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '10px',
            paddingBottom: '8px',
            borderBottom: `1px solid ${C.slateLt}`,
          }}
        >
          <span
            style={{
              fontFamily: SANS,
              fontSize: '14px',
              fontWeight: 700,
              color: C.black,
              minWidth: '28px',
              flexShrink: 0,
            }}
          >
            {index + 1}.
          </span>
          {q.section && (
            <span style={{ fontSize: '10px', color: C.slate, fontFamily: MONO }}>
              § {q.section}
            </span>
          )}
        </div>
        {/* eslint-disable-next-line react-hooks/static-components */}
        <Renderer q={q} isAnswer={isAnswer} worksheet={worksheet} />
      </div>
    )
  return (
    <div
      style={{
        background: 'white',
        border: `1.5px solid ${cardIssues.length ? C.redMd : '#E2E8F0'}`,
        padding: '20px 24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '12px',
          paddingBottom: '10px',
          borderBottom: `1px solid ${C.slateLt}`,
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            background: `linear-gradient(135deg,${C.green},${C.greenDk})`,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '13px',
            fontFamily: MONO,
            flexShrink: 0,
          }}
        >
          {index + 1}
        </div>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            color: C.green,
            fontFamily: MONO,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {meta.icon} {meta.label}
        </span>
        {q.section && (
          <span style={{ fontSize: '10px', color: C.slate, fontFamily: MONO, marginLeft: 'auto' }}>
            § {q.section}
          </span>
        )}
        {q.meta?.difficulty && (
          <span
            style={{
              fontSize: '9px',
              fontWeight: 700,
              color: C.slate,
              fontFamily: MONO,
              background: C.slateLt,
              padding: '2px 7px',
              textTransform: 'uppercase',
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
          }}
        >
          ⚠ {iss.msg}
        </div>
      ))}
      {/* eslint-disable-next-line react-hooks/static-components */}
      <Renderer q={q} isAnswer={isAnswer} worksheet={worksheet} />
    </div>
  )
}
