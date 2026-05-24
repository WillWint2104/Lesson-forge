/* ═══════════════════════════════════════════
   CORE — DIAGRAM BLOCK (leaf)
   ═══════════════════════════════════════════
   Single-purpose helper that dispatches a diagram spec to the right
   domain renderer. Lives in its own leaf module so that domain files
   (e.g. domains/algebra.jsx → ClassifyRenderer) can import it without
   pulling in core/renderers.jsx, which already imports those same
   domain files. This breaks the renderers ↔ algebra import cycle in
   the same way core/colors.js breaks ui ↔ math. */

import DOMPurify from 'dompurify'
import { CTTriangleDiagram, GeometryDiagram } from '../domains/geometry.jsx'

// `diagram.value` for svg_inline can come from the LLM (when Claude generates
// inline SVG) or from a user-pasted lesson JSON. Either could in principle
// contain <script> tags, on* handlers, or javascript: URLs. Sanitize with an
// SVG-aware allowlist before handing the string to dangerouslySetInnerHTML.
//
// USE_PROFILES.svg + svgFilters preserves the full legitimate SVG element set
// (g, path, circle, rect, polygon, polyline, text, filter primitives, …) and
// drops <script>, event handlers, and javascript:/data: URLs.
function sanitizeSvg(raw) {
  return DOMPurify.sanitize(raw, {
    USE_PROFILES: { svg: true, svgFilters: true },
  })
}

export function DiagramBlock({ diagram }) {
  if (!diagram) return null
  if (diagram.type === 'svg_inline' && diagram.value)
    return (
      <div
        style={{ margin: '10px 0', lineHeight: 0 }}
        dangerouslySetInnerHTML={{ __html: sanitizeSvg(diagram.value) }}
      />
    )
  if (diagram.type === 'ct_triangle' && diagram.data)
    return <CTTriangleDiagram item={diagram.data} />
  if (diagram.type === 'geometry' && diagram.data) return <GeometryDiagram data={diagram.data} />
  return null
}
