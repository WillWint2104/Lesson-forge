import { C, SERIF, MONO, BP, BS } from '../core/ui.jsx'
import { QuestionCard } from '../core/renderers.jsx'

export default function Answers({ lesson, qs, title, qaAutoSummary, worksheetMode, setView }) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
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
            {title || lesson.lesson_title} — Answers
          </h2>
          <p style={{ fontSize: '11px', color: C.slate, fontFamily: MONO, margin: '4px 0 0' }}>
            {qs.length} questions
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {qaAutoSummary && (
            <button
              onClick={() => setView('review')}
              style={{ ...BS, fontSize: '12px', padding: '8px 14px' }}
            >
              ← Review
            </button>
          )}
          <button onClick={() => setView('preview')} style={BS}>
            ← Questions
          </button>
          <button onClick={() => setView('export')} style={BP}>
            Export →
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {qs.map((q, i) => (
          <QuestionCard
            key={q.id || i}
            q={q}
            index={i}
            isAnswer={true}
            worksheet={worksheetMode}
            issues={[]}
            year={lesson?.year}
            topic={lesson?.topic}
          />
        ))}
      </div>
    </div>
  )
}
