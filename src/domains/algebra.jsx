import { C, Instruction } from '../core/ui.jsx'
import { MathExpr } from '../core/math.jsx'
// Import from the leaf module rather than core/renderers.jsx — renderers.jsx
// imports this file (for ClassifyRenderer), so going back through it would
// re-create the cycle the leaf module exists to break.
import { DiagramBlock } from '../core/diagram-block.jsx'

/* ═══════════════════════════════════════════
   DOMAIN — ALGEBRA (classify)
═══════════════════════════════════════════ */
export function ClassifyRenderer({ q, isAnswer, worksheet }) {
  const cats = q.content?.categories || [],
    items = q.content?.items || [],
    mapping = q.answer?.mapping || {}
  return (
    <div>
      <Instruction text={q.instruction} worksheet={worksheet} />
      <DiagramBlock diagram={q.content?.diagram} />
      {isAnswer ? (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
          {cats.map((cat) => {
            const ci = items.filter((it) => mapping[it] === cat)
            return (
              <div
                key={cat}
                style={{
                  flex: '1 1 140px',
                  border: '1.5px solid #A3D9C6',
                  background: '#fff',
                  borderRadius: '8px',
                  padding: '10px 14px',
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '11px',
                    color: '#3D9A7E',
                    fontFamily: "'DM Mono',monospace",
                    background: '#EDF7F3',
                    border: '1.5px solid #A3D9C6',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'inline-block',
                  }}
                >
                  {cat}
                </div>
                {ci.map((it) => (
                  <div
                    key={it}
                    style={{
                      fontSize: '13px',
                      padding: '3px 0',
                      borderBottom: '1px solid #E5E7EB',
                      lineHeight: 1.4,
                    }}
                  >
                    <MathExpr text={it} />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ marginTop: '8px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
            {cats.map((cat) => (
              <div
                key={cat}
                style={{
                  flex: '1 1 140px',
                  border: '1.5px dashed #CBD5E1',
                  background: C.slateXlt,
                  borderRadius: '8px',
                  padding: '10px 14px',
                  minHeight: '56px',
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '11px',
                    color: '#3D9A7E',
                    fontFamily: "'DM Mono',monospace",
                    background: '#EDF7F3',
                    border: '1.5px solid #A3D9C6',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'inline-block',
                  }}
                >
                  {cat}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {items.map((it) => (
              <span
                key={it}
                style={{
                  padding: '4px 12px',
                  border: '1px solid #E5E7EB',
                  background: '#fff',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              >
                <MathExpr text={it} />
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
