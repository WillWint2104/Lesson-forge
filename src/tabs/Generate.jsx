import { C, SERIF, SANS, MONO, BS, BO, BP } from '../core/ui.jsx'
import { safeDownload } from '../core/workflow.js'

export default function Generate({
  lesson,
  genTopic,
  setGenTopic,
  genSection,
  setGenSection,
  genYear,
  setGenYear,
  genCount,
  setGenCount,
  genDiagIter,
  setGenDiagIter,
  genExemplars,
  setGenExemplars,
  genRunning,
  genStage,
  setGenStage,
  genProgress,
  genLog,
  setGenLog,
  genError,
  setGenError,
  qaAutoSummary,
  handleGenerate,
  setView,
  setJsonPanel,
}) {
  return (
    <div>
      <h2
        style={{
          fontFamily: SERIF,
          fontSize: '20px',
          fontWeight: 700,
          color: '#0F172A',
          marginBottom: '4px',
        }}
      >
        ⚡ Generate Questions
      </h2>
      <p style={{ fontSize: '13px', color: C.slate, marginBottom: '20px' }}>
        Paste exemplar questions → Claude generates, revises diagrams, and runs QA.
      </p>
      {genError && (
        <div
          style={{
            background: C.redLt,
            border: `1px solid ${C.redMd}`,
            padding: '10px 16px',
            marginBottom: '16px',
            fontSize: '13px',
            color: C.red,
            fontFamily: MONO,
          }}
        >
          ⚠ {genError}
        </div>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 70px',
          gap: '10px',
          marginBottom: '14px',
        }}
      >
        <div>
          <label
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: C.slate,
              fontFamily: MONO,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '4px',
            }}
          >
            Topic
          </label>
          <input
            value={genTopic}
            onChange={(e) => setGenTopic(e.target.value)}
            placeholder="e.g. transformations_congruence"
            style={{
              width: '100%',
              padding: '8px 10px',
              border: '1.5px solid #E2E8F0',
              fontFamily: MONO,
              fontSize: '12px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div>
          <label
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: C.slate,
              fontFamily: MONO,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '4px',
            }}
          >
            Section
          </label>
          <input
            value={genSection}
            onChange={(e) => setGenSection(e.target.value)}
            placeholder="e.g. Tessellations"
            style={{
              width: '100%',
              padding: '8px 10px',
              border: '1.5px solid #E2E8F0',
              fontFamily: MONO,
              fontSize: '12px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div>
          <label
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: C.slate,
              fontFamily: MONO,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '4px',
            }}
          >
            Year
          </label>
          <input
            value={genYear}
            onChange={(e) => setGenYear(e.target.value)}
            placeholder="9"
            style={{
              width: '100%',
              padding: '8px 10px',
              border: '1.5px solid #E2E8F0',
              fontFamily: MONO,
              fontSize: '12px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          gap: '20px',
          marginBottom: '14px',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
        }}
      >
        <div>
          <label
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: C.slate,
              fontFamily: MONO,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '4px',
            }}
          >
            Questions
          </label>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[3, 5, 8, 10].map((n) => (
              <button
                key={n}
                onClick={() => setGenCount(n)}
                style={{
                  ...BS,
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontFamily: MONO,
                  borderColor: genCount === n ? C.orange : '#E2E8F0',
                  color: genCount === n ? C.orange : C.slate,
                  fontWeight: genCount === n ? 700 : 400,
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: C.slate,
              fontFamily: MONO,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '4px',
            }}
          >
            Diagram rounds
          </label>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3, 5].map((n) => (
              <button
                key={n}
                onClick={() => setGenDiagIter(n)}
                style={{
                  ...BS,
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontFamily: MONO,
                  borderColor: genDiagIter === n ? C.orange : '#E2E8F0',
                  color: genDiagIter === n ? C.orange : C.slate,
                  fontWeight: genDiagIter === n ? 700 : 400,
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ marginBottom: '14px' }}>
        <label
          style={{
            fontSize: '10px',
            fontWeight: 700,
            color: C.slate,
            fontFamily: MONO,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: '4px',
          }}
        >
          Exemplar questions
        </label>
        <textarea
          value={genExemplars}
          onChange={(e) => setGenExemplars(e.target.value)}
          placeholder={`Paste 1–3 exemplar questions (JSON or plain English):\n"Q: Which shapes tessellate? (MCQ, answer = equilateral triangle)"`}
          style={{
            width: '100%',
            minHeight: '140px',
            padding: '12px 14px',
            border: '1.5px solid #E2E8F0',
            fontFamily: MONO,
            fontSize: '12px',
            lineHeight: 1.7,
            color: C.black,
            resize: 'vertical',
            outline: 'none',
            background: 'white',
            boxSizing: 'border-box',
          }}
        />
      </div>
      {!genRunning && genStage !== 'done' && (
        <button
          onClick={handleGenerate}
          disabled={!genExemplars.trim() || !genTopic.trim()}
          style={{
            ...BO,
            opacity: genExemplars.trim() && genTopic.trim() ? 1 : 0.4,
            cursor: genExemplars.trim() && genTopic.trim() ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          ⚡ Generate &amp; Review
        </button>
      )}
      {genRunning && (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              border: `2.5px solid ${C.orange}`,
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: '13px', fontWeight: 600, color: C.orange, fontFamily: SANS }}>
            {genStage === 'generating'
              ? 'Generating…'
              : genStage === 'diagrams'
                ? `Revising diagrams (iter ${genProgress.iter || 1}/${genDiagIter} ${genProgress.phase || ''})…`
                : genStage === 'qa'
                  ? `QA — ${genProgress.done + 1}/${genProgress.total}…`
                  : 'Running…'}
          </span>
        </div>
      )}
      {genLog.length > 0 && (
        <div
          style={{
            marginTop: '16px',
            background: '#0F172A',
            padding: '12px 16px',
            fontFamily: MONO,
            fontSize: '11px',
            maxHeight: '220px',
            overflowY: 'auto',
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
            Pipeline Log
          </div>
          {genLog.map((entry, ei) => (
            <div
              key={ei}
              style={{
                padding: '2px 0',
                color:
                  entry.type === 'ok'
                    ? '#4ADE80'
                    : entry.type === 'error'
                      ? '#F87171'
                      : entry.type === 'warn'
                        ? '#F59E0B'
                        : '#94A3B8',
                lineHeight: 1.5,
              }}
            >
              <span style={{ opacity: 0.4, marginRight: '8px' }}>
                {new Date(entry.ts).toLocaleTimeString('en-AU', {
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
              {entry.msg}
            </div>
          ))}
        </div>
      )}
      {genStage === 'done' && !genRunning && lesson && (
        <div
          style={{
            marginTop: '16px',
            background: 'white',
            border: `1.5px solid ${C.greenMd}`,
            padding: '16px 20px',
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: '14px',
              fontFamily: SERIF,
              color: C.black,
              marginBottom: '10px',
            }}
          >
            ✅ {lesson.questions?.length || 0} questions ready
            {qaAutoSummary?.patches > 0 && (
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 400,
                  color: C.orange,
                  marginLeft: '10px',
                }}
              >
                · {qaAutoSummary.patches} patches
              </span>
            )}
            {qaAutoSummary?.visualTodos?.length > 0 && (
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 400,
                  color: C.red,
                  marginLeft: '10px',
                }}
              >
                · {qaAutoSummary.visualTodos.length} visual TODOs
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => setView('preview')} style={BP}>
              👁 Preview →
            </button>
            <button onClick={() => setView('validate')} style={BS}>
              ✓ Validate
            </button>
            <button
              onClick={() =>
                safeDownload(
                  JSON.stringify(lesson, null, 2),
                  (lesson.lesson_title || 'generated').toLowerCase().split(' ').join('-') +
                    '.json',
                  'application/json',
                  setJsonPanel
                )
              }
              style={BS}
            >
              ↓ JSON
            </button>
            <button
              onClick={() => {
                setGenStage('')
                setGenLog([])
                setGenError(null)
              }}
              style={{ ...BS, color: C.slate }}
            >
              ↺ Reset
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
