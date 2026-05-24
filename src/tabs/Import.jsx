import { C, SERIF, SANS, MONO, BP, BS } from '../core/ui.jsx'
import { TYPE_META } from '../core/schema.js'

/* Sample JSON */
const SAMPLE_JSON = JSON.stringify(
  {
    lesson_title: 'Tessellations — Set A',
    topic: 'transformations_congruence',
    year: 9,
    version: '1.0',
    questions: [
      {
        id: 'T1',
        type: 'mcq',
        section: 'Tessellations',
        instruction: 'Which best describes a tessellation?',
        content: {
          options: [
            { key: 'A', text: 'Shapes joined together' },
            { key: 'B', text: 'Shapes stacked on top of each other' },
            { key: 'C', text: 'Shapes arranged with no overlaps and no gaps' },
            { key: 'D', text: 'Shapes forming an attractive pattern' },
          ],
        },
        answer: {
          correct: 'C',
          explanation: 'A tessellation covers a plane with no gaps and no overlaps.',
        },
        meta: { difficulty: 'easy' },
      },
      {
        id: 'T2',
        type: 'classify',
        section: 'Tessellations',
        instruction: 'Which shapes tessellate by themselves?',
        content: {
          categories: ['Tessellates', 'Does not tessellate'],
          items: [
            'Equilateral triangle',
            'Circle',
            'Square',
            'Regular hexagon',
            'Regular pentagon',
            'Rectangle',
          ],
        },
        answer: {
          mapping: {
            'Equilateral triangle': 'Tessellates',
            Circle: 'Does not tessellate',
            Square: 'Tessellates',
            'Regular hexagon': 'Tessellates',
            'Regular pentagon': 'Does not tessellate',
            Rectangle: 'Tessellates',
          },
        },
        meta: { difficulty: 'medium' },
      },
      {
        id: 'T3',
        type: 'short_answer',
        section: 'Tessellations',
        instruction: 'Explain why circles cannot form a tessellation.',
        content: { parts: [] },
        answer: {
          responses: [
            {
              label: '',
              text: 'Circles have curved edges that leave gaps when fitted together. A tessellation requires no gaps and no overlaps.',
            },
          ],
        },
        meta: { difficulty: 'medium' },
      },
      {
        id: 'T4',
        type: 'short_answer',
        section: 'Tessellations',
        instruction: 'Name the following semi-regular tessellations using vertex notation.',
        content: {
          parts: [
            {
              label: 'a',
              prompt: 'Three equilateral triangles and two squares meet at each vertex.',
            },
            { label: 'b', prompt: 'One square and two regular octagons meet at each vertex.' },
            {
              label: 'c',
              prompt: 'One triangle, two squares and one hexagon meet at each vertex.',
            },
          ],
        },
        answer: {
          responses: [
            { label: 'a', text: '3.3.3.4.4' },
            { label: 'b', text: '4.8.8' },
            { label: 'c', text: '3.4.6.4' },
          ],
        },
        meta: { difficulty: 'hard' },
      },
      {
        id: 'T5',
        type: 'diagram',
        section: 'Tessellations',
        instruction:
          'The diagram shows three regular hexagons meeting at a point. Use the diagram to explain why regular hexagons tessellate.',
        content: {
          diagram: {
            type: 'geometry',
            data: {
              width: 280,
              height: 240,
              grid: 'iso',
              grid_size: 28,
              shapes: [
                { shape: 'regular_polygon', sides: 6, cx: 140, cy: 120, radius: 72, fill: true },
                { shape: 'regular_polygon', sides: 6, cx: 202, cy: 182, radius: 72, fill: true },
                { shape: 'regular_polygon', sides: 6, cx: 78, cy: 182, radius: 72, fill: true },
              ],
              angles: [
                { cx: 140, cy: 182, from_deg: 330, to_deg: 90, radius: 22, label: '120°' },
                { cx: 140, cy: 182, from_deg: 90, to_deg: 210, radius: 22 },
                { cx: 140, cy: 182, from_deg: 210, to_deg: 330, radius: 22 },
              ],
              points: [{ x: 140, y: 182, label: 'V', label_pos: 'above' }],
              labels: [
                { x: 140, y: 50, text: 'Each interior angle = 120°', size: 10, color: '#1E293B' },
                {
                  x: 140,
                  y: 222,
                  text: '3 × 120° = 360° ✓',
                  size: 11,
                  bold: true,
                  color: '#3D9A7E',
                },
              ],
            },
          },
        },
        answer: {
          text: 'Each interior angle of a regular hexagon is 120°. At vertex V, three hexagons meet: 3 × 120° = 360°, which fills exactly the space around a point with no gap and no overlap. Therefore regular hexagons tessellate.',
        },
        meta: { difficulty: 'medium' },
      },
    ],
  },
  null,
  2
)

export default function Import({
  input,
  setInput,
  error,
  setError,
  formatRevisions,
  setFormatRevisions,
  handleImport,
  fileRef,
  setLesson,
  setValidation,
  setView,
}) {
  return (
    <div>
      <h2
        style={{
          fontFamily: SERIF,
          fontSize: '20px',
          fontWeight: 700,
          color: '#0F172A',
          marginBottom: '14px',
        }}
      >
        Import JSON
      </h2>
      {error && (
        <div
          style={{
            background: C.redLt,
            border: `1px solid ${C.redMd}`,
            padding: '10px 16px',
            marginBottom: '12px',
            fontSize: '13px',
            color: C.red,
            fontFamily: MONO,
          }}
        >
          ⚠ {error}
        </div>
      )}
      <textarea
        value={input}
        onChange={(e) => {
          setInput(e.target.value)
          setError(null)
        }}
        placeholder="Paste your lesson JSON here…"
        style={{
          width: '100%',
          minHeight: '260px',
          padding: '14px 16px',
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
      <div
        style={{
          display: 'flex',
          gap: 0,
          marginTop: '12px',
          alignItems: 'stretch',
          flexWrap: 'wrap',
          rowGap: '8px',
        }}
      >
        <button
          onClick={() => input.trim() && handleImport(input)}
          disabled={!input.trim()}
          style={{
            ...BP,
            opacity: input.trim() ? 1 : 0.4,
            cursor: input.trim() ? 'pointer' : 'default',
          }}
        >
          {formatRevisions > 0 ? `Import & Review (${formatRevisions}×) →` : 'Import →'}
        </button>
        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            border: '1.5px solid #E2E8F0',
            borderLeft: 'none',
            background: 'white',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '0 8px',
              borderRight: '1px solid #E2E8F0',
            }}
          >
            <div
              style={{
                fontSize: '9px',
                fontWeight: 700,
                color: '#94A3B8',
                letterSpacing: '0.07em',
                fontFamily: SANS,
                textTransform: 'uppercase',
              }}
            >
              Auto-review
            </div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: formatRevisions > 0 ? C.green : '#94A3B8',
                fontFamily: MONO,
              }}
            >
              {formatRevisions === 0 ? 'off' : `${formatRevisions}×`}
            </div>
          </div>
          <button
            onClick={() => setFormatRevisions((v) => Math.max(0, v - 1))}
            style={{
              width: '28px',
              background: 'white',
              border: 'none',
              borderRight: '1px solid #E2E8F0',
              color: formatRevisions > 0 ? C.black : '#CBD5E1',
              fontSize: '14px',
              cursor: formatRevisions > 0 ? 'pointer' : 'default',
              fontWeight: 700,
            }}
          >
            −
          </button>
          <button
            onClick={() => setFormatRevisions((v) => Math.min(5, v + 1))}
            style={{
              width: '28px',
              background: 'white',
              border: 'none',
              color: formatRevisions < 5 ? C.black : '#CBD5E1',
              fontSize: '14px',
              cursor: formatRevisions < 5 ? 'pointer' : 'default',
              fontWeight: 700,
            }}
          >
            +
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
        <button onClick={() => fileRef.current?.click()} style={BS}>
          📁 Import File
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files[0]
            if (!f) return
            const r = new FileReader()
            r.onload = (ev) => setInput(ev.target.result)
            r.readAsText(f)
            e.target.value = ''
          }}
        />
        <button
          onClick={() => setInput(SAMPLE_JSON)}
          style={{ ...BS, color: '#2563EB', borderColor: '#BFDBFE' }}
        >
          🔷 Tessellations Example
        </button>
        {input.trim() && (
          <button
            onClick={() => {
              setInput('')
              setError(null)
              setLesson(null)
              setValidation(null)
              setView('import')
            }}
            style={{ ...BS, color: C.red, borderColor: C.redMd }}
          >
            ✕ Clear
          </button>
        )}
      </div>
      <div
        style={{
          marginTop: '20px',
          background: 'white',
          border: '1px solid #E2E8F0',
          padding: '14px 18px',
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: '13px',
            color: C.black,
            fontFamily: SERIF,
            marginBottom: '8px',
          }}
        >
          Question types
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))',
            gap: '6px',
          }}
        >
          {Object.entries(TYPE_META).map(([type, m]) => (
            <div
              key={type}
              style={{
                padding: '6px 10px',
                background: C.slateXlt,
                border: '1px solid #E2E8F0',
                fontFamily: MONO,
                fontSize: '11px',
                color: C.black,
              }}
            >
              {m.icon} <strong>{type}</strong>
              <div style={{ fontSize: '10px', color: C.slate, marginTop: '1px' }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
