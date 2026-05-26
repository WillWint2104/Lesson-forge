import { C, SERIF, MONO, BP, BS } from '../core/ui.jsx'
import { QuestionCard } from '../core/renderers.jsx'
import { safeDownload } from '../core/workflow.js'

export default function Export({
  lesson,
  qs,
  qaAutoSummary,
  worksheetMode,
  copyMsg,
  setCopyMsg,
  setJsonPanel,
  setView,
}) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: SERIF,
              fontSize: '20px',
              fontWeight: 700,
              color: '#0F172A',
              marginBottom: '2px',
            }}
          >
            Export
          </h2>
          <p style={{ fontSize: '12px', color: C.slate, margin: 0 }}>
            Right-click any card → Save Image As.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {qaAutoSummary && (
            <button
              onClick={() => setView('review')}
              style={{ ...BS, fontSize: '12px', padding: '7px 12px' }}
            >
              ← Review
            </button>
          )}
          <button
            onClick={() => setView('answers')}
            style={{ ...BS, fontSize: '12px', padding: '7px 12px' }}
          >
            ← Answers
          </button>
        </div>
      </div>
      <div style={{ background: '#0F172A', padding: '12px 16px', marginBottom: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '6px',
          }}
        >
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#94A3B8',
              fontFamily: MONO,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
            }}
          >
            {lesson.lesson_title || 'Lesson'} — JSON
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => {
                const json = JSON.stringify(lesson, null, 2)
                navigator.clipboard
                  .writeText(json)
                  .then(() => {
                    setCopyMsg('✓ Copied!')
                    setTimeout(() => setCopyMsg(null), 2000)
                  })
                  .catch(() => {
                    setCopyMsg('✗ Failed')
                    setTimeout(() => setCopyMsg(null), 3000)
                  })
              }}
              style={{ ...BP, fontSize: '11px', padding: '5px 12px' }}
            >
              {copyMsg || '📋 Copy JSON'}
            </button>
            <button
              onClick={() =>
                safeDownload(
                  JSON.stringify(lesson, null, 2),
                  (lesson.lesson_title || 'lesson').toLowerCase().split(' ').join('-') + '.json',
                  'application/json',
                  setJsonPanel
                )
              }
              style={{ ...BS, fontSize: '11px', padding: '5px 12px' }}
            >
              ↓ Download
            </button>
          </div>
        </div>
        <textarea
          readOnly
          value={JSON.stringify(lesson, null, 2)}
          onClick={(e) => e.target.select()}
          style={{
            width: '100%',
            height: '80px',
            fontFamily: MONO,
            fontSize: '10px',
            color: '#94A3B8',
            background: '#1E293B',
            border: '1px solid #334155',
            padding: '6px',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
            cursor: 'text',
          }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {qs.map((q, i) => (
          <div key={q.id || i}>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: C.slate,
                fontFamily: MONO,
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Q{i + 1} — Question
            </div>
            <QuestionCard
              q={q}
              index={i}
              isAnswer={false}
              worksheet={worksheetMode}
              issues={[]}
              year={lesson?.year}
            />
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: C.slate,
                fontFamily: MONO,
                margin: '4px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Q{i + 1} — Answer
            </div>
            <QuestionCard
              q={q}
              index={i}
              isAnswer={true}
              worksheet={worksheetMode}
              issues={[]}
              year={lesson?.year}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
