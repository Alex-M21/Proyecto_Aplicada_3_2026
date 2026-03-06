// src/metodos/PuntoFijo.jsx
import { useState, useMemo, useEffect } from "react";
import { create, all } from "mathjs";
import "./Biseccion.css"; // reutilizamos estilos

const math = create(all, {});

// === Pan & Zoom (igual a Newton) ===
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
    if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMin === xMax) return;

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
    const dxX = (-dxPx * (xMax - xMin)) / innerW;
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
    style: { cursor: "grab" }
  };
};

export default function PuntoFijo() {
  const [gInput, setGInput] = useState("(sin(x)+2*cos(x))/2");
  const [x0Input, setX0Input] = useState("0.6");
  const [tolInput, setTolInput] = useState("0.003");
  const [maxIterInput, setMaxIterInput] = useState("10");
  const [decimalsInput, setDecimalsInput] = useState("5");

  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Slider para ver “cobweb” por iteración
  const [iterView, setIterView] = useState(0);

  // -------------------------
  // Utilidades
  // -------------------------
  const normalizeExpr = (expr) => expr.trim().replace(/ln/gi, "log").replace(/sen/gi, "sin");

  const buildCompiled = (expr) => {
    const trimmed = expr.trim();
    if (!trimmed) return null;
    try {
      return math.compile(normalizeExpr(trimmed));
    } catch {
      return null;
    }
  };

  const getDecimals = () => {
    const d = parseInt(decimalsInput, 10);
    if (Number.isNaN(d) || d < 0) return 6;
    return Math.min(12, d);
  };

  const formatNumber = (value) => {
    const decimals = getDecimals();
    return Number.isFinite(value) ? value.toFixed(decimals) : "NaN";
  };

  const tolNum = useMemo(() => {
    const t = parseFloat(tolInput);
    return Number.isFinite(t) ? t : NaN;
  }, [tolInput]);

  // -------------------------
  // Derivada g'(x) y evaluación en x0
  // -------------------------
  const derivativeInfo = useMemo(() => {
    const trimmed = gInput.trim();
    if (!trimmed) return { expr: null, valueAtX0: null };

    try {
      const node = math.parse(normalizeExpr(trimmed));
      const derNode = math.derivative(node, "x");
      const derExpr = derNode.toString();
      const compiledDer = derNode.compile();

      const x0 = parseFloat(x0Input);
      let valueAtX0 = null;

      if (Number.isFinite(x0)) {
        try {
          const v = compiledDer.evaluate({ x: x0 });
          valueAtX0 = Number.isFinite(v) ? v : null;
        } catch {
          valueAtX0 = null;
        }
      }

      return { expr: derExpr, valueAtX0 };
    } catch {
      return { expr: null, valueAtX0: null };
    }
  }, [gInput, x0Input]);

  // -------------------------
  // Cálculo del método
  // -------------------------
  const handleCalculate = (e) => {
    e.preventDefault();
    setMessage("");
    setErrorMsg("");
    setRows([]);
    setIterView(0);

    if (!gInput.trim()) {
      setErrorMsg("Debes ingresar una expresión para g(x).");
      return;
    }

    const x0 = parseFloat(x0Input);
    const tol = parseFloat(tolInput);
    const maxIter = parseInt(maxIterInput, 10);

    if (!Number.isFinite(x0) || !Number.isFinite(tol) || !Number.isFinite(maxIter)) {
      setErrorMsg("Por favor ingresa valores numéricos válidos.");
      return;
    }
    if (tol <= 0) {
      setErrorMsg("La tolerancia debe ser un número positivo.");
      return;
    }
    if (maxIter <= 0) {
      setErrorMsg("El número de iteraciones debe ser mayor que cero.");
      return;
    }

    const compiled = buildCompiled(gInput);
    if (!compiled) {
      setErrorMsg("La función g(x) no se pudo interpretar. Revisa la sintaxis.");
      return;
    }

    const evalG = (x) => {
      try {
        const res = compiled.evaluate({ x });
        return Number.isFinite(res) ? res : NaN;
      } catch {
        return NaN;
      }
    };

    const newRows = [];
    let xn = x0;
    let found = false;
    let hadError = false;

    try {
      for (let n = 1; n <= maxIter; n++) {
        const gxn = evalG(xn);

        if (!Number.isFinite(gxn)) {
          setErrorMsg("No se pudo evaluar g(x) en alguna iteración. Revisa dominio.");
          hadError = true;
          break;
        }

        const error = Math.abs(gxn - xn);
        newRows.push({ n, xn, gxn, error });

        if (error < tol || error === 0) {
          found = true;
          break;
        }

        xn = gxn;
      }
    } catch {
      setErrorMsg("Ocurrió un error inesperado durante las iteraciones.");
      hadError = true;
    }

    setRows(newRows);
    if (!newRows.length || hadError) return;

    setIterView(newRows.length - 1);

    const last = newRows[newRows.length - 1];
    setMessage(
      found
        ? `Se encontró una aproximación al punto fijo: x ≈ ${formatNumber(last.gxn)}`
        : "Se alcanzó el número máximo de iteraciones sin cumplir la tolerancia."
    );
  };

  const handleClear = () => {
    setGInput("");
    setX0Input("");
    setTolInput("");
    setMaxIterInput("");
    setDecimalsInput("5");
    setRows([]);
    setIterView(0);
    setMessage("");
    setErrorMsg("");
  };

  // ✅ Determinar si la última fila cumple (para colorear)
  const lastIndex = rows.length - 1;
  const foundFinal =
    rows.length > 0 &&
    Number.isFinite(rows[lastIndex]?.error) &&
    Number.isFinite(tolNum) &&
    (rows[lastIndex].error < tolNum || rows[lastIndex].error === 0);

  // =========================
  // Gráfica dinámica (pan/zoom)
  // g(x) y y=x + cobweb por iterView
  // =========================
  const width = 400;
  const height = 240;
  const padL = 46;
  const padR = 10;
  const padT = 10;
  const padB = 28;

  const [rangeX, setRangeX] = useState({ xMin: -5, xMax: 5 });

  // Auto-rango alrededor de x0 cuando cambia g o x0
  useEffect(() => {
    const x0 = parseFloat(x0Input);
    if (Number.isFinite(x0)) {
      setRangeX({ xMin: x0 - 2, xMax: x0 + 2 });
    } else {
      setRangeX({ xMin: -5, xMax: 5 });
    }
  }, [gInput, x0Input]);

  const panZoom = makePanZoomHandlers(rangeX, setRangeX, width, padL, padR);

  const zoomIn = () => {
    const c = (rangeX.xMin + rangeX.xMax) / 2;
    const s = (rangeX.xMax - rangeX.xMin) / 2 / 1.8;
    setRangeX({ xMin: c - s, xMax: c + s });
  };
  const zoomOut = () => {
    const c = (rangeX.xMin + rangeX.xMax) / 2;
    const s = (rangeX.xMax - rangeX.xMin) / 2 * 1.8;
    setRangeX({ xMin: c - s, xMax: c + s });
  };
  const autoRange = () => {
    const x0 = parseFloat(x0Input);
    if (Number.isFinite(x0)) setRangeX({ xMin: x0 - 2, xMax: x0 + 2 });
    else setRangeX({ xMin: -5, xMax: 5 });
  };

  const graphView = useMemo(() => {
    const compiled = buildCompiled(gInput);
    if (!compiled) return null;

    const g = (x) => {
      try {
        const r = compiled.evaluate({ x });
        return Number.isFinite(r) ? r : NaN;
      } catch {
        return NaN;
      }
    };

    const xMin = rangeX.xMin;
    const xMax = rangeX.xMax;
    if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMin === xMax) return null;

    const steps = 240;
    const step = (xMax - xMin) / steps;

    const gPts = [];
    const diagPts = [];

    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * step;
      const gx = g(x);
      if (Number.isFinite(gx)) gPts.push({ x, y: gx });
      diagPts.push({ x, y: x });
    }

    let yMin = Infinity;
    let yMax = -Infinity;
    const consider = (y) => {
      yMin = Math.min(yMin, y);
      yMax = Math.max(yMax, y);
    };
    gPts.forEach((p) => consider(p.y));
    diagPts.forEach((p) => consider(p.y));

    if (!Number.isFinite(yMin) || !Number.isFinite(yMax) || yMin === yMax) {
      yMin = -1;
      yMax = 1;
    } else {
      const m = (yMax - yMin) * 0.15;
      yMin -= m;
      yMax += m;
    }

    const innerW = width - padL - padR;
    const innerH = height - padT - padB;

    const xTo = (x) => padL + ((x - xMin) / (xMax - xMin)) * innerW;
    const yTo = (y) => padT + (1 - (y - yMin) / (yMax - yMin)) * innerH;

    const pathFrom = (pts) =>
      pts.length ? pts.map((p, i) => `${i ? "L" : "M"} ${xTo(p.x)} ${yTo(p.y)}`).join(" ") : "";

    const pathG = pathFrom(gPts);
    const pathDiag = pathFrom(diagPts);

    const ticks = (min, max, count = 6) => {
      const arr = [];
      for (let i = 0; i <= count; i++) arr.push(min + (i * (max - min)) / count);
      return arr;
    };

    const xTicks = ticks(xMin, xMax, 6).map((x) => ({ x, X: xTo(x) }));
    const yTicks = ticks(yMin, yMax, 6).map((y) => ({ y, Y: yTo(y) }));

    const xAxisY = yMin <= 0 && yMax >= 0 ? yTo(0) : yTo(yMin);
    const yAxisX = xMin <= 0 && xMax >= 0 ? xTo(0) : xTo(xMin);

    return { xMin, xMax, yMin, yMax, xTo, yTo, pathG, pathDiag, xTicks, yTicks, xAxisY, yAxisX, g };
  }, [gInput, rangeX, decimalsInput]);

  const cobweb = useMemo(() => {
    if (!graphView) return { segments: [], lastPoint: null };
    if (!rows.length) return { segments: [], lastPoint: null };

    const k = Math.max(0, Math.min(iterView, rows.length - 1));
    const r0 = rows[0];
    let x = r0.xn;
    const segs = [];

    for (let i = 0; i <= k; i++) {
      const gx = graphView.g(x);
      if (!Number.isFinite(gx)) break;

      segs.push({ x1: x, y1: x, x2: x, y2: gx });
      segs.push({ x1: x, y1: gx, x2: gx, y2: gx });

      x = gx;
    }

    const lastPoint = { x, y: graphView.g(x) };
    return { segments: segs, lastPoint };
  }, [graphView, rows, iterView]);

  const lastRow = rows.length ? rows[Math.max(0, Math.min(iterView, rows.length - 1))] : null;

  return (
    <div className="bisection-grid">
      {/* Columna: formulario + análisis de g'(x) */}
      <div className="bisection-form">
        <h3>Método de Punto Fijo</h3>
        <p className="bisection-hint">
          Ingresa g(x) para resolver f(x)=0 reescrita como x=g(x). Ejemplos:{" "}
          <code>(sin(x)+2*cos(x))/2</code>, <code>exp(-x)</code>, <code>(x^2+1)/3</code>.
          También se aceptan <code>ln(x)</code> y <code>sen(x)</code>.
        </p>

        <form onSubmit={handleCalculate}>
          <div className="bisection-form-row">
            <label>Ingrese la función g(x) =</label>
            <input
              type="text"
              value={gInput}
              onChange={(e) => setGInput(e.target.value)}
              placeholder="Ej: (sin(x)+2*cos(x))/2"
            />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese el valor x₀ =</label>
            <input type="number" step="any" value={x0Input} onChange={(e) => setX0Input(e.target.value)} />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese tolerancia o exactitud =</label>
            <input type="number" step="any" value={tolInput} onChange={(e) => setTolInput(e.target.value)} />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese número de iteraciones =</label>
            <input type="number" value={maxIterInput} onChange={(e) => setMaxIterInput(e.target.value)} />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese número de decimales =</label>
            <input type="number" value={decimalsInput} onChange={(e) => setDecimalsInput(e.target.value)} />
          </div>

          <div className="bisection-buttons">
            <button type="submit" className="btn-primary">CALCULAR</button>
            <button type="button" className="btn-secondary" onClick={handleClear}>BORRAR CELDAS</button>
          </div>
        </form>

        {/* Panel de derivada g'(x) */}
        <div className="graph-card" style={{ marginTop: "1rem" }}>
          <h4 className="graph-title">Análisis de convergencia</h4>
          {!derivativeInfo.expr ? (
            <p className="bisection-hint">No se pudo obtener la derivada de g(x). Revisa la expresión.</p>
          ) : (
            <>
              <p>
                <strong>g&apos;(x) = </strong>
                <code>{derivativeInfo.expr}</code>
              </p>

              {derivativeInfo.valueAtX0 == null || !Number.isFinite(derivativeInfo.valueAtX0) ? (
                <p className="bisection-hint">No se pudo evaluar g&apos;(x₀). Verifica x₀ y el dominio.</p>
              ) : (
                <>
                  <p>
                    <strong>g&apos;(x₀)</strong> con x₀ = <code>{x0Input || "?"}</code> es aproximadamente{" "}
                    <code>{formatNumber(derivativeInfo.valueAtX0)}</code>.
                  </p>
                  <p className="bisection-hint">
                    Criterio local: se desea <strong>|g&apos;(x₀)| &lt; 1</strong>.
                  </p>
                  {Math.abs(derivativeInfo.valueAtX0) < 1 ? (
                    <p className="bisection-message">|g&apos;(x₀)| &lt; 1 ⇒ buena indicación de convergencia.</p>
                  ) : (
                    <p className="bisection-error">|g&apos;(x₀)| ≥ 1 ⇒ es posible que no converja desde este x₀.</p>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {message && <p className="bisection-message">{message}</p>}
        {errorMsg && <p className="bisection-error">{errorMsg}</p>}
      </div>

      {/* Columna: tabla + gráfica */}
      <div className="bisection-results">
        <div className="bisection-table-wrapper">
          <h4>Tabla de iteraciones</h4>
          {rows.length === 0 ? (
            <p className="bisection-hint">Ingresa los datos y presiona <strong>CALCULAR</strong>.</p>
          ) : (
            <table className="bisection-table">
              <thead>
                <tr>
                  <th>n</th>
                  <th>xₙ</th>
                  <th>g(xₙ)</th>
                  <th>Error = |g(xₙ) - xₙ|</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const isLast = idx === lastIndex && foundFinal;
                  return (
                    <tr key={row.n}>
                      <td>{row.n}</td>
                      <td>{formatNumber(row.xn)}</td>
                      <td className={isLast ? "cell-green" : ""}>{formatNumber(row.gxn)}</td>
                      <td className={isLast ? "cell-red" : ""}>{formatNumber(row.error)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="graph-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 className="graph-title">Gráfica de g(x) y recta y = x (zoom y pan)</h4>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn-download" onClick={zoomIn}>Zoom +</button>
              <button type="button" className="btn-download btn-download-secondary" onClick={zoomOut}>Zoom −</button>
              <button type="button" className="btn-secondary" onClick={autoRange}>Auto</button>
            </div>
          </div>

          {/* Slider de iteración para cobweb */}
          {rows.length > 0 && (
            <div style={{ margin: "8px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span>Iteración: <strong>{rows[iterView]?.n}</strong></span>
                <span>xₙ: <strong>{lastRow ? formatNumber(lastRow.xn) : "-"}</strong></span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(0, rows.length - 1)}
                value={iterView}
                onChange={(e) => setIterView(parseInt(e.target.value, 10))}
                style={{ width: "100%" }}
              />
            </div>
          )}

          {!graphView ? (
            <p className="bisection-hint">No se pudo generar la gráfica. Revisa g(x) y x₀.</p>
          ) : (
            <>
              <svg
                className="graph-svg"
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
                {...panZoom}
              >
                {/* Grid */}
                {graphView.xTicks.map((t, i) => (
                  <line key={`gx${i}`} x1={t.X} x2={t.X} y1={padT} y2={height - padB} stroke="#e5e7eb" />
                ))}
                {graphView.yTicks.map((t, i) => (
                  <line key={`gy${i}`} x1={padL} x2={width - padR} y1={t.Y} y2={t.Y} stroke="#e5e7eb" />
                ))}

                {/* Ejes */}
                <line x1={padL} x2={width - padR} y1={graphView.xAxisY} y2={graphView.xAxisY} stroke="#9ca3af" />
                <line x1={graphView.yAxisX} x2={graphView.yAxisX} y1={padT} y2={height - padB} stroke="#9ca3af" />

                {/* ✅ Etiquetas de ejes agregadas */}
                <text
                  x={(padL + width - padR) / 2}
                  y={height - 2}
                  fontSize="11"
                  textAnchor="middle"
                  fill="#374151"
                >
                  x
                </text>

                <text
                  x={14}
                  y={(padT + (height - padB)) / 2}
                  fontSize="11"
                  textAnchor="middle"
                  fill="#374151"
                  transform={`rotate(-90 14 ${(padT + (height - padB)) / 2})`}
                >
                  y
                </text>

                {/* Ticks X */}
                {graphView.xTicks.map((t, i) => (
                  <g key={`xt${i}`}>
                    <line x1={t.X} x2={t.X} y1={graphView.xAxisY - 3} y2={graphView.xAxisY + 3} stroke="#6b7280" />
                    <text x={t.X} y={height - 6} fontSize="9" textAnchor="middle" fill="#374151">
                      {t.x.toFixed(2)}
                    </text>
                  </g>
                ))}

                {/* Ticks Y */}
                {graphView.yTicks.map((t, i) => (
                  <g key={`yt${i}`}>
                    <line x1={graphView.yAxisX - 3} x2={graphView.yAxisX + 3} y1={t.Y} y2={t.Y} stroke="#6b7280" />
                    <text x={padL - 6} y={t.Y + 3} fontSize="9" textAnchor="end" fill="#374151">
                      {t.y.toFixed(2)}
                    </text>
                  </g>
                ))}

                {/* y = x */}
                <path d={graphView.pathDiag} fill="none" stroke="#9ca3af" strokeWidth="1" strokeDasharray="4 3" />

                {/* g(x) */}
                <path d={graphView.pathG} fill="none" stroke="#2563eb" strokeWidth="1.6" />

                {/* Cobweb */}
                {cobweb.segments.map((s, idx) => (
                  <line
                    key={`cw-${idx}`}
                    x1={graphView.xTo(s.x1)}
                    y1={graphView.yTo(s.y1)}
                    x2={graphView.xTo(s.x2)}
                    y2={graphView.yTo(s.y2)}
                    stroke="#ef4444"
                    strokeWidth="1.2"
                    opacity="0.85"
                  />
                ))}

                {/* Punto actual (x_n, g(x_n)) */}
                {lastRow && (
                  <circle
                    cx={graphView.xTo(lastRow.xn)}
                    cy={graphView.yTo(lastRow.gxn)}
                    r={4}
                    fill="#ef4444"
                  />
                )}
              </svg>

              <p className="bisection-hint" style={{ marginTop: 6 }}>
                Rueda: zoom • Arrastrar: mover • Slider: ver cobweb por iteración
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}