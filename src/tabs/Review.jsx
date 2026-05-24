import { C, SERIF, SANS, MONO, BP, BS } from '../core/ui.jsx'
import { safeDownload } from '../core/workflow.js'

export default function Review({
  lesson,
  qs,
  qaProgress,
  qaAutoSummary,
  reviewLog,
  reviewFinal,
  formatReviewing,
  setView,
  setJsonPanel,
}) {
  return (
    <div>
      <div style={{ marginBottom: '18px' }}>
        <h2
          style={{
            fontFamily: SERIF,
            fontSize: '20px',
            fontWeight: 700,
            color: '#0F172A',
            marginBottom: '4px',
          }}
        >
          {formatReviewing ? '⏳ Reviewing…' : '✅ Review Complete'}
        </h2>
        <p style={{ fontSize: '12px', color: C.slate }}>
          {formatReviewing
            ? `Round ${qaProgress.iter} of ${qaProgress.of} — ${qaProgress.done}/${qaProgress.total}`
            : `${qaAutoSummary?.rounds} round${qaAutoSummary?.rounds !== 1 ? 's' : ''} · ${qaAutoSummary?.patches || 0} patches · ${qaAutoSummary?.visualTodos?.length || 0} TODOs`}
        </p>
      </div>
      {formatReviewing && (
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              fontFamily: MONO,
              color: C.slate,
              marginBottom: '4px',
            }}
          >
            <span>
              Round {qaProgress.iter}/{qaProgress.of}
            </span>
            <span>
              {qaProgress.done}/{qaProgress.total}
            </span>
          </div>
          <div style={{ height: '8px', background: C.slateLt }}>
            <div
              style={{
                height: '100%',
                background: `linear-gradient(90deg,${C.green},${C.greenDk})`,
                width: `${qaProgress.total ? Math.round((qaProgress.done / qaProgress.total) * 100) : 0}%`,
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>
      )}
      {reviewLog.length > 0 && (
        <div
          style={{
            background: '#0F172A',
            padding: '12px 16px',
            marginBottom: '16px',
            fontFamily: MONO,
            fontSize: '11px',
          }}
        >
          <div
            style={{
              color: '#F59E0B',
              fontWeight: 700,
              fontSize: '9px',
              letterSpacing: '0.1em',
              marginBottom: '6px',
              textTransform: 'uppercase',
            }}
          >
            Revision Log
          </div>
          {reviewLog.map((e, ei) => {
            const pct = Math.round((e.passCount / e.total) * 100)
            return (
              <div
                key={ei}
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '3px 0',
                  borderBottom: ei < reviewLog.length - 1 ? '1px solid #1E293B' : 'none',
                  opacity: ei === reviewLog.length - 1 ? 1 : 0.6,
                }}
              >
                <span style={{ color: '#475569', minWidth: '52px' }}>Round {e.iter}</span>
                <span
                  style={{
                    color: pct === 100 ? '#4ADE80' : pct >= 70 ? '#F59E0B' : '#F87171',
                    minWidth: '100px',
                  }}
                >
                  {e.passCount}/{e.total} ({pct}%)
                </span>
                <span style={{ color: C.orange }}>
                  {e.patches} patch{e.patches !== 1 ? 'es' : ''}
                </span>
              </div>
            )
          })}{' '}
        </div>
      )}
      {!formatReviewing && qaAutoSummary && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {[
              {
                n: reviewLog[reviewLog.length - 1]?.passCount || 0,
                l: 'PASSED',
                c: C.green,
                bg: C.greenLt,
                bd: '#86EFAC',
              },
              {
                n: qaAutoSummary.patches,
                l: 'PATCHES',
                c: C.orange,
                bg: C.orangeLt,
                bd: C.orangeMd,
              },
              {
                n: qaAutoSummary.visualTodos.length,
                l: 'TODOs',
                c: C.red,
                bg: C.redLt,
                bd: C.redMd,
              },
            ].map((s) => (
              <div
                key={s.l}
                style={{
                  flex: '1 1 80px',
                  padding: '10px',
                  background: s.bg,
                  border: `1.5px solid ${s.bd}`,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{ fontSize: '24px', fontWeight: 700, fontFamily: SERIF, color: s.c }}
                >
                  {s.n}
                </div>
                <div
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    color: s.c,
                    fontFamily: SANS,
                    letterSpacing: '0.07em',
                  }}
                >
                  {s.l}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              background: 'white',
              border: '1.5px solid #E2E8F0',
              padding: '16px 20px',
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: '13px',
                fontFamily: SERIF,
                color: C.black,
                marginBottom: '12px',
              }}
            >
              Download output
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  const out = { ...lesson, questions: reviewFinal || qs }
                  safeDownload(
                    JSON.stringify(out, null, 2),
                    (lesson.lesson_title || 'lesson').toLowerCase().split(' ').join('-') +
                      '-reviewed.json',
                    'application/json',
                    setJsonPanel
                  )
                }}
                style={BP}
              >
                ↓ Download JSON
              </button>
              <button
                onClick={() => setView('export')}
                style={{
                  ...BP,
                  background: `linear-gradient(135deg,${C.green},${C.greenDk})`,
                }}
              >
                📤 Export Cards
              </button>
              <button onClick={() => setView('preview')} style={BS}>
                👁 Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
