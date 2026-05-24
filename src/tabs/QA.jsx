import { useState, useRef, useCallback } from 'react'
import { C, SERIF, SANS, MONO, BS, BO } from '../core/ui.jsx'
import { runQAForFrame, applyPatches } from '../core/workflow.js'

/* ═══════════════════════════════════════════
   QA PANEL
═══════════════════════════════════════════ */
function QAPanel({ lesson, setLesson, qaResults, setQaResults, qaRefs }) {
  const [running, setRunning] = useState(false),
    [progress, setProgress] = useState({ done: 0, total: 0, iter: 0, of: 0 }),
    [passTarget, setPassTarget] = useState(90),
    [maxIter, setMaxIter] = useState(3),
    [iterLog, setIterLog] = useState([]),
    [visualTodos, setVisualTodos] = useState([])
  const stopRef = useRef(false)
  const run = useCallback(async () => {
    stopRef.current = false
    setRunning(true)
    setQaResults(null)
    setIterLog([])
    setVisualTodos([])
    let questions = [...lesson.questions]
    const allTodos = []
    for (let iter = 1; iter <= maxIter; iter++) {
      if (stopRef.current) break
      setProgress({ done: 0, total: questions.length, iter, of: maxIter })
      const results = []
      for (let i = 0; i < questions.length; i++) {
        if (stopRef.current) break
        const q = questions[i],
          qId = q.id || `idx-${i}`,
          el = qaRefs.current[qId]
        try {
          const r = await runQAForFrame(q, el)
          results.push({ frameIdx: i, qId, frameLabel: `Q${i + 1}`, ...r })
        } catch (e) {
          results.push({
            frameIdx: i,
            qId,
            frameLabel: `Q${i + 1}`,
            pass: false,
            summary: 'Error',
            issues: [],
          })
        }
        setProgress((p) => ({ ...p, done: i + 1 }))
      }
      let patches = 0
      results.forEach((r) => {
        ;(r.issues || []).forEach((iss) => {
          if (iss.type === 'visual_todo') allTodos.push({ frameLabel: r.frameLabel, ...iss })
        })
        const ps = (r.issues || []).filter((i) => i.patch)
        if (ps.length) {
          questions[r.frameIdx] = applyPatches(
            questions[r.frameIdx],
            ps.map((i) => i.patch)
          )
          patches += ps.length
        }
      })
      const passCount = results.filter((r) => r.pass).length,
        pct = Math.round((passCount / results.length) * 100)
      setIterLog((p) => [...p, { iter, passCount, total: results.length, patches, pct }])
      setQaResults(results)
      if (patches > 0) setLesson((prev) => ({ ...prev, questions: [...questions] }))
      setVisualTodos([...allTodos])
      if (pct >= passTarget && patches === 0) break
      if (iter < maxIter) await new Promise((res) => setTimeout(res, 700))
    }
    setRunning(false)
  }, [lesson, maxIter, passTarget, qaRefs, setQaResults, setLesson])
  const passCount = qaResults ? qaResults.filter((r) => r.pass).length : 0,
    total = qaResults ? qaResults.length : 0,
    pct = total ? Math.round((passCount / total) * 100) : 0
  return (
    <div>
      <div
        style={{
          background: 'white',
          border: '1.5px solid #E2E8F0',
          padding: '14px 18px',
          marginBottom: '18px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '18px',
          alignItems: 'center',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '9px',
              fontWeight: 700,
              color: C.slate,
              fontFamily: MONO,
              letterSpacing: '0.07em',
              marginBottom: '4px',
              textTransform: 'uppercase',
            }}
          >
            Pass target
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[70, 80, 90, 100].map((v) => (
              <button
                key={v}
                onClick={() => setPassTarget(v)}
                style={{
                  ...BS,
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontFamily: MONO,
                  borderColor: passTarget === v ? C.orange : '#E2E8F0',
                  color: passTarget === v ? C.orange : C.slate,
                  fontWeight: passTarget === v ? 700 : 400,
                }}
              >
                {v}%
              </button>
            ))}
          </div>
        </div>
        <div style={{ width: '1px', height: '34px', background: '#E2E8F0' }} />
        <div>
          <div
            style={{
              fontSize: '9px',
              fontWeight: 700,
              color: C.slate,
              fontFamily: MONO,
              letterSpacing: '0.07em',
              marginBottom: '4px',
              textTransform: 'uppercase',
            }}
          >
            Max rounds
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3, 5].map((v) => (
              <button
                key={v}
                onClick={() => setMaxIter(v)}
                style={{
                  ...BS,
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontFamily: MONO,
                  borderColor: maxIter === v ? C.orange : '#E2E8F0',
                  color: maxIter === v ? C.orange : C.slate,
                  fontWeight: maxIter === v ? 700 : 400,
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          {running ? (
            <button
              onClick={() => {
                stopRef.current = true
              }}
              style={{ ...BS, color: C.red, borderColor: C.redMd }}
            >
              ⏹ Stop
            </button>
          ) : (
            <button onClick={run} style={BO}>
              {qaResults ? '↺ Re-run' : '▶ Run QA'}
            </button>
          )}
        </div>
      </div>
      {running && (
        <div style={{ marginBottom: '14px' }}>
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
              Round {progress.iter}/{progress.of}
            </span>
            <span>
              {progress.done}/{progress.total}
            </span>
          </div>
          <div style={{ height: '6px', background: C.slateLt }}>
            <div
              style={{
                height: '100%',
                background: `linear-gradient(90deg,${C.orange},#F59E0B)`,
                width: `${progress.total ? Math.round((progress.done / progress.total) * 100) : 0}%`,
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>
      )}
      {iterLog.length > 0 && (
        <div
          style={{
            background: '#0F172A',
            padding: '12px 16px',
            marginBottom: '14px',
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
            Log
          </div>
          {iterLog.map((e, ei) => (
            <div
              key={ei}
              style={{
                display: 'flex',
                gap: '12px',
                padding: '3px 0',
                borderBottom: ei < iterLog.length - 1 ? '1px solid #1E293B' : 'none',
                opacity: ei === iterLog.length - 1 ? 1 : 0.6,
              }}
            >
              <span style={{ color: '#475569', minWidth: '48px' }}>round {e.iter}</span>
              <span
                style={{ color: e.pct === 100 ? '#4ADE80' : e.pct >= 70 ? '#F59E0B' : '#F87171' }}
              >
                {e.passCount}/{e.total} ({e.pct}%)
              </span>
              <span style={{ color: C.orange }}>
                {e.patches} patch{e.patches !== 1 ? 'es' : ''}
              </span>
            </div>
          ))}
        </div>
      )}
      {qaResults && !running && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
          <div
            style={{
              flex: '1 1 80px',
              padding: '12px',
              background: C.greenLt,
              border: '1.5px solid #86EFAC',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: SERIF, color: '#15803D' }}>
              {passCount}
            </div>
            <div
              style={{
                fontSize: '9px',
                fontWeight: 700,
                color: '#15803D',
                fontFamily: SANS,
                letterSpacing: '0.06em',
              }}
            >
              PASSED
            </div>
          </div>
          <div
            style={{
              flex: '2 1 160px',
              background: 'white',
              border: `1.5px solid ${pct >= passTarget ? '#86EFAC' : '#E2E8F0'}`,
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '5px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '10px',
                fontFamily: MONO,
                color: C.slate,
              }}
            >
              <span>{pct}% passing</span>
              <span style={{ color: pct >= passTarget ? '#15803D' : C.orange }}>
                target {passTarget}%{pct >= passTarget ? ' ✓' : ''}
              </span>
            </div>
            <div style={{ height: '6px', background: C.slateLt, position: 'relative' }}>
              <div
                style={{
                  height: '100%',
                  background:
                    pct >= passTarget ? '#4ADE80' : `linear-gradient(90deg,${C.orange},#F59E0B)`,
                  width: pct + '%',
                  transition: 'width 0.4s',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: passTarget + '%',
                  width: '2px',
                  background: C.orange,
                  opacity: 0.5,
                }}
              />
            </div>
          </div>
        </div>
      )}
      {visualTodos.length > 0 && (
        <div
          style={{
            background: C.redLt,
            border: `1.5px solid ${C.redMd}`,
            padding: '12px 16px',
            marginBottom: '14px',
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: '12px',
              color: C.red,
              fontFamily: SANS,
              marginBottom: '7px',
            }}
          >
            ⚠ Visual TODOs
          </div>
          {visualTodos.map((t, ti) => (
            <div key={ti} style={{ display: 'flex', gap: '10px', padding: '4px 0' }}>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: '10px',
                  color: '#F87171',
                  minWidth: '60px',
                  flexShrink: 0,
                }}
              >
                {t.frameLabel}
              </span>
              <span style={{ fontSize: '12px', color: '#7F1D1D', fontFamily: SANS }}>
                {t.description}
              </span>
            </div>
          ))}
        </div>
      )}
      {qaResults && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {qaResults.map((r) => {
            const blocking = (r.issues || []).filter((i) => i.severity === 'blocking'),
              major = (r.issues || []).filter((i) => i.severity === 'major'),
              minor = (r.issues || []).filter((i) => i.severity === 'minor'),
              patches = (r.issues || []).filter((i) => i.patch)
            return (
              <div
                key={r.qId}
                style={{
                  border: `1.5px solid ${r.pass ? '#86EFAC' : blocking.length ? '#DC2626' : major.length ? C.orange : C.redMd}`,
                  background: r.pass ? '#F9FEFB' : '#FFFAFA',
                  padding: '8px 12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontWeight: 700,
                      fontSize: '11px',
                      color: r.pass ? '#15803D' : blocking.length ? C.red : C.orange,
                      minWidth: '50px',
                    }}
                  >
                    {r.pass ? '✓' : '✗'} {r.frameLabel}
                  </span>
                  {!r._hasImage && (
                    <span
                      style={{
                        fontSize: '9px',
                        fontFamily: MONO,
                        color: '#94A3B8',
                        background: '#F1F5F9',
                        padding: '1px 5px',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      no screenshot
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: '12px',
                      color: C.slate,
                      fontFamily: SANS,
                      flex: 1,
                      lineHeight: 1.4,
                    }}
                  >
                    {r.summary}
                    {r._skipped ? ' (skipped)' : ''}
                  </span>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {blocking.length > 0 && (
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          color: 'white',
                          fontFamily: MONO,
                          background: C.red,
                          padding: '2px 6px',
                        }}
                      >
                        🔴 {blocking.length}
                      </span>
                    )}
                    {major.length > 0 && (
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          color: 'white',
                          fontFamily: MONO,
                          background: C.orange,
                          padding: '2px 6px',
                        }}
                      >
                        🟠 {major.length}
                      </span>
                    )}
                    {patches.length > 0 && (
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          color: C.greenDk,
                          fontFamily: MONO,
                          background: C.greenLt,
                          border: `1px solid ${C.greenMd}`,
                          padding: '2px 5px',
                        }}
                      >
                        {patches.length}× patched
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {!qaResults && !running && (
        <div
          style={{
            border: '2px dashed #FDE68A',
            background: C.orangeLt,
            padding: '44px 28px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔍</div>
          <div
            style={{
              fontFamily: SERIF,
              fontSize: '18px',
              fontWeight: 600,
              color: C.orange,
              marginBottom: '6px',
            }}
          >
            QA Inspector
          </div>
          <div
            style={{
              fontSize: '13px',
              color: '#92400E',
              maxWidth: '340px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Screenshots each card, sends image + JSON to Claude. Patches data errors, logs visual
            TODOs.
          </div>
        </div>
      )}
    </div>
  )
}

export default function QA({ lesson, setLesson, qaResults, setQaResults, qaRefs }) {
  return (
    <QAPanel
      lesson={lesson}
      setLesson={setLesson}
      qaResults={qaResults}
      setQaResults={setQaResults}
      qaRefs={qaRefs}
    />
  )
}
