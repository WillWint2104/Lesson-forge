import { useState, useRef, useCallback } from 'react'
import { C, SERIF, SANS, MONO, FONTS, BP, BS } from './core/ui.jsx'
import { validateLesson } from './core/validation.js'
import { QuestionCard } from './core/renderers.jsx'
import { applyPatches, runQAForFrame, generateQuestions, reviseDiagram } from './core/workflow.js'

import Generate from './tabs/Generate.jsx'
import Import from './tabs/Import.jsx'
import Validate from './tabs/Validate.jsx'
import Preview from './tabs/Preview.jsx'
import Answers from './tabs/Answers.jsx'
import QA from './tabs/QA.jsx'
import Export from './tabs/Export.jsx'
import Review from './tabs/Review.jsx'

// Every value `view` can legally hold — used by the dispatcher's
// "unknown tab" fallback below so we render an explicit error
// instead of an empty surface if a typo or stale state ever leaks in.
const KNOWN_VIEWS = new Set([
  'generate',
  'import',
  'validate',
  'preview',
  'answers',
  'qa',
  'export',
  'review',
])

/* ═══════════════════════════════════════════
   APP
═══════════════════════════════════════════ */
export default function App() {
  const [input, setInput] = useState(''),
    [lesson, setLesson] = useState(null),
    [validation, setValidation] = useState(null),
    [view, setView] = useState('import'),
    [title, setTitle] = useState(''),
    [error, setError] = useState(null),
    [copyMsg, setCopyMsg] = useState(null),
    [worksheetMode, setWorksheetMode] = useState(false),
    [jsonPanel, setJsonPanel] = useState(null),
    [formatRevisions, setFormatRevisions] = useState(0),
    [formatReviewing, setFormatReviewing] = useState(false),
    [qaProgress, setQaProgress] = useState({ done: 0, total: 0, iter: 0, of: 0 }),
    [reviewLog, setReviewLog] = useState([]),
    [reviewFinal, setReviewFinal] = useState(null),
    [qaResults, setQaResults] = useState(null),
    [qaAutoSummary, setQaAutoSummary] = useState(null),
    [genExemplars, setGenExemplars] = useState(''),
    [genTopic, setGenTopic] = useState(''),
    [genSection, setGenSection] = useState(''),
    [genYear, setGenYear] = useState('9'),
    [genCount, setGenCount] = useState(5),
    [genDiagIter, setGenDiagIter] = useState(3),
    [genRunning, setGenRunning] = useState(false),
    [genStage, setGenStage] = useState(''),
    [genProgress, setGenProgress] = useState({ done: 0, total: 0, stage: '' }),
    [genLog, setGenLog] = useState([]),
    [genError, setGenError] = useState(null)
  const fileRef = useRef(null),
    qaRefs = useRef({})

  const handleImport = useCallback((raw) => {
    setError(null)
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch (e) {
      setError('Invalid JSON: ' + e.message)
      return
    }
    const val = validateLesson(parsed)
    setLesson(parsed)
    setValidation(val)
    setTitle(parsed.lesson_title || '')
    setReviewLog([])
    setReviewFinal(null)
    setQaResults(null)
    setQaAutoSummary(null)
    setView('validate')
  }, [])

  const handleGenerate = useCallback(async () => {
    setGenRunning(true)
    setGenError(null)
    setGenLog([])
    setGenStage('generating')
    const addLog = (type, msg) => setGenLog((prev) => [...prev, { type, msg, ts: Date.now() }])
    try {
      addLog('info', `Generating ${genCount} questions…`)
      let questions
      try {
        questions = await generateQuestions(genTopic, genSection, genYear, genCount, genExemplars)
        if (!Array.isArray(questions)) throw new Error('Not an array')
        addLog('ok', `Generated ${questions.length} questions`)
      } catch (e) {
        addLog('error', 'Generation failed: ' + e.message)
        setGenError('Generation failed: ' + e.message)
        setGenRunning(false)
        return
      }
      const lessonDraft = {
        lesson_title: (genSection || genTopic) + ' — Generated Set',
        topic: genTopic,
        year: parseInt(genYear) || 9,
        version: '1.0',
        questions,
      }
      setLesson(lessonDraft)
      setValidation(validateLesson(lessonDraft))
      setTitle(lessonDraft.lesson_title)
      await new Promise((res) => setTimeout(res, 800))
      const diagQs = questions
        .map((q, i) => ({ q, i }))
        .filter(({ q }) => q.type === 'diagram' && q.content?.diagram?.type === 'geometry')
      if (diagQs.length > 0) {
        setGenStage('diagrams')
        addLog('info', `Revising ${diagQs.length} diagrams…`)
        for (const { q, i } of diagQs) {
          const el = qaRefs.current[q.id || `idx-${i}`]
          setGenProgress({
            done: i,
            total: diagQs.length,
            stage: 'diagrams',
            qId: q.id,
            iter: 1,
            maxIter: genDiagIter,
          })
          const revised = await reviseDiagram(q, el, genDiagIter, ({ iter, maxIter, phase }) =>
            setGenProgress({
              done: i,
              total: diagQs.length,
              stage: 'diagrams',
              qId: q.id,
              iter,
              maxIter,
              phase,
            })
          )
          questions[i] = revised
          const fp = revised._diag_log?.[revised._diag_log.length - 1]?.pass
          addLog(fp ? 'ok' : 'warn', `Diagram Q${i + 1}: ${fp ? '✓ passed' : '⚠ best effort'}`)
          setLesson((prev) => {
            const nq = [...(prev?.questions || [])]
            nq[i] = questions[i]
            return { ...prev, questions: nq }
          })
          await new Promise((res) => setTimeout(res, 400))
        }
        addLog('ok', 'Diagrams done')
      }
      setGenStage('qa')
      addLog('info', 'Running QA…')
      await new Promise((res) => setTimeout(res, 600))
      let totalPatches = 0
      const allTodos = []
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i],
          el = qaRefs.current[q.id || `idx-${i}`]
        setGenProgress({ done: i, total: questions.length, stage: 'qa' })
        try {
          const result = await runQAForFrame(q, el)
          const patches = (result.issues || []).filter((iss) => iss.patch),
            todos = (result.issues || []).filter((iss) => iss.type === 'visual_todo')
          if (patches.length) {
            questions[i] = applyPatches(
              questions[i],
              patches.map((p) => p.patch)
            )
            totalPatches += patches.length
            addLog(
              'ok',
              `Q${i + 1}: ${patches.length} patch${patches.length !== 1 ? 'es' : ''} applied`
            )
          }
          todos.forEach((t) => allTodos.push({ frameLabel: `Q${i + 1}`, ...t }))
          if (!result.pass && !result._skipped) addLog('warn', `Q${i + 1}: ${result.summary}`)
        } catch (e) {}
      }
      if (totalPatches > 0) addLog('ok', `QA: ${totalPatches} total patches`)
      const finalLesson = {
        ...lessonDraft,
        questions: questions.map((q) => {
          const c = { ...q }
          delete c._diag_log
          return c
        }),
      }
      setLesson(finalLesson)
      setValidation(validateLesson(finalLesson))
      setQaAutoSummary({ rounds: 1, patches: totalPatches, visualTodos: allTodos })
      setGenStage('done')
      addLog('ok', `Done — ${questions.length} questions ready`)
    } catch (e) {
      setGenError('Pipeline error: ' + e.message)
      addLog('error', 'Pipeline error: ' + e.message)
    }
    setGenRunning(false)
  }, [genExemplars, genTopic, genSection, genYear, genCount, genDiagIter])

  const handleFormatAndReview = useCallback(async () => {
    if (!lesson) return
    if (formatRevisions === 0) {
      setView('preview')
      return
    }
    setFormatReviewing(true)
    setView('review')
    setReviewLog([])
    setReviewFinal(null)
    setQaResults(null)
    setQaAutoSummary(null)
    await new Promise((res) => setTimeout(res, 700))
    let questions = [...lesson.questions],
      totalPatches = 0
    const allTodos = [],
      log = []
    for (let iter = 1; iter <= formatRevisions; iter++) {
      setQaProgress({ done: 0, total: questions.length, iter, of: formatRevisions })
      const results = []
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i],
          el = qaRefs.current[q.id || `idx-${i}`]
        try {
          const r = await runQAForFrame(q, el)
          results.push({ frameIdx: i, qId: q.id, frameLabel: `Q${i + 1}`, ...r })
        } catch (e) {
          results.push({
            frameIdx: i,
            qId: q.id,
            frameLabel: `Q${i + 1}`,
            pass: false,
            summary: 'Error',
            issues: [],
          })
        }
        setQaProgress((p) => ({ ...p, done: i + 1 }))
      }
      let iterP = 0
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
          iterP += ps.length
        }
      })
      totalPatches += iterP
      const passCount = results.filter((r) => r.pass).length
      log.push({ iter, passCount, total: questions.length, patches: iterP })
      setReviewLog([...log])
      setLesson((prev) => ({ ...prev, questions: [...questions] }))
      setQaResults(results)
      if (passCount === questions.length && iterP === 0) break
      if (iter < formatRevisions) await new Promise((res) => setTimeout(res, 700))
    }
    setQaAutoSummary({
      rounds: log.length,
      patches: totalPatches,
      visualTodos: allTodos,
      iterLogs: log,
    })
    setReviewFinal([...questions])
    setFormatReviewing(false)
  }, [lesson, formatRevisions])

  const qs = lesson?.questions || [],
    hasLesson = !!lesson
  const tabs = [
    { k: 'generate', l: '⚡ Generate', on: true, accent: C.orange },
    { k: 'import', l: '✏️ Import', on: true },
    {
      k: 'validate',
      l: '✓ Validate',
      on: hasLesson,
      badge: validation
        ? validation.errors.length
          ? { n: validation.errors.length, col: C.red }
          : validation.warnings.length
            ? { n: validation.warnings.length, col: C.orange }
            : { n: '✓', col: C.green }
        : null,
    },
    { k: 'preview', l: '👁 Questions', on: hasLesson },
    { k: 'answers', l: '✅ Answers', on: hasLesson },
    { k: 'qa', l: '🔍 QA', on: hasLesson },
    { k: 'export', l: '📤 Export', on: hasLesson },
  ]

  return (
    <div style={{ fontFamily: SANS, minHeight: '100vh', background: C.cream }}>
      <link href={FONTS} rel="stylesheet" />
      <span
        style={{
          position: 'absolute',
          left: '-9999px',
          fontFamily: "'STIX Two Text',serif",
          fontStyle: 'italic',
          fontSize: '16px',
          opacity: 0,
          pointerEvents: 'none',
        }}
      >
        xyzabcmnpqr
      </span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {jsonPanel && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#0F172A',
            borderTop: `3px solid ${C.green}`,
            zIndex: 1000,
            padding: '12px 24px',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: C.green,
                fontFamily: MONO,
                marginBottom: '4px',
              }}
            >
              {jsonPanel.filename} — copied ✓
            </div>
            <textarea
              readOnly
              value={jsonPanel.content}
              onClick={(e) => e.target.select()}
              style={{
                width: '100%',
                height: '60px',
                fontFamily: MONO,
                fontSize: '10px',
                color: '#94A3B8',
                background: '#1E293B',
                border: '1px solid #334155',
                padding: '6px',
                resize: 'none',
                outline: 'none',
              }}
            />
          </div>
          <button
            onClick={() => {
              try {
                navigator.clipboard.writeText(jsonPanel.content).catch(() => {})
              } catch (e) {}
            }}
            style={{ ...BP, fontSize: '12px', padding: '8px 16px', flexShrink: 0 }}
          >
            📋 Copy
          </button>
          <button
            onClick={() => setJsonPanel(null)}
            style={{ ...BS, fontSize: '12px', padding: '8px 12px', flexShrink: 0 }}
          >
            ✕
          </button>
        </div>
      )}
      <div style={{ background: '#0F172A', padding: '14px 24px', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              background: `linear-gradient(135deg,${C.green},${C.greenDk})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              flexShrink: 0,
            }}
          >
            📐
          </div>
          <div>
            <h1 style={{ fontFamily: SERIF, fontSize: '18px', fontWeight: 700, margin: 0 }}>
              Lesson Formatter{' '}
              <span
                style={{ fontSize: '9px', opacity: 0.5, fontFamily: 'monospace', fontWeight: 400 }}
              >
                v2.3
              </span>
            </h1>
            <p style={{ fontSize: '10px', color: '#94A3B8', fontFamily: MONO, margin: 0 }}>
              {lesson
                ? `${qs.length} questions · ${lesson.topic || ''} · Year ${lesson.year || '?'}`
                : ''}
            </p>
          </div>
        </div>
      </div>
      <div
        style={{
          background: 'white',
          borderBottom: '1px solid #E2E8F0',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'stretch', overflowX: 'auto', padding: '0 8px' }}
        >
          {tabs.map((t) => (
            <button
              key={t.k}
              onClick={() => t.on && setView(t.k)}
              style={{
                padding: '10px 12px',
                background: 'none',
                border: 'none',
                borderBottom:
                  view === t.k ? `3px solid ${t.accent || C.green}` : '3px solid transparent',
                color: view === t.k ? t.accent || C.green : t.on ? C.slate : '#CBD5E1',
                fontWeight: view === t.k ? 700 : 500,
                fontSize: '12px',
                cursor: t.on ? 'pointer' : 'default',
                fontFamily: SANS,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
              }}
            >
              {t.l}
              {t.badge && (
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    color: t.badge.col,
                    fontFamily: MONO,
                    background: t.badge.col + '18',
                    padding: '1px 4px',
                    border: `1px solid ${t.badge.col}40`,
                  }}
                >
                  {t.badge.n}
                </span>
              )}
            </button>
          ))}
          {hasLesson && !formatReviewing && (
            <div
              style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                padding: '0 8px',
              }}
            >
              <button
                onClick={() => setWorksheetMode((v) => !v)}
                style={{
                  padding: '4px 10px',
                  background: worksheetMode ? C.orangeLt : 'none',
                  border: `1px solid ${worksheetMode ? C.orange : '#E2E8F0'}`,
                  color: worksheetMode ? C.orange : C.slate,
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontFamily: SANS,
                }}
              >
                {worksheetMode ? '📖 Textbook' : '📄 Worksheet'}
              </button>
            </div>
          )}
          {formatReviewing && (
            <div
              style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                fontFamily: MONO,
                color: C.orange,
                padding: '0 8px',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  border: `2px solid ${C.orange}`,
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              Round {qaProgress.iter}/{qaProgress.of}
            </div>
          )}
        </div>
      </div>

      {/* Hidden render zone */}
      <div
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '700px',
          pointerEvents: 'none',
          zIndex: -1,
          overflow: 'visible',
        }}
      >
        {qs.map((q, i) => {
          const qId = q.id || `idx-${i}`
          return (
            <div
              key={qId}
              ref={(el) => {
                if (el) qaRefs.current[qId] = el
              }}
              style={{
                background: 'white',
                padding: '16px',
                marginBottom: '4px',
                width: '700px',
                overflow: 'visible',
              }}
            >
              <QuestionCard q={q} index={i} isAnswer={false} worksheet={false} issues={[]} />
              <QuestionCard q={q} index={i} isAnswer={true} worksheet={false} issues={[]} />
            </div>
          )
        })}
      </div>

      <div style={{ padding: '20px 24px' }}>
        {view === 'generate' && (
          <Generate
            lesson={lesson}
            genTopic={genTopic}
            setGenTopic={setGenTopic}
            genSection={genSection}
            setGenSection={setGenSection}
            genYear={genYear}
            setGenYear={setGenYear}
            genCount={genCount}
            setGenCount={setGenCount}
            genDiagIter={genDiagIter}
            setGenDiagIter={setGenDiagIter}
            genExemplars={genExemplars}
            setGenExemplars={setGenExemplars}
            genRunning={genRunning}
            genStage={genStage}
            setGenStage={setGenStage}
            genProgress={genProgress}
            genLog={genLog}
            setGenLog={setGenLog}
            genError={genError}
            setGenError={setGenError}
            qaAutoSummary={qaAutoSummary}
            handleGenerate={handleGenerate}
            setView={setView}
            setJsonPanel={setJsonPanel}
          />
        )}

        {view === 'import' && (
          <Import
            input={input}
            setInput={setInput}
            error={error}
            setError={setError}
            formatRevisions={formatRevisions}
            setFormatRevisions={setFormatRevisions}
            handleImport={handleImport}
            fileRef={fileRef}
            setLesson={setLesson}
            setValidation={setValidation}
            setView={setView}
          />
        )}

        {view === 'validate' && lesson && validation && (
          <Validate
            lesson={lesson}
            validation={validation}
            qs={qs}
            formatRevisions={formatRevisions}
            handleFormatAndReview={handleFormatAndReview}
            setView={setView}
          />
        )}

        {view === 'preview' && lesson && (
          <Preview
            lesson={lesson}
            qs={qs}
            title={title}
            validation={validation}
            worksheetMode={worksheetMode}
            setView={setView}
          />
        )}

        {view === 'answers' && lesson && (
          <Answers
            lesson={lesson}
            qs={qs}
            title={title}
            qaAutoSummary={qaAutoSummary}
            worksheetMode={worksheetMode}
            setView={setView}
          />
        )}

        {view === 'qa' && lesson && (
          <QA
            lesson={lesson}
            setLesson={setLesson}
            qaResults={qaResults}
            setQaResults={setQaResults}
            qaRefs={qaRefs}
          />
        )}

        {view === 'export' && lesson && (
          <Export
            lesson={lesson}
            qs={qs}
            qaAutoSummary={qaAutoSummary}
            worksheetMode={worksheetMode}
            copyMsg={copyMsg}
            setCopyMsg={setCopyMsg}
            setJsonPanel={setJsonPanel}
            setView={setView}
          />
        )}

        {view === 'review' && (
          <Review
            lesson={lesson}
            qs={qs}
            qaProgress={qaProgress}
            qaAutoSummary={qaAutoSummary}
            reviewLog={reviewLog}
            reviewFinal={reviewFinal}
            formatReviewing={formatReviewing}
            setView={setView}
            setJsonPanel={setJsonPanel}
          />
        )}

        {!KNOWN_VIEWS.has(view) && (
          <div
            style={{
              padding: '40px 24px',
              textAlign: 'center',
              fontFamily: SANS,
              color: C.slate,
            }}
          >
            <div
              style={{
                fontSize: '14px',
                fontWeight: 700,
                fontFamily: MONO,
                color: C.red,
                marginBottom: '6px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Tab not found
            </div>
            <div style={{ fontSize: '13px' }}>
              Unknown view: <code style={{ fontFamily: MONO }}>{String(view)}</code>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
