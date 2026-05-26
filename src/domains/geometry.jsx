import { C } from '../core/ui.jsx'

/* ═══════════════════════════════════════════
   DOMAIN — GEOMETRY
═══════════════════════════════════════════ */
export function GeometryDiagram({ data }) {
  if (!data || typeof data !== 'object') return null
  if (Array.isArray(data.diagrams) && data.diagrams.length > 0)
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '40px',
          flexWrap: 'wrap',
          margin: '8px 0',
          padding: '8px 12px 16px',
          overflow: 'visible',
        }}
      >
        {data.diagrams.map((d, di) => (
          <div key={di} style={{ overflow: 'visible', padding: '0 8px 8px 8px' }}>
            {d.label && (
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: C.greenDk,
                  fontFamily: "'DM Mono',monospace",
                  marginBottom: '4px',
                }}
              >
                {d.label}
              </div>
            )}
            <GeometryDiagram data={d} />
          </div>
        ))}
      </div>
    )
  const sd = {
    ...data,
    shapes: (data.shapes || []).filter(Boolean),
    angles: (data.angles || []).filter(Boolean),
    points: (data.points || []).filter(Boolean),
    labels: (data.labels || []).filter(Boolean),
    construction_lines: (data.construction_lines || []).filter(Boolean),
  }
  const W = sd.width || 320,
    H = sd.height || 280,
    GS = sd.grid_size || 30,
    grid = sd.grid || 'none',
    G = C.green,
    GDK = C.greenDk,
    GMD = C.greenMd
  const d2r = (d) => (d * Math.PI) / 180
  function rPP(sides, cx, cy, r, rot = 0) {
    return Array.from({ length: sides }, (_, i) => {
      const a = d2r(rot + (i * 360) / sides - 90)
      return [+(cx + r * Math.cos(a)).toFixed(2), +(cy + r * Math.sin(a)).toFixed(2)]
    })
  }
  function pPath(pts, close = true) {
    return (
      pts
        .map((p, i) => {
          const px = Array.isArray(p) ? p[0] : p.x,
            py = Array.isArray(p) ? p[1] : p.y
          return (i === 0 ? 'M' : 'L') + px + ',' + py
        })
        .join(' ') + (close ? ' Z' : '')
    )
  }
  function arcMP(cx, cy, r, f, t) {
    const x1 = +(cx + r * Math.cos(d2r(f))).toFixed(2),
      y1 = +(cy + r * Math.sin(d2r(f))).toFixed(2),
      x2 = +(cx + r * Math.cos(d2r(t))).toFixed(2),
      y2 = +(cy + r * Math.sin(d2r(t))).toFixed(2),
      lg = Math.abs(t - f) > 180 ? 1 : 0
    return `M${x1},${y1} A${r},${r} 0 ${lg},1 ${x2},${y2}`
  }
  function arcMid(cx, cy, r, f, t) {
    const m = (f + t) / 2
    return [+(cx + r * Math.cos(d2r(m))).toFixed(2), +(cy + r * Math.sin(d2r(m))).toFixed(2)]
  }
  function HT({
    x,
    y,
    text,
    size = 11,
    bold = false,
    color,
    anchor = 'middle',
    baseline = 'central',
  }) {
    const st = {
      fontSize: size,
      textAnchor: anchor,
      dominantBaseline: baseline,
      fontFamily: 'Libre Franklin,Arial,sans-serif',
      fontWeight: bold ? '700' : '400',
    }
    return (
      <g>
        <text
          {...st}
          x={x}
          y={y}
          fill="white"
          stroke="white"
          strokeWidth="3"
          strokeLinejoin="round"
        >
          {text}
        </text>
        <text {...st} x={x} y={y} fill={color || G}>
          {text}
        </text>
      </g>
    )
  }
  const gridLines = []
  if (grid === 'square') {
    for (let x = 0; x <= W; x += GS)
      gridLines.push(
        <line
          key={'gx' + x}
          x1={x}
          y1={0}
          x2={x}
          y2={H}
          stroke={GMD}
          strokeWidth="0.5"
          opacity="0.5"
        />
      )
    for (let y = 0; y <= H; y += GS)
      gridLines.push(
        <line
          key={'gy' + y}
          x1={0}
          y1={y}
          x2={W}
          y2={y}
          stroke={GMD}
          strokeWidth="0.5"
          opacity="0.5"
        />
      )
  } else if (grid === 'iso') {
    const step = GS
    for (let i = -H; i <= W + H; i += step) {
      gridLines.push(
        <line
          key={'il' + i}
          x1={i}
          y1={0}
          x2={i + H}
          y2={H}
          stroke={GMD}
          strokeWidth="0.4"
          opacity="0.4"
        />
      )
      gridLines.push(
        <line
          key={'ir' + i}
          x1={i}
          y1={0}
          x2={i - H}
          y2={H}
          stroke={GMD}
          strokeWidth="0.4"
          opacity="0.4"
        />
      )
    }
    for (let y = 0; y <= H; y += step * Math.sin(d2r(60)))
      gridLines.push(
        <line
          key={'ih' + y}
          x1={0}
          y1={y}
          x2={W}
          y2={y}
          stroke={GMD}
          strokeWidth="0.4"
          opacity="0.4"
        />
      )
  }
  const consE = sd.construction_lines.map((l, i) => (
    <line
      key={'cl' + i}
      x1={l.x1}
      y1={l.y1}
      x2={l.x2}
      y2={l.y2}
      stroke={GDK}
      strokeWidth="1"
      strokeDasharray="6,4"
      opacity="0.6"
    />
  ))
  const shapeE = sd.shapes.flatMap((s, si) => {
    const el = []
    if (s.shape === 'regular_polygon') {
      const pts = rPP(s.sides, s.cx, s.cy, s.radius, s.rotation_deg || 0),
        d = pPath(pts)
      el.push(
        <path
          key={'sp' + si}
          d={d}
          fill={s.fill === false ? 'none' : `${G}22`}
          stroke={s.stroke_dash ? GDK : G}
          strokeWidth={s.stroke_width || 2}
          strokeDasharray={s.stroke_dash ? '8,4' : undefined}
          strokeLinejoin="round"
        />
      )
      if (s.side_label) {
        const p0 = pts[0],
          p1 = pts[1],
          mx = (p0[0] + p1[0]) / 2,
          my = (p0[1] + p1[1]) / 2,
          nx = -(p1[1] - p0[1]),
          ny = p1[0] - p0[0],
          nl = Math.sqrt(nx * nx + ny * ny) || 1
        el.push(
          <HT
            key={'sl' + si}
            x={mx + (nx / nl) * 14}
            y={my + (ny / nl) * 14}
            text={s.side_label}
            size={10}
            color={C.black}
          />
        )
      }
      if (s.angle_label)
        el.push(
          <HT
            key={'al' + si}
            x={s.cx}
            y={s.cy - (s.radius ? s.radius * 0.25 : 15)}
            text={s.angle_label}
            size={11}
            bold
            color={C.black}
          />
        )
      if (s.label_inside)
        el.push(
          <HT
            key={'li' + si}
            x={s.cx}
            y={s.cy + (s.label_inside_offset || 0)}
            text={s.label_inside}
            size={10}
            color={GDK}
          />
        )
    } else if (s.shape === 'polygon')
      el.push(
        <path
          key={'sp' + si}
          d={pPath(s.points, s.closed !== false)}
          fill={s.fill === false ? 'none' : `${G}22`}
          stroke={s.stroke_dash ? GDK : G}
          strokeWidth={s.stroke_width || 2}
          strokeDasharray={s.stroke_dash ? '8,4' : undefined}
          strokeLinejoin="round"
        />
      )
    else if (s.shape === 'line') {
      el.push(
        <line
          key={'sl' + si}
          x1={s.x1}
          y1={s.y1}
          x2={s.x2}
          y2={s.y2}
          stroke={G}
          strokeWidth={s.stroke_width || 2}
          strokeDasharray={s.dash ? '6,3' : undefined}
          markerEnd={s.arrow ? 'url(#arr)' : undefined}
        />
      )
      if (s.label) {
        const mx = (s.x1 + s.x2) / 2,
          my = (s.y1 + s.y2) / 2
        el.push(
          <HT
            key={'ll' + si}
            x={mx + (s.label_offset_x || 0)}
            y={my + (s.label_offset_y || -10)}
            text={s.label}
            size={10}
            color={C.black}
          />
        )
      }
    } else if (s.shape === 'circle')
      el.push(
        <circle
          key={'sc' + si}
          cx={s.cx}
          cy={s.cy}
          r={s.r}
          fill={s.fill === false ? 'none' : `${G}15`}
          stroke={G}
          strokeWidth={s.stroke_width || 2}
        />
      )
    else if (s.shape === 'semicircle') {
      const rot = s.rotation_deg || 0,
        rad = d2r(rot),
        cos = Math.cos(rad),
        sin2 = Math.sin(rad),
        x1 = +(s.cx - s.r * cos).toFixed(2),
        y1 = +(s.cy - s.r * sin2).toFixed(2),
        x2 = +(s.cx + s.r * cos).toFixed(2),
        y2 = +(s.cy + s.r * sin2).toFixed(2)
      el.push(
        <path
          key={'ss' + si}
          d={`M${x1},${y1} A${s.r},${s.r} 0 0,1 ${x2},${y2} Z`}
          fill={s.fill === false ? 'none' : `${G}15`}
          stroke={G}
          strokeWidth={s.stroke_width || 2}
        />
      )
    } else if (s.shape === 'arc_shape') {
      const r = s.r || 50,
        x1 = +(s.cx + r * Math.cos(d2r(s.from_deg || 0))).toFixed(2),
        y1 = +(s.cy + r * Math.sin(d2r(s.from_deg || 0))).toFixed(2),
        x2 = +(s.cx + r * Math.cos(d2r(s.to_deg || 180))).toFixed(2),
        y2 = +(s.cy + r * Math.sin(d2r(s.to_deg || 180))).toFixed(2),
        lg = Math.abs((s.to_deg || 180) - (s.from_deg || 0)) > 180 ? 1 : 0
      el.push(
        <path
          key={'sa' + si}
          d={
            s.closed
              ? `M${x1},${y1} A${r},${r} 0 ${lg},1 ${x2},${y2} Z`
              : `M${x1},${y1} A${r},${r} 0 ${lg},1 ${x2},${y2}`
          }
          fill={s.closed ? (s.fill === false ? 'none' : `${G}15`) : 'none'}
          stroke={G}
          strokeWidth={s.stroke_width || 2}
        />
      )
    }
    return el
  })
  const angleE = sd.angles.flatMap((a, ai) => {
    const r = a.radius || 28,
      el = [
        <path
          key={'aa' + ai}
          d={arcMP(a.cx, a.cy, r, a.from_deg, a.to_deg)}
          fill="none"
          stroke={G}
          strokeWidth="1.8"
        />,
      ]
    if (a.double)
      el.push(
        <path
          key={'aa2' + ai}
          d={arcMP(a.cx, a.cy, r + 6, a.from_deg, a.to_deg)}
          fill="none"
          stroke={G}
          strokeWidth="1.8"
        />
      )
    if (a.label) {
      const lr = r + (a.double ? 24 : 20),
        [lx, ly] = arcMid(a.cx, a.cy, lr, a.from_deg, a.to_deg)
      el.push(<HT key={'al' + ai} x={lx} y={ly} text={a.label} size={11} bold color={C.black} />)
    }
    return el
  })
  const ptE = sd.points.map((pt, pi) => {
    const offs = { above: [0, -14], below: [0, 14], left: [-14, 0], right: [14, 0] },
      [ox, oy] = offs[pt.label_pos || 'above'] || [0, -14]
    return (
      <g key={'pt' + pi}>
        <circle cx={pt.x} cy={pt.y} r={3.5} fill={GDK} stroke="white" strokeWidth="1.5" />
        {pt.label && <HT x={pt.x + ox} y={pt.y + oy} text={pt.label} size={11} bold color={GDK} />}
      </g>
    )
  })
  const lblE = sd.labels.map((l, li) => (
    <HT
      key={'lb' + li}
      x={l.x}
      y={l.y}
      text={l.text}
      size={l.size || 11}
      bold={l.bold}
      color={l.color || C.black}
      anchor={l.anchor || 'middle'}
    />
  ))
  return (
    <div
      style={{
        display: 'inline-block',
        background: '#FAFAFA',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '16px',
        margin: '8px 0',
      }}
    >
      <svg
        width={W}
        height={H}
        viewBox={`-10 -5 ${W + 20} ${H + 20}`}
        style={{ display: 'block', overflow: 'visible', maxWidth: '100%' }}
      >
        <defs>
          <marker id="arr" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
            <path d="M0,0 L7,2.5 L0,5" fill={G} />
          </marker>
        </defs>
        <rect width={W} height={H} fill="#FEFFFE" />
        {gridLines}
        {consE}
        {shapeE}
        {angleE}
        {ptE}
        {lblE}
      </svg>
    </div>
  )
}

export function CTTriangleDiagram({ item }) {
  if (!item || !item.triangles || !item.triangles.length) return null
  const GAP = 50,
    G = C.green
  const dist = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
  const cen = (v) => ({
    x: v.reduce((s, p) => s + p.x, 0) / v.length,
    y: v.reduce((s, p) => s + p.y, 0) / v.length,
  })
  const d2r = (d) => (d * Math.PI) / 180
  const pn = (s) => {
    if (!s) return null
    const n = parseFloat(String(s).replace(/[°cms\s]/g, ''))
    return isNaN(n) ? null : n
  }
  function eN(p1, p2, c) {
    let bx = p2.y - p1.y,
      by = -(p2.x - p1.x)
    const l = Math.sqrt(bx * bx + by * by) || 1
    bx /= l
    by /= l
    if ((c.x - p1.x) * bx + (c.y - p1.y) * by > 0) {
      bx = -bx
      by = -by
    }
    return [bx, by]
  }
  function aP(v, pv, nx, r) {
    const a1 = Math.atan2(pv.y - v.y, pv.x - v.x),
      a2 = Math.atan2(nx.y - v.y, nx.x - v.x)
    const x1 = (v.x + r * Math.cos(a1)).toFixed(2),
      y1 = (v.y + r * Math.sin(a1)).toFixed(2),
      x2 = (v.x + r * Math.cos(a2)).toFixed(2),
      y2 = (v.y + r * Math.sin(a2)).toFixed(2)
    let d = a2 - a1
    while (d > Math.PI) d -= 2 * Math.PI
    while (d < -Math.PI) d += 2 * Math.PI
    return (
      'M' +
      x1 +
      ',' +
      y1 +
      ' A' +
      r +
      ',' +
      r +
      ' 0 ' +
      (Math.abs(d) > Math.PI ? 1 : 0) +
      ',' +
      (d > 0 ? 1 : 0) +
      ' ' +
      x2 +
      ',' +
      y2
    )
  }
  function HT({ x, y, text, fill, size, bold, anchor }) {
    const c = {
      x,
      y,
      fontSize: size || 11,
      textAnchor: anchor || 'middle',
      dominantBaseline: 'central',
      fontFamily: 'Libre Franklin,Arial,sans-serif',
      fontWeight: bold ? '700' : '400',
    }
    return (
      <g>
        <text {...c} fill="white" stroke="white" strokeWidth="4" strokeLinejoin="round">
          {text}
        </text>
        <text {...c} fill={fill || G}>
          {text}
        </text>
      </g>
    )
  }
  function buildC(tri) {
    const al = tri.angle_labels || [],
      sl = tri.side_labels || [],
      mk = tri.marks || {}
    const aM = {}
    al.forEach((a) => {
      const v = pn(a.text)
      if (v !== null) aM[a.at] = v
    })
    ;(mk.angles || []).forEach((m) => {
      if (m.type === 'right_angle') aM[m.at] = 90
    })
    const sM = {}
    sl.forEach((s) => {
      const v = pn(s.text)
      if (v !== null) sM[s.from + '-' + s.to] = v
    })
    const gS = (a, b) => sM[a + '-' + b] || sM[b + '-' + a] || null
    const s01 = gS(0, 1),
      s12 = gS(1, 2),
      s02 = gS(0, 2)
    if (s01 && s12 && s02 && Object.keys(aM).length < 2) {
      const c0 = (s01 * s01 + s02 * s02 - s12 * s12) / (2 * s01 * s02),
        c1 = (s01 * s01 + s12 * s12 - s02 * s02) / (2 * s01 * s12),
        c2 = (s12 * s12 + s02 * s02 - s01 * s01) / (2 * s12 * s02)
      if (!aM[0]) aM[0] = (Math.acos(Math.max(-1, Math.min(1, c0))) * 180) / Math.PI
      if (!aM[1]) aM[1] = (Math.acos(Math.max(-1, Math.min(1, c1))) * 180) / Math.PI
      if (!aM[2]) aM[2] = (Math.acos(Math.max(-1, Math.min(1, c2))) * 180) / Math.PI
    }
    const kn = Object.keys(aM).map(Number)
    if (kn.length === 2) {
      const m = [0, 1, 2].find((i) => !kn.includes(i))
      aM[m] = 180 - aM[kn[0]] - aM[kn[1]]
    }
    const A0 = aM[0],
      A1 = aM[1],
      A2 = aM[2]
    if (A0 == null || A1 == null || A2 == null || Math.abs(A0 + A1 + A2 - 180) > 5) return null
    let b =
      s01 ||
      (s02
        ? (s02 * Math.sin(d2r(A2))) / Math.sin(d2r(A1))
        : s12
          ? (s12 * Math.sin(d2r(A2))) / Math.sin(d2r(A0))
          : 80)
    const sa = s02 || (b * Math.sin(d2r(A1))) / Math.sin(d2r(A2))
    return [
      { x: 0, y: 0 },
      { x: b, y: 0 },
      { x: sa * Math.cos(d2r(A0)), y: -sa * Math.sin(d2r(A0)) },
    ]
  }
  let cRaw = null
  for (const tri of item.triangles) {
    cRaw = buildC(tri)
    if (cRaw) break
  }
  if (!cRaw && item.triangles[0]?.vertices) cRaw = item.triangles[0].vertices
  if (!cRaw) return null
  const tA = (v) =>
      Math.abs((v[1].x - v[0].x) * (v[2].y - v[0].y) - (v[2].x - v[0].x) * (v[1].y - v[0].y)) / 2,
    lS = (v) => Math.max(dist(v[0], v[1]), dist(v[1], v[2]), dist(v[2], v[0])) || 1,
    isDeg = (v) => !v || v.length < 3 || tA(v) / lS(v) < 0.15
  if (isDeg(cRaw)) {
    cRaw = null
    for (const tri of item.triangles) {
      if (tri.vertices && !isDeg(tri.vertices)) {
        cRaw = tri.vertices
        break
      }
    }
    if (!cRaw) return null
  }
  const mxS = Math.max(dist(cRaw[0], cRaw[1]), dist(cRaw[1], cRaw[2]), dist(cRaw[2], cRaw[0])) || 1,
    cR2 = cen(cRaw),
    uV = cRaw.map((v) => ({ x: (v.x - cR2.x) / mxS, y: (v.y - cR2.y) / mxS }))
  const LM = 30,
    MIN_S = 90,
    MAX_S = 200,
    TW = 260 - 2 * LM,
    TH = 200 - 2 * LM
  function aTx(v, t) {
    if (!t || t === 'none') return v
    if (t === 'flip_h') return v.map((p) => ({ x: -p.x, y: p.y }))
    if (t === 'flip_v') return v.map((p) => ({ x: p.x, y: -p.y }))
    if (t === 'rot90') return v.map((p) => ({ x: p.y, y: -p.x }))
    if (t === 'rot180') return v.map((p) => ({ x: -p.x, y: -p.y }))
    if (t === 'rot270') return v.map((p) => ({ x: -p.y, y: p.x }))
    if (t === 'flip_h_rot90') return v.map((p) => ({ x: p.y, y: p.x }))
    return v
  }
  function bb(v) {
    const xs = v.map((p) => p.x),
      ys = v.map((p) => p.y)
    return {
      x0: Math.min(...xs),
      x1: Math.max(...xs),
      y0: Math.min(...ys),
      y1: Math.max(...ys),
      w: Math.max(...xs) - Math.min(...xs) || 1,
      h: Math.max(...ys) - Math.min(...ys) || 1,
    }
  }
  const tVs = item.triangles.map((tri) => aTx(uV, tri.transform || 'none')),
    bxs = tVs.map(bb)
  const sS = Math.min(
      MAX_S,
      Math.max(MIN_S, Math.min(...bxs.flatMap((b) => [TW / b.w, TH / b.h])))
    ),
    cWs = bxs.map((b) => Math.ceil(b.w * sS + 2 * LM + 10)),
    sH = Math.ceil(Math.max(...bxs.map((b) => b.h * sS)) + 2 * LM + 10)
  function pCell(ox, tv, box) {
    const cw = Math.ceil(box.w * sS + 2 * LM + 10),
      ox2 = ox + (cw - box.w * sS) / 2 - box.x0 * sS,
      oy = (sH - box.h * sS) / 2 - box.y0 * sS
    return tv.map((v) => ({ x: +(v.x * sS + ox2).toFixed(2), y: +(v.y * sS + oy).toFixed(2) }))
  }
  const svgW = cWs.reduce((s, w) => s + w, 0) + (item.triangles.length - 1) * GAP,
    svgH = sH
  const cells = item.triangles.map((tri, ti) => {
    const ox = cWs.slice(0, ti).reduce((s, w) => s + w + GAP, 0),
      vs = pCell(ox, tVs[ti], bxs[ti]),
      cn = cen(vs),
      nv = vs.length,
      pts = vs.map((v) => v.x + ',' + v.y).join(' '),
      mk = tri.marks || {},
      sp = Math.max(...vs.map((v) => dist(v, cn))),
      AR = Math.max(12, Math.min(20, sp * 0.2)),
      ss = Math.min(dist(vs[0], vs[1]), dist(vs[1], vs[2]), dist(vs[2], vs[0])),
      RA = Math.max(8, Math.min(13, ss * 0.13))
    const ticks = (mk.sides || []).flatMap((m, mi) => {
      const p1 = vs[m.from],
        p2 = vs[m.to],
        mx = (p1.x + p2.x) / 2,
        my = (p1.y + p2.y) / 2,
        le = dist(p1, p2) || 1,
        ex = (p2.x - p1.x) / le,
        ey = (p2.y - p1.y) / le,
        nx = -ey,
        ny = ex,
        TL = 6,
        SP = 4,
        n = m.ticks || 1
      return Array.from({ length: n }, (_, k) => {
        const sh = (k - (n - 1) / 2) * SP,
          cx2 = mx + ex * sh,
          cy2 = my + ey * sh
        return (
          <line
            key={mi + '_' + k}
            x1={(cx2 + nx * TL).toFixed(2)}
            y1={(cy2 + ny * TL).toFixed(2)}
            x2={(cx2 - nx * TL).toFixed(2)}
            y2={(cy2 - ny * TL).toFixed(2)}
            stroke={G}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        )
      })
    })
    const mks = (mk.angles || [])
      .filter((m) => !m.dot && m.type !== 'dot')
      .map((m, mi) => {
        const v = vs[m.at],
          pv = vs[(m.at + nv - 1) % nv],
          nx = vs[(m.at + 1) % nv]
        if (m.type === 'right_angle') {
          const al = dist(pv, v) || 1,
            bl = dist(nx, v) || 1,
            d1x = (pv.x - v.x) / al,
            d1y = (pv.y - v.y) / al,
            d2x = (nx.x - v.x) / bl,
            d2y = (nx.y - v.y) / bl,
            p1x = v.x + d1x * RA,
            p1y = v.y + d1y * RA,
            p2x = v.x + d2x * RA,
            p2y = v.y + d2y * RA,
            pmx = p1x + d2x * RA,
            pmy = p1y + d2y * RA
          return (
            <path
              key={mi}
              d={
                'M' +
                p1x.toFixed(2) +
                ',' +
                p1y.toFixed(2) +
                ' L' +
                pmx.toFixed(2) +
                ',' +
                pmy.toFixed(2) +
                ' L' +
                p2x.toFixed(2) +
                ',' +
                p2y.toFixed(2)
              }
              fill="none"
              stroke={G}
              strokeWidth="1.5"
            />
          )
        }
        return (
          <g key={mi}>
            {Array.from({ length: m.arcs || 1 }, (_, k) => (
              <path
                key={k}
                d={aP(v, pv, nx, AR + k * 5)}
                fill="none"
                stroke={G}
                strokeWidth="1.4"
              />
            ))}
          </g>
        )
      })
    const raS = new Set((mk.angles || []).filter((m) => m.type === 'right_angle').map((m) => m.at))
    const aByV = {}
    ;(tri.angle_labels || []).forEach((al) => {
      if (!aByV[al.at]) aByV[al.at] = []
      aByV[al.at].push(al.text)
    })
    const aLbls = Object.entries(aByV).flatMap(([ats, txts]) => {
      const at = parseInt(ats),
        v = vs[at],
        pv = vs[(at + nv - 1) % nv],
        nx = vs[(at + 1) % nv],
        [bx, by] = eN(v, pv, nx),
        av =
          (180 / Math.PI) *
            Math.atan2(
              Math.abs((pv.x - v.x) * (nx.y - v.y) - (pv.y - v.y) * (nx.x - v.x)),
              (pv.x - v.x) * (nx.x - v.x) + (pv.y - v.y) * (nx.y - v.y)
            ) || 90
      if (raS.has(at) || Math.round(av) === 90) return []
      const r = av > 100 ? AR * 1.3 : AR,
        ld = r + (av < 45 ? 18 : 14),
        el = [
          <path key={'a' + ats} d={aP(v, pv, nx, r)} fill="none" stroke={G} strokeWidth="1.4" />,
        ]
      txts.forEach((txt, i) =>
        el.push(
          <HT
            key={'l' + ats + '_' + i}
            x={(v.x + bx * (ld + i * 16)).toFixed(2)}
            y={(v.y + by * (ld + i * 16)).toFixed(2)}
            text={txt}
            fill={C.black}
          />
        )
      )
      return el
    })
    const sLbls = (tri.side_labels || []).map((sl, si) => {
      const p1 = vs[sl.from],
        p2 = vs[sl.to],
        [nx2, ny2] = eN(p1, p2, cn),
        mx = (p1.x + p2.x) / 2,
        my = (p1.y + p2.y) / 2,
        ll = (sl.text || '').length,
        ea = Math.abs((Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI),
        isVert = ea > 70 && ea < 110,
        isHoriz = ea < 20 || ea > 160,
        off = 28 + Math.max(0, (ll - 4) * 2) + (isVert ? 8 : 0) + (isHoriz ? 4 : 0)
      return (
        <HT
          key={'sl' + si}
          x={(mx + nx2 * off).toFixed(2)}
          y={(my + ny2 * off).toFixed(2)}
          text={sl.text}
          fill={C.black}
        />
      )
    })
    const vLbls = vs.map((v, vi) => {
      if (!v.label) return null
      const dx = v.x - cn.x,
        dy = v.y - cn.y,
        dl = Math.hypot(dx, dy) || 1
      return (
        <HT
          key={'vl' + vi}
          x={(v.x + (dx / dl) * 20).toFixed(2)}
          y={(v.y + (dy / dl) * 20).toFixed(2)}
          text={v.label}
          fill={G}
          bold
        />
      )
    })
    return (
      <g key={ti}>
        <polygon points={pts} fill={G + '18'} stroke={G} strokeWidth="2" strokeLinejoin="round" />
        {ticks}
        {mks}
        {aLbls}
        {sLbls}
        {vLbls}
      </g>
    )
  })
  return (
    <div
      style={{
        display: 'inline-block',
        background: '#FAFAFA',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '16px',
      }}
    >
      <svg
        width={svgW}
        height={svgH}
        viewBox={'0 0 ' + svgW + ' ' + svgH}
        style={{ display: 'block', overflow: 'visible', maxWidth: '100%' }}
      >
        {cells}
      </svg>
    </div>
  )
}
