// src/metodos/MullerReal.jsx
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

export default function MullerReal() {
  const [fxInput, setFxInput] = useState("x^3+3*x^2+4*x-12");
  const [x0Input, setX0Input] = useState("0");
  const [x1Input, setX1Input] = useState("1");
  const [x2Input, setX2Input] = useState("2");
  const [tolInput, setTolInput] = useState("0.01");
  const [maxIterInput, setMaxIterInput] = useState("25");
  const [decimalsInput, setDecimalsInput] = useState("4");

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

  const formatNumber = (v) =>
    Number.isFinite(v) ? v.toFixed(getDecimals()) : "NaN";

  const tolNum = useMemo(() => {
    const t = parseFloat(tolInput);
    return Number.isFinite(t) ? t : NaN;
  }, [tolInput]);

  // =========================================================
  // Cálculo: Muller (raíz real)
  // =========================================================
  const handleCalculate = (e) => {
    e.preventDefault();
    setMessage("");
    setErrorMsg("");
    setRows([]);
    setIterView(0);

    if (!fxInput.trim()) {
      setErrorMsg("Debes ingresar una expresión para el polinomio / f(x).");
      return;
    }

    let x0 = parseFloat(x0Input);
    let x1 = parseFloat(x1Input);
    let x2 = parseFloat(x2Input);
    const tol = parseFloat(tolInput);
    const maxIter = parseInt(maxIterInput, 10);

    if (
      !Number.isFinite(x0) ||
      !Number.isFinite(x1) ||
      !Number.isFinite(x2) ||
      !Number.isFinite(tol) ||
      !Number.isFinite(maxIter)
    ) {
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

    const compiledF = buildCompiled(fxInput);
    if (!compiledF) {
      setErrorMsg("No se pudo interpretar f(x). Revisa la sintaxis.");
      return;
    }

    const evalF = (x) => {
      try {
        const r = compiledF.evaluate({ x });
        return Number.isFinite(r) ? r : NaN;
      } catch {
        return NaN;
      }
    };

    x0 = roundTo(x0);
    x1 = roundTo(x1);
    x2 = roundTo(x2);

    const newRows = [];
    let found = false;
    let bad = false;
    const EPS = 1e-14;

    try {
      for (let n = 1; n <= maxIter; n++) {
        const x0_i = x0;
        const x1_i = x1;
        const x2_i = x2;

        const f0 = evalF(x0_i);
        const f1 = evalF(x1_i);
        const f2 = evalF(x2_i);

        if (!Number.isFinite(f0) || !Number.isFinite(f1) || !Number.isFinite(f2)) {
          setErrorMsg("No se pudo evaluar f(x) en alguna iteración. Revisa el dominio y la función.");
          bad = true;
          break;
        }

        const h1 = x1_i - x0_i;
        const h2 = x2_i - x1_i;

        if (Math.abs(h1) < EPS || Math.abs(h2) < EPS) {
          setErrorMsg("Hay dos puntos iguales o muy cercanos (x0, x1, x2). Cambia los valores iniciales.");
          bad = true;
          break;
        }

        const d1 = (f1 - f0) / h1;
        const d2 = (f2 - f1) / h2;
        const d = (d2 - d1) / (h2 + h1);

        let p;

        if (Math.abs(d) < EPS) {
          const denomSec = f2 - f1;
          if (Math.abs(denomSec) < EPS) {
            setErrorMsg("No se puede avanzar (pendiente ~ 0). Cambia los valores iniciales.");
            bad = true;
            break;
          }
          p = x2_i - (f2 * (x2_i - x1_i)) / denomSec;
        } else {
          const b = d2 + h2 * d;
          const disc = b * b - 4 * f2 * d;

          if (disc < 0) {
            setErrorMsg("El discriminante salió negativo (raíz compleja en esta iteración). Cambia x0, x1, x2.");
            bad = true;
            break;
          }

          const D = Math.sqrt(disc);
          const denom1 = b + D;
          const denom2 = b - D;
          const denom = Math.abs(denom1) >= Math.abs(denom2) ? denom1 : denom2;

          if (Math.abs(denom) < EPS) {
            setErrorMsg("División entre cero numérica en el denominador. Cambia los valores iniciales.");
            bad = true;
            break;
          }

          p = x2_i + (-2 * f2) / denom;
        }

        const pRounded = roundTo(p);
        const error = roundTo(Math.abs(pRounded - x2_i));

        newRows.push({
          n,
          x0Raw: x0_i,
          x1Raw: x1_i,
          x2Raw: x2_i,
          pRaw: p,
          f0Raw: f0,
          f1Raw: f1,
          f2Raw: f2,

          x0: x0_i,
          x1: x1_i,
          x2: x2_i,
          p: pRounded,
          error,
        });

        if (error < tol) {
          found = true;
          break;
        }

        x0 = x1_i;
        x1 = x2_i;
        x2 = pRounded;
      }
    } catch {
      setErrorMsg("Ocurrió un error inesperado durante el cálculo.");
      bad = true;
    }

    setRows(newRows);
    if (!newRows.length || bad) return;

    setIterView(newRows.length - 1);

    const last = newRows[newRows.length - 1];
    setMessage(
      found
        ? `Se encontró una aproximación a la solución: p ≈ ${formatNumber(last.p)}`
        : "Se alcanzó el número máximo de iteraciones sin cumplir la tolerancia."
    );
  };

  const handleClear = () => {
    setFxInput("");
    setX0Input("");
    setX1Input("");
    setX2Input("");
    setTolInput("");
    setMaxIterInput("");
    setDecimalsInput("4");
    setRows([]);
    setIterView(0);
    setMessage("");
    setErrorMsg("");
  };

  // =========================================================
  // Descarga CSV
  // =========================================================
  const handleDownloadTable = () => {
    if (!rows.length) return;

    const headers = ["n", "x0", "x1", "x2", "p", "Error"];
    const csvRows = [headers.join(",")];

    rows.forEach((r) => {
      csvRows.push(
        [r.n, formatNumber(r.x0), formatNumber(r.x1), formatNumber(r.x2), formatNumber(r.p), formatNumber(r.error)].join(",")
      );
    });

    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "muller_real_iteraciones.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // =========================================================
  // Gráfica
  // =========================================================
  const baseRange = useMemo(() => {
    const x0 = parseFloat(x0Input);
    const x1 = parseFloat(x1Input);
    const x2 = parseFloat(x2Input);

    const xs = [x0, x1, x2].filter((v) => Number.isFinite(v));
    if (xs.length) {
      let xMin = Math.min(...xs);
      let xMax = Math.max(...xs);
      const m = (xMax - xMin) * 0.25 || 2;
      xMin -= m;
      xMax += m;
      if (xMin === xMax) {
        xMin -= 2;
        xMax += 2;
      }
      return { xMin, xMax };
    }
    return { xMin: -5, xMax: 5 };
  }, [x0Input, x1Input, x2Input, fxInput]);

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

  const graphData = useMemo(() => {
    const cF = buildCompiled(fxInput);
    if (!cF) return null;

    const f = (x) => {
      try {
        const r = cF.evaluate({ x });
        return Number.isFinite(r) ? r : NaN;
      } catch {
        return NaN;
      }
    };

    const xMin = rangeMain.xMin;
    const xMax = rangeMain.xMax;

    const steps = 240;
    const step = (xMax - xMin) / steps;
    const pts = [];

    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * step;
      const y = f(x);
      if (Number.isFinite(y)) pts.push({ x, y });
    }

    let yMin = Infinity;
    let yMax = -Infinity;

    pts.forEach((p) => {
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

    const xTicks = buildTicks(xMin, xMax, 6);
    const yTicks = buildTicks(yMin, yMax, 6);
    const { xTo, yTo } = toXY(xMin, xMax, yMin, yMax);

    const path =
      pts.length
        ? pts.map((p, i) => `${i ? "L" : "M"} ${xTo(p.x)} ${yTo(p.y)}`).join(" ")
        : "";

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
      xTo,
      yTo,
      path,
    };
  }, [fxInput, rangeMain.xMin, rangeMain.xMax]);

  const panZoomMain = makePanZoomHandlers(rangeMain, setRangeMain, width, padL, padR);

  const lastIndex = rows.length - 1;
  const converged =
    rows.length > 0 &&
    Number.isFinite(tolNum) &&
    (rows[lastIndex]?.error < tolNum || rows[lastIndex]?.error === 0);

  const rowView = rows.length ? rows[Math.max(0, Math.min(iterView, rows.length - 1))] : null;
  const pHistory = rows.map((r) => r.pRaw).filter((v) => Number.isFinite(v));

  // =========================================================
  // Parábola interpolante
  // =========================================================
  const quadCoeffs = (xa, ya, xb, yb, xc, yc) => {
    const den0 = (xa - xb) * (xa - xc);
    const den1 = (xb - xa) * (xb - xc);
    const den2 = (xc - xa) * (xc - xb);
    if (den0 === 0 || den1 === 0 || den2 === 0) return null;

    const A0 = ya / den0;
    const A1 = yb / den1;
    const A2 = yc / den2;

    const A = A0 + A1 + A2;
    const B = -(A0 * (xb + xc) + A1 * (xa + xc) + A2 * (xa + xb));
    const C = A0 * (xb * xc) + A1 * (xa * xc) + A2 * (xa * xb);

    if (![A, B, C].every(Number.isFinite)) return null;
    return { A, B, C };
  };

  const buildQuadPath = (A, B, C, xMin, xMax, xTo, yTo) => {
    const steps = 200;
    const step = (xMax - xMin) / steps;
    let d = "";
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * step;
      const y = A * x * x + B * x + C;
      if (!Number.isFinite(y)) continue;
      d += `${d ? "L" : "M"} ${xTo(x)} ${yTo(y)} `;
    }
    return d.trim();
  };

  const pointLabel = (x, y, text, color = "#111827") => (
    <g>
      <text
        x={x + 8}
        y={y - 8}
        fontSize="11"
        fill={color}
        style={{ paintOrder: "stroke", stroke: "#ffffff", strokeWidth: 3 }}
      >
        {text}
      </text>
      <text x={x + 8} y={y - 8} fontSize="11" fill={color}>
        {text}
      </text>
    </g>
  );

  // =========================================================
  // Ejes / escalas
  // =========================================================
  const renderAxes = ({ xTicks, yTicks, xAxisY, yAxisX }) => (
    <>
      {xTicks.map((t, i) => (
        <g key={`gx-${i}`}>
          <line
            x1={t.X}
            x2={t.X}
            y1={padT}
            y2={height - padB}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
          <line
            x1={t.X}
            x2={t.X}
            y1={height - padB}
            y2={height - padB + 5}
            stroke="#94a3b8"
            strokeWidth="1"
          />
          <text
            x={t.X}
            y={height - 10}
            textAnchor="middle"
            fontSize="10"
            fill="#475569"
          >
            {t.x.toFixed(2)}
          </text>
        </g>
      ))}

      {yTicks.map((t, i) => (
        <g key={`gy-${i}`}>
          <line
            x1={padL}
            x2={width - padR}
            y1={t.Y}
            y2={t.Y}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
          <line
            x1={padL - 5}
            x2={padL}
            y1={t.Y}
            y2={t.Y}
            stroke="#94a3b8"
            strokeWidth="1"
          />
          <text
            x={padL - 8}
            y={t.Y + 3}
            textAnchor="end"
            fontSize="10"
            fill="#475569"
          >
            {t.y.toFixed(2)}
          </text>
        </g>
      ))}

      <line
        x1={padL}
        x2={width - padR}
        y1={xAxisY}
        y2={xAxisY}
        stroke="#94a3b8"
        strokeWidth="1.3"
      />
      <line
        x1={yAxisX}
        x2={yAxisX}
        y1={padT}
        y2={height - padB}
        stroke="#94a3b8"
        strokeWidth="1.3"
      />

      <text
        x={(padL + width - padR) / 2}
        y={height - 4}
        textAnchor="middle"
        fontSize="12"
        fill="#334155"
      >
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
        f(x)
      </text>
    </>
  );

  return (
    <div className="bisection-grid">
      <div className="bisection-form">
        <h3>Método de Muller (Raíz Real)</h3>
        <p className="bisection-hint">
          Ingresa <strong>f(x)</strong> y tres valores iniciales <strong>x₀, x₁, x₂</strong>.
          Acepta <code>ln(x)</code> y <code>sen(x)</code>.
        </p>

        <form onSubmit={handleCalculate}>
          <div className="bisection-form-row">
            <label>Polinomio / f(x)</label>
            <input
              type="text"
              value={fxInput}
              onChange={(e) => setFxInput(e.target.value)}
              placeholder="Ejemplo: x^3+3*x^2+4*x-12"
            />
          </div>

          <div className="bisection-form-row">
            <label>Valor x₀</label>
            <input
              type="number"
              step="any"
              value={x0Input}
              onChange={(e) => setX0Input(e.target.value)}
            />
          </div>

          <div className="bisection-form-row">
            <label>Valor x₁</label>
            <input
              type="number"
              step="any"
              value={x1Input}
              onChange={(e) => setX1Input(e.target.value)}
            />
          </div>

          <div className="bisection-form-row">
            <label>Valor x₂</label>
            <input
              type="number"
              step="any"
              value={x2Input}
              onChange={(e) => setX2Input(e.target.value)}
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
                    <th>x₀</th>
                    <th>x₁</th>
                    <th>x₂</th>
                    <th>p</th>
                    <th>Error = |p - x₂|</th>
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
                        <td>{formatNumber(r.x0)}</td>
                        <td>{formatNumber(r.x1)}</td>
                        <td>{formatNumber(r.x2)}</td>
                        <td className={isLastOk ? "cell-green" : ""}>
                          {formatNumber(r.p)}
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
                    Iteración: <strong>{rows[iterView]?.n}</strong>
                  </span>
                  <span>
                    p ≈ <strong>{rowView ? formatNumber(rowView.p) : "-"}</strong>
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
            <h4 className="graph-title">Recorrido de Muller</h4>

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
            <p className="bisection-hint">No se pudo graficar f(x).</p>
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
                  d={graphData.path}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2"
                />

                {pHistory.map((p, i) => (
                  <circle
                    key={`ph-${i}`}
                    cx={graphData.xTo(p)}
                    cy={graphData.xAxisY}
                    r="2.6"
                    fill="#111827"
                    opacity="0.6"
                  />
                ))}

                {rowView &&
                  (() => {
                    const coeffs = quadCoeffs(
                      rowView.x0Raw,
                      rowView.f0Raw,
                      rowView.x1Raw,
                      rowView.f1Raw,
                      rowView.x2Raw,
                      rowView.f2Raw
                    );

                    const quadPath = coeffs
                      ? buildQuadPath(
                          coeffs.A,
                          coeffs.B,
                          coeffs.C,
                          graphData.xMin,
                          graphData.xMax,
                          graphData.xTo,
                          graphData.yTo
                        )
                      : "";

                    const X0 = graphData.xTo(rowView.x0Raw);
                    const Y0 = graphData.yTo(rowView.f0Raw);
                    const X1 = graphData.xTo(rowView.x1Raw);
                    const Y1 = graphData.yTo(rowView.f1Raw);
                    const X2 = graphData.xTo(rowView.x2Raw);
                    const Y2 = graphData.yTo(rowView.f2Raw);
                    const Xp = graphData.xTo(rowView.pRaw);
                    const YpAxis = graphData.xAxisY;

                    return (
                      <>
                        {coeffs && (
                          <path
                            d={quadPath}
                            fill="none"
                            stroke="#64748b"
                            strokeWidth="2"
                            opacity="0.95"
                          />
                        )}

                        <circle cx={X0} cy={Y0} r="4" fill="#64748b" />
                        <circle cx={X1} cy={Y1} r="4" fill="#475569" />
                        <circle cx={X2} cy={Y2} r="4" fill="#334155" />

                        {pointLabel(X0, Y0, "x0", "#475569")}
                        {pointLabel(X1, Y1, "x1", "#334155")}
                        {pointLabel(X2, Y2, "x2", "#1f2937")}

                        <line
                          x1={Xp}
                          x2={Xp}
                          y1={padT}
                          y2={height - padB}
                          stroke="#10b981"
                          strokeWidth="1.6"
                          strokeDasharray="4 3"
                        />
                        <circle cx={Xp} cy={YpAxis} r="4.2" fill="#10b981" />
                        {pointLabel(Xp, YpAxis, "p", "#065f46")}
                      </>
                    );
                  })()}
              </svg>

              <p className="bisection-hint" style={{ marginTop: 8 }}>
                Rueda del mouse: zoom • Arrastrar: mover • Slider: ver iteración •
                Puntos negros: historial de p
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}