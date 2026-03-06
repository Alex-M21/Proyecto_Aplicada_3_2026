// src/metodos/Newton.jsx
import { useState, useMemo, useEffect } from "react";
import { create, all } from "mathjs";
import "./Biseccion.css"; // reutilizamos estilos

const math = create(all, {});

// === Pan & Zoom genéricos para SVG con ejes (en X) ===
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
    style: { cursor: "grab" },
  };
};

export default function Newton() {
  const [fxInput, setFxInput] = useState("1-cos(x)");
  const [dfxInput, setDfxInput] = useState("sin(x)");
  const [x0Input, setX0Input] = useState("0.1");
  const [tolInput, setTolInput] = useState("0.001");
  const [maxIterInput, setMaxIterInput] = useState("15");
  const [decimalsInput, setDecimalsInput] = useState("5");

  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // ---- utilidades numéricas
  const normalizeExpr = (expr) => expr.trim().replace(/ln/gi, "log").replace(/sen/gi, "sin");

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
    return Number.isNaN(d) || d < 0 ? 6 : Math.min(12, d);
  };

  const roundTo = (v) => {
    const f = 10 ** getDecimals();
    return Math.round(v * f) / f;
  };

  const formatNumber = (v) => (Number.isFinite(v) ? v.toFixed(getDecimals()) : "NaN");

  const tolNum = useMemo(() => {
    const t = parseFloat(tolInput);
    return Number.isFinite(t) ? t : NaN;
  }, [tolInput]);

  // =========================
  // Cálculo de Newton
  // =========================
  const handleCalculate = (e) => {
    e.preventDefault();
    setMessage("");
    setErrorMsg("");
    setRows([]);

    if (!fxInput.trim() || !dfxInput.trim()) {
      setErrorMsg("Debes ingresar f(x) y su derivada f'(x).");
      return;
    }

    let x0 = parseFloat(x0Input);
    const tol = parseFloat(tolInput);
    const maxIter = parseInt(maxIterInput, 10);

    if (!Number.isFinite(x0) || !Number.isFinite(tol) || !Number.isFinite(maxIter)) {
      setErrorMsg("Por favor ingresa valores numéricos válidos.");
      return;
    }
    if (tol <= 0) {
      setErrorMsg("La tolerancia debe ser positiva.");
      return;
    }
    if (maxIter <= 0) {
      setErrorMsg("El número de iteraciones debe ser > 0.");
      return;
    }

    x0 = roundTo(x0);

    const cF = buildCompiled(fxInput);
    const cDf = buildCompiled(dfxInput);
    if (!cF || !cDf) {
      setErrorMsg("No se pudo interpretar f(x) o f'(x).");
      return;
    }

    const f = (x) => {
      try {
        const r = cF.evaluate({ x });
        return Number.isFinite(r) ? r : NaN;
      } catch {
        return NaN;
      }
    };
    const df = (x) => {
      try {
        const r = cDf.evaluate({ x });
        return Number.isFinite(r) ? r : NaN;
      } catch {
        return NaN;
      }
    };

    const newRows = [];
    let xn = x0,
      ok = false,
      bad = false;

    try {
      for (let n = 1; n <= maxIter; n++) {
        const fxn = roundTo(f(xn));
        const dfxn = roundTo(df(xn));

        if (!Number.isFinite(fxn) || !Number.isFinite(dfxn)) {
          setErrorMsg("No se pudo evaluar f o f' en alguna iteración.");
          bad = true;
          break;
        }
        if (dfxn === 0) {
          setErrorMsg("Apareció f'(xₙ)=0. Newton no puede continuar.");
          bad = true;
          break;
        }

        const xNext = roundTo(xn - fxn / dfxn);
        const error = roundTo(Math.abs(xNext - xn));

        // ✅ Guardamos también m y b de la tangente para mostrar ecuaciones
        const m = dfxn;
        const b = roundTo(fxn - m * xn);

        newRows.push({ n, xn, fxn, dfxn, xNext, error, m, b });

        if (error < tol || error === 0) {
          ok = true;
          break;
        }
        xn = xNext;
      }
    } catch {
      setErrorMsg("Error inesperado durante las iteraciones.");
      bad = true;
    }

    setRows(newRows);
    if (!newRows.length || bad) return;

    const last = newRows[newRows.length - 1];
    setMessage(
      ok
        ? `Se encontró una aproximación: x ≈ ${formatNumber(last.xNext)}`
        : "Se alcanzó el máximo de iteraciones sin cumplir tolerancia."
    );
  };

  const handleClear = () => {
    setFxInput("");
    setDfxInput("");
    setX0Input("");
    setTolInput("");
    setMaxIterInput("");
    setDecimalsInput("5");
    setRows([]);
    setMessage("");
    setErrorMsg("");
  };

  // ✅ Pintar fila final si converge
  const lastIndex = rows.length - 1;
  const foundFinal =
    rows.length > 0 &&
    Number.isFinite(rows[lastIndex]?.error) &&
    Number.isFinite(tolNum) &&
    (rows[lastIndex].error < tolNum || rows[lastIndex].error === 0);

  // =========================
  // Curva base f(x) (para auto-range inicial)
  // =========================
  const graphBase = useMemo(() => {
    const cF = buildCompiled(fxInput);
    if (!cF) return { pts: [], xMin: -5, xMax: 5, yMin: -1, yMax: 1 };

    const f = (x) => {
      try {
        const r = cF.evaluate({ x });
        return Number.isFinite(r) ? r : NaN;
      } catch {
        return NaN;
      }
    };

    const x0 = parseFloat(x0Input);
    let xMin, xMax;
    if (Number.isFinite(x0)) {
      xMin = x0 - 2;
      xMax = x0 + 2;
    } else {
      xMin = -5;
      xMax = 5;
    }

    const steps = 120,
      step = (xMax - xMin) / steps,
      pts = [];
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * step;
      const y = f(x);
      if (Number.isFinite(y)) pts.push({ x, y });
    }

    if (!pts.length) return { pts: [], xMin, xMax, yMin: -1, yMax: 1 };

    const ys = pts.map((p) => p.y);
    let yMin = Math.min(...ys),
      yMax = Math.max(...ys);
    if (yMin === yMax) {
      yMin -= 1;
      yMax += 1;
    } else {
      const m = (yMax - yMin) * 0.2;
      yMin -= m;
      yMax += m;
    }
    return { pts: pts, xMin, xMax, yMin, yMax };
  }, [fxInput, x0Input, decimalsInput]);

  // ===== Vista general con pan/zoom =====
  const width = 420,
    height = 260,
    padL = 50,
    padR = 10,
    padT = 12,
    padB = 30;

  const [rangeMain, setRangeMain] = useState({ xMin: -5, xMax: 5 });
  useEffect(() => {
    setRangeMain({ xMin: graphBase.xMin, xMax: graphBase.xMax });
  }, [graphBase.xMin, graphBase.xMax]);

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
    pts.length ? pts.map((p, i) => `${i ? "L" : "M"} ${xTo(p.x)} ${yTo(p.y)}`).join(" ") : "";

  const buildMainView = (rangeX) => {
    const { xMin, xMax } = rangeX;
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

    const steps = 200,
      step = (xMax - xMin) / steps,
      pts = [];
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * step;
      const y = f(x);
      if (Number.isFinite(y)) pts.push({ x, y });
    }

    let yMin = Infinity,
      yMax = -Infinity;
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
    const path = pathFromPts(pts, xTo, yTo);

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
      path,
      xTo,
      yTo,
    };
  };

  // =========================
  // Tangentes: primeras 3 y últimas 3
  // =========================
  const first3 = rows.slice(0, 3);
  const last3 = rows.slice(-3);

  const autoRangeFor = (items) => {
    const xs = items.length ? items.map((r) => r.xn) : [parseFloat(x0Input) || 0];
    const xmin = Math.min(...xs),
      xmax = Math.max(...xs);
    let span = Math.max(1e-6, xmax - xmin);
    if (span < 0.2) span = 0.2;
    return { xMin: xmin - span, xMax: xmax + span };
  };

  const [rangeA, setRangeA] = useState(() => autoRangeFor(first3));
  const [rangeB, setRangeB] = useState(() => autoRangeFor(last3));
  useEffect(() => {
    setRangeA(autoRangeFor(first3));
  }, [rows.length]);
  useEffect(() => {
    setRangeB(autoRangeFor(last3));
  }, [rows.length]);

  const makeLinePath = (m, c, xMin, xMax, xTo, yTo) => {
    const x1 = xMin,
      x2 = xMax,
      y1 = m * x1 + c,
      y2 = m * x2 + c;
    return `M ${xTo(x1)} ${yTo(y1)} L ${xTo(x2)} ${yTo(y2)}`;
  };

  const buildTangentView = (items, rangeX) => {
    const { xMin, xMax } = rangeX;

    const cF = buildCompiled(fxInput);
    const f = (x) => {
      try {
        const r = cF ? cF.evaluate({ x }) : NaN;
        return Number.isFinite(r) ? r : NaN;
      } catch {
        return NaN;
      }
    };

    const steps = 160,
      step = (xMax - xMin) / steps,
      pts = [];
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * step;
      const y = f(x);
      if (Number.isFinite(y)) pts.push({ x, y });
    }

    let yMin = Infinity,
      yMax = -Infinity;
    pts.forEach((p) => {
      yMin = Math.min(yMin, p.y);
      yMax = Math.max(yMax, p.y);
    });

    // incluir tangentes en Y-range
    items.forEach((r) => {
      const m = r.m;
      const c = r.b;
      const ya = m * xMin + c,
        yb = m * xMax + c;
      yMin = Math.min(yMin, ya, yb);
      yMax = Math.max(yMax, ya, yb);
    });

    if (!Number.isFinite(yMin) || !Number.isFinite(yMax) || yMin === yMax) {
      yMin = -1;
      yMax = 1;
    } else {
      const mm = (yMax - yMin) * 0.15;
      yMin -= mm;
      yMax += mm;
    }

    const xTicks = buildTicks(xMin, xMax, 6),
      yTicks = buildTicks(yMin, yMax, 6);
    const { xTo, yTo } = toXY(xMin, xMax, yMin, yMax);

    const basePath = pathFromPts(pts, xTo, yTo);

    const tangents = items.map((r) => ({
      n: r.n,
      path: makeLinePath(r.m, r.b, xMin, xMax, xTo, yTo),
    }));

    const axis = {
      xAxisY: yMin <= 0 && yMax >= 0 ? yTo(0) : yTo(yMin),
      yAxisX: xMin <= 0 && xMax >= 0 ? xTo(0) : xTo(xMin),
      xTicks: xTicks.map((x) => ({ x, X: xTo(x) })),
      yTicks: yTicks.map((y) => ({ y, Y: yTo(y) })),
    };

    return { basePath, tangents, axis, range: { xMin, xMax, yMin, yMax } };
  };

  const viewA = buildTangentView(first3, rangeA);
  const viewB = buildTangentView(last3, rangeB);

  const lastRow = rows.length ? rows[rows.length - 1] : null;

  // Colores (mismos que ya usas en la gráfica)
  const colorA = ["#DC2626", "#F59E0B", "#10B981"];
  const colorB = ["#7C3AED", "#0EA5E9", "#EF4444"];

  // Controles zoom
  const zoomIn = (range, setRange) => {
    const c = (range.xMin + range.xMax) / 2;
    const s = (range.xMax - range.xMin) / 2 / 1.8;
    setRange({ xMin: c - s, xMax: c + s });
  };
  const zoomOut = (range, setRange) => {
    const c = (range.xMin + range.xMax) / 2;
    const s = (range.xMax - range.xMin) / 2 * 1.8;
    setRange({ xMin: c - s, xMax: c + s });
  };
  const autoA = () => setRangeA(autoRangeFor(first3));
  const autoB = () => setRangeB(autoRangeFor(last3));

  // Handlers pan/zoom
  const panZoomMain = makePanZoomHandlers(rangeMain, setRangeMain, width, padL, padR);
  const panZoomA = makePanZoomHandlers(rangeA, setRangeA, width, padL, padR);
  const panZoomB = makePanZoomHandlers(rangeB, setRangeB, width, padL, padR);

  // ====== ecuación de tangente como texto ======
  const tangentText = (r) => {
    const m = r.m;
    const b = r.b;
    const bAbs = Math.abs(b);
    const sign = b >= 0 ? "+" : "-";
    return `y${r.n}(x) = ${formatNumber(m)} x ${sign} ${formatNumber(bAbs)}`;
  };

  // ✅ helper agregado: dibujar ejes + escalas + etiquetas
  const renderAxes = (axis) => {
    const { xAxisY, yAxisX, xTicks, yTicks } = axis;
    return (
      <>
        {/* grid */}
        {xTicks.map((t, i) => (
          <line
            key={`grid-x-${i}`}
            x1={t.X}
            x2={t.X}
            y1={padT}
            y2={height - padB}
            stroke="#e5e7eb"
          />
        ))}
        {yTicks.map((t, i) => (
          <line
            key={`grid-y-${i}`}
            x1={padL}
            x2={width - padR}
            y1={t.Y}
            y2={t.Y}
            stroke="#e5e7eb"
          />
        ))}

        {/* ejes */}
        <line x1={padL} x2={width - padR} y1={xAxisY} y2={xAxisY} stroke="#9ca3af" strokeWidth="1.2" />
        <line x1={yAxisX} x2={yAxisX} y1={padT} y2={height - padB} stroke="#9ca3af" strokeWidth="1.2" />

        {/* ticks x */}
        {xTicks.map((t, i) => (
          <g key={`tick-x-${i}`}>
            <line x1={t.X} x2={t.X} y1={height - padB} y2={height - padB + 5} stroke="#6b7280" />
            <text x={t.X} y={height - 6} fontSize="9" textAnchor="middle" fill="#374151">
              {t.x.toFixed(2)}
            </text>
          </g>
        ))}

        {/* ticks y */}
        {yTicks.map((t, i) => (
          <g key={`tick-y-${i}`}>
            <line x1={padL - 5} x2={padL} y1={t.Y} y2={t.Y} stroke="#6b7280" />
            <text x={padL - 6} y={t.Y + 3} fontSize="9" textAnchor="end" fill="#374151">
              {t.y.toFixed(2)}
            </text>
          </g>
        ))}

        {/* nombres de ejes */}
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
          x={16}
          y={(padT + (height - padB)) / 2}
          fontSize="11"
          textAnchor="middle"
          fill="#374151"
          transform={`rotate(-90 16 ${(padT + (height - padB)) / 2})`}
        >
          f(x)
        </text>
      </>
    );
  };

  // ========= RENDER =========
  return (
    <div className="bisection-grid">
      {/* Formulario */}
      <div className="bisection-form">
        <h3>Método de Newton-Raphson</h3>
        <p className="bisection-hint">
          Ingresa f(x) y su derivada f&apos;(x). Ej: <code>1-cos(x)</code> y <code>sin(x)</code>.
          Acepta <code>ln(x)</code> y <code>sen(x)</code>.
        </p>

        <form onSubmit={handleCalculate}>
          <div className="bisection-form-row">
            <label>f(x) =</label>
            <input type="text" value={fxInput} onChange={(e) => setFxInput(e.target.value)} />
          </div>

          <div className="bisection-form-row">
            <label>f&apos;(x) =</label>
            <input type="text" value={dfxInput} onChange={(e) => setDfxInput(e.target.value)} />
          </div>

          <div className="bisection-form-row">
            <label>x₀ =</label>
            <input type="number" step="any" value={x0Input} onChange={(e) => setX0Input(e.target.value)} />
          </div>

          <div className="bisection-form-row">
            <label>Tolerancia =</label>
            <input type="number" step="any" value={tolInput} onChange={(e) => setTolInput(e.target.value)} />
          </div>

          <div className="bisection-form-row">
            <label>Iteraciones =</label>
            <input type="number" value={maxIterInput} onChange={(e) => setMaxIterInput(e.target.value)} />
          </div>

          <div className="bisection-form-row">
            <label>Decimales =</label>
            <input type="number" value={decimalsInput} onChange={(e) => setDecimalsInput(e.target.value)} />
          </div>

          <div className="bisection-buttons">
            <button type="submit" className="btn-primary">CALCULAR</button>
            <button type="button" className="btn-secondary" onClick={handleClear}>BORRAR CELDAS</button>
          </div>
        </form>

        {message && <p className="bisection-message">{message}</p>}
        {errorMsg && <p className="bisection-error">{errorMsg}</p>}

        {/* ✅ Ecuación general */}
        <div className="graph-card" style={{ marginTop: "1rem" }}>
          <h4 className="graph-title">Recta tangente (general)</h4>
          <p style={{ margin: 0 }}>
            Para cada iteración n:
            <br />
            <code>
              yₙ(x) = f(xₙ) + f&apos;(xₙ)(x - xₙ) = mₙx + bₙ
            </code>
            <br />
            <code>
              mₙ = f&apos;(xₙ), &nbsp; bₙ = f(xₙ) - f&apos;(xₙ)xₙ
            </code>
          </p>
        </div>
      </div>

      {/* Resultados */}
      <div className="bisection-results">
        {/* Tabla */}
        <div className="bisection-table-wrapper">
          <h4>Tabla de iteraciones</h4>
          {rows.length === 0 ? (
            <p className="bisection-hint">Ingresa datos y presiona <strong>CALCULAR</strong>.</p>
          ) : (
            <table className="bisection-table">
              <thead>
                <tr>
                  <th>n</th>
                  <th>xₙ</th>
                  <th>f(xₙ)</th>
                  <th>f&apos;(xₙ)</th>
                  <th>xₙ₊₁</th>
                  <th>|xₙ₊₁ - xₙ|</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const isLast = idx === lastIndex && foundFinal;
                  return (
                    <tr key={r.n}>
                      <td>{r.n}</td>
                      <td>{formatNumber(r.xn)}</td>
                      <td>{formatNumber(r.fxn)}</td>
                      <td>{formatNumber(r.dfxn)}</td>
                      <td className={isLast ? "cell-green" : ""}>{formatNumber(r.xNext)}</td>
                      <td className={isLast ? "cell-red" : ""}>{formatNumber(r.error)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Vista general f(x) con pan/zoom */}
        <div className="graph-card">
          <h4 className="graph-title">f(x) — vista general (zoom y pan)</h4>
          {(() => {
            const v = buildMainView(rangeMain);
            if (!v) return <p className="bisection-hint">No se pudo graficar f(x).</p>;
            return (
              <svg
                className="graph-svg"
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
                {...panZoomMain}
              >
                {/* grid */}
                {v.xTicks.map((t, i) => (
                  <line key={`gx${i}`} x1={t.X} x2={t.X} y1={padT} y2={height - padB} stroke="#e5e7eb" />
                ))}
                {v.yTicks.map((t, i) => (
                  <line key={`gy${i}`} x1={padL} x2={width - padR} y1={t.Y} y2={t.Y} stroke="#e5e7eb" />
                ))}

                {/* ejes */}
                <line x1={padL} x2={width - padR} y1={v.xAxisY} y2={v.xAxisY} stroke="#9ca3af" />
                <line x1={v.yAxisX} x2={v.yAxisX} y1={padT} y2={height - padB} stroke="#9ca3af" />

                {/* ticks + labels */}
                {v.xTicks.map((t, i) => (
                  <g key={`xt${i}`}>
                    <line x1={t.X} x2={t.X} y1={v.xAxisY - 3} y2={v.xAxisY + 3} stroke="#6b7280" />
                    <text x={t.X} y={height - 6} fontSize="9" textAnchor="middle" fill="#374151">
                      {t.x.toFixed(2)}
                    </text>
                  </g>
                ))}
                {v.yTicks.map((t, i) => (
                  <g key={`yt${i}`}>
                    <line x1={v.yAxisX - 3} x2={v.yAxisX + 3} y1={t.Y} y2={t.Y} stroke="#6b7280" />
                    <text x={padL - 6} y={t.Y + 3} fontSize="9" textAnchor="end" fill="#374151">
                      {t.y.toFixed(2)}
                    </text>
                  </g>
                ))}

                {/* ✅ etiquetas agregadas */}
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
                  x={16}
                  y={(padT + (height - padB)) / 2}
                  fontSize="11"
                  textAnchor="middle"
                  fill="#374151"
                  transform={`rotate(-90 16 ${(padT + (height - padB)) / 2})`}
                >
                  f(x)
                </text>

                {/* curva */}
                <path d={v.path} fill="none" stroke="#2563eb" strokeWidth="1.7" />

                {/* última aproximación */}
                {lastRow && (
                  <line
                    x1={v.xTo(lastRow.xNext)}
                    x2={v.xTo(lastRow.xNext)}
                    y1={padT}
                    y2={height - padB}
                    stroke="#ef4444"
                    strokeWidth="1.3"
                    strokeDasharray="4 3"
                  />
                )}
              </svg>
            );
          })()}
        </div>

        {/* ---- Tangentes: Primeras 3 ---- */}
        {rows.length > 0 && (
          <div className="graph-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 className="graph-title">Primeras 3 rectas tangentes</h4>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button className="btn-download" onClick={() => zoomIn(rangeA, setRangeA)}>Zoom +</button>
                <button className="btn-download btn-download-secondary" onClick={() => zoomOut(rangeA, setRangeA)}>Zoom −</button>
                <button className="btn-secondary" onClick={autoA}>Auto</button>
                <span style={{ fontSize: 12 }}>xMin</span>
                <input
                  style={{ width: 90 }}
                  type="number"
                  step="any"
                  value={rangeA.xMin}
                  onChange={(e) => setRangeA((r) => ({ ...r, xMin: parseFloat(e.target.value) }))}
                />
                <span style={{ fontSize: 12 }}>xMax</span>
                <input
                  style={{ width: 90 }}
                  type="number"
                  step="any"
                  value={rangeA.xMax}
                  onChange={(e) => setRangeA((r) => ({ ...r, xMax: parseFloat(e.target.value) }))}
                />
              </div>
            </div>

            {/* ✅ Ecuaciones y1,y2,y3 con color */}
            <div style={{ marginTop: 8 }}>
              {first3.map((r, i) => (
                <div key={`eqA-${r.n}`} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                  <span style={{ width: 14, height: 14, borderRadius: 4, background: colorA[i], display: "inline-block" }} />
                  <code style={{ fontSize: 13 }}>{tangentText(r)}</code>
                </div>
              ))}
            </div>

            <svg
              className="graph-svg"
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="none"
              {...panZoomA}
            >
              {(() => {
                const v = viewA;
                const { xAxisY, yAxisX } = v.axis;
                return (
                  <>
                    {/* ✅ agregado: ejes, escalas y nombres */}
                    {renderAxes(v.axis)}

                    <path d={v.basePath} fill="none" stroke="#2563eb" strokeOpacity="0.5" strokeWidth="1.4" />
                    {v.tangents.map((tg, i) => (
                      <path key={tg.n} d={tg.path} fill="none" stroke={colorA[i]} strokeWidth="2" />
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
        )}

        {/* ---- Tangentes: Últimas 3 ---- */}
        {rows.length > 0 && (
          <div className="graph-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 className="graph-title">Últimas 3 rectas tangentes</h4>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button className="btn-download" onClick={() => zoomIn(rangeB, setRangeB)}>Zoom +</button>
                <button className="btn-download btn-download-secondary" onClick={() => zoomOut(rangeB, setRangeB)}>Zoom −</button>
                <button className="btn-secondary" onClick={autoB}>Auto</button>
                <span style={{ fontSize: 12 }}>xMin</span>
                <input
                  style={{ width: 90 }}
                  type="number"
                  step="any"
                  value={rangeB.xMin}
                  onChange={(e) => setRangeB((r) => ({ ...r, xMin: parseFloat(e.target.value) }))}
                />
                <span style={{ fontSize: 12 }}>xMax</span>
                <input
                  style={{ width: 90 }}
                  type="number"
                  step="any"
                  value={rangeB.xMax}
                  onChange={(e) => setRangeB((r) => ({ ...r, xMax: parseFloat(e.target.value) }))}
                />
              </div>
            </div>

            {/* ✅ Ecuaciones y_{n-2}, y_{n-1}, y_n con color */}
            <div style={{ marginTop: 8 }}>
              {last3.map((r, i) => (
                <div key={`eqB-${r.n}`} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                  <span style={{ width: 14, height: 14, borderRadius: 4, background: colorB[i], display: "inline-block" }} />
                  <code style={{ fontSize: 13 }}>{tangentText(r)}</code>
                </div>
              ))}
            </div>

            <svg
              className="graph-svg"
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="none"
              {...panZoomB}
            >
              {(() => {
                const v = viewB;
                const { xAxisY, yAxisX } = v.axis;
                return (
                  <>
                    {/* ✅ agregado: ejes, escalas y nombres */}
                    {renderAxes(v.axis)}

                    <path d={v.basePath} fill="none" stroke="#2563eb" strokeOpacity="0.5" strokeWidth="1.4" />
                    {v.tangents.map((tg, i) => (
                      <path key={tg.n} d={tg.path} fill="none" stroke={colorB[i]} strokeWidth="2" />
                    ))}
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