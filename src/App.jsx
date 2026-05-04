import { useState, useRef, useCallback, useEffect } from "react";

/* ── Brand ── */
const C = {
  green:"#5CB89B", greenDk:"#3D9A7E", greenLt:"#EDF7F3", greenMd:"#A3D9C6",
  black:"#1E293B", white:"#FFFFFF", cream:"#FAF6F0",
  purple:"#7C3AED", purpleLt:"#F5F3FF", purpleMd:"#DDD6FE",
  orange:"#D97706", orangeLt:"#FFFBEB", orangeMd:"#FDE68A",
  red:"#DC2626", redLt:"#FEF2F2", redMd:"#FCA5A5",
  slate:"#64748B", slateLt:"#F1F5F9", slateXlt:"#F8FAFC",
};
const SERIF = "'Newsreader',serif";
const SANS  = "'Libre Franklin',sans-serif";
const MONO  = "'DM Mono',monospace";
const FONTS = "https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Franklin:wght@400;500;600;700&family=DM+Mono:wght@400;500&family=STIX+Two+Text:ital,wght@0,400;0,700;1,400;1,700&display=swap";
const BP = { background:`linear-gradient(135deg,${C.green},${C.greenDk})`, color:"#fff", border:"none", padding:"11px 24px", fontSize:"14px", fontWeight:700, cursor:"pointer", fontFamily:SANS };
const BS = { background:"#fff", color:C.slate, border:"1.5px solid #E2E8F0", padding:"10px 20px", fontSize:"14px", fontWeight:600, cursor:"pointer", fontFamily:SANS };
const BO = { background:`linear-gradient(135deg,${C.orange},#B45309)`, color:"#fff", border:"none", padding:"11px 24px", fontSize:"14px", fontWeight:700, cursor:"pointer", fontFamily:SANS };

/* ═══════════════════════════════════════════
   CORE — SCHEMA
═══════════════════════════════════════════ */
const QUESTION_TYPES = ["mcq","short_answer","diagram","table","graph","classify"];
const TYPE_META = {
  mcq:          { label:"Multiple Choice", icon:"🔘" },
  short_answer: { label:"Short Answer",    icon:"✏️"  },
  diagram:      { label:"Diagram",         icon:"📐" },
  table:        { label:"Table",           icon:"📊" },
  graph:        { label:"Graph",           icon:"📈" },
  classify:     { label:"Classify",        icon:"🏷️"  },
};

/* ═══════════════════════════════════════════
   CORE — VALIDATION
═══════════════════════════════════════════ */
function validateLesson(lesson) {
  const errors = [], warnings = [];
  if (!lesson.lesson_title) warnings.push({ field:"lesson_title", msg:"Missing lesson_title" });
  if (!lesson.topic)        warnings.push({ field:"topic",        msg:"Missing topic" });
  if (!lesson.year)         warnings.push({ field:"year",         msg:"Missing year" });
  if (!lesson.version)      warnings.push({ field:"version",      msg:'Missing version — add "version":"1.0"' });
  if (!Array.isArray(lesson.questions)||!lesson.questions.length)
    errors.push({ field:"questions", msg:"No questions array found" });
  const ids = new Set();
  (lesson.questions||[]).forEach((q,i) => {
    const loc = q.id ? `Q${i+1}(${q.id})` : `Q${i+1}`;
    if (!q.id)          warnings.push({ field:loc, msg:`${loc}: missing id` });
    if (ids.has(q.id))  errors.push(  { field:loc, msg:`${loc}: duplicate id "${q.id}"` });
    if (q.id) ids.add(q.id);
    if (!q.type)        errors.push(  { field:loc, msg:`${loc}: missing type` });
    if (q.type && !QUESTION_TYPES.includes(q.type))
      errors.push({ field:loc, msg:`${loc}: unknown type "${q.type}"` });
    if (!q.instruction) warnings.push({ field:loc, msg:`${loc}: missing instruction` });
    if (!q.content)     errors.push(  { field:loc, msg:`${loc}: missing content block` });
    if (!q.answer)      warnings.push({ field:loc, msg:`${loc}: missing answer block` });
    if (q.type==="mcq"&&q.content) {
      const opts=q.content.options;
      if (!Array.isArray(opts)||opts.length<2) errors.push({ field:loc, msg:`${loc}: mcq needs at least 2 options` });
      if (q.answer?.correct&&opts&&!opts.find(o=>o.key===q.answer.correct))
        errors.push({ field:loc, msg:`${loc}: answer.correct not in options` });
    }
    if (q.type==="diagram"&&q.content&&!q.content.diagram)
      warnings.push({ field:loc, msg:`${loc}: diagram type but no content.diagram` });
    if (q.type==="table"&&q.content) {
      if (!q.content.columns) errors.push({ field:loc, msg:`${loc}: table missing columns` });
      if (!q.content.rows)    errors.push({ field:loc, msg:`${loc}: table missing rows` });
    }
    if (q.type==="classify"&&q.content) {
      if (!q.content.categories) errors.push({ field:loc, msg:`${loc}: classify missing categories` });
      if (!q.content.items)      errors.push({ field:loc, msg:`${loc}: classify missing items` });
    }
  });
  return { valid:errors.length===0, errors, warnings };
}

/* ═══════════════════════════════════════════
   CORE — MATH RENDERING
═══════════════════════════════════════════ */
const MATH_FONT = "'STIX Two Text',Georgia,'Times New Roman',serif";
const MATH_SIZE = "16px";
const MATH_FUNCTIONS = new Set(['sin','cos','tan','sec','csc','cot','log','ln','exp','lim','max','min','inf','abs','mod','div','gcd','lcm','det']);
const ENGLISH_WORDS = new Set(["find","solve","show","given","hence","write","state","prove","using","where","when","then","with","from","into","over","that","this","each","both","left","right","true","false","note","case","let","the","and","for","not","but","any","all","use","add","sub","see","set","put","get","out","one","two","six","ten","per","check","expand","collect","simplify","divide","multiply","subtract"]);

function renderLetters(tok, key) {
  const lower = tok.toLowerCase();
  if (MATH_FUNCTIONS.has(lower) || ENGLISH_WORDS.has(lower) || tok.length > 4)
    return <span key={key} style={{fontFamily:MATH_FONT,fontSize:MATH_SIZE,fontStyle:"normal"}}>{tok}</span>;
  return <span key={key} style={{fontFamily:MATH_FONT,fontStyle:"italic",fontSize:MATH_SIZE,fontWeight:400}}>{tok}</span>;
}
function renderMathText(s, key) {
  if (!s) return null;
  const tokens = s.match(/[a-zA-Z]+|[^a-zA-Z]+/g) || [s];
  return <span key={key} style={{fontFamily:MATH_FONT,fontSize:MATH_SIZE,lineHeight:1.6,fontStyle:"normal"}}>
    {tokens.map((tok,ti) => /^[a-zA-Z]+$/.test(tok) ? renderLetters(tok,ti) : <span key={ti} style={{fontFamily:MATH_FONT,fontStyle:"normal"}}>{tok}</span>)}
  </span>;
}
function MathFrac({ num, den }) {
  const p = { display:"block", textAlign:"center", fontFamily:MATH_FONT, fontSize:MATH_SIZE, lineHeight:1.2, padding:"0 4px" };
  return <span style={{display:"inline-flex",flexDirection:"column",alignItems:"center",verticalAlign:"middle",margin:"0 2px",gap:0}}>
    <span style={{...p,borderBottom:"1px solid "+C.black,paddingBottom:"1px"}}>{renderMathText(num,"num")}</span>
    <span style={{...p,paddingTop:"1px"}}>{renderMathText(den,"den")}</span>
  </span>;
}
function MathExpr({ text }) {
  if (!text) return null;
  const str = String(text);
  const wd = str.replace(/([^\s÷(]+|\([^)]+\))\s*÷\s*(\([^)]+\)|[^\s÷]+)/g, (_,n,d) => `${n.trim()}/${d.trim()}`);
  const fracRe = /(\([^)]+\)|[\w−\-]+)\s*\/\s*(\([^)]+\)|[\w−\-]+)/g;
  const segs = []; let last=0, m; fracRe.lastIndex=0;
  while ((m = fracRe.exec(wd)) !== null) {
    const num=m[1].replace(/^\(|\)$/g,''), den=m[2].replace(/^\(|\)$/g,'');
    if (num.trim()==='d' && /^d[a-zA-Z]/.test(den.trim())) continue;
    if (m.index>last) segs.push({type:'text',val:wd.slice(last,m.index)});
    segs.push({type:'frac',num,den});
    last = m.index+m[0].length;
  }
  if (last<wd.length) segs.push({type:'text',val:wd.slice(last)});
  return <span style={{display:'inline-flex',alignItems:'center',flexWrap:'wrap',verticalAlign:'middle'}}>
    {segs.map((seg,si) => seg.type==='frac' ? <MathFrac key={si} num={seg.num} den={seg.den}/> : renderMathText(seg.val,si))}
  </span>;
}
function NumberLine({ nl }) {
  if (!nl) return null;
  const val=nl.value??0, dir=nl.direction||(nl.right?"right":"left"), open=nl.open!==false&&!nl.closed;
  const rW=nl.range||8, min=nl.min??(val-rW/2), max=nl.max??(val+rW/2);
  const W=320,H=48,PL=24,PR=24,plotW=W-PL-PR,toX=v=>PL+(v-min)/(max-min)*plotW,cx=toX(val);
  const ticks=[];
  for (let i=Math.ceil(min);i<=Math.floor(max);i++) {
    const tx=toX(i);
    ticks.push(<g key={i}><line x1={tx} y1={H/2-5} x2={tx} y2={H/2+5} stroke="#94A3B8" strokeWidth="1"/><text x={tx} y={H/2+16} textAnchor="middle" fontSize="9" fill="#94A3B8" fontFamily="sans-serif">{i}</text></g>);
  }
  const al=10; let lp,ah;
  if (dir==="right") { const ex=Math.min(W-PR+8,W-4); lp=`M${cx},${H/2} L${ex},${H/2}`; ah=`M${ex},${H/2} L${ex-al},${H/2-5} L${ex-al},${H/2+5} Z`; }
  else { const ex=Math.max(PL-8,4); lp=`M${cx},${H/2} L${ex},${H/2}`; ah=`M${ex},${H/2} L${ex+al},${H/2-5} L${ex+al},${H/2+5} Z`; }
  return <svg width={W} height={H} style={{display:"block",margin:"6px 0",overflow:"visible"}}>
    <line x1={PL} y1={H/2} x2={W-PR} y2={H/2} stroke="#CBD5E1" strokeWidth="1.5"/>
    <path d={lp} stroke={C.green} strokeWidth="2.5" fill="none"/>
    <path d={ah} fill={C.green}/>
    <circle cx={cx} cy={H/2} r={6} fill={open?"white":C.green} stroke={C.green} strokeWidth="2"/>
    {ticks}
    <text x={cx} y={H/2-12} textAnchor="middle" fontSize="10" fontWeight="700" fill={C.greenDk} fontFamily="sans-serif">{val}</text>
  </svg>;
}

/* ═══════════════════════════════════════════
   CORE — UI PRIMITIVES
═══════════════════════════════════════════ */
function Instruction({ text, worksheet }) {
  return <p style={{fontFamily:SERIF,fontSize:worksheet?"16px":"15px",color:C.black,lineHeight:1.65,margin:"0 0 10px"}}>{text}</p>;
}
function PartLabel({ label }) {
  return <span style={{fontWeight:700,color:C.green,fontFamily:SERIF,fontSize:"15px",minWidth:"24px",flexShrink:0}}>{label})</span>;
}
function WorkArea({ worksheet }) {
  if (worksheet) return null;
  return <div style={{border:"1.5px dashed #CBD5E1",background:"#FAFAFA",height:"80px",margin:"8px 0 4px"}}/>;
}
function WorkedAnswer({ resp }) {
  if (!resp) return null;
  const nl = resp.number_line || null;
  const block = () => {
    if (Array.isArray(resp.steps) && resp.steps.length > 0) {
      return <div style={{display:"flex",flexDirection:"column",gap:"2px"}}>
        {resp.steps.map((step,si) => {
          const ci=step.indexOf(":"), hc=ci>0&&ci<step.length-1;
          const ln=hc?step.slice(0,ci).trim():null, rm=hc?step.slice(ci+1).trim():step.trim();
          const ai=rm.indexOf("←"), mp=ai>0?rm.slice(0,ai).trim():rm, ap=ai>0?rm.slice(ai).trim():null;
          return <div key={si} style={{display:"grid",gridTemplateColumns:"20px minmax(0,1fr) minmax(0,1.6fr) auto",gap:"2px 10px",alignItems:"start",padding:"4px 0",borderBottom:`1px solid ${C.greenLt}`}}>
            <span style={{fontFamily:MONO,fontSize:"10px",fontWeight:700,color:C.greenDk,textAlign:"right"}}>{si+1}.</span>
            <span style={{fontFamily:SANS,fontSize:"12px",color:C.slate,fontStyle:"italic",lineHeight:1.5}}>{ln||""}</span>
            <span style={{fontSize:"14px",fontWeight:700,lineHeight:1.5}}><MathExpr text={mp}/></span>
            {ap&&<span style={{fontFamily:SANS,fontSize:"11px",fontWeight:700,color:C.orange,background:C.orangeLt,padding:"1px 7px",border:`1px solid ${C.orangeMd}`,whiteSpace:"nowrap"}}>{ap}</span>}
          </div>;
        })}
        {resp.final&&<div style={{marginTop:"8px",paddingTop:"6px",borderTop:`2px solid ${C.green}`,fontSize:"14px",fontWeight:700,color:C.greenDk,padding:"6px 10px",display:"inline-block"}}><MathExpr text={resp.final}/></div>}
      </div>;
    }
    const lines=(resp.text||"").split("\n").filter(l=>l.trim());
    if (!lines.length) return null;
    if (lines.length===1) return <div style={{fontFamily:SERIF,fontSize:"14px",lineHeight:1.6}}>{resp.text}</div>;
    return <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>{lines.map((line,li)=><div key={li} style={{fontSize:"14px",lineHeight:1.6}}><MathExpr text={line}/></div>)}</div>;
  };
  return <div style={{background:C.greenLt,borderLeft:`3px solid ${C.green}`,padding:"10px 14px",display:"flex",flexDirection:"column",gap:"6px"}}>{block()}{nl&&<NumberLine nl={nl}/>}</div>;
}

/* ═══════════════════════════════════════════
   DOMAIN — GEOMETRY
═══════════════════════════════════════════ */
function GeometryDiagram({ data }) {
  if (!data||typeof data!=="object") return null;
  if (Array.isArray(data.diagrams)&&data.diagrams.length>0) return (
    <div style={{display:"flex",alignItems:"flex-end",gap:"40px",flexWrap:"wrap",margin:"8px 0",padding:"8px 12px 16px",overflow:"visible"}}>
      {data.diagrams.map((d,di)=><div key={di} style={{overflow:"visible",padding:"0 8px 8px 8px"}}>
        {d.label&&<div style={{textAlign:"center",fontSize:"11px",fontWeight:700,color:C.greenDk,fontFamily:MONO,marginBottom:"4px"}}>{d.label}</div>}
        <GeometryDiagram data={d}/>
      </div>)}
    </div>
  );
  const sd={...data,shapes:(data.shapes||[]).filter(Boolean),angles:(data.angles||[]).filter(Boolean),points:(data.points||[]).filter(Boolean),labels:(data.labels||[]).filter(Boolean),construction_lines:(data.construction_lines||[]).filter(Boolean)};
  const W=sd.width||320,H=sd.height||280,GS=sd.grid_size||30,grid=sd.grid||"none",G=C.green,GDK=C.greenDk,GMD=C.greenMd;
  const d2r=d=>d*Math.PI/180;
  function rPP(sides,cx,cy,r,rot=0){return Array.from({length:sides},(_,i)=>{const a=d2r(rot+i*360/sides-90);return[+(cx+r*Math.cos(a)).toFixed(2),+(cy+r*Math.sin(a)).toFixed(2)];});}
  function pPath(pts,close=true){return pts.map((p,i)=>{const px=Array.isArray(p)?p[0]:p.x,py=Array.isArray(p)?p[1]:p.y;return(i===0?"M":"L")+px+","+py;}).join(" ")+(close?" Z":"");}
  function arcMP(cx,cy,r,f,t){const x1=+(cx+r*Math.cos(d2r(f))).toFixed(2),y1=+(cy+r*Math.sin(d2r(f))).toFixed(2),x2=+(cx+r*Math.cos(d2r(t))).toFixed(2),y2=+(cy+r*Math.sin(d2r(t))).toFixed(2),lg=Math.abs(t-f)>180?1:0;return`M${x1},${y1} A${r},${r} 0 ${lg},1 ${x2},${y2}`;}
  function arcMid(cx,cy,r,f,t){const m=(f+t)/2;return[+(cx+r*Math.cos(d2r(m))).toFixed(2),+(cy+r*Math.sin(d2r(m))).toFixed(2)];}
  function HT({x,y,text,size=11,bold=false,color,anchor="middle",baseline="central"}){const st={fontSize:size,textAnchor:anchor,dominantBaseline:baseline,fontFamily:"Libre Franklin,Arial,sans-serif",fontWeight:bold?"700":"400"};return<g><text {...st} x={x} y={y} fill="white" stroke="white" strokeWidth="3" strokeLinejoin="round">{text}</text><text {...st} x={x} y={y} fill={color||G}>{text}</text></g>;}
  const gridLines=[];
  if (grid==="square"){for(let x=0;x<=W;x+=GS)gridLines.push(<line key={"gx"+x} x1={x} y1={0} x2={x} y2={H} stroke={GMD} strokeWidth="0.5" opacity="0.5"/>);for(let y=0;y<=H;y+=GS)gridLines.push(<line key={"gy"+y} x1={0} y1={y} x2={W} y2={y} stroke={GMD} strokeWidth="0.5" opacity="0.5"/>);}
  else if (grid==="iso"){const step=GS;for(let i=-H;i<=W+H;i+=step){gridLines.push(<line key={"il"+i} x1={i} y1={0} x2={i+H} y2={H} stroke={GMD} strokeWidth="0.4" opacity="0.4"/>);gridLines.push(<line key={"ir"+i} x1={i} y1={0} x2={i-H} y2={H} stroke={GMD} strokeWidth="0.4" opacity="0.4"/>);}for(let y=0;y<=H;y+=step*Math.sin(d2r(60)))gridLines.push(<line key={"ih"+y} x1={0} y1={y} x2={W} y2={y} stroke={GMD} strokeWidth="0.4" opacity="0.4"/>);}
  const consE=sd.construction_lines.map((l,i)=><line key={"cl"+i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={GDK} strokeWidth="1" strokeDasharray="6,4" opacity="0.6"/>);
  const shapeE=sd.shapes.flatMap((s,si)=>{const el=[];
    if(s.shape==="regular_polygon"){const pts=rPP(s.sides,s.cx,s.cy,s.radius,s.rotation_deg||0),d=pPath(pts);el.push(<path key={"sp"+si} d={d} fill={s.fill===false?"none":`${G}22`} stroke={s.stroke_dash?GDK:G} strokeWidth={s.stroke_width||2} strokeDasharray={s.stroke_dash?"8,4":undefined} strokeLinejoin="round"/>);if(s.side_label){const p0=pts[0],p1=pts[1],mx=(p0[0]+p1[0])/2,my=(p0[1]+p1[1])/2,nx=-(p1[1]-p0[1]),ny=(p1[0]-p0[0]),nl=Math.sqrt(nx*nx+ny*ny)||1;el.push(<HT key={"sl"+si} x={mx+nx/nl*14} y={my+ny/nl*14} text={s.side_label} size={10} color={C.black}/>);}if(s.angle_label)el.push(<HT key={"al"+si} x={s.cx} y={s.cy-(s.radius?s.radius*0.25:15)} text={s.angle_label} size={11} bold color={C.black}/>);if(s.label_inside)el.push(<HT key={"li"+si} x={s.cx} y={s.cy+(s.label_inside_offset||0)} text={s.label_inside} size={10} color={GDK}/>);}
    else if(s.shape==="polygon")el.push(<path key={"sp"+si} d={pPath(s.points,s.closed!==false)} fill={s.fill===false?"none":`${G}22`} stroke={s.stroke_dash?GDK:G} strokeWidth={s.stroke_width||2} strokeDasharray={s.stroke_dash?"8,4":undefined} strokeLinejoin="round"/>);
    else if(s.shape==="line"){el.push(<line key={"sl"+si} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={G} strokeWidth={s.stroke_width||2} strokeDasharray={s.dash?"6,3":undefined} markerEnd={s.arrow?"url(#arr)":undefined}/>);if(s.label){const mx=(s.x1+s.x2)/2,my=(s.y1+s.y2)/2;el.push(<HT key={"ll"+si} x={mx+(s.label_offset_x||0)} y={my+(s.label_offset_y||-10)} text={s.label} size={10} color={C.black}/>);}}
    else if(s.shape==="circle")el.push(<circle key={"sc"+si} cx={s.cx} cy={s.cy} r={s.r} fill={s.fill===false?"none":`${G}15`} stroke={G} strokeWidth={s.stroke_width||2}/>);
    else if(s.shape==="semicircle"){const rot=s.rotation_deg||0,rad=d2r(rot),cos=Math.cos(rad),sin2=Math.sin(rad),x1=+(s.cx-s.r*cos).toFixed(2),y1=+(s.cy-s.r*sin2).toFixed(2),x2=+(s.cx+s.r*cos).toFixed(2),y2=+(s.cy+s.r*sin2).toFixed(2);el.push(<path key={"ss"+si} d={`M${x1},${y1} A${s.r},${s.r} 0 0,1 ${x2},${y2} Z`} fill={s.fill===false?"none":`${G}15`} stroke={G} strokeWidth={s.stroke_width||2}/>);}
    else if(s.shape==="arc_shape"){const r=s.r||50,x1=+(s.cx+r*Math.cos(d2r(s.from_deg||0))).toFixed(2),y1=+(s.cy+r*Math.sin(d2r(s.from_deg||0))).toFixed(2),x2=+(s.cx+r*Math.cos(d2r(s.to_deg||180))).toFixed(2),y2=+(s.cy+r*Math.sin(d2r(s.to_deg||180))).toFixed(2),lg=Math.abs((s.to_deg||180)-(s.from_deg||0))>180?1:0;el.push(<path key={"sa"+si} d={s.closed?`M${x1},${y1} A${r},${r} 0 ${lg},1 ${x2},${y2} Z`:`M${x1},${y1} A${r},${r} 0 ${lg},1 ${x2},${y2}`} fill={s.closed?(s.fill===false?"none":`${G}15`):"none"} stroke={G} strokeWidth={s.stroke_width||2}/>);}
    return el;
  });
  const angleE=sd.angles.flatMap((a,ai)=>{const r=a.radius||28,el=[<path key={"aa"+ai} d={arcMP(a.cx,a.cy,r,a.from_deg,a.to_deg)} fill="none" stroke={G} strokeWidth="1.8"/>];if(a.double)el.push(<path key={"aa2"+ai} d={arcMP(a.cx,a.cy,r+6,a.from_deg,a.to_deg)} fill="none" stroke={G} strokeWidth="1.8"/>);if(a.label){const lr=r+(a.double?24:20),[lx,ly]=arcMid(a.cx,a.cy,lr,a.from_deg,a.to_deg);el.push(<HT key={"al"+ai} x={lx} y={ly} text={a.label} size={11} bold color={C.black}/>);}return el;});
  const ptE=sd.points.map((pt,pi)=>{const offs={above:[0,-14],below:[0,14],left:[-14,0],right:[14,0]},[ox,oy]=offs[pt.label_pos||"above"]||[0,-14];return<g key={"pt"+pi}><circle cx={pt.x} cy={pt.y} r={3.5} fill={GDK} stroke="white" strokeWidth="1.5"/>{pt.label&&<HT x={pt.x+ox} y={pt.y+oy} text={pt.label} size={11} bold color={GDK}/>}</g>;});
  const lblE=sd.labels.map((l,li)=><HT key={"lb"+li} x={l.x} y={l.y} text={l.text} size={l.size||11} bold={l.bold} color={l.color||C.black} anchor={l.anchor||"middle"}/>);
  return <svg width={W} height={H} viewBox={`-10 -5 ${W+20} ${H+20}`} style={{display:"block",overflow:"visible",maxWidth:"100%",margin:"8px 0"}}>
    <defs><marker id="arr" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto"><path d="M0,0 L7,2.5 L0,5" fill={G}/></marker></defs>
    <rect width={W} height={H} fill="#FEFFFE"/>
    {gridLines}{consE}{shapeE}{angleE}{ptE}{lblE}
  </svg>;
}

function CTTriangleDiagram({item}){
  if(!item||!item.triangles||!item.triangles.length)return null;
  const GAP=50,G=C.green;
  const dist=(a,b)=>Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2);
  const cen=v=>({x:v.reduce((s,p)=>s+p.x,0)/v.length,y:v.reduce((s,p)=>s+p.y,0)/v.length});
  const d2r=d=>d*Math.PI/180;
  const pn=s=>{if(!s)return null;const n=parseFloat(String(s).replace(/[°cms\s]/g,""));return isNaN(n)?null:n;};
  function eN(p1,p2,c){let bx=(p2.y-p1.y),by=-(p2.x-p1.x);const l=Math.sqrt(bx*bx+by*by)||1;bx/=l;by/=l;if((c.x-p1.x)*bx+(c.y-p1.y)*by>0){bx=-bx;by=-by;}return[bx,by];}
  function aP(v,pv,nx,r){const a1=Math.atan2(pv.y-v.y,pv.x-v.x),a2=Math.atan2(nx.y-v.y,nx.x-v.x);const x1=(v.x+r*Math.cos(a1)).toFixed(2),y1=(v.y+r*Math.sin(a1)).toFixed(2),x2=(v.x+r*Math.cos(a2)).toFixed(2),y2=(v.y+r*Math.sin(a2)).toFixed(2);let d=a2-a1;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return"M"+x1+","+y1+" A"+r+","+r+" 0 "+(Math.abs(d)>Math.PI?1:0)+","+(d>0?1:0)+" "+x2+","+y2;}
  function HT({x,y,text,fill,size,bold,anchor}){const c={x,y,fontSize:size||11,textAnchor:anchor||"middle",dominantBaseline:"central",fontFamily:"Libre Franklin,Arial,sans-serif",fontWeight:bold?"700":"400"};return<g><text {...c} fill="white" stroke="white" strokeWidth="4" strokeLinejoin="round">{text}</text><text {...c} fill={fill||G}>{text}</text></g>;}
  function buildC(tri){const al=tri.angle_labels||[],sl=tri.side_labels||[],mk=tri.marks||{};const aM={};al.forEach(a=>{const v=pn(a.text);if(v!==null)aM[a.at]=v;});(mk.angles||[]).forEach(m=>{if(m.type==="right_angle")aM[m.at]=90;});const sM={};sl.forEach(s=>{const v=pn(s.text);if(v!==null)sM[s.from+"-"+s.to]=v;});const gS=(a,b)=>sM[a+"-"+b]||sM[b+"-"+a]||null;const s01=gS(0,1),s12=gS(1,2),s02=gS(0,2);if(s01&&s12&&s02&&Object.keys(aM).length<2){const c0=(s01*s01+s02*s02-s12*s12)/(2*s01*s02),c1=(s01*s01+s12*s12-s02*s02)/(2*s01*s12),c2=(s12*s12+s02*s02-s01*s01)/(2*s12*s02);if(!aM[0])aM[0]=Math.acos(Math.max(-1,Math.min(1,c0)))*180/Math.PI;if(!aM[1])aM[1]=Math.acos(Math.max(-1,Math.min(1,c1)))*180/Math.PI;if(!aM[2])aM[2]=Math.acos(Math.max(-1,Math.min(1,c2)))*180/Math.PI;}const kn=Object.keys(aM).map(Number);if(kn.length===2){const m=[0,1,2].find(i=>!kn.includes(i));aM[m]=180-aM[kn[0]]-aM[kn[1]];}const A0=aM[0],A1=aM[1],A2=aM[2];if(A0==null||A1==null||A2==null||Math.abs(A0+A1+A2-180)>5)return null;let b=s01||(s02?s02*Math.sin(d2r(A2))/Math.sin(d2r(A1)):(s12?s12*Math.sin(d2r(A2))/Math.sin(d2r(A0)):80));const sa=s02||b*Math.sin(d2r(A1))/Math.sin(d2r(A2));return[{x:0,y:0},{x:b,y:0},{x:sa*Math.cos(d2r(A0)),y:-sa*Math.sin(d2r(A0))}];}
  let cRaw=null;for(const tri of item.triangles){cRaw=buildC(tri);if(cRaw)break;}if(!cRaw&&item.triangles[0]?.vertices)cRaw=item.triangles[0].vertices;if(!cRaw)return null;
  const tA=v=>Math.abs((v[1].x-v[0].x)*(v[2].y-v[0].y)-(v[2].x-v[0].x)*(v[1].y-v[0].y))/2,lS=v=>Math.max(dist(v[0],v[1]),dist(v[1],v[2]),dist(v[2],v[0]))||1,isDeg=v=>!v||v.length<3||tA(v)/lS(v)<0.15;
  if(isDeg(cRaw)){cRaw=null;for(const tri of item.triangles){if(tri.vertices&&!isDeg(tri.vertices)){cRaw=tri.vertices;break;}}if(!cRaw)return null;}
  const mxS=Math.max(dist(cRaw[0],cRaw[1]),dist(cRaw[1],cRaw[2]),dist(cRaw[2],cRaw[0]))||1,cR2=cen(cRaw),uV=cRaw.map(v=>({x:(v.x-cR2.x)/mxS,y:(v.y-cR2.y)/mxS}));
  const LM=30,MIN_S=90,MAX_S=200,TW=260-2*LM,TH=200-2*LM;
  function aTx(v,t){if(!t||t==="none")return v;if(t==="flip_h")return v.map(p=>({x:-p.x,y:p.y}));if(t==="flip_v")return v.map(p=>({x:p.x,y:-p.y}));if(t==="rot90")return v.map(p=>({x:p.y,y:-p.x}));if(t==="rot180")return v.map(p=>({x:-p.x,y:-p.y}));if(t==="rot270")return v.map(p=>({x:-p.y,y:p.x}));if(t==="flip_h_rot90")return v.map(p=>({x:p.y,y:p.x}));return v;}
  function bb(v){const xs=v.map(p=>p.x),ys=v.map(p=>p.y);return{x0:Math.min(...xs),x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys),w:(Math.max(...xs)-Math.min(...xs))||1,h:(Math.max(...ys)-Math.min(...ys))||1};}
  const tVs=item.triangles.map(tri=>aTx(uV,tri.transform||"none")),bxs=tVs.map(bb);
  const sS=Math.min(MAX_S,Math.max(MIN_S,Math.min(...bxs.flatMap(b=>[TW/b.w,TH/b.h])))),cWs=bxs.map(b=>Math.ceil(b.w*sS+2*LM+10)),sH=Math.ceil(Math.max(...bxs.map(b=>b.h*sS))+2*LM+10);
  function pCell(ox,tv,box){const cw=Math.ceil(box.w*sS+2*LM+10),ox2=ox+(cw-box.w*sS)/2-box.x0*sS,oy=(sH-box.h*sS)/2-box.y0*sS;return tv.map(v=>({x:+(v.x*sS+ox2).toFixed(2),y:+(v.y*sS+oy).toFixed(2)}));}
  const svgW=cWs.reduce((s,w)=>s+w,0)+(item.triangles.length-1)*GAP,svgH=sH;
  const cells=item.triangles.map((tri,ti)=>{
    const ox=cWs.slice(0,ti).reduce((s,w)=>s+w+GAP,0),vs=pCell(ox,tVs[ti],bxs[ti]),cn=cen(vs),nv=vs.length,pts=vs.map(v=>v.x+","+v.y).join(" "),mk=tri.marks||{},sp=Math.max(...vs.map(v=>dist(v,cn))),AR=Math.max(12,Math.min(20,sp*0.20)),ss=Math.min(dist(vs[0],vs[1]),dist(vs[1],vs[2]),dist(vs[2],vs[0])),RA=Math.max(8,Math.min(13,ss*0.13));
    const ticks=(mk.sides||[]).flatMap((m,mi)=>{const p1=vs[m.from],p2=vs[m.to],mx=(p1.x+p2.x)/2,my=(p1.y+p2.y)/2,le=dist(p1,p2)||1,ex=(p2.x-p1.x)/le,ey=(p2.y-p1.y)/le,nx=-ey,ny=ex,TL=6,SP=4,n=m.ticks||1;return Array.from({length:n},(_,k)=>{const sh=(k-(n-1)/2)*SP,cx2=mx+ex*sh,cy2=my+ey*sh;return<line key={mi+"_"+k} x1={(cx2+nx*TL).toFixed(2)} y1={(cy2+ny*TL).toFixed(2)} x2={(cx2-nx*TL).toFixed(2)} y2={(cy2-ny*TL).toFixed(2)} stroke={G} strokeWidth="1.8" strokeLinecap="round"/>;});});
    const mks=(mk.angles||[]).filter(m=>!m.dot&&m.type!=="dot").map((m,mi)=>{const v=vs[m.at],pv=vs[(m.at+nv-1)%nv],nx=vs[(m.at+1)%nv];if(m.type==="right_angle"){const al=dist(pv,v)||1,bl=dist(nx,v)||1,d1x=(pv.x-v.x)/al,d1y=(pv.y-v.y)/al,d2x=(nx.x-v.x)/bl,d2y=(nx.y-v.y)/bl,p1x=v.x+d1x*RA,p1y=v.y+d1y*RA,p2x=v.x+d2x*RA,p2y=v.y+d2y*RA,pmx=p1x+d2x*RA,pmy=p1y+d2y*RA;return<path key={mi} d={"M"+p1x.toFixed(2)+","+p1y.toFixed(2)+" L"+pmx.toFixed(2)+","+pmy.toFixed(2)+" L"+p2x.toFixed(2)+","+p2y.toFixed(2)} fill="none" stroke={G} strokeWidth="1.5"/>;}return<g key={mi}>{Array.from({length:m.arcs||1},(_,k)=><path key={k} d={aP(v,pv,nx,AR+k*5)} fill="none" stroke={G} strokeWidth="1.4"/>)}</g>;});
    const raS=new Set((mk.angles||[]).filter(m=>m.type==="right_angle").map(m=>m.at));
    const aByV={};(tri.angle_labels||[]).forEach(al=>{if(!aByV[al.at])aByV[al.at]=[];aByV[al.at].push(al.text);});
    const aLbls=Object.entries(aByV).flatMap(([ats,txts])=>{const at=parseInt(ats),v=vs[at],pv=vs[(at+nv-1)%nv],nx=vs[(at+1)%nv],[bx,by]=eN(v,pv,nx),av=((180/Math.PI)*Math.atan2(Math.abs((pv.x-v.x)*(nx.y-v.y)-(pv.y-v.y)*(nx.x-v.x)),(pv.x-v.x)*(nx.x-v.x)+(pv.y-v.y)*(nx.y-v.y)))||90;if(raS.has(at)||Math.round(av)===90)return[];const r=av>100?AR*1.3:AR,ld=r+(av<45?18:14),el=[<path key={"a"+ats} d={aP(v,pv,nx,r)} fill="none" stroke={G} strokeWidth="1.4"/>];txts.forEach((txt,i)=>el.push(<HT key={"l"+ats+"_"+i} x={(v.x+bx*(ld+i*16)).toFixed(2)} y={(v.y+by*(ld+i*16)).toFixed(2)} text={txt} fill={C.black}/>));return el;});
    const sLbls=(tri.side_labels||[]).map((sl,si)=>{const p1=vs[sl.from],p2=vs[sl.to],[nx2,ny2]=eN(p1,p2,cn),mx=(p1.x+p2.x)/2,my=(p1.y+p2.y)/2,ll=(sl.text||"").length,ea=Math.abs(Math.atan2(p2.y-p1.y,p2.x-p1.x)*180/Math.PI),isVert=(ea>70&&ea<110),isHoriz=(ea<20||ea>160),off=28+Math.max(0,(ll-4)*2)+(isVert?8:0)+(isHoriz?4:0);return<HT key={"sl"+si} x={(mx+nx2*off).toFixed(2)} y={(my+ny2*off).toFixed(2)} text={sl.text} fill={C.black}/>;});
    const vLbls=vs.map((v,vi)=>{if(!v.label)return null;const dx=v.x-cn.x,dy=v.y-cn.y,dl=Math.hypot(dx,dy)||1;return<HT key={"vl"+vi} x={(v.x+dx/dl*20).toFixed(2)} y={(v.y+dy/dl*20).toFixed(2)} text={v.label} fill={G} bold/>;});
    return<g key={ti}><polygon points={pts} fill={G+"18"} stroke={G} strokeWidth="2" strokeLinejoin="round"/>{ticks}{mks}{aLbls}{sLbls}{vLbls}</g>;
  });
  return<svg width={svgW} height={svgH} viewBox={"0 0 "+svgW+" "+svgH} style={{display:"block",overflow:"visible",maxWidth:"100%"}}>{cells}</svg>;
}

/* ═══════════════════════════════════════════
   CORE — RENDERER REGISTRY
═══════════════════════════════════════════ */
const _renderers = {};
function registerRenderer(type, Comp) { _renderers[type] = Comp; }
function getRenderer(type) { return _renderers[type] || ShortAnswerRenderer; }

function DiagramBlock({ diagram }) {
  if (!diagram) return null;
  if (diagram.type==="svg_inline"&&diagram.value) return <div style={{margin:"10px 0",lineHeight:0}} dangerouslySetInnerHTML={{__html:diagram.value}}/>;
  if (diagram.type==="ct_triangle"&&diagram.data) return <CTTriangleDiagram item={diagram.data}/>;
  if (diagram.type==="geometry"&&diagram.data)    return <GeometryDiagram data={diagram.data}/>;
  return null;
}

/* ═══════════════════════════════════════════
   CORE — RENDERERS
═══════════════════════════════════════════ */
function McqRenderer({ q, isAnswer, worksheet }) {
  const opts=q.content?.options||[], correct=q.answer?.correct;
  return <div>
    <Instruction text={q.instruction} worksheet={worksheet}/>
    <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
      {opts.map(opt=>{const hit=isAnswer&&opt.key===correct;return<div key={opt.key} style={{display:"flex",alignItems:"flex-start",gap:"10px",padding:"8px 12px",background:hit?C.greenLt:"#FAFAFA",border:`1.5px solid ${hit?C.green:"#E2E8F0"}`}}>
        <span style={{fontWeight:700,color:hit?C.greenDk:C.slate,fontFamily:MONO,fontSize:"13px",minWidth:"20px",flexShrink:0}}>{opt.key}</span>
        <span style={{fontSize:"14px",lineHeight:1.5,flex:1}}><MathExpr text={opt.text}/></span>
        {hit&&<span style={{color:C.greenDk,fontWeight:700,fontSize:"13px",flexShrink:0}}>✓</span>}
      </div>;})}
    </div>
    {isAnswer&&q.answer?.explanation&&<div style={{marginTop:"10px",padding:"9px 13px",background:C.greenLt,borderLeft:`3px solid ${C.green}`,fontSize:"13px",fontFamily:SANS,lineHeight:1.5}}>{q.answer.explanation}</div>}
  </div>;
}

function cleanPrompt(text) { return (text||"").replace(/\s*\([^)]*first[^)]*\)/gi,"").replace(/\s*\[[^\]]*\]/g,"").trim(); }

function ShortAnswerRenderer({ q, isAnswer, worksheet }) {
  const parts=q.content?.parts, responses=q.answer?.responses||[];
  if (!parts||parts.length===0) {
    const resp=responses[0];
    return <div><Instruction text={q.instruction} worksheet={worksheet}/><DiagramBlock diagram={q.content?.diagram}/>{isAnswer&&resp?<WorkedAnswer resp={resp}/>:!isAnswer&&<WorkArea worksheet={worksheet}/>}</div>;
  }
  return <div>
    <Instruction text={q.instruction} worksheet={worksheet}/>
    <DiagramBlock diagram={q.content?.diagram}/>
    <div style={{display:"flex",flexDirection:"column",gap:"8px",marginTop:"8px"}}>
      {parts.map((part,pi)=>{
        const resp=responses.find(r=>r.label===part.label), mainP=cleanPrompt(part.prompt);
        const hint=part.hint||(part.prompt!==mainP?part.prompt.match(/\(([^)]+first[^)]*)\)/i)?.[1]:null);
        return <div key={pi} style={{padding:"10px 0",borderBottom:`1px solid ${C.slateLt}`}}>
          <div style={{display:"flex",alignItems:"baseline",gap:"10px"}}><PartLabel label={part.label}/><MathExpr text={mainP}/></div>
          {hint&&!isAnswer&&<div style={{marginLeft:"32px",fontSize:"12px",color:C.slate,fontFamily:SANS,fontStyle:"italic",marginTop:"2px"}}>Hint: {hint}</div>}
          {isAnswer&&resp?<div style={{marginLeft:"32px",marginTop:"4px"}}><WorkedAnswer resp={resp}/></div>:!isAnswer&&<div style={{marginLeft:"32px"}}><WorkArea worksheet={worksheet}/></div>}
        </div>;
      })}
    </div>
  </div>;
}

function DiagramRenderer({ q, isAnswer, worksheet }) {
  const parts=q.content?.parts, responses=q.answer?.responses||[];
  return <div>
    <Instruction text={q.instruction}/>
    <DiagramBlock diagram={q.content?.diagram}/>
    {parts&&parts.length>0
      ? <div style={{display:"flex",flexDirection:"column",gap:"0",marginTop:"8px"}}>
          {parts.map((part,pi)=>{const resp=responses.find(r=>r.label===part.label);return<div key={pi} style={{padding:"8px 0",borderBottom:`1px solid ${C.slateLt}`}}>
            <div style={{display:"flex",alignItems:"baseline",gap:"10px",marginBottom:isAnswer&&resp?"6px":0}}><PartLabel label={part.label}/><span style={{fontSize:"14px",flex:1,lineHeight:1.5}}><MathExpr text={part.prompt}/></span></div>
            {isAnswer&&resp?<div style={{marginLeft:"32px"}}><WorkedAnswer resp={resp}/></div>:!isAnswer&&<div style={{marginLeft:"32px"}}><WorkArea worksheet={worksheet}/></div>}
          </div>;})}
        </div>
      : isAnswer&&q.answer?.text
        ? <div style={{marginTop:"10px",padding:"10px 14px",background:C.greenLt,borderLeft:`3px solid ${C.green}`,fontFamily:SERIF,fontSize:"14px",lineHeight:1.6}}>{q.answer.text}</div>
        : !isAnswer?<WorkArea worksheet={worksheet}/>:null}
  </div>;
}

function TableRenderer({ q, isAnswer, worksheet }) {
  const cols=q.content?.columns||[], qRows=q.content?.rows||[], aRows=q.answer?.rows||[];
  const display=isAnswer&&aRows.length?aRows:qRows, blanks=new Set();
  qRows.forEach((row,ri)=>row.forEach((cell,ci)=>{if(cell===""||cell===null)blanks.add(ri+"-"+ci);}));
  return <div>
    <Instruction text={q.instruction}/>
    <div style={{overflowX:"auto",marginTop:"8px"}}>
      <table style={{borderCollapse:"collapse",width:"100%",fontFamily:SANS,fontSize:"13px"}}>
        <thead><tr>{cols.map((col,ci)=><th key={ci} style={{padding:"8px 14px",background:C.black,color:"#fff",fontWeight:700,textAlign:"left",border:`1px solid ${C.black}`}}>{col}</th>)}</tr></thead>
        <tbody>{display.map((row,ri)=><tr key={ri} style={{background:ri%2===0?"#fff":C.slateXlt}}>{row.map((cell,ci)=>{const was=blanks.has(ri+"-"+ci);return<td key={ci} style={{padding:"8px 14px",border:"1px solid #E2E8F0",minWidth:"80px",background:isAnswer&&was?C.greenLt:undefined,fontWeight:isAnswer&&was?700:400,color:isAnswer&&was?C.greenDk:C.black}}>{cell?<MathExpr text={cell}/>:(isAnswer?"":"▢")}</td>;})}</tr>)}</tbody>
      </table>
    </div>
  </div>;
}

/* ═══════════════════════════════════════════
   DOMAIN — GRAPH
═══════════════════════════════════════════ */
function GraphRenderer({ q, isAnswer, worksheet }) {
  const grid=q.content?.grid||{},{xMin=-5,xMax=5,yMin=-5,yMax=5,step=1}=grid;
  const pts=isAnswer?(q.answer?.points||[]):[], rule=q.content?.rule_expression||q.answer?.rule_expression;
  const PAD=32,W=260,H=260,toX=x=>(x-xMin)/(xMax-xMin||1)*(W-PAD*2)+PAD,toY=y=>(yMax-y)/(yMax-yMin||1)*(H-PAD*2)+PAD,curve=[];
  if(isAnswer&&rule){const m=rule.match(/y\s*=\s*(.+)/i);if(m){let expr=m[1].trim().replace(/(\d)x/g,"$1*x").replace(/x\^(\d+)/g,"(Math.pow(x,$1))");for(let xi=xMin;xi<=xMax;xi+=0.1){try{const y=Function("x","Math",`"use strict";return(${expr})`)(xi,Math);if(isFinite(y)&&y>=yMin-1&&y<=yMax+1)curve.push([toX(xi),toY(y)]);}catch(e){}}}}
  const xT=Array.from({length:Math.floor((xMax-xMin)/step)+1},(_,i)=>xMin+i*step),yT=Array.from({length:Math.floor((yMax-yMin)/step)+1},(_,i)=>yMin+i*step);
  return <div>
    <Instruction text={q.instruction} worksheet={worksheet}/>
    {q.content?.task&&<p style={{fontFamily:SERIF,fontSize:"13px",color:C.slate,marginBottom:"8px"}}>{q.content.task}</p>}
    <svg width={W} height={H} style={{display:"block",border:"1px solid #E2E8F0",background:"#FEFEFE"}}>
      {xT.map(x=><line key={"gx"+x} x1={toX(x)} y1={PAD} x2={toX(x)} y2={H-PAD} stroke="#E2E8F0" strokeWidth="0.5"/>)}
      {yT.map(y=><line key={"gy"+y} x1={PAD} y1={toY(y)} x2={W-PAD} y2={toY(y)} stroke="#E2E8F0" strokeWidth="0.5"/>)}
      {yMin<=0&&yMax>=0&&<line x1={PAD} y1={toY(0)} x2={W-PAD} y2={toY(0)} stroke={C.black} strokeWidth="1.5"/>}
      {xMin<=0&&xMax>=0&&<line x1={toX(0)} y1={PAD} x2={toX(0)} y2={H-PAD} stroke={C.black} strokeWidth="1.5"/>}
      {xT.filter(x=>x!==0).map(x=><text key={"tx"+x} x={toX(x)} y={toY(0)+13} fontSize="8" fill={C.slate} textAnchor="middle">{x}</text>)}
      {yT.filter(y=>y!==0).map(y=><text key={"ty"+y} x={toX(0)-6} y={toY(y)+3} fontSize="8" fill={C.slate} textAnchor="end">{y}</text>)}
      {curve.length>1&&<polyline points={curve.map(p=>p.join(",")).join(" ")} fill="none" stroke={C.green} strokeWidth="2"/>}
      {pts.map((pt,pi)=><g key={pi}><circle cx={toX(pt.x)} cy={toY(pt.y)} r={5} fill={C.green} stroke="#fff" strokeWidth="1.5"/>{pt.label&&<text x={toX(pt.x)+8} y={toY(pt.y)-6} fontSize="10" fontWeight="700" fill={C.greenDk}>{pt.label}</text>}</g>)}
      <text x={W-PAD+4} y={toY(0)+4} fontSize="10" fill={C.slate}>x</text>
      <text x={toX(0)+4} y={PAD-4} fontSize="10" fill={C.slate}>y</text>
    </svg>
  </div>;
}

/* ═══════════════════════════════════════════
   DOMAIN — ALGEBRA (classify)
═══════════════════════════════════════════ */
function ClassifyRenderer({ q, isAnswer, worksheet }) {
  const cats=q.content?.categories||[], items=q.content?.items||[], mapping=q.answer?.mapping||{};
  return <div>
    <Instruction text={q.instruction} worksheet={worksheet}/>
    <DiagramBlock diagram={q.content?.diagram}/>
    {isAnswer
      ? <div style={{display:"flex",gap:"12px",flexWrap:"wrap",marginTop:"8px"}}>
          {cats.map(cat=>{const ci=items.filter(it=>mapping[it]===cat);return<div key={cat} style={{flex:"1 1 140px",border:`1.5px solid ${C.greenMd}`,background:C.greenLt,padding:"10px 14px"}}>
            <div style={{fontWeight:700,fontSize:"11px",color:C.greenDk,fontFamily:SANS,marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.05em"}}>{cat}</div>
            {ci.map(it=><div key={it} style={{fontSize:"13px",padding:"3px 0",borderBottom:`1px solid ${C.greenMd}`,lineHeight:1.4}}><MathExpr text={it}/></div>)}
          </div>;})}
        </div>
      : <div style={{marginTop:"8px"}}>
          <div style={{display:"flex",gap:"12px",marginBottom:"10px",flexWrap:"wrap"}}>
            {cats.map(cat=><div key={cat} style={{flex:"1 1 140px",border:"1.5px dashed #CBD5E1",background:C.slateXlt,padding:"10px 14px",minHeight:"56px"}}>
              <div style={{fontWeight:700,fontSize:"11px",color:C.slate,fontFamily:SANS,textTransform:"uppercase",letterSpacing:"0.05em"}}>{cat}</div>
            </div>)}
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
            {items.map(it=><span key={it} style={{padding:"4px 12px",border:"1.5px solid #E2E8F0",background:"white",fontSize:"13px"}}><MathExpr text={it}/></span>)}
          </div>
        </div>}
  </div>;
}

/* Register all domain renderers */
registerRenderer("mcq",          McqRenderer);
registerRenderer("short_answer", ShortAnswerRenderer);
registerRenderer("diagram",      DiagramRenderer);
registerRenderer("table",        TableRenderer);
registerRenderer("graph",        GraphRenderer);
registerRenderer("classify",     ClassifyRenderer);

/* ═══════════════════════════════════════════
   CORE — QUESTION CARD
═══════════════════════════════════════════ */
function QuestionCard({ q, index, isAnswer, issues, worksheet }) {
  if (!q) return null;
  const meta=TYPE_META[q.type]||{label:"Unknown",icon:"?"}, Renderer=getRenderer(q.type);
  const cardIssues=(!worksheet&&issues||[]).filter(v=>v.field&&v.field.includes(q.id||`Q${index+1}`));
  if (worksheet) return <div style={{background:"white",border:"1.5px solid #E2E8F0",padding:"16px 20px"}}>
    <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px",paddingBottom:"8px",borderBottom:`1px solid ${C.slateLt}`}}>
      <span style={{fontFamily:SANS,fontSize:"14px",fontWeight:700,color:C.black,minWidth:"28px",flexShrink:0}}>{index+1}.</span>
      {q.section&&<span style={{fontSize:"10px",color:C.slate,fontFamily:MONO}}>§ {q.section}</span>}
    </div>
    <Renderer q={q} isAnswer={isAnswer} worksheet={worksheet}/>
  </div>;
  return <div style={{background:"white",border:`1.5px solid ${cardIssues.length?C.redMd:"#E2E8F0"}`,padding:"20px 24px"}}>
    <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px",paddingBottom:"10px",borderBottom:`1px solid ${C.slateLt}`}}>
      <div style={{width:"28px",height:"28px",background:`linear-gradient(135deg,${C.green},${C.greenDk})`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:"13px",fontFamily:MONO,flexShrink:0}}>{index+1}</div>
      <span style={{fontSize:"10px",fontWeight:700,color:C.green,fontFamily:MONO,letterSpacing:"0.08em",textTransform:"uppercase"}}>{meta.icon} {meta.label}</span>
      {q.section&&<span style={{fontSize:"10px",color:C.slate,fontFamily:MONO,marginLeft:"auto"}}>§ {q.section}</span>}
      {q.meta?.difficulty&&<span style={{fontSize:"9px",fontWeight:700,color:C.slate,fontFamily:MONO,background:C.slateLt,padding:"2px 7px",textTransform:"uppercase"}}>{q.meta.difficulty}</span>}
    </div>
    {cardIssues.map((iss,ii)=><div key={ii} style={{fontSize:"11px",color:C.orange,fontFamily:MONO,background:C.orangeLt,padding:"4px 10px",marginBottom:"8px",border:`1px solid ${C.orangeMd}`}}>⚠ {iss.msg}</div>)}
    <Renderer q={q} isAnswer={isAnswer} worksheet={worksheet}/>
  </div>;
}

/* ═══════════════════════════════════════════
   CORE — WORKFLOW UTILITIES
═══════════════════════════════════════════ */
function applyPatches(question, patches) {
  if (!patches||!patches.length) return question;
  const q=JSON.parse(JSON.stringify(question));
  patches.forEach(patch=>{if(!patch||!patch.path)return;try{const parts=patch.path.replace(/\[(\d+)\]/g,".$1").split(".").filter(Boolean);let obj=q;for(let i=0;i<parts.length-1;i++){if(obj[parts[i]]===undefined)obj[parts[i]]={};obj=obj[parts[i]];}obj[parts[parts.length-1]]=patch.value;}catch(e){}});
  return q;
}
function safeDownload(content, filename, mimeType, setPanel) {
  try{const blob=new Blob([content],{type:mimeType}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(url);document.body.removeChild(a);},100);if(setPanel)setPanel({content,filename});return;}catch(e){}
  try{navigator.clipboard.writeText(content).catch(()=>{});}catch(e){}
  if(setPanel)setPanel({content,filename});
}
async function captureCardPng(el) {
  if(!el)return null;
  if(!window.html2canvas){await new Promise((res,rej)=>{const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";s.onload=res;s.onerror=rej;document.head.appendChild(s);});}
  const container=document.createElement("div");container.style.cssText="position:fixed;left:0;top:0;width:700px;background:#fff;z-index:999999;pointer-events:none;";
  const clone=el.cloneNode(true);clone.style.cssText="width:700px;background:#fff;padding:0;margin:0;opacity:1;";
  container.appendChild(clone);document.body.appendChild(container);
  try{await document.fonts.ready;}catch(e){}
  await new Promise(r=>setTimeout(r,400));
  let result=null;
  try{const canvas=await window.html2canvas(container,{scale:2,useCORS:true,logging:false,backgroundColor:"#ffffff",width:700,windowWidth:1200});result=canvas.toDataURL("image/png").split(",")[1];}catch(e){}finally{document.body.removeChild(container);}
  return result;
}

const SECTION_DATA_RULES={
  "congruent triangles":["Tick marks: 1=shortest, 2=middle, 3=longest","No angle label on right-angle vertices","answer.text must name one test: SSS, SAS, AAS, RHS"],
  "tessellations":["MCQ answer.correct must match an existing option key","Vertex notation angles must sum to exactly 360°"],
  "inequalities":["Inequality symbol must match exactly","open=true for strict, open=false for non-strict"],
  "_default":["instruction must be present","answer block must be present","MCQ: answer.correct must match an option key"],
};
const SECTION_VISUAL={
  "inequalities":["Open circle = strict, closed = non-strict","Arrow direction matches inequality direction"],
  "_default":["No content truncation.","No overflow.","Diagrams within bounds."],
};
function getFullRubric(q){const sec=(q.section||"").toLowerCase().trim();let key="_default";for(const k of Object.keys(SECTION_DATA_RULES)){if(k!=="_default"&&sec.includes(k)){key=k;break;}}return{key,dataChecks:SECTION_DATA_RULES[key],visualChecks:SECTION_VISUAL[key]||SECTION_VISUAL._default};}

async function runQAForFrame(q, el) {
  const rubric=getFullRubric(q);
  let imgB64=null;try{imgB64=await captureCardPng(el);}catch(e){}
  const qc={...q};["_pool_set_vis","_pool_set_hid","_pool_vis_ids","_pool_hid_ids","_pool_editing"].forEach(k=>delete qc[k]);
  const hasImage=!!imgB64;
  const sysPrompt=`You are QA reviewer for a maths lesson formatter. Section: ${rubric.key}\nVisual checks:\n${(rubric.visualChecks||[]).map((c,i)=>`${i+1}. ${c}`).join("\n")}\nData checks:\n${(rubric.dataChecks||[]).slice(0,4).map((c,i)=>`${i+1}. ${c}`).join("\n")}\nReturn ONLY valid JSON:\n{"pass":true|false,"summary":"one line","issues":[{"type":"data_error"|"visual_todo","severity":"blocking"|"major"|"minor","description":"...","patch":{"path":"dot.path","value":null}|null}]}\nOnly flag real issues. pass:true with empty issues if correct.`;
  const uc=hasImage?[{type:"image",source:{type:"base64",media_type:"image/png",data:imgB64}},{type:"text",text:"JSON:\n```json\n"+JSON.stringify(qc,null,2)+"\n```"}]:[{type:"text",text:"NO SCREENSHOT — data only.\nJSON:\n```json\n"+JSON.stringify(qc,null,2)+"\n```\nOnly flag data errors."}];
  const timeout=new Promise(res=>setTimeout(()=>res({pass:true,summary:"Timeout",issues:[],_skipped:true}),20000));
  const call=(async()=>{try{const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1200,system:sysPrompt,messages:[{role:"user",content:uc}]})});if(!resp.ok)return{pass:true,summary:`API ${resp.status}`,issues:[],_skipped:true};const data=await resp.json();if(data.error)return{pass:true,summary:"API error",issues:[],_skipped:true};const text=(data.content?.find(c=>c.type==="text")?.text||"").replace(/```json|```/g,"").trim();return JSON.parse(text);}catch(e){return{pass:true,summary:"Network error",issues:[],_skipped:true};}})();
  const result=await Promise.race([call,timeout]);
  const issues=(result.issues||[]),blocking=issues.filter(i=>i.severity==="blocking"),major=issues.filter(i=>i.severity==="major"),minor=issues.filter(i=>i.severity==="minor"),patches=issues.filter(i=>i.patch),todos=issues.filter(i=>i.type==="visual_todo");
  return{pass:blocking.length===0&&major.length===0,summary:!hasImage?"⚠ No screenshot — data-only":blocking.length?`BLOCKING: ${blocking[0].description}`:major.length?`${major.length} major: ${major[0].description}`:minor.length?`${minor.length} minor`:result.summary||"All passed ✓",issues,passResults:[{pass:"combined",passed:result.pass,_skipped:result._skipped}],blocking:blocking.length,major:major.length,minor:minor.length,_patches:patches,_todos:todos,_hasImage:hasImage};
}

/* ═══════════════════════════════════════════
   GENERATION
═══════════════════════════════════════════ */
const SCHEMA_DEF=`QUESTION SCHEMA:\n{"id":"Q1","type":"mcq|short_answer|diagram|table|graph|classify","section":"...","instruction":"...","content":{...},"answer":{...},"meta":{"difficulty":"easy|medium|hard"}}\nmcq: content:{options:[{key,text}]} answer:{correct,explanation}\nshort_answer: content:{parts:[{label,prompt}]} answer:{responses:[{label,steps:[],final,number_line?}]}\nsteps format: "Operation label: algebra result"\ndiagram: content:{diagram:{type:"geometry",data:{...}},parts:[]} answer:{responses:[{label,text}]}\ntable: content:{columns:[],rows:[[]]} answer:{rows:[[]]}\ngraph: content:{grid:{xMin,xMax,yMin,yMax,step}} answer:{points:[{label,x,y}],rule_expression}\nclassify: content:{categories:[],items:[]} answer:{mapping:{}}`;
const GEOM_SPEC=`geometry.data:{width,height,grid("square"|"iso"|"none"),grid_size,shapes:[{shape:"regular_polygon"|"polygon"|"line"|"circle"|"semicircle"|"arc_shape",...}],angles:[{cx,cy,from_deg,to_deg,radius?,label?}],points:[{x,y,label,label_pos}],labels:[{x,y,text,size?,bold?,color?}]}\nSVG y=DOWN: 0=right,90=down,180=left,270=up`;
function buildGenPrompt(topic,section,year,count){return `You are a maths question generator for Year ${year} students.\nGenerate exactly ${count} questions for topic "${topic}", section "${section}".\n\n${SCHEMA_DEF}\n\n${GEOM_SPEC}\n\nRULES: Output ONLY a valid JSON array. steps[] REQUIRED in every short_answer. Mix types. All ids unique. Answers correct. For classify: every item must appear in answer.mapping.`;}
function buildDiagramRevisionPrompt(section){return `You are a maths diagram QA reviewer. Assess diagram: correct sizes, no overlaps, readable labels, correct angle arcs.\nSection: ${section||"geometry"}\nReturn ONLY valid JSON: {"pass":true|false,"critique":"...","revised_data":{...complete geometry.data...}|null}\nIf pass:true set revised_data:null.`;}
async function generateQuestions(topic,section,year,count,exemplars){
  const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:8000,system:buildGenPrompt(topic,section,year,count),messages:[{role:"user",content:`Generate ${count} questions based on these exemplars:\n\n${exemplars}\n\nReturn only the JSON array.`}]})});
  if(!resp.ok)throw new Error(`API ${resp.status}`);
  const data=await resp.json();if(data.error)throw new Error(data.error.message||"API error");
  const text=(data.content?.find(c=>c.type==="text")?.text||"").replace(/^```json|^```|```$/gm,"").trim();
  return JSON.parse(text);
}
async function reviseDiagram(q,cardEl,maxIter,onProgress){
  if(q.type!=="diagram"||q.content?.diagram?.type!=="geometry")return q;
  let current={...q};const log=[];
  for(let iter=1;iter<=maxIter;iter++){
    onProgress({iter,maxIter,phase:"screenshot"});
    let imgB64=null;try{imgB64=await captureCardPng(cardEl);}catch(e){}
    onProgress({iter,maxIter,phase:"critique"});
    const userContent=[];
    if(imgB64)userContent.push({type:"image",source:{type:"base64",media_type:"image/png",data:imgB64}});
    userContent.push({type:"text",text:`Current geometry.data:\n\`\`\`json\n${JSON.stringify(current.content.diagram.data,null,2)}\n\`\`\`\nQuestion: ${q.instruction}\nCritique and return revision JSON.`});
    try{const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2000,system:buildDiagramRevisionPrompt(q.section||""),messages:[{role:"user",content:userContent}]})});if(!resp.ok){log.push({iter,pass:false,critique:`API ${resp.status}`,revised:false});break;}
    const data=await resp.json();if(data.error){log.push({iter,pass:false,critique:"API error",revised:false});break;}
    const text=(data.content?.find(c=>c.type==="text")?.text||"").replace(/```json|```/g,"").trim(),result=JSON.parse(text);
    log.push({iter,pass:result.pass,critique:result.critique,revised:!!result.revised_data});
    if(result.pass)break;
    if(result.revised_data){current={...current,content:{...current.content,diagram:{...current.content.diagram,data:result.revised_data}}};onProgress({iter,maxIter,phase:"re-render"});await new Promise(res=>setTimeout(res,600));}else break;
    }catch(e){log.push({iter,pass:false,critique:"Error: "+e.message,revised:false});break;}
  }
  return{...current,_diag_log:log};
}

/* Sample JSON */
const SAMPLE_JSON=JSON.stringify({lesson_title:"Tessellations — Set A",topic:"transformations_congruence",year:9,version:"1.0",questions:[{id:"T1",type:"mcq",section:"Tessellations",instruction:"Which best describes a tessellation?",content:{options:[{key:"A",text:"Shapes joined together"},{key:"B",text:"Shapes stacked on top of each other"},{key:"C",text:"Shapes arranged with no overlaps and no gaps"},{key:"D",text:"Shapes forming an attractive pattern"}]},answer:{correct:"C",explanation:"A tessellation covers a plane with no gaps and no overlaps."},meta:{difficulty:"easy"}},{id:"T2",type:"classify",section:"Tessellations",instruction:"Which shapes tessellate by themselves?",content:{categories:["Tessellates","Does not tessellate"],items:["Equilateral triangle","Circle","Square","Regular hexagon","Regular pentagon","Rectangle"]},answer:{mapping:{"Equilateral triangle":"Tessellates","Circle":"Does not tessellate","Square":"Tessellates","Regular hexagon":"Tessellates","Regular pentagon":"Does not tessellate","Rectangle":"Tessellates"}},meta:{difficulty:"medium"}},{id:"T3",type:"short_answer",section:"Tessellations",instruction:"Explain why circles cannot form a tessellation.",content:{parts:[]},answer:{responses:[{label:"",text:"Circles have curved edges that leave gaps when fitted together. A tessellation requires no gaps and no overlaps."}]},meta:{difficulty:"medium"}},{id:"T4",type:"short_answer",section:"Tessellations",instruction:"Name the following semi-regular tessellations using vertex notation.",content:{parts:[{label:"a",prompt:"Three equilateral triangles and two squares meet at each vertex."},{label:"b",prompt:"One square and two regular octagons meet at each vertex."},{label:"c",prompt:"One triangle, two squares and one hexagon meet at each vertex."}]},answer:{responses:[{label:"a",text:"3.3.3.4.4"},{label:"b",text:"4.8.8"},{label:"c",text:"3.4.6.4"}]},meta:{difficulty:"hard"}},{id:"T5",type:"diagram",section:"Tessellations",instruction:"The diagram shows three regular hexagons meeting at a point. Use the diagram to explain why regular hexagons tessellate.",content:{diagram:{type:"geometry",data:{width:280,height:240,grid:"iso",grid_size:28,shapes:[{shape:"regular_polygon",sides:6,cx:140,cy:120,radius:72,fill:true},{shape:"regular_polygon",sides:6,cx:202,cy:182,radius:72,fill:true},{shape:"regular_polygon",sides:6,cx:78,cy:182,radius:72,fill:true}],angles:[{cx:140,cy:182,from_deg:330,to_deg:90,radius:22,label:"120°"},{cx:140,cy:182,from_deg:90,to_deg:210,radius:22},{cx:140,cy:182,from_deg:210,to_deg:330,radius:22}],points:[{x:140,y:182,label:"V",label_pos:"above"}],labels:[{x:140,y:50,text:"Each interior angle = 120°",size:10,color:"#1E293B"},{x:140,y:222,text:"3 × 120° = 360° ✓",size:11,bold:true,color:"#3D9A7E"}]}}},answer:{text:"Each interior angle of a regular hexagon is 120°. At vertex V, three hexagons meet: 3 × 120° = 360°, which fills exactly the space around a point with no gap and no overlap. Therefore regular hexagons tessellate."},meta:{difficulty:"medium"}}]},null,2);

/* ═══════════════════════════════════════════
   QA PANEL
═══════════════════════════════════════════ */
function QAPanel({lesson,setLesson,qaResults,setQaResults,qaRefs}){
  const[running,setRunning]=useState(false),[progress,setProgress]=useState({done:0,total:0,iter:0,of:0}),[passTarget,setPassTarget]=useState(90),[maxIter,setMaxIter]=useState(3),[iterLog,setIterLog]=useState([]),[visualTodos,setVisualTodos]=useState([]);
  const stopRef=useRef(false);
  const run=useCallback(async()=>{stopRef.current=false;setRunning(true);setQaResults(null);setIterLog([]);setVisualTodos([]);let questions=[...lesson.questions];const allTodos=[];
    for(let iter=1;iter<=maxIter;iter++){if(stopRef.current)break;setProgress({done:0,total:questions.length,iter,of:maxIter});const results=[];
      for(let i=0;i<questions.length;i++){if(stopRef.current)break;const q=questions[i],qId=q.id||`idx-${i}`,el=qaRefs.current[qId];try{const r=await runQAForFrame(q,el);results.push({frameIdx:i,qId,frameLabel:`Q${i+1}`,...r});}catch(e){results.push({frameIdx:i,qId,frameLabel:`Q${i+1}`,pass:false,summary:"Error",issues:[]});}setProgress(p=>({...p,done:i+1}));}
      let patches=0;results.forEach(r=>{(r.issues||[]).forEach(iss=>{if(iss.type==="visual_todo")allTodos.push({frameLabel:r.frameLabel,...iss});});const ps=(r.issues||[]).filter(i=>i.patch);if(ps.length){questions[r.frameIdx]=applyPatches(questions[r.frameIdx],ps.map(i=>i.patch));patches+=ps.length;}});
      const passCount=results.filter(r=>r.pass).length,pct=Math.round(passCount/results.length*100);setIterLog(p=>[...p,{iter,passCount,total:results.length,patches,pct}]);setQaResults(results);if(patches>0)setLesson(prev=>({...prev,questions:[...questions]}));setVisualTodos([...allTodos]);if(pct>=passTarget&&patches===0)break;if(iter<maxIter)await new Promise(res=>setTimeout(res,700));}
    setRunning(false);},[lesson,maxIter,passTarget,qaRefs,setQaResults,setLesson]);
  const passCount=qaResults?qaResults.filter(r=>r.pass).length:0,total=qaResults?qaResults.length:0,pct=total?Math.round(passCount/total*100):0;
  return<div>
    <div style={{background:"white",border:"1.5px solid #E2E8F0",padding:"14px 18px",marginBottom:"18px",display:"flex",flexWrap:"wrap",gap:"18px",alignItems:"center"}}>
      <div><div style={{fontSize:"9px",fontWeight:700,color:C.slate,fontFamily:MONO,letterSpacing:"0.07em",marginBottom:"4px",textTransform:"uppercase"}}>Pass target</div><div style={{display:"flex",gap:"4px"}}>{[70,80,90,100].map(v=><button key={v} onClick={()=>setPassTarget(v)} style={{...BS,padding:"5px 10px",fontSize:"11px",fontFamily:MONO,borderColor:passTarget===v?C.orange:"#E2E8F0",color:passTarget===v?C.orange:C.slate,fontWeight:passTarget===v?700:400}}>{v}%</button>)}</div></div>
      <div style={{width:"1px",height:"34px",background:"#E2E8F0"}}/>
      <div><div style={{fontSize:"9px",fontWeight:700,color:C.slate,fontFamily:MONO,letterSpacing:"0.07em",marginBottom:"4px",textTransform:"uppercase"}}>Max rounds</div><div style={{display:"flex",gap:"4px"}}>{[1,2,3,5].map(v=><button key={v} onClick={()=>setMaxIter(v)} style={{...BS,padding:"5px 10px",fontSize:"11px",fontFamily:MONO,borderColor:maxIter===v?C.orange:"#E2E8F0",color:maxIter===v?C.orange:C.slate,fontWeight:maxIter===v?700:400}}>{v}</button>)}</div></div>
      <div style={{marginLeft:"auto",display:"flex",gap:"8px"}}>{running?<button onClick={()=>{stopRef.current=true;}} style={{...BS,color:C.red,borderColor:C.redMd}}>⏹ Stop</button>:<button onClick={run} style={BO}>{qaResults?"↺ Re-run":"▶ Run QA"}</button>}</div>
    </div>
    {running&&<div style={{marginBottom:"14px"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:"11px",fontFamily:MONO,color:C.slate,marginBottom:"4px"}}><span>Round {progress.iter}/{progress.of}</span><span>{progress.done}/{progress.total}</span></div><div style={{height:"6px",background:C.slateLt}}><div style={{height:"100%",background:`linear-gradient(90deg,${C.orange},#F59E0B)`,width:`${progress.total?Math.round(progress.done/progress.total*100):0}%`,transition:"width 0.3s"}}/></div></div>}
    {iterLog.length>0&&<div style={{background:"#0F172A",padding:"12px 16px",marginBottom:"14px",fontFamily:MONO,fontSize:"11px"}}><div style={{color:"#F59E0B",fontWeight:700,fontSize:"9px",letterSpacing:"0.1em",marginBottom:"6px",textTransform:"uppercase"}}>Log</div>{iterLog.map((e,ei)=><div key={ei} style={{display:"flex",gap:"12px",padding:"3px 0",borderBottom:ei<iterLog.length-1?"1px solid #1E293B":"none",opacity:ei===iterLog.length-1?1:0.6}}><span style={{color:"#475569",minWidth:"48px"}}>round {e.iter}</span><span style={{color:e.pct===100?"#4ADE80":e.pct>=70?"#F59E0B":"#F87171"}}>{e.passCount}/{e.total} ({e.pct}%)</span><span style={{color:C.orange}}>{e.patches} patch{e.patches!==1?"es":""}</span></div>)}</div>}
    {qaResults&&!running&&<div style={{display:"flex",gap:"10px",marginBottom:"14px"}}><div style={{flex:"1 1 80px",padding:"12px",background:C.greenLt,border:"1.5px solid #86EFAC",textAlign:"center"}}><div style={{fontSize:"24px",fontWeight:700,fontFamily:SERIF,color:"#15803D"}}>{passCount}</div><div style={{fontSize:"9px",fontWeight:700,color:"#15803D",fontFamily:SANS,letterSpacing:"0.06em"}}>PASSED</div></div><div style={{flex:"2 1 160px",background:"white",border:`1.5px solid ${pct>=passTarget?"#86EFAC":"#E2E8F0"}`,padding:"12px",display:"flex",flexDirection:"column",justifyContent:"center",gap:"5px"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:"10px",fontFamily:MONO,color:C.slate}}><span>{pct}% passing</span><span style={{color:pct>=passTarget?"#15803D":C.orange}}>target {passTarget}%{pct>=passTarget?" ✓":""}</span></div><div style={{height:"6px",background:C.slateLt,position:"relative"}}><div style={{height:"100%",background:pct>=passTarget?"#4ADE80":`linear-gradient(90deg,${C.orange},#F59E0B)`,width:pct+"%",transition:"width 0.4s"}}/><div style={{position:"absolute",top:0,bottom:0,left:passTarget+"%",width:"2px",background:C.orange,opacity:0.5}}/></div></div></div>}
    {visualTodos.length>0&&<div style={{background:C.redLt,border:`1.5px solid ${C.redMd}`,padding:"12px 16px",marginBottom:"14px"}}><div style={{fontWeight:700,fontSize:"12px",color:C.red,fontFamily:SANS,marginBottom:"7px"}}>⚠ Visual TODOs</div>{visualTodos.map((t,ti)=><div key={ti} style={{display:"flex",gap:"10px",padding:"4px 0"}}><span style={{fontFamily:MONO,fontSize:"10px",color:"#F87171",minWidth:"60px",flexShrink:0}}>{t.frameLabel}</span><span style={{fontSize:"12px",color:"#7F1D1D",fontFamily:SANS}}>{t.description}</span></div>)}</div>}
    {qaResults&&<div style={{display:"flex",flexDirection:"column",gap:"4px"}}>{qaResults.map(r=>{const blocking=(r.issues||[]).filter(i=>i.severity==="blocking"),major=(r.issues||[]).filter(i=>i.severity==="major"),minor=(r.issues||[]).filter(i=>i.severity==="minor"),patches=(r.issues||[]).filter(i=>i.patch);return<div key={r.qId} style={{border:`1.5px solid ${r.pass?"#86EFAC":blocking.length?"#DC2626":major.length?C.orange:C.redMd}`,background:r.pass?"#F9FEFB":"#FFFAFA",padding:"8px 12px"}}><div style={{display:"flex",alignItems:"center",gap:"8px"}}><span style={{fontFamily:MONO,fontWeight:700,fontSize:"11px",color:r.pass?"#15803D":blocking.length?C.red:C.orange,minWidth:"50px"}}>{r.pass?"✓":"✗"} {r.frameLabel}</span>{!r._hasImage&&<span style={{fontSize:"9px",fontFamily:MONO,color:"#94A3B8",background:"#F1F5F9",padding:"1px 5px",border:"1px solid #E2E8F0"}}>no screenshot</span>}<span style={{fontSize:"12px",color:C.slate,fontFamily:SANS,flex:1,lineHeight:1.4}}>{r.summary}{r._skipped?" (skipped)":""}</span><div style={{display:"flex",gap:"3px"}}>{blocking.length>0&&<span style={{fontSize:"9px",fontWeight:700,color:"white",fontFamily:MONO,background:C.red,padding:"2px 6px"}}>🔴 {blocking.length}</span>}{major.length>0&&<span style={{fontSize:"9px",fontWeight:700,color:"white",fontFamily:MONO,background:C.orange,padding:"2px 6px"}}>🟠 {major.length}</span>}{patches.length>0&&<span style={{fontSize:"9px",fontWeight:700,color:C.greenDk,fontFamily:MONO,background:C.greenLt,border:`1px solid ${C.greenMd}`,padding:"2px 5px"}}>{patches.length}× patched</span>}</div></div></div>;})}
    </div>}
    {!qaResults&&!running&&<div style={{border:"2px dashed #FDE68A",background:C.orangeLt,padding:"44px 28px",textAlign:"center"}}><div style={{fontSize:"36px",marginBottom:"8px"}}>🔍</div><div style={{fontFamily:SERIF,fontSize:"18px",fontWeight:600,color:C.orange,marginBottom:"6px"}}>QA Inspector</div><div style={{fontSize:"13px",color:"#92400E",maxWidth:"340px",margin:"0 auto",lineHeight:1.6}}>Screenshots each card, sends image + JSON to Claude. Patches data errors, logs visual TODOs.</div></div>}
  </div>;
}

/* ═══════════════════════════════════════════
   APP
═══════════════════════════════════════════ */
export default function App() {
  const[input,setInput]=useState(""),[lesson,setLesson]=useState(null),[validation,setValidation]=useState(null),[view,setView]=useState("import"),[title,setTitle]=useState(""),[error,setError]=useState(null),[copyMsg,setCopyMsg]=useState(null),[worksheetMode,setWorksheetMode]=useState(false),[jsonPanel,setJsonPanel]=useState(null),[formatRevisions,setFormatRevisions]=useState(0),[formatReviewing,setFormatReviewing]=useState(false),[qaProgress,setQaProgress]=useState({done:0,total:0,iter:0,of:0}),[reviewLog,setReviewLog]=useState([]),[reviewFinal,setReviewFinal]=useState(null),[qaResults,setQaResults]=useState(null),[qaPatched,setQaPatched]=useState(false),[qaAutoSummary,setQaAutoSummary]=useState(null),[genExemplars,setGenExemplars]=useState(""),[genTopic,setGenTopic]=useState(""),[genSection,setGenSection]=useState(""),[genYear,setGenYear]=useState("9"),[genCount,setGenCount]=useState(5),[genDiagIter,setGenDiagIter]=useState(3),[genRunning,setGenRunning]=useState(false),[genStage,setGenStage]=useState(""),[genProgress,setGenProgress]=useState({done:0,total:0,stage:""}),[genLog,setGenLog]=useState([]),[genError,setGenError]=useState(null);
  const fileRef=useRef(null),qaRefs=useRef({});

  const handleImport=useCallback((raw)=>{setError(null);let parsed;try{parsed=JSON.parse(raw);}catch(e){setError("Invalid JSON: "+e.message);return;}const val=validateLesson(parsed);setLesson(parsed);setValidation(val);setTitle(parsed.lesson_title||"");setReviewLog([]);setReviewFinal(null);setQaResults(null);setQaAutoSummary(null);setView("validate");},[]);

  const handleGenerate=useCallback(async()=>{
    setGenRunning(true);setGenError(null);setGenLog([]);setGenStage("generating");
    const addLog=(type,msg)=>setGenLog(prev=>[...prev,{type,msg,ts:Date.now()}]);
    try{
      addLog("info",`Generating ${genCount} questions…`);
      let questions;try{questions=await generateQuestions(genTopic,genSection,genYear,genCount,genExemplars);if(!Array.isArray(questions))throw new Error("Not an array");addLog("ok",`Generated ${questions.length} questions`);}catch(e){addLog("error","Generation failed: "+e.message);setGenError("Generation failed: "+e.message);setGenRunning(false);return;}
      const lessonDraft={lesson_title:(genSection||genTopic)+" — Generated Set",topic:genTopic,year:parseInt(genYear)||9,version:"1.0",questions};
      setLesson(lessonDraft);setValidation(validateLesson(lessonDraft));setTitle(lessonDraft.lesson_title);
      await new Promise(res=>setTimeout(res,800));
      const diagQs=questions.map((q,i)=>({q,i})).filter(({q})=>q.type==="diagram"&&q.content?.diagram?.type==="geometry");
      if(diagQs.length>0){setGenStage("diagrams");addLog("info",`Revising ${diagQs.length} diagrams…`);for(const{q,i}of diagQs){const el=qaRefs.current[q.id||`idx-${i}`];setGenProgress({done:i,total:diagQs.length,stage:"diagrams",qId:q.id,iter:1,maxIter:genDiagIter});const revised=await reviseDiagram(q,el,genDiagIter,({iter,maxIter,phase})=>setGenProgress({done:i,total:diagQs.length,stage:"diagrams",qId:q.id,iter,maxIter,phase}));questions[i]=revised;const fp=revised._diag_log?.[revised._diag_log.length-1]?.pass;addLog(fp?"ok":"warn",`Diagram Q${i+1}: ${fp?"✓ passed":"⚠ best effort"}`);setLesson(prev=>{const nq=[...(prev?.questions||[])];nq[i]=questions[i];return{...prev,questions:nq};});await new Promise(res=>setTimeout(res,400));}addLog("ok","Diagrams done");}
      setGenStage("qa");addLog("info","Running QA…");await new Promise(res=>setTimeout(res,600));
      let totalPatches=0;const allTodos=[];
      for(let i=0;i<questions.length;i++){const q=questions[i],el=qaRefs.current[q.id||`idx-${i}`];setGenProgress({done:i,total:questions.length,stage:"qa"});try{const result=await runQAForFrame(q,el);const patches=(result.issues||[]).filter(iss=>iss.patch),todos=(result.issues||[]).filter(iss=>iss.type==="visual_todo");if(patches.length){questions[i]=applyPatches(questions[i],patches.map(p=>p.patch));totalPatches+=patches.length;addLog("ok",`Q${i+1}: ${patches.length} patch${patches.length!==1?"es":""} applied`);}todos.forEach(t=>allTodos.push({frameLabel:`Q${i+1}`,...t}));if(!result.pass&&!result._skipped)addLog("warn",`Q${i+1}: ${result.summary}`);}catch(e){}}
      if(totalPatches>0)addLog("ok",`QA: ${totalPatches} total patches`);
      const finalLesson={...lessonDraft,questions:questions.map(q=>{const c={...q};delete c._diag_log;return c;})};
      setLesson(finalLesson);setValidation(validateLesson(finalLesson));setQaAutoSummary({rounds:1,patches:totalPatches,visualTodos:allTodos});setGenStage("done");addLog("ok",`Done — ${questions.length} questions ready`);
    }catch(e){setGenError("Pipeline error: "+e.message);addLog("error","Pipeline error: "+e.message);}
    setGenRunning(false);
  },[genExemplars,genTopic,genSection,genYear,genCount,genDiagIter]);

  const handleFormatAndReview=useCallback(async()=>{if(!lesson)return;if(formatRevisions===0){setView("preview");return;}setFormatReviewing(true);setView("review");setReviewLog([]);setReviewFinal(null);setQaResults(null);setQaAutoSummary(null);await new Promise(res=>setTimeout(res,700));let questions=[...lesson.questions],totalPatches=0;const allTodos=[],log=[];for(let iter=1;iter<=formatRevisions;iter++){setQaProgress({done:0,total:questions.length,iter,of:formatRevisions});const results=[];for(let i=0;i<questions.length;i++){const q=questions[i],el=qaRefs.current[q.id||`idx-${i}`];try{const r=await runQAForFrame(q,el);results.push({frameIdx:i,qId:q.id,frameLabel:`Q${i+1}`,...r});}catch(e){results.push({frameIdx:i,qId:q.id,frameLabel:`Q${i+1}`,pass:false,summary:"Error",issues:[]});}setQaProgress(p=>({...p,done:i+1}));}let iterP=0;results.forEach(r=>{(r.issues||[]).forEach(iss=>{if(iss.type==="visual_todo")allTodos.push({frameLabel:r.frameLabel,...iss});});const ps=(r.issues||[]).filter(i=>i.patch);if(ps.length){questions[r.frameIdx]=applyPatches(questions[r.frameIdx],ps.map(i=>i.patch));iterP+=ps.length;}});totalPatches+=iterP;const passCount=results.filter(r=>r.pass).length;log.push({iter,passCount,total:questions.length,patches:iterP});setReviewLog([...log]);setLesson(prev=>({...prev,questions:[...questions]}));setQaResults(results);if(passCount===questions.length&&iterP===0)break;if(iter<formatRevisions)await new Promise(res=>setTimeout(res,700));}setQaAutoSummary({rounds:log.length,patches:totalPatches,visualTodos:allTodos,iterLogs:log});setReviewFinal([...questions]);setFormatReviewing(false);},[lesson,formatRevisions]);

  const qs=lesson?.questions||[],hasLesson=!!lesson;
  const tabs=[{k:"generate",l:"⚡ Generate",on:true,accent:C.orange},{k:"import",l:"✏️ Import",on:true},{k:"validate",l:"✓ Validate",on:hasLesson,badge:validation?(validation.errors.length?{n:validation.errors.length,col:C.red}:validation.warnings.length?{n:validation.warnings.length,col:C.orange}:{n:"✓",col:C.green}):null},{k:"preview",l:"👁 Questions",on:hasLesson},{k:"answers",l:"✅ Answers",on:hasLesson},{k:"qa",l:"🔍 QA",on:hasLesson},{k:"export",l:"📤 Export",on:hasLesson}];

  return (
    <div style={{fontFamily:SANS,minHeight:"100vh",background:C.cream}}>
      <link href={FONTS} rel="stylesheet"/>
      <span style={{position:"absolute",left:"-9999px",fontFamily:"'STIX Two Text',serif",fontStyle:"italic",fontSize:"16px",opacity:0,pointerEvents:"none"}}>xyzabcmnpqr</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {jsonPanel&&<div style={{position:"fixed",bottom:0,left:0,right:0,background:"#0F172A",borderTop:`3px solid ${C.green}`,zIndex:1000,padding:"12px 24px",display:"flex",gap:"12px",alignItems:"center"}}><div style={{flex:1,minWidth:0}}><div style={{fontSize:"11px",fontWeight:700,color:C.green,fontFamily:MONO,marginBottom:"4px"}}>{jsonPanel.filename} — copied ✓</div><textarea readOnly value={jsonPanel.content} onClick={e=>e.target.select()} style={{width:"100%",height:"60px",fontFamily:MONO,fontSize:"10px",color:"#94A3B8",background:"#1E293B",border:"1px solid #334155",padding:"6px",resize:"none",outline:"none"}}/></div><button onClick={()=>{try{navigator.clipboard.writeText(jsonPanel.content).catch(()=>{});}catch(e){}}} style={{...BP,fontSize:"12px",padding:"8px 16px",flexShrink:0}}>📋 Copy</button><button onClick={()=>setJsonPanel(null)} style={{...BS,fontSize:"12px",padding:"8px 12px",flexShrink:0}}>✕</button></div>}
      <div style={{background:"#0F172A",padding:"14px 24px",color:"white"}}><div style={{display:"flex",alignItems:"center",gap:"12px"}}><div style={{width:"36px",height:"36px",background:`linear-gradient(135deg,${C.green},${C.greenDk})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",flexShrink:0}}>📐</div><div><h1 style={{fontFamily:SERIF,fontSize:"18px",fontWeight:700,margin:0}}>Lesson Formatter <span style={{fontSize:"9px",opacity:0.5,fontFamily:"monospace",fontWeight:400}}>v2.3</span></h1><p style={{fontSize:"10px",color:"#94A3B8",fontFamily:MONO,margin:0}}>{lesson?`${qs.length} questions · ${lesson.topic||""} · Year ${lesson.year||"?"}`:""}</p></div></div></div>
      <div style={{background:"white",borderBottom:"1px solid #E2E8F0",position:"sticky",top:0,zIndex:10}}><div style={{display:"flex",alignItems:"stretch",overflowX:"auto",padding:"0 8px"}}>{tabs.map(t=><button key={t.k} onClick={()=>t.on&&setView(t.k)} style={{padding:"10px 12px",background:"none",border:"none",borderBottom:view===t.k?`3px solid ${t.accent||C.green}`:"3px solid transparent",color:view===t.k?(t.accent||C.green):t.on?C.slate:"#CBD5E1",fontWeight:view===t.k?700:500,fontSize:"12px",cursor:t.on?"pointer":"default",fontFamily:SANS,display:"flex",alignItems:"center",gap:"4px",whiteSpace:"nowrap"}}>{t.l}{t.badge&&<span style={{fontSize:"9px",fontWeight:700,color:t.badge.col,fontFamily:MONO,background:t.badge.col+"18",padding:"1px 4px",border:`1px solid ${t.badge.col}40`}}>{t.badge.n}</span>}</button>)}{hasLesson&&!formatReviewing&&<div style={{marginLeft:"auto",display:"flex",alignItems:"center",padding:"0 8px"}}><button onClick={()=>setWorksheetMode(v=>!v)} style={{padding:"4px 10px",background:worksheetMode?C.orangeLt:"none",border:`1px solid ${worksheetMode?C.orange:"#E2E8F0"}`,color:worksheetMode?C.orange:C.slate,fontSize:"11px",cursor:"pointer",fontFamily:SANS}}>{worksheetMode?"📖 Textbook":"📄 Worksheet"}</button></div>}{formatReviewing&&<div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:"8px",fontSize:"11px",fontFamily:MONO,color:C.orange,padding:"0 8px"}}><div style={{width:"8px",height:"8px",border:`2px solid ${C.orange}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>Round {qaProgress.iter}/{qaProgress.of}</div>}</div></div>

      {/* Hidden render zone */}
      <div style={{position:"fixed",left:"-9999px",top:0,width:"700px",pointerEvents:"none",zIndex:-1,overflow:"visible"}}>{qs.map((q,i)=>{const qId=q.id||`idx-${i}`;return<div key={qId} ref={el=>{if(el)qaRefs.current[qId]=el;}} style={{background:"white",padding:"16px",marginBottom:"4px",width:"700px",overflow:"visible"}}><QuestionCard q={q} index={i} isAnswer={false} worksheet={false} issues={[]}/><QuestionCard q={q} index={i} isAnswer={true} worksheet={false} issues={[]}/></div>;})}</div>

      <div style={{padding:"20px 24px"}}>
        {/* GENERATE */}
        {view==="generate"&&<div>
          <h2 style={{fontFamily:SERIF,fontSize:"20px",fontWeight:700,color:"#0F172A",marginBottom:"4px"}}>⚡ Generate Questions</h2>
          <p style={{fontSize:"13px",color:C.slate,marginBottom:"20px"}}>Paste exemplar questions → Claude generates, revises diagrams, and runs QA.</p>
          {genError&&<div style={{background:C.redLt,border:`1px solid ${C.redMd}`,padding:"10px 16px",marginBottom:"16px",fontSize:"13px",color:C.red,fontFamily:MONO}}>⚠ {genError}</div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 70px",gap:"10px",marginBottom:"14px"}}>
            <div><label style={{fontSize:"10px",fontWeight:700,color:C.slate,fontFamily:MONO,letterSpacing:"0.07em",textTransform:"uppercase",display:"block",marginBottom:"4px"}}>Topic</label><input value={genTopic} onChange={e=>setGenTopic(e.target.value)} placeholder="e.g. transformations_congruence" style={{width:"100%",padding:"8px 10px",border:"1.5px solid #E2E8F0",fontFamily:MONO,fontSize:"12px",outline:"none",boxSizing:"border-box"}}/></div>
            <div><label style={{fontSize:"10px",fontWeight:700,color:C.slate,fontFamily:MONO,letterSpacing:"0.07em",textTransform:"uppercase",display:"block",marginBottom:"4px"}}>Section</label><input value={genSection} onChange={e=>setGenSection(e.target.value)} placeholder="e.g. Tessellations" style={{width:"100%",padding:"8px 10px",border:"1.5px solid #E2E8F0",fontFamily:MONO,fontSize:"12px",outline:"none",boxSizing:"border-box"}}/></div>
            <div><label style={{fontSize:"10px",fontWeight:700,color:C.slate,fontFamily:MONO,letterSpacing:"0.07em",textTransform:"uppercase",display:"block",marginBottom:"4px"}}>Year</label><input value={genYear} onChange={e=>setGenYear(e.target.value)} placeholder="9" style={{width:"100%",padding:"8px 10px",border:"1.5px solid #E2E8F0",fontFamily:MONO,fontSize:"12px",outline:"none",boxSizing:"border-box"}}/></div>
          </div>
          <div style={{display:"flex",gap:"20px",marginBottom:"14px",flexWrap:"wrap",alignItems:"flex-end"}}>
            <div><label style={{fontSize:"10px",fontWeight:700,color:C.slate,fontFamily:MONO,letterSpacing:"0.07em",textTransform:"uppercase",display:"block",marginBottom:"4px"}}>Questions</label><div style={{display:"flex",gap:"4px"}}>{[3,5,8,10].map(n=><button key={n} onClick={()=>setGenCount(n)} style={{...BS,padding:"5px 12px",fontSize:"12px",fontFamily:MONO,borderColor:genCount===n?C.orange:"#E2E8F0",color:genCount===n?C.orange:C.slate,fontWeight:genCount===n?700:400}}>{n}</button>)}</div></div>
            <div><label style={{fontSize:"10px",fontWeight:700,color:C.slate,fontFamily:MONO,letterSpacing:"0.07em",textTransform:"uppercase",display:"block",marginBottom:"4px"}}>Diagram rounds</label><div style={{display:"flex",gap:"4px"}}>{[1,2,3,5].map(n=><button key={n} onClick={()=>setGenDiagIter(n)} style={{...BS,padding:"5px 12px",fontSize:"12px",fontFamily:MONO,borderColor:genDiagIter===n?C.orange:"#E2E8F0",color:genDiagIter===n?C.orange:C.slate,fontWeight:genDiagIter===n?700:400}}>{n}</button>)}</div></div>
          </div>
          <div style={{marginBottom:"14px"}}><label style={{fontSize:"10px",fontWeight:700,color:C.slate,fontFamily:MONO,letterSpacing:"0.07em",textTransform:"uppercase",display:"block",marginBottom:"4px"}}>Exemplar questions</label><textarea value={genExemplars} onChange={e=>setGenExemplars(e.target.value)} placeholder={`Paste 1–3 exemplar questions (JSON or plain English):\n"Q: Which shapes tessellate? (MCQ, answer = equilateral triangle)"`} style={{width:"100%",minHeight:"140px",padding:"12px 14px",border:"1.5px solid #E2E8F0",fontFamily:MONO,fontSize:"12px",lineHeight:1.7,color:C.black,resize:"vertical",outline:"none",background:"white",boxSizing:"border-box"}}/></div>
          {!genRunning&&genStage!=="done"&&<button onClick={handleGenerate} disabled={!genExemplars.trim()||!genTopic.trim()} style={{...BO,opacity:(genExemplars.trim()&&genTopic.trim())?1:0.4,cursor:(genExemplars.trim()&&genTopic.trim())?"pointer":"default",display:"flex",alignItems:"center",gap:"8px"}}>⚡ Generate &amp; Review</button>}
          {genRunning&&<div style={{display:"flex",gap:"10px",alignItems:"center"}}><div style={{width:"12px",height:"12px",border:`2.5px solid ${C.orange}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite",flexShrink:0}}/><span style={{fontSize:"13px",fontWeight:600,color:C.orange,fontFamily:SANS}}>{genStage==="generating"?"Generating…":genStage==="diagrams"?`Revising diagrams (iter ${genProgress.iter||1}/${genDiagIter} ${genProgress.phase||""})…`:genStage==="qa"?`QA — ${genProgress.done+1}/${genProgress.total}…`:"Running…"}</span></div>}
          {genLog.length>0&&<div style={{marginTop:"16px",background:"#0F172A",padding:"12px 16px",fontFamily:MONO,fontSize:"11px",maxHeight:"220px",overflowY:"auto"}}><div style={{color:"#F59E0B",fontWeight:700,fontSize:"9px",letterSpacing:"0.1em",marginBottom:"6px",textTransform:"uppercase"}}>Pipeline Log</div>{genLog.map((entry,ei)=><div key={ei} style={{padding:"2px 0",color:entry.type==="ok"?"#4ADE80":entry.type==="error"?"#F87171":entry.type==="warn"?"#F59E0B":"#94A3B8",lineHeight:1.5}}><span style={{opacity:0.4,marginRight:"8px"}}>{new Date(entry.ts).toLocaleTimeString("en-AU",{hour12:false,hour:"2-digit",minute:"2-digit",second:"2-digit"})}</span>{entry.msg}</div>)}</div>}
          {genStage==="done"&&!genRunning&&lesson&&<div style={{marginTop:"16px",background:"white",border:`1.5px solid ${C.greenMd}`,padding:"16px 20px"}}><div style={{fontWeight:700,fontSize:"14px",fontFamily:SERIF,color:C.black,marginBottom:"10px"}}>✅ {lesson.questions?.length||0} questions ready{qaAutoSummary?.patches>0&&<span style={{fontSize:"12px",fontWeight:400,color:C.orange,marginLeft:"10px"}}>· {qaAutoSummary.patches} patches</span>}{qaAutoSummary?.visualTodos?.length>0&&<span style={{fontSize:"12px",fontWeight:400,color:C.red,marginLeft:"10px"}}>· {qaAutoSummary.visualTodos.length} visual TODOs</span>}</div><div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}><button onClick={()=>setView("preview")} style={BP}>👁 Preview →</button><button onClick={()=>setView("validate")} style={BS}>✓ Validate</button><button onClick={()=>safeDownload(JSON.stringify(lesson,null,2),(lesson.lesson_title||"generated").toLowerCase().split(" ").join("-")+".json","application/json",setJsonPanel)} style={BS}>↓ JSON</button><button onClick={()=>{setGenStage("");setGenLog([]);setGenError(null);}} style={{...BS,color:C.slate}}>↺ Reset</button></div></div>}
        </div>}

        {/* IMPORT */}
        {view==="import"&&<div>
          <h2 style={{fontFamily:SERIF,fontSize:"20px",fontWeight:700,color:"#0F172A",marginBottom:"14px"}}>Import JSON</h2>
          {error&&<div style={{background:C.redLt,border:`1px solid ${C.redMd}`,padding:"10px 16px",marginBottom:"12px",fontSize:"13px",color:C.red,fontFamily:MONO}}>⚠ {error}</div>}
          <textarea value={input} onChange={e=>{setInput(e.target.value);setError(null);}} placeholder="Paste your lesson JSON here…" style={{width:"100%",minHeight:"260px",padding:"14px 16px",border:"1.5px solid #E2E8F0",fontFamily:MONO,fontSize:"12px",lineHeight:1.7,color:C.black,resize:"vertical",outline:"none",background:"white",boxSizing:"border-box"}}/>
          <div style={{display:"flex",gap:0,marginTop:"12px",alignItems:"stretch",flexWrap:"wrap",rowGap:"8px"}}>
            <button onClick={()=>input.trim()&&handleImport(input)} disabled={!input.trim()} style={{...BP,opacity:input.trim()?1:0.4,cursor:input.trim()?"pointer":"default"}}>{formatRevisions>0?`Import & Review (${formatRevisions}×) →`:"Import →"}</button>
            <div style={{display:"flex",alignItems:"stretch",border:"1.5px solid #E2E8F0",borderLeft:"none",background:"white"}}><div style={{display:"flex",flexDirection:"column",justifyContent:"center",padding:"0 8px",borderRight:"1px solid #E2E8F0"}}><div style={{fontSize:"9px",fontWeight:700,color:"#94A3B8",letterSpacing:"0.07em",fontFamily:SANS,textTransform:"uppercase"}}>Auto-review</div><div style={{fontSize:"11px",fontWeight:700,color:formatRevisions>0?C.green:"#94A3B8",fontFamily:MONO}}>{formatRevisions===0?"off":`${formatRevisions}×`}</div></div><button onClick={()=>setFormatRevisions(v=>Math.max(0,v-1))} style={{width:"28px",background:"white",border:"none",borderRight:"1px solid #E2E8F0",color:formatRevisions>0?C.black:"#CBD5E1",fontSize:"14px",cursor:formatRevisions>0?"pointer":"default",fontWeight:700}}>−</button><button onClick={()=>setFormatRevisions(v=>Math.min(5,v+1))} style={{width:"28px",background:"white",border:"none",color:formatRevisions<5?C.black:"#CBD5E1",fontSize:"14px",cursor:formatRevisions<5?"pointer":"default",fontWeight:700}}>+</button></div>
          </div>
          <div style={{display:"flex",gap:"8px",marginTop:"8px",flexWrap:"wrap"}}>
            <button onClick={()=>fileRef.current?.click()} style={BS}>📁 Import File</button>
            <input ref={fileRef} type="file" accept=".json" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setInput(ev.target.result);r.readAsText(f);e.target.value="";}}/>
            <button onClick={()=>setInput(SAMPLE_JSON)} style={{...BS,color:"#2563EB",borderColor:"#BFDBFE"}}>🔷 Tessellations Example</button>
            {input.trim()&&<button onClick={()=>{setInput("");setError(null);setLesson(null);setValidation(null);setView("import");}} style={{...BS,color:C.red,borderColor:C.redMd}}>✕ Clear</button>}
          </div>
          <div style={{marginTop:"20px",background:"white",border:"1px solid #E2E8F0",padding:"14px 18px"}}><div style={{fontWeight:700,fontSize:"13px",color:C.black,fontFamily:SERIF,marginBottom:"8px"}}>Question types</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:"6px"}}>{Object.entries(TYPE_META).map(([type,m])=><div key={type} style={{padding:"6px 10px",background:C.slateXlt,border:"1px solid #E2E8F0",fontFamily:MONO,fontSize:"11px",color:C.black}}>{m.icon} <strong>{type}</strong><div style={{fontSize:"10px",color:C.slate,marginTop:"1px"}}>{m.label}</div></div>)}</div></div>
        </div>}

        {/* VALIDATE */}
        {view==="validate"&&lesson&&validation&&<div>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"18px",flexWrap:"wrap",gap:"10px"}}><div><h2 style={{fontFamily:SERIF,fontSize:"20px",fontWeight:700,color:"#0F172A",margin:0}}>{lesson.lesson_title||"Untitled"}</h2><p style={{fontSize:"11px",color:C.slate,fontFamily:MONO,margin:"4px 0 0"}}>Year {lesson.year||"?"} · {lesson.topic||""} · {qs.length} questions</p></div><button onClick={()=>formatRevisions>0?handleFormatAndReview():setView("preview")} style={BP}>{formatRevisions>0?`Review (${formatRevisions}×) →`:"Preview →"}</button></div>
          <div style={{padding:"12px 16px",marginBottom:"16px",background:validation.valid?(validation.warnings.length?C.orangeLt:C.greenLt):C.redLt,border:`1.5px solid ${validation.valid?(validation.warnings.length?C.orangeMd:C.greenMd):C.redMd}`,display:"flex",gap:"10px",alignItems:"center"}}><span style={{fontSize:"16px"}}>{validation.valid?(validation.warnings.length?"⚠️":"✅"):"❌"}</span><div><div style={{fontWeight:700,fontSize:"13px",fontFamily:SANS,color:validation.valid?(validation.warnings.length?C.orange:C.greenDk):C.red}}>{validation.valid?"Schema valid":"Schema has errors"} · {validation.errors.length} error{validation.errors.length!==1?"s":""} · {validation.warnings.length} warning{validation.warnings.length!==1?"s":""}</div><div style={{fontSize:"12px",color:C.slate,fontFamily:SANS}}>{validation.valid?"Safe to preview.":"Fix errors before rendering."}</div></div></div>
          {validation.errors.length>0&&<div style={{marginBottom:"10px"}}><div style={{fontSize:"10px",fontWeight:700,color:C.red,fontFamily:MONO,letterSpacing:"0.07em",marginBottom:"5px",textTransform:"uppercase"}}>Errors</div>{validation.errors.map((e,ei)=><div key={ei} style={{padding:"6px 10px",background:C.redLt,borderLeft:`3px solid ${C.red}`,marginBottom:"3px",fontSize:"12px",fontFamily:MONO,color:C.red}}>✗ {e.msg}</div>)}</div>}
          {validation.warnings.length>0&&<div style={{marginBottom:"10px"}}><div style={{fontSize:"10px",fontWeight:700,color:C.orange,fontFamily:MONO,letterSpacing:"0.07em",marginBottom:"5px",textTransform:"uppercase"}}>Warnings</div>{validation.warnings.map((w,wi)=><div key={wi} style={{padding:"6px 10px",background:C.orangeLt,borderLeft:`3px solid ${C.orange}`,marginBottom:"3px",fontSize:"12px",fontFamily:MONO,color:C.orange}}>⚠ {w.msg}</div>)}</div>}
          <div style={{marginTop:"12px"}}><div style={{fontSize:"10px",fontWeight:700,color:C.slate,fontFamily:MONO,letterSpacing:"0.07em",marginBottom:"5px",textTransform:"uppercase"}}>Questions</div>{qs.map((q,i)=>{const m=TYPE_META[q.type],qi=[...validation.errors,...validation.warnings].filter(v=>v.field&&v.field.includes(q.id||`Q${i+1}`));return<div key={i} style={{display:"flex",gap:"8px",alignItems:"center",padding:"6px 10px",background:i%2===0?"white":C.slateXlt,border:"1px solid #E2E8F0",borderTop:i===0?"1px solid #E2E8F0":"none"}}><span style={{fontFamily:MONO,fontSize:"11px",fontWeight:700,color:C.green,minWidth:"28px"}}>Q{i+1}</span><span style={{fontFamily:MONO,fontSize:"11px",color:C.slate,minWidth:"18px"}}>{m?.icon||"?"}</span><span style={{fontFamily:MONO,fontSize:"11px",color:C.black,minWidth:"110px"}}>{q.type||"?"}</span><span style={{fontFamily:SANS,fontSize:"12px",color:C.black,flex:1}}>{(q.instruction||"").substring(0,55)}{(q.instruction||"").length>55?"…":""}</span>{q.section&&<span style={{fontSize:"10px",color:C.slate,fontFamily:MONO,whiteSpace:"nowrap"}}>§ {q.section}</span>}{qi.length>0&&<span style={{fontSize:"10px",color:C.orange,fontFamily:MONO}}>⚠ {qi.length}</span>}</div>;})}</div>
        </div>}

        {/* PREVIEW */}
        {view==="preview"&&lesson&&<div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"18px",flexWrap:"wrap",gap:"10px"}}><div><h2 style={{fontFamily:SERIF,fontSize:"20px",fontWeight:700,color:"#0F172A",margin:0}}>{title||lesson.lesson_title}</h2><p style={{fontSize:"11px",color:C.slate,fontFamily:MONO,margin:"4px 0 0"}}>{qs.length} questions · Year {lesson.year||"?"}</p></div><button onClick={()=>setView("answers")} style={BP}>Answers →</button></div>
          <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>{qs.map((q,i)=><QuestionCard key={q.id||i} q={q} index={i} isAnswer={false} worksheet={worksheetMode} issues={[...(validation?.errors||[]),...(validation?.warnings||[])]}/>)}</div>
        </div>}

        {/* ANSWERS */}
        {view==="answers"&&lesson&&<div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"18px",flexWrap:"wrap",gap:"10px"}}><div><h2 style={{fontFamily:SERIF,fontSize:"20px",fontWeight:700,color:"#0F172A",margin:0}}>{title||lesson.lesson_title} — Answers</h2><p style={{fontSize:"11px",color:C.slate,fontFamily:MONO,margin:"4px 0 0"}}>{qs.length} questions</p></div><div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>{qaAutoSummary&&<button onClick={()=>setView("review")} style={{...BS,fontSize:"12px",padding:"8px 14px"}}>← Review</button>}<button onClick={()=>setView("preview")} style={BS}>← Questions</button><button onClick={()=>setView("export")} style={BP}>Export →</button></div></div>
          <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>{qs.map((q,i)=><QuestionCard key={q.id||i} q={q} index={i} isAnswer={true} worksheet={worksheetMode} issues={[]}/>)}</div>
        </div>}

        {/* QA */}
        {view==="qa"&&lesson&&<QAPanel lesson={lesson} setLesson={setLesson} qaResults={qaResults} setQaResults={setQaResults} qaRefs={qaRefs}/>}

        {/* EXPORT */}
        {view==="export"&&lesson&&<div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"14px",flexWrap:"wrap",gap:"8px"}}><div><h2 style={{fontFamily:SERIF,fontSize:"20px",fontWeight:700,color:"#0F172A",marginBottom:"2px"}}>Export</h2><p style={{fontSize:"12px",color:C.slate,margin:0}}>Right-click any card → Save Image As.</p></div><div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>{qaAutoSummary&&<button onClick={()=>setView("review")} style={{...BS,fontSize:"12px",padding:"7px 12px"}}>← Review</button>}<button onClick={()=>setView("answers")} style={{...BS,fontSize:"12px",padding:"7px 12px"}}>← Answers</button></div></div>
          <div style={{background:"#0F172A",padding:"12px 16px",marginBottom:"16px"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"6px"}}><span style={{fontSize:"10px",fontWeight:700,color:"#94A3B8",fontFamily:MONO,textTransform:"uppercase",letterSpacing:"0.07em"}}>{lesson.lesson_title||"Lesson"} — JSON</span><div style={{display:"flex",gap:"6px"}}><button onClick={()=>{const json=JSON.stringify(lesson,null,2);navigator.clipboard.writeText(json).then(()=>{setCopyMsg("✓ Copied!");setTimeout(()=>setCopyMsg(null),2000);}).catch(()=>{setCopyMsg("✗ Failed");setTimeout(()=>setCopyMsg(null),3000);});}} style={{...BP,fontSize:"11px",padding:"5px 12px"}}>{copyMsg||"📋 Copy JSON"}</button><button onClick={()=>safeDownload(JSON.stringify(lesson,null,2),(lesson.lesson_title||"lesson").toLowerCase().split(" ").join("-")+".json","application/json",setJsonPanel)} style={{...BS,fontSize:"11px",padding:"5px 12px"}}>↓ Download</button></div></div><textarea readOnly value={JSON.stringify(lesson,null,2)} onClick={e=>e.target.select()} style={{width:"100%",height:"80px",fontFamily:MONO,fontSize:"10px",color:"#94A3B8",background:"#1E293B",border:"1px solid #334155",padding:"6px",resize:"vertical",outline:"none",boxSizing:"border-box",cursor:"text"}}/></div>
          <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>{qs.map((q,i)=><div key={q.id||i}><div style={{fontSize:"10px",fontWeight:700,color:C.slate,fontFamily:MONO,marginBottom:"4px",textTransform:"uppercase",letterSpacing:"0.06em"}}>Q{i+1} — Question</div><QuestionCard q={q} index={i} isAnswer={false} worksheet={worksheetMode} issues={[]}/><div style={{fontSize:"10px",fontWeight:700,color:C.slate,fontFamily:MONO,margin:"4px 0",textTransform:"uppercase",letterSpacing:"0.06em"}}>Q{i+1} — Answer</div><QuestionCard q={q} index={i} isAnswer={true} worksheet={worksheetMode} issues={[]}/></div>)}</div>
        </div>}

        {/* REVIEW */}
        {view==="review"&&<div>
          <div style={{marginBottom:"18px"}}><h2 style={{fontFamily:SERIF,fontSize:"20px",fontWeight:700,color:"#0F172A",marginBottom:"4px"}}>{formatReviewing?"⏳ Reviewing…":"✅ Review Complete"}</h2><p style={{fontSize:"12px",color:C.slate}}>{formatReviewing?`Round ${qaProgress.iter} of ${qaProgress.of} — ${qaProgress.done}/${qaProgress.total}`:`${qaAutoSummary?.rounds} round${qaAutoSummary?.rounds!==1?"s":""} · ${qaAutoSummary?.patches||0} patches · ${qaAutoSummary?.visualTodos?.length||0} TODOs`}</p></div>
          {formatReviewing&&<div style={{marginBottom:"16px"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:"11px",fontFamily:MONO,color:C.slate,marginBottom:"4px"}}><span>Round {qaProgress.iter}/{qaProgress.of}</span><span>{qaProgress.done}/{qaProgress.total}</span></div><div style={{height:"8px",background:C.slateLt}}><div style={{height:"100%",background:`linear-gradient(90deg,${C.green},${C.greenDk})`,width:`${qaProgress.total?Math.round(qaProgress.done/qaProgress.total*100):0}%`,transition:"width 0.3s"}}/></div></div>}
          {reviewLog.length>0&&<div style={{background:"#0F172A",padding:"12px 16px",marginBottom:"16px",fontFamily:MONO,fontSize:"11px"}}><div style={{color:"#F59E0B",fontWeight:700,fontSize:"9px",letterSpacing:"0.1em",marginBottom:"6px",textTransform:"uppercase"}}>Revision Log</div>{reviewLog.map((e,ei)=>{const pct=Math.round(e.passCount/e.total*100);return<div key={ei} style={{display:"flex",gap:"12px",padding:"3px 0",borderBottom:ei<reviewLog.length-1?"1px solid #1E293B":"none",opacity:ei===reviewLog.length-1?1:0.6}}><span style={{color:"#475569",minWidth:"52px"}}>Round {e.iter}</span><span style={{color:pct===100?"#4ADE80":pct>=70?"#F59E0B":"#F87171",minWidth:"100px"}}>{e.passCount}/{e.total} ({pct}%)</span><span style={{color:C.orange}}>{e.patches} patch{e.patches!==1?"es":""}</span></div>;})}  </div>}
          {!formatReviewing&&qaAutoSummary&&<div><div style={{display:"flex",gap:"8px",marginBottom:"16px",flexWrap:"wrap"}}>{[{n:reviewLog[reviewLog.length-1]?.passCount||0,l:"PASSED",c:C.green,bg:C.greenLt,bd:"#86EFAC"},{n:qaAutoSummary.patches,l:"PATCHES",c:C.orange,bg:C.orangeLt,bd:C.orangeMd},{n:qaAutoSummary.visualTodos.length,l:"TODOs",c:C.red,bg:C.redLt,bd:C.redMd}].map(s=><div key={s.l} style={{flex:"1 1 80px",padding:"10px",background:s.bg,border:`1.5px solid ${s.bd}`,textAlign:"center"}}><div style={{fontSize:"24px",fontWeight:700,fontFamily:SERIF,color:s.c}}>{s.n}</div><div style={{fontSize:"9px",fontWeight:700,color:s.c,fontFamily:SANS,letterSpacing:"0.07em"}}>{s.l}</div></div>)}</div><div style={{background:"white",border:"1.5px solid #E2E8F0",padding:"16px 20px"}}><div style={{fontWeight:700,fontSize:"13px",fontFamily:SERIF,color:C.black,marginBottom:"12px"}}>Download output</div><div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}><button onClick={()=>{const out={...lesson,questions:reviewFinal||qs};safeDownload(JSON.stringify(out,null,2),(lesson.lesson_title||"lesson").toLowerCase().split(" ").join("-")+"-reviewed.json","application/json",setJsonPanel);}} style={BP}>↓ Download JSON</button><button onClick={()=>setView("export")} style={{...BP,background:`linear-gradient(135deg,${C.green},${C.greenDk})`}}>📤 Export Cards</button><button onClick={()=>setView("preview")} style={BS}>👁 Preview</button></div></div></div>}
        </div>}
      </div>
    </div>
  );
}
