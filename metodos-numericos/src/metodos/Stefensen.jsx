// src/metodos/Steffensen.jsx
import { useState, useMemo, useEffect } from "react";
import { create, all } from "mathjs";
import "./Biseccion.css";

const math = create(all, {});

// =========================================================
// Pan & Zoom genéricos (solo eje X)
// =========================================================
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
    if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMin === xMax) return;

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
    style: { cursor: "grab", touchAction: "none" },
  };
};

export default function Steffensen() {
  const [gInput, setGInput] = useState("(-1)*(ln(x)/ln(2))");
  const [p0Input, setP0Input] = useState("0.5");
  const [tolInput, setTolInput] = useState("0.001");
  const [maxIterInput, setMaxIterInput] = useState("15");
  const [decimalsInput, setDecimalsInput] = useState("5");

  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [iterView, setIterView] = useState(0);

  // =========================================================
  // Utilidades
  // =========================================================
  const normalizeExpr = (expr) =>
    expr.trim().replace(/LN/gi, "log").replace(/ln/gi, "log").replace(/sen/gi, "sin");

  const buildCompiled = (expr) => {
    const t = expr.trim();
    if (!t) return null;
    try {
      return math.compile(normalizeExpr(t));
    } catch {
      return null;
    }
  };

  const getDecimals = () => {
    const d = parseInt(decimalsInput, 10);
    if (Number.isNaN(d) || d < 0) return 6;
    return Math.min(12, d);
  };

  const roundTo = (v) => {
    const d = getDecimals();
    const f = 10 ** d;
    return Math.round(v * f) / f;
  };

  const formatNumber = (v) => (Number.isFinite(v) ? v.toFixed(getDecimals()) : "NaN");

  const tolNum = useMemo(() => {
    const t = parseFloat(tolInput);
    return Number.isFinite(t) ? t : NaN;
  }, [tolInput]);

  // =========================================================
  // Cálculo Steffensen
  // =========================================================
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

    let p0 = parseFloat(p0Input);
    const tol = parseFloat(tolInput);
    const maxIter = parseInt(maxIterInput, 10);

    if (!Number.isFinite(p0) || !Number.isFinite(tol) || !Number.isFinite(maxIter)) {
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

    const compiledG = buildCompiled(gInput);
    if (!compiledG) {
      setErrorMsg(
        "La función g(x) no se pudo interpretar. Revisa la sintaxis. Ejemplos: (-1)*(ln(x)/ln(2)), (sin(x)+2*cos(x))/2, exp(-x)."
      );
      return;
    }

    const evalG = (x) => {
      try {
        const r = compiledG.evaluate({ x });
        return Number.isFinite(r) ? r : NaN;
      } catch {
        return NaN;
      }
    };

    const newRows = [];
    let found = false;
    let bad = false;

    const EPS = 1e-15;

    try {
      for (let n = 1; n <= maxIter; n++) {
        const p0_i = p0;

        const p1 = evalG(p0_i);
        if (!Number.isFinite(p1)) {
          setErrorMsg("No se pudo evaluar g(p0) en alguna iteración. Revisa dominio/función.");
          bad = true;
          break;
        }

        const p2 = evalG(p1);
        if (!Number.isFinite(p2)) {
          setErrorMsg("No se pudo evaluar g(p1) en alguna iteración. Revisa dominio/función.");
          bad = true;
          break;
        }

        const denom = p2 - 2 * p1 + p0_i;
        if (!Number.isFinite(denom) || Math.abs(denom) < EPS) {
          setErrorMsg("Apareció p2 - 2p1 + p0 ≈ 0. Steffensen no puede continuar (división entre cero).");
          bad = true;
          break;
        }

        const pNext = p0_i - ((p1 - p0_i) ** 2) / denom;
        if (!Number.isFinite(pNext)) {
          setErrorMsg("No se pudo calcular pₙ₊₁. Revisa dominio/función.");
          bad = true;
          break;
        }

        const error = Math.abs(pNext - p0_i);

        newRows.push({
          n,
          p0Raw: p0_i,
          p1Raw: p1,
          p2Raw: p2,
          pNextRaw: pNext,
          errorRaw: error,

          p0: roundTo(p0_i),
          p1: roundTo(p1),
          p2: roundTo(p2),
          pNext: roundTo(pNext),
          error: roundTo(error),

          Ax: p0_i,
          Ay: p1,
          Bx: p1,
          By: p2,
        });

        if (error < tol) {
          found = true;
          break;
        }

        p0 = pNext;
      }
    } catch {
      setErrorMsg("Ocurrió un error inesperado durante las iteraciones.");
      bad = true;
    }

    setRows(newRows);
    if (!newRows.length || bad) return;

    setIterView(newRows.length - 1);

    const last = newRows[newRows.length - 1];
    setMessage(
      found
        ? `Se encontró una aproximación a la solución: p ≈ ${formatNumber(last.pNext)}`
        : "Se alcanzó el número máximo de iteraciones sin cumplir la tolerancia."
    );
  };

  const handleClear = () => {
    setGInput("");
    setP0Input("");
    setTolInput("");
    setMaxIterInput("");
    setDecimalsInput("5");
    setRows([]);
    setIterView(0);
    setMessage("");
    setErrorMsg("");
  };

  // =========================================================
  // CSV
  // =========================================================
  const handleDownloadTable = () => {
    if (!rows.length) return;
    const headers = ["n", "p0", "p1=g(p0)", "p2=g(p1)", "pₙ₊₁", "Error"];
    const csvRows = [headers.join(",")];

    rows.forEach((r) => {
      csvRows.push(
        [r.n, formatNumber(r.p0), formatNumber(r.p1), formatNumber(r.p2), formatNumber(r.pNext), formatNumber(r.error)].join(",")
      );
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "steffensen_iteraciones.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // =========================================================
  // Gráfica base
  // =========================================================
  const baseRange = useMemo(() => {
    const p0 = parseFloat(p0Input);
    if (Number.isFinite(p0)) {
      return { xMin: p0 - 2, xMax: p0 + 2 };
    }
    return { xMin: -5, xMax: 5 };
  }, [p0Input, gInput]);

  const width = 640;
  const height = 340;
  const padL = 62;
  const padR = 18;
  const padT = 18;
  const padB = 44;

  const [rangeMain, setRangeMain] = useState({ xMin: -5, xMax: 5 });

  useEffect(() => {
    setRangeMain({ xMin: baseRange.xMin, xMax: baseRange.xMax });
  }, [baseRange.xMin, baseRange.xMax]);

  const zoomInMain = () => {
    const { xMin, xMax } = rangeMain;
    if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMin === xMax) return;
    const c = (xMin + xMax) / 2;
    const s = (xMax - xMin) / 2 / 1.8;
    setRangeMain({ xMin: c - s, xMax: c + s });
  };

  const zoomOutMain = () => {
    const { xMin, xMax } = rangeMain;
    if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMin === xMax) return;
    const c = (xMin + xMax) / 2;
    const s = ((xMax - xMin) / 2) * 1.8;
    setRangeMain({ xMin: c - s, xMax: c + s });
  };

  const autoMain = () => setRangeMain({ xMin: baseRange.xMin, xMax: baseRange.xMax });

  const buildTicks = (min, max, count = 6) => {
    if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return [];
    const ticks = [];
    for (let i = 0; i <= count; i++) ticks.push(min + (i * (max - min)) / count);
    return ticks;
  };

  const toXY = (xMin, xMax, yMin, yMax) => {
    const xTo = (x) => padL + ((x - xMin) / (xMax - xMin)) * (width - padL - padR);
    const yTo = (y) => padT + (1 - (y - yMin) / (yMax - yMin)) * (height - padT - padB);
    return { xTo, yTo };
  };

  const pathFromPts = (pts, xTo, yTo) =>
    pts.length
      ? pts.map((p, i) => `${i ? "L" : "M"} ${xTo(p.x)} ${yTo(p.y)}`).join(" ")
      : "";

  // =========================================================
  // Ejes / escalas
  // =========================================================
  const renderAxes = ({ xTicks, yTicks, xAxisY, yAxisX }) => (
    <>
      {xTicks.map((t, i) => (
        <g key={`gx-${i}`}>
          <line x1={t.X} x2={t.X} y1={padT} y2={height - padB} stroke="#e5e7eb" strokeWidth="1" />
          <line x1={t.X} x2={t.X} y1={height - padB} y2={height - padB + 5} stroke="#94a3b8" strokeWidth="1" />
          <text x={t.X} y={height - 10} textAnchor="middle" fontSize="10" fill="#475569">
            {t.x.toFixed(2)}
          </text>
        </g>
      ))}

      {yTicks.map((t, i) => (
        <g key={`gy-${i}`}>
          <line x1={padL} x2={width - padR} y1={t.Y} y2={t.Y} stroke="#e5e7eb" strokeWidth="1" />
          <line x1={padL - 5} x2={padL} y1={t.Y} y2={t.Y} stroke="#94a3b8" strokeWidth="1" />
          <text x={padL - 8} y={t.Y + 3} textAnchor="end" fontSize="10" fill="#475569">
            {t.y.toFixed(2)}
          </text>
        </g>
      ))}

      <line x1={padL} x2={width - padR} y1={xAxisY} y2={xAxisY} stroke="#94a3b8" strokeWidth="1.3" />
      <line x1={yAxisX} x2={yAxisX} y1={padT} y2={height - padB} stroke="#94a3b8" strokeWidth="1.3" />

      <text x={(padL + width - padR) / 2} y={height - 4} textAnchor="middle" fontSize="12" fill="#334155">
        x
      </text>

      <text
        x={18}
        y={(padT + height - padB) / 2}
        textAnchor="middle"
        fontSize="12"
        fill="#334155"
        transform={`rotate(-90 18 ${(padT + height - padB) / 2})`}
      >
        y
      </text>
    </>
  );

  // =========================================================
  // Gráfica principal
  // =========================================================
  const graphData = useMemo(() => {
    const cG = buildCompiled(gInput);
    if (!cG) return null;

    const g = (x) => {
      try {
        const r = cG.evaluate({ x });
        return Number.isFinite(r) ? r : NaN;
      } catch {
        return NaN;
      }
    };

    const xMin = rangeMain.xMin;
    const xMax = rangeMain.xMax;

    const steps = 240;
    const step = (xMax - xMin) / steps;

    const ptsG = [];
    const ptsI = [];
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * step;
      const yg = g(x);
      if (Number.isFinite(yg)) ptsG.push({ x, y: yg });
      ptsI.push({ x, y: x });
    }

    let yMin = Infinity;
    let yMax = -Infinity;

    ptsG.forEach((p) => {
      yMin = Math.min(yMin, p.y);
      yMax = Math.max(yMax, p.y);
    });
    ptsI.forEach((p) => {
      yMin = Math.min(yMin, p.y);
      yMax = Math.max(yMax, p.y);
    });

    if (!Number.isFinite(yMin) || !Number.isFinite(yMax) || yMin === yMax) {
      yMin = -1;
      yMax = 1;
    } else {
      const m = (yMax - yMin) * 0.15;
      yMin -= m;
      yMax += m;
    }

    const { xTo, yTo } = toXY(xMin, xMax, yMin, yMax);

    const pathG = pathFromPts(ptsG, xTo, yTo);
    const pathI = pathFromPts(ptsI, xTo, yTo);

    const xTicks = buildTicks(xMin, xMax, 6);
    const yTicks = buildTicks(yMin, yMax, 6);

    const xAxisY = yMin <= 0 && yMax >= 0 ? yTo(0) : yTo(yMin);
    const yAxisX = xMin <= 0 && xMax >= 0 ? xTo(0) : xTo(xMin);

    return {
      xMin,
      xMax,
      yMin,
      yMax,
      xTicks: xTicks.map((x) => ({ x, X: xTo(x) })),
      yTicks: yTicks.map((y) => ({ y, Y: yTo(y) })),
      xAxisY,
      yAxisX,
      pathG,
      pathI,
      xTo,
      yTo,
    };
  }, [gInput, rangeMain.xMin, rangeMain.xMax, decimalsInput]);

  const panZoomMain = makePanZoomHandlers(rangeMain, setRangeMain, width, padL, padR);

  const lastIndex = rows.length - 1;
  const converged =
    rows.length > 0 &&
    Number.isFinite(tolNum) &&
    (rows[lastIndex]?.errorRaw < tolNum || rows[lastIndex]?.errorRaw === 0);

  const rowView = rows.length ? rows[Math.max(0, Math.min(iterView, rows.length - 1))] : null;
  const pHistory = rows.map((r) => r.pNextRaw);

  return (
    <div className="bisection-grid">
      <div className="bisection-form">
        <h3>Método de Steffensen</h3>
        <p className="bisection-hint">
          Ingresa <strong>g(x)</strong> y un valor inicial <strong>p₀</strong>. Acepta{" "}
          <code>ln(x)</code> y <code>sen(x)</code>.
          <br />
          Ejemplo: <code>(-1)*(ln(x)/ln(2))</code>
        </p>

        <form onSubmit={handleCalculate}>
          <div className="bisection-form-row">
            <label>Función g(x)</label>
            <input
              type="text"
              value={gInput}
              onChange={(e) => setGInput(e.target.value)}
              placeholder="Ejemplo: (-1)*(ln(x)/ln(2))"
            />
          </div>

          <div className="bisection-form-row">
            <label>Valor inicial p₀</label>
            <input
              type="number"
              step="any"
              value={p0Input}
              onChange={(e) => setP0Input(e.target.value)}
            />
          </div>

          <div className="bisection-form-row">
            <label>Tolerancia</label>
            <input
              type="number"
              step="any"
              value={tolInput}
              onChange={(e) => setTolInput(e.target.value)}
            />
          </div>

          <div className="bisection-form-row">
            <label>Máximo de iteraciones</label>
            <input
              type="number"
              value={maxIterInput}
              onChange={(e) => setMaxIterInput(e.target.value)}
            />
          </div>

          <div className="bisection-form-row">
            <label>Número de decimales</label>
            <input
              type="number"
              value={decimalsInput}
              onChange={(e) => setDecimalsInput(e.target.value)}
            />
          </div>

          <div className="bisection-buttons">
            <button type="submit" className="btn-primary">
              CALCULAR
            </button>
            <button type="button" className="btn-secondary" onClick={handleClear}>
              LIMPIAR
            </button>
          </div>
        </form>

        {message && <p className="bisection-message">{message}</p>}
        {errorMsg && <p className="bisection-error">{errorMsg}</p>}
      </div>

      <div className="bisection-results">
        <div className="bisection-table-wrapper">
          <h4>Tabla de iteraciones</h4>

          {rows.length === 0 ? (
            <p className="bisection-hint">
              Ingresa los datos y presiona <strong>CALCULAR</strong>.
            </p>
          ) : (
            <>
              <table className="bisection-table">
                <thead>
                  <tr>
                    <th>n</th>
                    <th>p₀</th>
                    <th>p₁ = g(p₀)</th>
                    <th>p₂ = g(p₁)</th>
                    <th>pₙ₊₁</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => {
                    const isLastOk = converged && idx === lastIndex;
                    const isSelected = idx === iterView;

                    return (
                      <tr
                        key={r.n}
                        style={
                          isSelected
                            ? { outline: "2px solid #93c5fd", outlineOffset: "-2px" }
                            : undefined
                        }
                      >
                        <td>{r.n}</td>
                        <td>{formatNumber(r.p0)}</td>
                        <td>{formatNumber(r.p1)}</td>
                        <td>{formatNumber(r.p2)}</td>
                        <td className={isLastOk ? "cell-green" : ""}>
                          {formatNumber(r.pNext)}
                        </td>
                        <td className={isLastOk ? "cell-red" : ""}>
                          {formatNumber(r.error)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div style={{ marginTop: 14 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    fontSize: 13,
                    marginBottom: 8,
                  }}
                >
                  <span>
                    Iteración seleccionada: <strong>{rows[iterView]?.n}</strong>
                  </span>
                  <span>
                    pₙ₊₁ ≈ <strong>{rowView ? formatNumber(rowView.pNext) : "-"}</strong>
                  </span>
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

              <div className="bisection-download">
                <button type="button" className="btn-download" onClick={handleDownloadTable}>
                  Descargar tabla (CSV)
                </button>
              </div>
            </>
          )}
        </div>

        <div className="graph-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 10,
            }}
          >
            <h4 className="graph-title">Recorrido de Steffensen</h4>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="btn-download" onClick={zoomInMain}>
                Zoom +
              </button>
              <button
                type="button"
                className="btn-download btn-download-secondary"
                onClick={zoomOutMain}
              >
                Zoom −
              </button>
              <button type="button" className="btn-secondary" onClick={autoMain}>
                Auto
              </button>
            </div>
          </div>

          {!graphData ? (
            <p className="bisection-hint">No se pudo graficar. Revisa g(x) y el rango.</p>
          ) : (
            <>
              <svg
                className="graph-svg"
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
                {...panZoomMain}
                style={{ touchAction: "none" }}
              >
                {renderAxes({
                  xTicks: graphData.xTicks,
                  yTicks: graphData.yTicks,
                  xAxisY: graphData.xAxisY,
                  yAxisX: graphData.yAxisX,
                })}

                <path
                  d={graphData.pathI}
                  fill="none"
                  stroke="#111827"
                  strokeWidth="1.3"
                  opacity="0.6"
                  strokeDasharray="4 3"
                />

                <path
                  d={graphData.pathG}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2"
                />

                {pHistory.map((p, i) => {
                  if (!Number.isFinite(p)) return null;
                  return (
                    <circle
                      key={`ph-${i}`}
                      cx={graphData.xTo(p)}
                      cy={graphData.yTo(p)}
                      r="2.6"
                      fill="#111827"
                      opacity="0.55"
                    />
                  );
                })}

                {rowView && (
                  <>
                    <circle
                      cx={graphData.xTo(rowView.Ax)}
                      cy={graphData.yTo(rowView.Ay)}
                      r="4"
                      fill="#64748b"
                    />
                    <circle
                      cx={graphData.xTo(rowView.Bx)}
                      cy={graphData.yTo(rowView.By)}
                      r="4"
                      fill="#334155"
                    />

                    <line
                      x1={graphData.xTo(rowView.Ax)}
                      y1={graphData.yTo(rowView.Ay)}
                      x2={graphData.xTo(rowView.Bx)}
                      y2={graphData.yTo(rowView.By)}
                      stroke="#475569"
                      strokeWidth="2"
                      opacity="0.9"
                    />

                    <line
                      x1={graphData.xTo(rowView.pNextRaw)}
                      x2={graphData.xTo(rowView.pNextRaw)}
                      y1={padT}
                      y2={height - padB}
                      stroke="#10b981"
                      strokeWidth="1.6"
                      strokeDasharray="4 3"
                    />

                    <circle
                      cx={graphData.xTo(rowView.pNextRaw)}
                      cy={graphData.yTo(rowView.pNextRaw)}
                      r="4.2"
                      fill="#10b981"
                    />

                    <text
                      x={graphData.xTo(rowView.pNextRaw) + 6}
                      y={graphData.yTo(rowView.pNextRaw) - 8}
                      fontSize="11"
                      fill="#065f46"
                    >
                      pₙ₊₁ = {rowView.pNextRaw.toFixed(Math.min(6, getDecimals()))}
                    </text>
                  </>
                )}
              </svg>

              <p className="bisection-hint" style={{ marginTop: 8 }}>
                Rueda del mouse: zoom • Arrastrar: mover • Slider: ver A=(p₀,g(p₀)),
                B=(p₁,g(p₁)) y pₙ₊₁ • Puntos negros: recorrido hacia el punto fijo
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}