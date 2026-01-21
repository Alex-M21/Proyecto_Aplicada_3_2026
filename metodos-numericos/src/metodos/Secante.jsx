// src/metodos/Secante.jsx
import { useState, useMemo, useEffect } from "react";
import { create, all } from "mathjs";
import "./Biseccion.css";

const math = create(all, {});

// === Pan & Zoom genéricos (solo eje X) ===
const makePanZoomHandlers = (range, setRange, width, padL, padR) => {
  let dragging = false;
  let lastClientX = 0;
  const innerW = width - padL - padR;

  const clientXToX = (svg, clientX, xMin, xMax) => {
    const rect = svg.getBoundingClientRect();
    let px = clientX - rect.left;
    px = Math.max(padL, Math.min(width - padR, px));
    const t = (px - padL) / innerW;
    return xMin + t * (xMax - xMin);
  };

  const onWheel = (e) => {
    e.preventDefault();
    const svg = e.currentTarget;
    const { xMin, xMax } = range;
    const mouseX = clientXToX(svg, e.clientX, xMin, xMax);

    const k = e.deltaY < 0 ? 1 / 1.2 : 1.2;
    const span = Math.max(1e-9, (xMax - xMin) * k);

    const t = (mouseX - xMin) / (xMax - xMin);
    const newXMin = mouseX - t * span;
    const newXMax = newXMin + span;

    setRange({ xMin: newXMin, xMax: newXMax });
  };

  const onMouseDown = (e) => {
    dragging = true;
    lastClientX = e.clientX;
    e.currentTarget.style.cursor = "grabbing";
  };

  const onMouseMove = (e) => {
    if (!dragging) return;
    const dxPx = e.clientX - lastClientX;
    lastClientX = e.clientX;

    const { xMin, xMax } = range;
    const dxX = -dxPx * (xMax - xMin) / innerW;
    setRange({ xMin: xMin + dxX, xMax: xMax + dxX });
  };

  const finish = (e) => {
    dragging = false;
    if (e?.currentTarget) e.currentTarget.style.cursor = "grab";
  };

  return {
    onWheel,
    onMouseDown,
    onMouseMove,
    onMouseUp: finish,
    onMouseLeave: finish,
    style: { cursor: "grab" },
  };
};

export default function Secante() {
  const [fxInput, setFxInput] = useState("3*ln(x-1)+2*cos(x-1)");
  const [xPrevInput, setXPrevInput] = useState("1.1");
  const [xCurrInput, setXCurrInput] = useState("2");
  const [tolInput, setTolInput] = useState("0.001");
  const [maxIterInput, setMaxIterInput] = useState("23");
  const [decimalsInput, setDecimalsInput] = useState("5");

  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const normalizeExpr = (expr) =>
    expr.trim().replace(/ln/gi, "log").replace(/sen/gi, "sin");
  const buildCompiled = (expr) => {
    const trimmed = expr.trim();
    if (!trimmed) return null;
    try { return math.compile(normalizeExpr(trimmed)); } catch { return null; }
  };
  const getDecimals = () => {
    const d = parseInt(decimalsInput, 10);
    return Number.isNaN(d) || d < 0 ? 6 : d;
  };
  const formatNumber = (v) => Number.isFinite(v) ? v.toFixed(getDecimals()) : "NaN";

  // =========================
  // Cálculo de la Secante
  // =========================
  const handleCalculate = (e) => {
    e.preventDefault();
    setMessage(""); setErrorMsg(""); setRows([]);

    if (!fxInput.trim()) { setErrorMsg("Debes ingresar una expresión para f(x)."); return; }

    let xPrev = parseFloat(xPrevInput);
    let xCurr = parseFloat(xCurrInput);
    const tol = parseFloat(tolInput);
    const maxIter = parseInt(maxIterInput, 10);

    if (!Number.isFinite(xPrev) || !Number.isFinite(xCurr) || !Number.isFinite(tol) || !Number.isFinite(maxIter)) {
      setErrorMsg("Por favor ingresa valores numéricos válidos."); return;
    }
    if (tol <= 0) { setErrorMsg("La tolerancia debe ser un número positivo."); return; }
    if (maxIter <= 0) { setErrorMsg("El número de iteraciones debe ser mayor que cero."); return; }

    const cF = buildCompiled(fxInput);
    if (!cF) { setErrorMsg("La función f(x) no se pudo interpretar. Revisa la sintaxis."); return; }

    const f = (x) => { try { const r = cF.evaluate({ x }); return Number.isFinite(r) ? r : NaN; } catch { return NaN; } };

    const newRows = [];
    let found = false, bad = false;

    try {
      for (let n = 1; n <= maxIter; n++) {
        const fxPrev = f(xPrev);
        const fxCurr = f(xCurr);
        if (!Number.isFinite(fxPrev) || !Number.isFinite(fxCurr)) {
          setErrorMsg("No se pudo evaluar f(x) en alguna iteración."); bad = true; break;
        }
        const denom = fxCurr - fxPrev;
        if (denom === 0) { setErrorMsg("f(xₙ) - f(xₙ₋₁) = 0. La secante no puede continuar."); bad = true; break; }

        const xNext = xCurr - fxCurr * (xCurr - xPrev) / denom;
        const error = Math.abs(xNext - xCurr);
        newRows.push({ n, xPrev, xCurr, xNext, error });

        if (error < tol) { found = true; break; }
        xPrev = xCurr; xCurr = xNext;
      }
    } catch {
      setErrorMsg("Ocurrió un error inesperado durante las iteraciones."); bad = true;
    }

    setRows(newRows);
    if (!newRows.length || bad) return;
    const last = newRows[newRows.length - 1];
    setMessage(found
      ? `Se encontró una aproximación a la solución: x ≈ ${formatNumber(last.xNext)}`
      : "Se alcanzó el número máximo de iteraciones sin cumplir la tolerancia.");
  };

  const handleClear = () => {
    setFxInput(""); setXPrevInput(""); setXCurrInput("");
    setTolInput(""); setMaxIterInput(""); setDecimalsInput("5");
    setRows([]); setMessage(""); setErrorMsg("");
  };

  // =========================
  // Tabla CSV
  // =========================
  const handleDownloadTable = () => {
    if (!rows.length) return;
    const headers = ["n","x_{n-1}","x_n","x_{n+1}","Error"];
    const csv = [headers.join(",")].concat(
      rows.map(r => [r.n, formatNumber(r.xPrev), formatNumber(r.xCurr), formatNumber(r.xNext), formatNumber(r.error)].join(","))
    ).join("\n");
    const blob = new Blob([csv], { type:"text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "secante_iteraciones.csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // =========================
  // Curva base f(x)
  // =========================
  const graphBase = useMemo(() => {
    const cF = buildCompiled(fxInput);
    if (!cF) return { pts:[], xMin:-5, xMax:5, yMin:-1, yMax:1 };
    const f = (x) => { try { const r = cF.evaluate({x}); return Number.isFinite(r)?r:NaN; } catch { return NaN; } };
    const xp = parseFloat(xPrevInput), xc = parseFloat(xCurrInput);
    let xMin, xMax;
    if (Number.isFinite(xp) && Number.isFinite(xc)) {
      xMin = Math.min(xp, xc); xMax = Math.max(xp, xc);
      const m = (xMax - xMin) * 0.2 || 2; xMin -= m; xMax += m;
    } else { xMin = -5; xMax = 5; }

    const steps=120, step=(xMax-xMin)/steps, pts=[];
    for(let i=0;i<=steps;i++){ const x=xMin+i*step; const y=f(x); if(Number.isFinite(y)) pts.push({x,y}); }
    if(!pts.length) return { pts:[], xMin, xMax, yMin:-1, yMax:1 };
    const ys=pts.map(p=>p.y);
    let yMin=Math.min(...ys), yMax=Math.max(...ys);
    if (yMin===yMax){ yMin-=1; yMax+=1; } else { const m=(yMax-yMin)*0.2; yMin-=m; yMax+=m; }
    return { pts, xMin, xMax, yMin, yMax };
  }, [fxInput, xPrevInput, xCurrInput, decimalsInput]);

  // ===== Vista general con pan/zoom =====
  const width=420, height=260, padL=50, padR=10, padT=12, padB=30;

  const [rangeMain, setRangeMain] = useState({ xMin:-5, xMax:5 });
  useEffect(()=>{ setRangeMain({ xMin: graphBase.xMin, xMax: graphBase.xMax }); }, [graphBase.xMin, graphBase.xMax]);

  const buildTicks = (min, max, count=6) => {
    if (!Number.isFinite(min) || !Number.isFinite(max) || min===max) return [];
    const ticks=[]; for(let i=0;i<=count;i++) ticks.push(min + i*(max-min)/count);
    return ticks;
  };

  const toXY = (xMin,xMax,yMin,yMax) => {
    const xTo = (x) => padL + ((x - xMin)/(xMax - xMin))*(width - padL - padR);
    const yTo = (y) => padT + (1 - (y - yMin)/(yMax - yMin))*(height - padT - padB);
    return { xTo, yTo };
  };

  const pathFromPts = (pts, xTo, yTo) =>
    pts.length ? pts.map((p,i)=>`${i?'L':'M'} ${xTo(p.x)} ${yTo(p.y)}`).join(" ") : "";

  const buildMainView = (rangeX) => {
    const { xMin, xMax } = rangeX;
    const cF = buildCompiled(fxInput);
    if (!cF) return null;
    const f = (x) => { try { const r = cF.evaluate({x}); return Number.isFinite(r)?r:NaN; } catch { return NaN; } };
    const steps=200, step=(xMax-xMin)/steps, pts=[];
    for(let i=0;i<=steps;i++){ const x=xMin+i*step; const y=f(x); if(Number.isFinite(y)) pts.push({x,y}); }
    let yMin=Infinity, yMax=-Infinity;
    pts.forEach(p=>{ yMin=Math.min(yMin,p.y); yMax=Math.max(yMax,p.y); });
    if(!Number.isFinite(yMin)||!Number.isFinite(yMax)||yMin===yMax){ yMin=-1; yMax=1; } else { const m=(yMax-yMin)*0.15; yMin-=m; yMax+=m; }
    const xTicks=buildTicks(xMin,xMax,6), yTicks=buildTicks(yMin,yMax,6);
    const { xTo, yTo } = toXY(xMin,xMax,yMin,yMax);
    const path = pathFromPts(pts,xTo,yTo);
    const xAxisY=(yMin<=0&&yMax>=0)?yTo(0):yTo(yMin);
    const yAxisX=(xMin<=0&&xMax>=0)?xTo(0):xTo(xMin);
    return { xMin,xMax,yMin,yMax, xTicks:xTicks.map(x=>({x,X:xTo(x)})), yTicks:yTicks.map(y=>({y,Y:yTo(y)})), xAxisY,yAxisX, path, xTo,yTo };
  };

  // =========================
  // Secantes: primeras 3 y últimas 3
  // =========================
  const first3 = rows.slice(0,3);
  const last3  = rows.slice(-3);

  const autoRangeFor = (items) => {
    const xs = items.length ? items.flatMap(r=>[r.xPrev, r.xCurr]) : [parseFloat(xPrevInput)||0, parseFloat(xCurrInput)||0];
    const xmin = Math.min(...xs), xmax = Math.max(...xs);
    let span = Math.max(1e-6, xmax - xmin);
    if (span < 0.2) span = 0.2;
    return { xMin: xmin - span, xMax: xmax + span };
  };

  const [rangeA, setRangeA] = useState(()=>autoRangeFor(first3));
  const [rangeB, setRangeB] = useState(()=>autoRangeFor(last3));
  useEffect(()=>{ setRangeA(autoRangeFor(first3)); }, [rows.length]);
  useEffect(()=>{ setRangeB(autoRangeFor(last3));  }, [rows.length]);

  const makeLinePath = (m,c, xMin,xMax, xTo,yTo) => {
    const x1=xMin, x2=xMax, y1=m*x1+c, y2=m*x2+c;
    return `M ${xTo(x1)} ${yTo(y1)} L ${xTo(x2)} ${yTo(y2)}`;
  };

  // ⚠️ Corregido: NO usar xTo/yTo antes de crearlos
  const buildSecantView = (items, rangeX) => {
    const { xMin, xMax } = rangeX;

    // 1) muestrear f(x) en el rango para base y para estimar Y
    const cF = buildCompiled(fxInput);
    const f=(x)=>{ try{ const r=cF?cF.evaluate({x}):NaN; return Number.isFinite(r)?r:NaN;}catch{return NaN;} };
    const steps=160, step=(xMax-xMin)/steps, pts=[];
    for(let i=0;i<=steps;i++){ const x=xMin+i*step; const y=f(x); if(Number.isFinite(y)) pts.push({x,y}); }

    // 2) calcular yMin/yMax con curva y con TODAS las secantes (sin xTo aún)
    let yMin=Infinity, yMax=-Infinity;
    pts.forEach(p=>{ yMin=Math.min(yMin,p.y); yMax=Math.max(yMax,p.y); });
    items.forEach(r=>{
      const x1=r.xPrev, x2=r.xCurr;
      const y1=f(x1), y2=f(x2);
      if (Number.isFinite(x1) && Number.isFinite(x2) && x1!==x2 &&
          Number.isFinite(y1) && Number.isFinite(y2)) {
        const m=(y2 - y1)/(x2 - x1), c=y1 - m*x1;
        const ya=m*xMin+c, yb=m*xMax+c;
        yMin=Math.min(yMin, y1, y2, ya, yb);
        yMax=Math.max(yMax, y1, y2, ya, yb);
      }
    });
    if(!Number.isFinite(yMin)||!Number.isFinite(yMax)||yMin===yMax){ yMin=-1; yMax=1; } else { const m=(yMax-yMin)*0.15; yMin-=m; yMax+=m; }

    // 3) ahora sí creamos xTo/yTo y los paths
    const xTicks=buildTicks(xMin,xMax,6), yTicks=buildTicks(yMin,yMax,6);
    const { xTo, yTo } = toXY(xMin,xMax,yMin,yMax);
    const basePath = pathFromPts(pts,xTo,yTo);

    const secantsPaths = items.map(r=>{
      const x1=r.xPrev, x2=r.xCurr;
      const y1=f(x1), y2=f(x2);
      if (!Number.isFinite(x1)||!Number.isFinite(x2)||x1===x2||!Number.isFinite(y1)||!Number.isFinite(y2)) return { n:r.n, path:"" };
      const m=(y2 - y1)/(x2 - x1), c=y1 - m*x1;
      return { n:r.n, path: makeLinePath(m,c,xMin,xMax,xTo,yTo) };
    });

    const axis = {
      xAxisY: (yMin<=0 && yMax>=0) ? yTo(0) : yTo(yMin),
      yAxisX: (xMin<=0 && xMax>=0) ? xTo(0) : xTo(xMin),
      xTicks: xTicks.map(x=>({x, X:xTo(x)})),
      yTicks: yTicks.map(y=>({y, Y:yTo(y)})),
    };
    return { basePath, secants: secantsPaths, axis, range:{xMin,xMax,yMin,yMax} };
  };

  const viewA = buildSecantView(first3, rangeA);
  const viewB = buildSecantView(last3,  rangeB);

  const lastRow = rows.length ? rows[rows.length - 1] : null;

  const colorA = ["#DC2626","#F59E0B","#10B981"];
  const colorB = ["#7C3AED","#0EA5E9","#EF4444"];

  const zoomIn  = (range,setRange)=>{ const c=(range.xMin+range.xMax)/2, s=(range.xMax-range.xMin)/2/1.8; setRange({xMin:c-s,xMax:c+s}); };
  const zoomOut = (range,setRange)=>{ const c=(range.xMin+range.xMax)/2, s=(range.xMax-range.xMin)/2*1.8; setRange({xMin:c-s,xMax:c+s}); };
  const autoA = () => setRangeA(autoRangeFor(first3));
  const autoB = () => setRangeB(autoRangeFor(last3));

  const panZoomMain = makePanZoomHandlers(rangeMain, setRangeMain, width, padL, padR);
  const panZoomA = makePanZoomHandlers(rangeA, setRangeA, width, padL, padR);
  const panZoomB = makePanZoomHandlers(rangeB, setRangeB, width, padL, padR);

  // ========= RENDER =========
  return (
    <div className="bisection-grid">
      <div className="bisection-form">
        <h3>Método de la Secante</h3>
        <p className="bisection-hint">
          Ingresa f(x) y dos aproximaciones iniciales x₀ (xₙ₋₁) y x₁ (xₙ).
          Acepta <code>ln(x)</code> y <code>sen(x)</code>.
        </p>

        <form onSubmit={handleCalculate}>
          <div className="bisection-form-row">
            <label>f(x) =</label>
            <input type="text" value={fxInput} onChange={e=>setFxInput(e.target.value)} />
          </div>
          <div className="bisection-form-row">
            <label>xₙ₋₁ =</label>
            <input type="number" step="any" value={xPrevInput} onChange={e=>setXPrevInput(e.target.value)} />
          </div>
          <div className="bisection-form-row">
            <label>xₙ =</label>
            <input type="number" step="any" value={xCurrInput} onChange={e=>setXCurrInput(e.target.value)} />
          </div>
          <div className="bisection-form-row">
            <label>Tolerancia =</label>
            <input type="number" step="any" value={tolInput} onChange={e=>setTolInput(e.target.value)} />
          </div>
          <div className="bisection-form-row">
            <label>Iteraciones =</label>
            <input type="number" value={maxIterInput} onChange={e=>setMaxIterInput(e.target.value)} />
          </div>
          <div className="bisection-form-row">
            <label>Decimales =</label>
            <input type="number" value={decimalsInput} onChange={e=>setDecimalsInput(e.target.value)} />
          </div>

          <div className="bisection-buttons">
            <button type="submit" className="btn-primary">CALCULAR</button>
            <button type="button" className="btn-secondary" onClick={handleClear}>BORRAR CELDAS</button>
          </div>
        </form>

        {message && <p className="bisection-message">{message}</p>}
        {errorMsg && <p className="bisection-error">{errorMsg}</p>}
      </div>

      <div className="bisection-results">
        {/* Tabla */}
        <div className="bisection-table-wrapper">
          <h4>Tabla de iteraciones</h4>
          {rows.length === 0 ? (
            <p className="bisection-hint">Ingresa los datos y presiona <strong>CALCULAR</strong>.</p>
          ) : (
            <>
              <table className="bisection-table">
                <thead>
                  <tr>
                    <th>n</th><th>xₙ₋₁</th><th>xₙ</th><th>xₙ₊₁</th><th>Error = |xₙ₊₁ - xₙ|</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r=>(
                    <tr key={r.n}>
                      <td>{r.n}</td>
                      <td>{formatNumber(r.xPrev)}</td>
                      <td>{formatNumber(r.xCurr)}</td>
                      <td>{formatNumber(r.xNext)}</td>
                      <td>{formatNumber(r.error)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="bisection-download">
                <button type="button" className="btn-download" onClick={handleDownloadTable}>
                  Descargar tabla (CSV)
                </button>
              </div>
            </>
          )}
        </div>

        {/* Vista general con pan/zoom */}
        <div className="graph-card">
          <h4 className="graph-title">f(x) — vista general (zoom y pan)</h4>
          {(() => {
            const v = buildMainView(rangeMain);
            if (!v) return <p className="bisection-hint">No se pudo graficar f(x).</p>;
            return (
              <svg className="graph-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" {...panZoomMain}>
                {v.xTicks.map((t,i)=>(<line key={`gx${i}`} x1={t.X} x2={t.X} y1={padT} y2={height-padB} stroke="#e5e7eb" />))}
                {v.yTicks.map((t,i)=>(<line key={`gy${i}`} x1={padL} x2={width-padR} y1={t.Y} y2={t.Y} stroke="#e5e7eb" />))}
                <line x1={padL} x2={width-padR} y1={v.xAxisY} y2={v.xAxisY} stroke="#9ca3af" />
                <line x1={v.yAxisX} x2={v.yAxisX} y1={padT} y2={height-padB} stroke="#9ca3af" />
                {v.xTicks.map((t,i)=>(
                  <g key={`xt${i}`}><line x1={t.X} x2={t.X} y1={v.xAxisY-3} y2={v.xAxisY+3} stroke="#6b7280"/>
                  <text x={t.X} y={height-6} fontSize="9" textAnchor="middle" fill="#374151">{t.x.toFixed(2)}</text></g>
                ))}
                {v.yTicks.map((t,i)=>(
                  <g key={`yt${i}`}><line x1={v.yAxisX-3} x2={v.yAxisX+3} y1={t.Y} y2={t.Y} stroke="#6b7280"/>
                  <text x={padL-6} y={t.Y+3} fontSize="9" textAnchor="end" fill="#374151">{t.y.toFixed(2)}</text></g>
                ))}
                <path d={v.path} fill="none" stroke="#2563eb" strokeWidth="1.7" />
                {lastRow && (
                  <line x1={v.xTo(lastRow.xNext)} x2={v.xTo(lastRow.xNext)} y1={padT} y2={height-padB}
                        stroke="#ef4444" strokeWidth="1.3" strokeDasharray="4 3" />
                )}
              </svg>
            );
          })()}
        </div>

        {/* Primeras 3 secantes */}
        {rows.length > 0 && (
          <div className="graph-card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <h4 className="graph-title">Primeras 3 líneas secantes</h4>
              <div className="graph-controls" style={{display:"flex",gap:8,alignItems:"center"}}>
                <button className="btn-download" onClick={()=>zoomIn(rangeA,setRangeA)}>Zoom +</button>
                <button className="btn-download btn-download-secondary" onClick={()=>zoomOut(rangeA,setRangeA)}>Zoom −</button>
                <button className="btn-secondary" onClick={autoA}>Auto</button>
                <span style={{fontSize:12}}>xMin</span>
                <input style={{width:90}} type="number" step="any" value={rangeA.xMin}
                       onChange={e=>setRangeA(r=>({...r,xMin:parseFloat(e.target.value)}))}/>
                <span style={{fontSize:12}}>xMax</span>
                <input style={{width:90}} type="number" step="any" value={rangeA.xMax}
                       onChange={e=>setRangeA(r=>({...r,xMax:parseFloat(e.target.value)}))}/>
              </div>
            </div>

            <svg className="graph-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" {...panZoomA}>
              {(() => {
                const v = viewA;
                const { xAxisY,yAxisX,xTicks,yTicks } = v.axis;
                return (
                  <>
                    {xTicks.map((t,i)=>(<line key={`g1x${i}`} x1={t.X} x2={t.X} y1={padT} y2={height-padB} stroke="#e5e7eb" />))}
                    {yTicks.map((t,i)=>(<line key={`g1y${i}`} x1={padL} x2={width-padR} y1={t.Y} y2={t.Y} stroke="#e5e7eb" />))}
                    <line x1={padL} x2={width-padR} y1={xAxisY} y2={xAxisY} stroke="#9ca3af" />
                    <line x1={yAxisX} x2={yAxisX} y1={padT} y2={height-padB} stroke="#9ca3af" />
                    {xTicks.map((t,i)=>(<g key={`t1x${i}`}><line x1={t.X} x2={t.X} y1={xAxisY-3} y2={xAxisY+3} stroke="#6b7280"/><text x={t.X} y={height-6} fontSize="9" textAnchor="middle" fill="#374151">{t.x.toFixed(2)}</text></g>))}
                    {yTicks.map((t,i)=>(<g key={`t1y${i}`}><line x1={yAxisX-3} x2={yAxisX+3} y1={t.Y} y2={t.Y} stroke="#6b7280"/><text x={padL-6} y={t.Y+3} fontSize="9" textAnchor="end" fill="#374151">{t.y.toFixed(2)}</text></g>))}
                    <path d={v.basePath} fill="none" stroke="#2563eb" strokeOpacity="0.5" strokeWidth="1.4" />
                    {v.secants.map((sc,i)=>(<path key={sc.n} d={sc.path} fill="none" stroke={colorA[i]} strokeWidth="2" />))}
                  </>
                );
              })()}
            </svg>
          </div>
        )}

        {/* Últimas 3 secantes */}
        {rows.length > 0 && (
          <div className="graph-card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <h4 className="graph-title">Últimas 3 líneas secantes</h4>
              <div className="graph-controls" style={{display:"flex",gap:8,alignItems:"center"}}>
                <button className="btn-download" onClick={()=>zoomIn(rangeB,setRangeB)}>Zoom +</button>
                <button className="btn-download btn-download-secondary" onClick={()=>zoomOut(rangeB,setRangeB)}>Zoom −</button>
                <button className="btn-secondary" onClick={autoB}>Auto</button>
                <span style={{fontSize:12}}>xMin</span>
                <input style={{width:90}} type="number" step="any" value={rangeB.xMin}
                       onChange={e=>setRangeB(r=>({...r,xMin:parseFloat(e.target.value)}))}/>
                <span style={{fontSize:12}}>xMax</span>
                <input style={{width:90}} type="number" step="any" value={rangeB.xMax}
                       onChange={e=>setRangeB(r=>({...r,xMax:parseFloat(e.target.value)}))}/>
              </div>
            </div>

            <svg className="graph-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" {...panZoomB}>
              {(() => {
                const v = viewB;
                const { xAxisY,yAxisX,xTicks,yTicks } = v.axis;
                return (
                  <>
                    {xTicks.map((t,i)=>(<line key={`g2x${i}`} x1={t.X} x2={t.X} y1={padT} y2={height-padB} stroke="#e5e7eb" />))}
                    {yTicks.map((t,i)=>(<line key={`g2y${i}`} x1={padL} x2={width-padR} y1={t.Y} y2={t.Y} stroke="#e5e7eb" />))}
                    <line x1={padL} x2={width-padR} y1={xAxisY} y2={xAxisY} stroke="#9ca3af" />
                    <line x1={yAxisX} x2={yAxisX} y1={padT} y2={height-padB} stroke="#9ca3af" />
                    {xTicks.map((t,i)=>(<g key={`t2x${i}`}><line x1={t.X} x2={t.X} y1={xAxisY-3} y2={xAxisY+3} stroke="#6b7280"/><text x={t.X} y={height-6} fontSize="9" textAnchor="middle" fill="#374151">{t.x.toFixed(2)}</text></g>))}
                    {yTicks.map((t,i)=>(<g key={`t2y${i}`}><line x1={yAxisX-3} x2={yAxisX+3} y1={t.Y} y2={t.Y} stroke="#6b7280"/><text x={padL-6} y={t.Y+3} fontSize="9" textAnchor="end" fill="#374151">{t.y.toFixed(2)}</text></g>))}
                    <path d={v.basePath} fill="none" stroke="#2563eb" strokeOpacity="0.5" strokeWidth="1.4" />
                    {v.secants.map((sc,i)=>(<path key={sc.n} d={sc.path} fill="none" stroke={colorB[i]} strokeWidth="2" />))}
                  </>
                );
              })()}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
