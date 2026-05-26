import { MathExpr, NumberLine } from './math.jsx'
import { GREEN, GREEN_DK, BLACK } from './colors.js'

/* ── Brand ── */
export const C = {
  green: GREEN,
  greenDk: GREEN_DK,
  greenLt: '#EDF7F3',
  greenMd: '#A3D9C6',
  black: BLACK,
  white: '#FFFFFF',
  cream: '#F5F5F3',
  purple: '#7C3AED',
  purpleLt: '#F5F3FF',
  purpleMd: '#DDD6FE',
  orange: '#D97706',
  orangeLt: '#FFFBEB',
  orangeMd: '#FDE68A',
  red: '#DC2626',
  redLt: '#FEF2F2',
  redMd: '#FCA5A5',
  slate: '#64748B',
  slateLt: '#F1F5F9',
  slateXlt: '#F8FAFC',
}
export const SERIF = "'Newsreader',serif"
export const SANS = "'Libre Franklin',sans-serif"
export const MONO = "'DM Mono',monospace"
export const FONTS =
  'https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Franklin:wght@400;500;600;700&family=DM+Mono:wght@400;500;700&family=STIX+Two+Text:ital,wght@0,400;0,700;1,400;1,700&display=swap'
export const BP = {
  background: `linear-gradient(135deg,${C.green},${C.greenDk})`,
  color: '#fff',
  border: 'none',
  padding: '11px 24px',
  fontSize: '14px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: SANS,
}
export const BS = {
  background: '#fff',
  color: C.slate,
  border: '1.5px solid #E2E8F0',
  padding: '10px 20px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: SANS,
}
export const BO = {
  background: `linear-gradient(135deg,${C.orange},#B45309)`,
  color: '#fff',
  border: 'none',
  padding: '11px 24px',
  fontSize: '14px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: SANS,
}

/* ═══════════════════════════════════════════
   CORE — UI PRIMITIVES
═══════════════════════════════════════════ */
export function Instruction({ text, worksheet }) {
  return (
    <p
      style={{
        fontFamily: SERIF,
        fontSize: worksheet ? '18px' : '20px',
        fontWeight: 600,
        color: '#1E293B',
        lineHeight: 1.5,
        margin: '0 0 20px',
      }}
    >
      {text}
    </p>
  )
}
export function PartLabel({ label }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '24px',
        height: '24px',
        background: '#EDF7F3',
        color: '#3D9A7E',
        fontFamily: SERIF,
        fontStyle: 'italic',
        fontSize: '13px',
        borderRadius: '6px',
        marginBottom: '10px',
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  )
}
export function WorkArea({ worksheet }) {
  if (worksheet) return null
  return (
    <div
      style={{
        background:
          'repeating-linear-gradient(to bottom, transparent, transparent 23px, #E5E7EB 23px, #E5E7EB 24px)',
        height: '96px',
        margin: '12px 0 4px',
        borderRadius: '6px',
        padding: '4px 0',
      }}
    />
  )
}
// When rendered inside a part sub-card (#FAFAFA), pass `inline` so we skip
// the outer mint wrapper — otherwise we'd nest two panels (grey → mint) with
// mismatched corners. Standalone single-part answers (no sub-card) keep the
// mint wrapper as the visual container.
export function WorkedAnswer({ resp, inline }) {
  if (!resp) return null
  const nl = resp.number_line || null
  const block = () => {
    if (Array.isArray(resp.steps) && resp.steps.length > 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {resp.steps.map((step, si) => {
            const ci = step.indexOf(':'),
              hc = ci > 0 && ci < step.length - 1
            const ln = hc ? step.slice(0, ci).trim() : null,
              rm = hc ? step.slice(ci + 1).trim() : step.trim()
            const ai = rm.indexOf('←'),
              mp = ai > 0 ? rm.slice(0, ai).trim() : rm,
              ap = ai > 0 ? rm.slice(ai).trim() : null
            return (
              <div
                key={si}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '20px minmax(0,1fr) minmax(0,1.6fr) auto',
                  gap: '2px 10px',
                  alignItems: 'start',
                  padding: '4px 0',
                  borderBottom: `1px solid ${C.greenLt}`,
                }}
              >
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: '10px',
                    fontWeight: 700,
                    color: C.greenDk,
                    textAlign: 'right',
                  }}
                >
                  {si + 1}.
                </span>
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: '12px',
                    color: C.slate,
                    fontStyle: 'italic',
                    lineHeight: 1.5,
                  }}
                >
                  {ln || ''}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 700, lineHeight: 1.5 }}>
                  <MathExpr text={mp} />
                </span>
                {ap && (
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: '11px',
                      fontWeight: 700,
                      color: C.orange,
                      background: C.orangeLt,
                      padding: '1px 7px',
                      border: `1px solid ${C.orangeMd}`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {ap}
                  </span>
                )}
              </div>
            )
          })}
          {resp.final && (
            <div
              style={{
                marginTop: '8px',
                border: '1.5px solid #1E293B',
                borderRadius: '4px',
                padding: '4px 12px',
                display: 'inline-block',
                fontSize: '14px',
                fontWeight: 700,
                color: '#1E293B',
              }}
            >
              <MathExpr text={resp.final} />
            </div>
          )}
        </div>
      )
    }
    const lines = (resp.text || '').split('\n').filter((l) => l.trim())
    if (!lines.length) return null
    if (lines.length === 1)
      return <div style={{ fontFamily: SERIF, fontSize: '14px', lineHeight: 1.6 }}>{resp.text}</div>
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {lines.map((line, li) => (
          <div key={li} style={{ fontSize: '14px', lineHeight: 1.6 }}>
            <MathExpr text={line} />
          </div>
        ))}
      </div>
    )
  }
  if (inline) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {block()}
        {nl && <NumberLine nl={nl} />}
      </div>
    )
  }
  return (
    <div
      style={{
        background: C.greenLt,
        borderLeft: `3px solid ${C.green}`,
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      {block()}
      {nl && <NumberLine nl={nl} />}
    </div>
  )
}
