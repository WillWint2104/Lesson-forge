import { C, SERIF, SANS, MONO, BP } from '../core/ui.jsx'
import { TYPE_META } from '../core/schema.js'

export default function Validate({
  lesson,
  validation,
  qs,
  formatRevisions,
  handleFormatAndReview,
  setView,
}) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '18px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: SERIF,
              fontSize: '20px',
              fontWeight: 700,
              color: '#0F172A',
              margin: 0,
            }}
          >
            {lesson.lesson_title || 'Untitled'}
          </h2>
          <p style={{ fontSize: '11px', color: C.slate, fontFamily: MONO, margin: '4px 0 0' }}>
            Year {lesson.year || '?'} · {lesson.topic || ''} · {qs.length} questions
          </p>
        </div>
        <button
          onClick={() => (formatRevisions > 0 ? handleFormatAndReview() : setView('preview'))}
          style={BP}
        >
          {formatRevisions > 0 ? `Review (${formatRevisions}×) →` : 'Preview →'}
        </button>
      </div>
      <div
        style={{
          padding: '12px 16px',
          marginBottom: '16px',
          background: validation.valid
            ? validation.warnings.length
              ? C.orangeLt
              : C.greenLt
            : C.redLt,
          border: `1.5px solid ${validation.valid ? (validation.warnings.length ? C.orangeMd : C.greenMd) : C.redMd}`,
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '16px' }}>
          {validation.valid ? (validation.warnings.length ? '⚠️' : '✅') : '❌'}
        </span>
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: '13px',
              fontFamily: SANS,
              color: validation.valid
                ? validation.warnings.length
                  ? C.orange
                  : C.greenDk
                : C.red,
            }}
          >
            {validation.valid ? 'Schema valid' : 'Schema has errors'} ·{' '}
            {validation.errors.length} error{validation.errors.length !== 1 ? 's' : ''} ·{' '}
            {validation.warnings.length} warning{validation.warnings.length !== 1 ? 's' : ''}
          </div>
          <div style={{ fontSize: '12px', color: C.slate, fontFamily: SANS }}>
            {validation.valid ? 'Safe to preview.' : 'Fix errors before rendering.'}
          </div>
        </div>
      </div>
      {validation.errors.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: C.red,
              fontFamily: MONO,
              letterSpacing: '0.07em',
              marginBottom: '5px',
              textTransform: 'uppercase',
            }}
          >
            Errors
          </div>
          {validation.errors.map((e, ei) => (
            <div
              key={ei}
              style={{
                padding: '6px 10px',
                background: C.redLt,
                borderLeft: `3px solid ${C.red}`,
                marginBottom: '3px',
                fontSize: '12px',
                fontFamily: MONO,
                color: C.red,
              }}
            >
              ✗ {e.msg}
            </div>
          ))}
        </div>
      )}
      {validation.warnings.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: C.orange,
              fontFamily: MONO,
              letterSpacing: '0.07em',
              marginBottom: '5px',
              textTransform: 'uppercase',
            }}
          >
            Warnings
          </div>
          {validation.warnings.map((w, wi) => (
            <div
              key={wi}
              style={{
                padding: '6px 10px',
                background: C.orangeLt,
                borderLeft: `3px solid ${C.orange}`,
                marginBottom: '3px',
                fontSize: '12px',
                fontFamily: MONO,
                color: C.orange,
              }}
            >
              ⚠ {w.msg}
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: '12px' }}>
        <div
          style={{
            fontSize: '10px',
            fontWeight: 700,
            color: C.slate,
            fontFamily: MONO,
            letterSpacing: '0.07em',
            marginBottom: '5px',
            textTransform: 'uppercase',
          }}
        >
          Questions
        </div>
        {qs.map((q, i) => {
          const fallback = `Q${i + 1}`
          const m = TYPE_META[q.type],
            // Anchored match — bare `.includes(q.id)` was a substring check, so
            // `Q1` would falsely match issues whose `field` mentioned `Q10`,
            // `Q11`, etc. We match: exact id, id followed by '(' (e.g.
            // 'Q1(parts[0])'), the synthesized 'Q<n>' fallback, or that
            // fallback followed by '(' (kept in sync with renderers.jsx
            // QuestionCard.cardIssues).
            qi = [...validation.errors, ...validation.warnings].filter(
              (v) =>
                v.field &&
                (v.field === q.id ||
                  (q.id && v.field.startsWith(q.id + '(')) ||
                  v.field === fallback ||
                  v.field.startsWith(fallback + '('))
            )
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                padding: '6px 10px',
                background: i % 2 === 0 ? 'white' : C.slateXlt,
                border: '1px solid #E2E8F0',
                borderTop: i === 0 ? '1px solid #E2E8F0' : 'none',
              }}
            >
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: '11px',
                  fontWeight: 700,
                  color: C.green,
                  minWidth: '28px',
                }}
              >
                Q{i + 1}
              </span>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: '11px',
                  color: C.slate,
                  minWidth: '18px',
                }}
              >
                {m?.icon || '?'}
              </span>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: '11px',
                  color: C.black,
                  minWidth: '110px',
                }}
              >
                {q.type || '?'}
              </span>
              <span style={{ fontFamily: SANS, fontSize: '12px', color: C.black, flex: 1 }}>
                {(q.instruction || '').substring(0, 55)}
                {(q.instruction || '').length > 55 ? '…' : ''}
              </span>
              {q.section && (
                <span
                  style={{
                    fontSize: '10px',
                    color: C.slate,
                    fontFamily: MONO,
                    whiteSpace: 'nowrap',
                  }}
                >
                  § {q.section}
                </span>
              )}
              {qi.length > 0 && (
                <span style={{ fontSize: '10px', color: C.orange, fontFamily: MONO }}>
                  ⚠ {qi.length}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
