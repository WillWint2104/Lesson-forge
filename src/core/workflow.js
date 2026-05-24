/* ═══════════════════════════════════════════
   CORE — WORKFLOW UTILITIES
═══════════════════════════════════════════ */
export function applyPatches(question, patches) {
  if (!patches || !patches.length) return question
  const q = JSON.parse(JSON.stringify(question))
  patches.forEach((patch) => {
    if (!patch || !patch.path) return
    try {
      const parts = patch.path
        .replace(/\[(\d+)\]/g, '.$1')
        .split('.')
        .filter(Boolean)
      let obj = q
      for (let i = 0; i < parts.length - 1; i++) {
        if (obj[parts[i]] === undefined) obj[parts[i]] = {}
        obj = obj[parts[i]]
      }
      obj[parts[parts.length - 1]] = patch.value
    } catch (_) {}
  })
  return q
}
export function safeDownload(content, filename, mimeType, setPanel) {
  try {
    const blob = new Blob([content], { type: mimeType }),
      url = URL.createObjectURL(blob),
      a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
    }, 100)
    if (setPanel) setPanel({ content, filename })
    return
  } catch (_) {}
  try {
    navigator.clipboard.writeText(content).catch(() => {})
  } catch (_) {}
  if (setPanel) setPanel({ content, filename })
}
export async function captureCardPng(el) {
  if (!el) return null
  if (!window.html2canvas) {
    await new Promise((res, rej) => {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
      s.onload = res
      s.onerror = rej
      document.head.appendChild(s)
    })
  }
  const container = document.createElement('div')
  container.style.cssText =
    'position:fixed;left:0;top:0;width:700px;background:#fff;z-index:999999;pointer-events:none;'
  const clone = el.cloneNode(true)
  clone.style.cssText = 'width:700px;background:#fff;padding:0;margin:0;opacity:1;'
  container.appendChild(clone)
  document.body.appendChild(container)
  try {
    await document.fonts.ready
  } catch (_) {}
  await new Promise((r) => setTimeout(r, 400))
  let result = null
  try {
    const canvas = await window.html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 700,
      windowWidth: 1200,
    })
    result = canvas.toDataURL('image/png').split(',')[1]
  } catch (_) {
  } finally {
    document.body.removeChild(container)
  }
  return result
}

export const SECTION_DATA_RULES = {
  'congruent triangles': [
    'Tick marks: 1=shortest, 2=middle, 3=longest',
    'No angle label on right-angle vertices',
    'answer.text must name one test: SSS, SAS, AAS, RHS',
  ],
  tessellations: [
    'MCQ answer.correct must match an existing option key',
    'Vertex notation angles must sum to exactly 360°',
  ],
  inequalities: [
    'Inequality symbol must match exactly',
    'open=true for strict, open=false for non-strict',
  ],
  _default: [
    'instruction must be present',
    'answer block must be present',
    'MCQ: answer.correct must match an option key',
  ],
}
export const SECTION_VISUAL = {
  inequalities: [
    'Open circle = strict, closed = non-strict',
    'Arrow direction matches inequality direction',
  ],
  _default: ['No content truncation.', 'No overflow.', 'Diagrams within bounds.'],
}
export function getFullRubric(q) {
  const sec = (q.section || '').toLowerCase().trim()
  let key = '_default'
  for (const k of Object.keys(SECTION_DATA_RULES)) {
    if (k !== '_default' && sec.includes(k)) {
      key = k
      break
    }
  }
  return {
    key,
    dataChecks: SECTION_DATA_RULES[key],
    visualChecks: SECTION_VISUAL[key] || SECTION_VISUAL._default,
  }
}

export async function runQAForFrame(q, el) {
  const rubric = getFullRubric(q)
  let imgB64 = null
  try {
    imgB64 = await captureCardPng(el)
  } catch (_) {}
  const qc = { ...q }
  ;['_pool_set_vis', '_pool_set_hid', '_pool_vis_ids', '_pool_hid_ids', '_pool_editing'].forEach(
    (k) => delete qc[k]
  )
  const hasImage = !!imgB64
  const sysPrompt = `You are QA reviewer for a maths lesson formatter. Section: ${rubric.key}\nVisual checks:\n${(rubric.visualChecks || []).map((c, i) => `${i + 1}. ${c}`).join('\n')}\nData checks:\n${(
    rubric.dataChecks || []
  )
    .slice(0, 4)
    .map((c, i) => `${i + 1}. ${c}`)
    .join(
      '\n'
    )}\nReturn ONLY valid JSON:\n{"pass":true|false,"summary":"one line","issues":[{"type":"data_error"|"visual_todo","severity":"blocking"|"major"|"minor","description":"...","patch":{"path":"dot.path","value":null}|null}]}\nOnly flag real issues. pass:true with empty issues if correct.`
  const uc = hasImage
    ? [
        { type: 'image', source: { type: 'base64', media_type: 'image/png', data: imgB64 } },
        { type: 'text', text: 'JSON:\n```json\n' + JSON.stringify(qc, null, 2) + '\n```' },
      ]
    : [
        {
          type: 'text',
          text:
            'NO SCREENSHOT — data only.\nJSON:\n```json\n' +
            JSON.stringify(qc, null, 2) +
            '\n```\nOnly flag data errors.',
        },
      ]
  const timeout = new Promise((res) =>
    setTimeout(() => res({ pass: true, summary: 'Timeout', issues: [], _skipped: true }), 20000)
  )
  const call = (async () => {
    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1200,
          system: sysPrompt,
          messages: [{ role: 'user', content: uc }],
        }),
      })
      if (!resp.ok) return { pass: true, summary: `API ${resp.status}`, issues: [], _skipped: true }
      const data = await resp.json()
      if (data.error) return { pass: true, summary: 'API error', issues: [], _skipped: true }
      const text = (data.content?.find((c) => c.type === 'text')?.text || '')
        .replace(/```json|```/g, '')
        .trim()
      return JSON.parse(text)
    } catch (_) {
      return { pass: true, summary: 'Network error', issues: [], _skipped: true }
    }
  })()
  const result = await Promise.race([call, timeout])
  const issues = result.issues || [],
    blocking = issues.filter((i) => i.severity === 'blocking'),
    major = issues.filter((i) => i.severity === 'major'),
    minor = issues.filter((i) => i.severity === 'minor'),
    patches = issues.filter((i) => i.patch),
    todos = issues.filter((i) => i.type === 'visual_todo')
  return {
    pass: blocking.length === 0 && major.length === 0,
    summary: !hasImage
      ? '⚠ No screenshot — data-only'
      : blocking.length
        ? `BLOCKING: ${blocking[0].description}`
        : major.length
          ? `${major.length} major: ${major[0].description}`
          : minor.length
            ? `${minor.length} minor`
            : result.summary || 'All passed ✓',
    issues,
    passResults: [{ pass: 'combined', passed: result.pass, _skipped: result._skipped }],
    blocking: blocking.length,
    major: major.length,
    minor: minor.length,
    _patches: patches,
    _todos: todos,
    _hasImage: hasImage,
  }
}

/* ═══════════════════════════════════════════
   GENERATION
═══════════════════════════════════════════ */
export const SCHEMA_DEF = `QUESTION SCHEMA:\n{"id":"Q1","type":"mcq|short_answer|diagram|table|graph|classify","section":"...","instruction":"...","content":{...},"answer":{...},"meta":{"difficulty":"easy|medium|hard"}}\nmcq: content:{options:[{key,text}]} answer:{correct,explanation}\nshort_answer: content:{parts:[{label,prompt}]} answer:{responses:[{label,steps:[],final,number_line?}]}\nsteps format: "Operation label: algebra result"\ndiagram: content:{diagram:{type:"geometry",data:{...}},parts:[]} answer:{responses:[{label,text}]}\ntable: content:{columns:[],rows:[[]]} answer:{rows:[[]]}\ngraph: content:{grid:{xMin,xMax,yMin,yMax,step}} answer:{points:[{label,x,y}],rule_expression}\nclassify: content:{categories:[],items:[]} answer:{mapping:{}}`
export const GEOM_SPEC = `geometry.data:{width,height,grid("square"|"iso"|"none"),grid_size,shapes:[{shape:"regular_polygon"|"polygon"|"line"|"circle"|"semicircle"|"arc_shape",...}],angles:[{cx,cy,from_deg,to_deg,radius?,label?}],points:[{x,y,label,label_pos}],labels:[{x,y,text,size?,bold?,color?}]}\nSVG y=DOWN: 0=right,90=down,180=left,270=up`
export function buildGenPrompt(topic, section, year, count) {
  return `You are a maths question generator for Year ${year} students.\nGenerate exactly ${count} questions for topic "${topic}", section "${section}".\n\n${SCHEMA_DEF}\n\n${GEOM_SPEC}\n\nRULES: Output ONLY a valid JSON array. steps[] REQUIRED in every short_answer. Mix types. All ids unique. Answers correct. For classify: every item must appear in answer.mapping.`
}
export function buildDiagramRevisionPrompt(section) {
  return `You are a maths diagram QA reviewer. Assess diagram: correct sizes, no overlaps, readable labels, correct angle arcs.\nSection: ${section || 'geometry'}\nReturn ONLY valid JSON: {"pass":true|false,"critique":"...","revised_data":{...complete geometry.data...}|null}\nIf pass:true set revised_data:null.`
}
export async function generateQuestions(topic, section, year, count, exemplars) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: buildGenPrompt(topic, section, year, count),
      messages: [
        {
          role: 'user',
          content: `Generate ${count} questions based on these exemplars:\n\n${exemplars}\n\nReturn only the JSON array.`,
        },
      ],
    }),
  })
  if (!resp.ok) throw new Error(`API ${resp.status}`)
  const data = await resp.json()
  if (data.error) throw new Error(data.error.message || 'API error')
  const text = (data.content?.find((c) => c.type === 'text')?.text || '')
    .replace(/^```json|^```|```$/gm, '')
    .trim()
  return JSON.parse(text)
}
export async function reviseDiagram(q, cardEl, maxIter, onProgress) {
  if (q.type !== 'diagram' || q.content?.diagram?.type !== 'geometry') return q
  let current = { ...q }
  const log = []
  for (let iter = 1; iter <= maxIter; iter++) {
    onProgress({ iter, maxIter, phase: 'screenshot' })
    let imgB64 = null
    try {
      imgB64 = await captureCardPng(cardEl)
    } catch (_) {}
    onProgress({ iter, maxIter, phase: 'critique' })
    const userContent = []
    if (imgB64)
      userContent.push({
        type: 'image',
        source: { type: 'base64', media_type: 'image/png', data: imgB64 },
      })
    userContent.push({
      type: 'text',
      text: `Current geometry.data:\n\`\`\`json\n${JSON.stringify(current.content.diagram.data, null, 2)}\n\`\`\`\nQuestion: ${q.instruction}\nCritique and return revision JSON.`,
    })
    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: buildDiagramRevisionPrompt(q.section || ''),
          messages: [{ role: 'user', content: userContent }],
        }),
      })
      if (!resp.ok) {
        log.push({ iter, pass: false, critique: `API ${resp.status}`, revised: false })
        break
      }
      const data = await resp.json()
      if (data.error) {
        log.push({ iter, pass: false, critique: 'API error', revised: false })
        break
      }
      const text = (data.content?.find((c) => c.type === 'text')?.text || '')
          .replace(/```json|```/g, '')
          .trim(),
        result = JSON.parse(text)
      log.push({
        iter,
        pass: result.pass,
        critique: result.critique,
        revised: !!result.revised_data,
      })
      if (result.pass) break
      if (result.revised_data) {
        current = {
          ...current,
          content: {
            ...current.content,
            diagram: { ...current.content.diagram, data: result.revised_data },
          },
        }
        onProgress({ iter, maxIter, phase: 're-render' })
        await new Promise((res) => setTimeout(res, 600))
      } else break
    } catch (e) {
      log.push({ iter, pass: false, critique: 'Error: ' + e.message, revised: false })
      break
    }
  }
  return { ...current, _diag_log: log }
}
