import { C, SERIF, MONO, BP } from '../core/ui.jsx'
import { QuestionCard } from '../core/renderers.jsx'

export default function Preview({ lesson, qs, title, validation, worksheetMode, setView }) {
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
            {title || lesson.lesson_title}
          </h2>
          <p style={{ fontSize: '11px', color: C.slate, fontFamily: MONO, margin: '4px 0 0' }}>
            {qs.length} questions · Year {lesson.year || '?'}
          </p>
        </div>
        <button onClick={() => setView('answers')} style={BP}>
          Answers →
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {qs.map((q, i) => (
          <QuestionCard
            key={q.id || i}
            q={q}
            index={i}
            isAnswer={false}
            worksheet={worksheetMode}
            issues={[...(validation?.errors || []), ...(validation?.warnings || [])]}
          />
        ))}
      </div>
    </div>
  )
}
