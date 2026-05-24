/* ═══════════════════════════════════════════
   CORE — DIAGRAM BLOCK (leaf)
   ═══════════════════════════════════════════
   Single-purpose helper that dispatches a diagram spec to the right
   domain renderer. Lives in its own leaf module so that domain files
   (e.g. domains/algebra.jsx → ClassifyRenderer) can import it without
   pulling in core/renderers.jsx, which already imports those same
   domain files. This breaks the renderers ↔ algebra import cycle in
   the same way core/colors.js breaks ui ↔ math. */

import { CTTriangleDiagram, GeometryDiagram } from '../domains/geometry.jsx'

export function DiagramBlock({ diagram }) {
  if (!diagram) return null
  if (diagram.type === 'svg_inline' && diagram.value)
    return (
      <div
        style={{ margin: '10px 0', lineHeight: 0 }}
        dangerouslySetInnerHTML={{ __html: diagram.value }}
      />
    )
  if (diagram.type === 'ct_triangle' && diagram.data)
    return <CTTriangleDiagram item={diagram.data} />
  if (diagram.type === 'geometry' && diagram.data) return <GeometryDiagram data={diagram.data} />
  return null
}
