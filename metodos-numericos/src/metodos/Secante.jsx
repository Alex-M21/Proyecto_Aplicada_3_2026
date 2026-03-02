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

  // slider para ver secante por iteración en la gráfica principal
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

  const formatNumber = (v) => (Number.isFinite(v) ? v.toFixed(getDecimals()) : "NaN");

  const tolNum = useMemo(() => {
    const t = parseFloat(tolInput);
    return Number.isFinite(t) ? t : NaN;
  }, [tolInput]);

  // =========================
  // Cálculo de la Secante
  // =========================
  const handleCalculate = (e) => {
    e.preventDefault();
    setMessage("");
    setErrorMsg("");
    setRows([]);
    setIterView(0);

    if (!fxInput.trim()) {
      setErrorMsg("Debes ingresar una expresión para f(x).");
      return;
    }

    let xPrev = parseFloat(xPrevInput);
    let xCurr = parseFloat(xCurrInput);
    const tol = parseFloat(tolInput);
    const maxIter = parseInt(maxIterInput, 10);

    if (!Number.isFinite(xPrev) || !Number.isFinite(xCurr) || !Number.isFinite(tol) || !Number.isFinite(maxIter)) {
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

    const cF = buildCompiled(fxInput);
    if (!cF) {
      setErrorMsg("La función f(x) no se pudo interpretar. Revisa la sintaxis.");
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

    const newRows = [];
    let found = false;
    let bad = false;

    try {
      for (let n = 1; n <= maxIter; n++) {
        const fxPrev = f(xPrev);
        const fxCurr = f(xCurr);

        if (!Number.isFinite(fxPrev) || !Number.isFinite(fxCurr)) {
          setErrorMsg("No se pudo evaluar f(x) en alguna iteración. Revisa dominio.");
          bad = true;
          break;
        }

        const denom = fxCurr - fxPrev;
        if (denom === 0) {
          setErrorMsg("f(xₙ) - f(xₙ₋₁) = 0. La secante no puede continuar.");
          bad = true;
          break;
        }

        const xNext = xCurr - (fxCurr * (xCurr - xPrev)) / denom;
        const error = Math.abs(xNext - xCurr);

        newRows.push({ n, xPrev, xCurr, xNext, fxPrev, fxCurr, error });

        if (error < tol || error === 0) {
          found = true;
          break;
        }

        xPrev = xCurr;
        xCurr = xNext;
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
        ? `Se encontró una aproximación a la solución: x ≈ ${formatNumber(last.xNext)}`
        : "Se alcanzó el número máximo de iteraciones sin cumplir la tolerancia."
    );
  };

  const handleClear = () => {
    setFxInput("");
    setXPrevInput("");
    setXCurrInput("");
    setTolInput("");
    setMaxIterInput("");
    setDecimalsInput("5");
    setRows([]);
    setIterView(0);
    setMessage("");
    setErrorMsg("");
  };

  // =========================
  // Tabla CSV
  // =========================
  const handleDownloadTable = () => {
    if (!rows.length) return;
    const headers = ["n", "x_{n-1}", "x_n", "x_{n+1}", "f(x_{n-1})", "f(x_n)", "Error"];
    const csv = [headers.join(",")]
      .concat(
        rows.map((r) =>
          [r.n, formatNumber(r.xPrev), formatNumber(r.xCurr), formatNumber(r.xNext), formatNumber(r.fxPrev), formatNumber(r.fxCurr), formatNumber(r.error)].join(
            ","
          )
        )
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "secante_iteraciones.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // =========================
  // Rango inicial para vista principal (auto)
  // =========================
  const graphBase = useMemo(() => {
    const cF = buildCompiled(fxInput);
    if (!cF) return { xMin: -5, xMax: 5 };

    const xp = parseFloat(xPrevInput);
    const xc = parseFloat(xCurrInput);

    if (Number.isFinite(xp) && Number.isFinite(xc)) {
      let xMin = Math.min(xp, xc);
      let xMax = Math.max(xp, xc);
      const m = (xMax - xMin) * 0.2 || 2;
      xMin -= m;
      xMax += m;
      if (xMin === xMax) {
        xMin -= 2;
        xMax += 2;
      }
      return { xMin, xMax };
    }
    return { xMin: -5, xMax: 5 };
  }, [fxInput, xPrevInput, xCurrInput]);

  // ===== Dimensiones SVG =====
  const width = 420,
    height = 260,
    padL = 50,
    padR = 10,
    padT = 12,
    padB = 30;

  // ===== Rango interactivo principal =====
  const [rangeMain, setRangeMain] = useState({ xMin: -5, xMax: 5 });
  useEffect(() => {
    setRangeMain({ xMin: graphBase.xMin, xMax: graphBase.xMax });
  }, [graphBase.xMin, graphBase.xMax]);

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
  const autoMain = () => setRangeMain({ xMin: graphBase.xMin, xMax: graphBase.xMax });

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

    const steps = 240;
    const step = (xMax - xMin) / steps;
    const pts = [];
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

    // fallback + margen
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
      f,
    };
  };

  const panZoomMain = makePanZoomHandlers(rangeMain, setRangeMain, width, padL, padR);

  const lastIndex = rows.length - 1;
  const converged =
    rows.length > 0 &&
    Number.isFinite(rows[lastIndex]?.error) &&
    Number.isFinite(tolNum) &&
    (rows[lastIndex].error < tolNum || rows[lastIndex].error === 0);

  const rowView = rows.length ? rows[Math.max(0, Math.min(iterView, rows.length - 1))] : null;

  // =========================
  // Bloque: primeras/últimas 3 secantes + ecuación (igual Newton)
  // =========================
  const first3 = rows.slice(0, 3);
  const last3 = rows.slice(-3);

  const autoRangeFor = (items) => {
    const xs = items.length
      ? items.flatMap((r) => [r.xPrev, r.xCurr])
      : [parseFloat(xPrevInput) || 0, parseFloat(xCurrInput) || 0];
    const xmin = Math.min(...xs);
    const xmax = Math.max(...xs);
    let span = Math.max(1e-6, xmax - xmin);
    if (span < 0.2) span = 0.2;
    return { xMin: xmin - span, xMax: xmax + span };
  };

  const [rangeA, setRangeA] = useState(() => autoRangeFor(first3));
  const [rangeB, setRangeB] = useState(() => autoRangeFor(last3));

  useEffect(() => {
    setRangeA(autoRangeFor(first3));
  }, [rows.length]); // re-auto al recalcular

  useEffect(() => {
    setRangeB(autoRangeFor(last3));
  }, [rows.length]);

  const zoomIn = (range, setRange) => {
    const c = (range.xMin + range.xMax) / 2;
    const s = (range.xMax - range.xMin) / 2 / 1.8;
    setRange({ xMin: c - s, xMax: c + s });
  };
  const zoomOut = (range, setRange) => {
    const c = (range.xMin + range.xMax) / 2;
    const s = ((range.xMax - range.xMin) / 2) * 1.8;
    setRange({ xMin: c - s, xMax: c + s });
  };
  const autoA = () => setRangeA(autoRangeFor(first3));
  const autoB = () => setRangeB(autoRangeFor(last3));

  const makeLinePath = (m, b, xMin, xMax, xTo, yTo) => {
    const y1 = m * xMin + b;
    const y2 = m * xMax + b;
    return `M ${xTo(xMin)} ${yTo(y1)} L ${xTo(xMax)} ${yTo(y2)}`;
  };

  const buildSecantView = (items, rangeX) => {
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

    // base
    const steps = 180;
    const step = (xMax - xMin) / steps;
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * step;
      const y = f(x);
      if (Number.isFinite(y)) pts.push({ x, y });
    }

    // yMin/yMax considerando curvas y secantes
    let yMin = Infinity,
      yMax = -Infinity;
    pts.forEach((p) => {
      yMin = Math.min(yMin, p.y);
      yMax = Math.max(yMax, p.y);
    });

    const secantsInfo = items.map((r) => {
      const x1 = r.xPrev,
        x2 = r.xCurr;
      const y1 = f(x1),
        y2 = f(x2);

      if (!Number.isFinite(x1) || !Number.isFinite(x2) || x1 === x2 || !Number.isFinite(y1) || !Number.isFinite(y2)) {
        return { n: r.n, ok: false, m: NaN, b: NaN, path: "" };
      }

      const m = (y2 - y1) / (x2 - x1);
      const b = y1 - m * x1;

      yMin = Math.min(yMin, y1, y2, m * xMin + b, m * xMax + b);
      yMax = Math.max(yMax, y1, y2, m * xMin + b, m * xMax + b);

      return { n: r.n, ok: true, m, b };
    });

    if (!Number.isFinite(yMin) || !Number.isFinite(yMax) || yMin === yMax) {
      yMin = -1;
      yMax = 1;
    } else {
      const margin = (yMax - yMin) * 0.15;
      yMin -= margin;
      yMax += margin;
    }

    const xTicks = buildTicks(xMin, xMax, 6);
    const yTicks = buildTicks(yMin, yMax, 6);
    const { xTo, yTo } = toXY(xMin, xMax, yMin, yMax);

    const basePath = pathFromPts(pts, xTo, yTo);

    const secants = secantsInfo.map((s) => ({
      ...s,
      path: s.ok ? makeLinePath(s.m, s.b, xMin, xMax, xTo, yTo) : "",
    }));

    const xAxisY = yMin <= 0 && yMax >= 0 ? yTo(0) : yTo(yMin);
    const yAxisX = xMin <= 0 && xMax >= 0 ? xTo(0) : xTo(xMin);

    return {
      basePath,
      secants,
      axis: {
        xAxisY,
        yAxisX,
        xTicks: xTicks.map((x) => ({ x, X: xTo(x) })),
        yTicks: yTicks.map((y) => ({ y, Y: yTo(y) })),
      },
    };
  };

  const viewA = buildSecantView(first3, rangeA);
  const viewB = buildSecantView(last3, rangeB);

  const panZoomA = makePanZoomHandlers(rangeA, setRangeA, width, padL, padR);
  const panZoomB = makePanZoomHandlers(rangeB, setRangeB, width, padL, padR);

  const colorA = ["#DC2626", "#F59E0B", "#10B981"];
  const colorB = ["#7C3AED", "#0EA5E9", "#EF4444"];

  const lineEq = (m, b) => {
    if (!Number.isFinite(m) || !Number.isFinite(b)) return "No válida";
    const mm = parseFloat(m.toFixed(getDecimals()));
    const bb = parseFloat(b.toFixed(getDecimals()));
    const sign = bb >= 0 ? "+" : "-";
    return `y = ${mm}x ${sign} ${Math.abs(bb)}`;
  };

  // ========= RENDER =========
  return (
    <div className="bisection-grid">
      <div className="bisection-form">
        <h3>Método de la Secante</h3>
        <p className="bisection-hint">
          Ingresa f(x) y dos aproximaciones iniciales x₀ (xₙ₋₁) y x₁ (xₙ). Acepta <code>ln(x)</code> y <code>sen(x)</code>.
        </p>

        <form onSubmit={handleCalculate}>
          <div className="bisection-form-row">
            <label>f(x) =</label>
            <input type="text" value={fxInput} onChange={(e) => setFxInput(e.target.value)} />
          </div>
          <div className="bisection-form-row">
            <label>xₙ₋₁ =</label>
            <input type="number" step="any" value={xPrevInput} onChange={(e) => setXPrevInput(e.target.value)} />
          </div>
          <div className="bisection-form-row">
            <label>xₙ =</label>
            <input type="number" step="any" value={xCurrInput} onChange={(e) => setXCurrInput(e.target.value)} />
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
            <button type="submit" className="btn-primary">
              CALCULAR
            </button>
            <button type="button" className="btn-secondary" onClick={handleClear}>
              BORRAR CELDAS
            </button>
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
            <p className="bisection-hint">
              Ingresa los datos y presiona <strong>CALCULAR</strong>.
            </p>
          ) : (
            <>
              <table className="bisection-table">
                <thead>
                  <tr>
                    <th>n</th>
                    <th>xₙ₋₁</th>
                    <th>xₙ</th>
                    <th>xₙ₊₁</th>
                    <th>f(xₙ₋₁)</th>
                    <th>f(xₙ)</th>
                    <th>Error = |xₙ₊₁ - xₙ|</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => {
                    const isLastOk = converged && idx === lastIndex;
                    const isSelected = idx === iterView;

                    return (
                      <tr key={r.n} style={isSelected ? { outline: "2px solid #93c5fd" } : undefined}>
                        <td>{r.n}</td>
                        <td>{formatNumber(r.xPrev)}</td>
                        <td>{formatNumber(r.xCurr)}</td>
                        <td className={isLastOk ? "cell-green" : ""}>{formatNumber(r.xNext)}</td>
                        <td>{formatNumber(r.fxPrev)}</td>
                        <td>{formatNumber(r.fxCurr)}</td>
                        <td className={isLastOk ? "cell-red" : ""}>{formatNumber(r.error)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* slider para seleccionar iteración */}
              <div style={{ marginTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span>
                    Iteración: <strong>{rows[iterView]?.n}</strong>
                  </span>
                  <span>
                    xₙ₊₁: <strong>{rowView ? formatNumber(rowView.xNext) : "-"}</strong>
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

        {/* Vista general con pan/zoom + botones */}
        <div className="graph-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 className="graph-title">f(x) — vista general (zoom y pan)</h4>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn-download" onClick={zoomInMain}>
                Zoom +
              </button>
              <button type="button" className="btn-download btn-download-secondary" onClick={zoomOutMain}>
                Zoom −
              </button>
              <button type="button" className="btn-secondary" onClick={autoMain}>
                Auto
              </button>
            </div>
          </div>

          {(() => {
            const v = buildMainView(rangeMain);
            if (!v) return <p className="bisection-hint">No se pudo graficar f(x).</p>;

            // secante de la iteración seleccionada (segmento entre los 2 puntos)
            let secantLine = null;
            if (rowView) {
              const x1 = rowView.xPrev;
              const x2 = rowView.xCurr;
              const y1 = v.f(x1);
              const y2 = v.f(x2);
              if (Number.isFinite(x1) && Number.isFinite(x2) && x1 !== x2 && Number.isFinite(y1) && Number.isFinite(y2)) {
                secantLine = { x1, y1, x2, y2 };
              }
            }

            return (
              <>
                <svg className="graph-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" {...panZoomMain} style={{ touchAction: "none" }}>
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

                  {/* ticks */}
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

                  {/* f(x) */}
                  <path d={v.path} fill="none" stroke="#2563eb" strokeWidth="1.7" />

                  {/* secante del slider */}
                  {secantLine && (
                    <line
                      x1={v.xTo(secantLine.x1)}
                      y1={v.yTo(secantLine.y1)}
                      x2={v.xTo(secantLine.x2)}
                      y2={v.yTo(secantLine.y2)}
                      stroke="#ef4444"
                      strokeWidth="2"
                      opacity="0.85"
                    />
                  )}

                  {/* línea vertical en x_{n+1} */}
                  {rowView && (
                    <line
                      x1={v.xTo(rowView.xNext)}
                      x2={v.xTo(rowView.xNext)}
                      y1={padT}
                      y2={height - padB}
                      stroke="#ef4444"
                      strokeWidth="1.3"
                      strokeDasharray="4 3"
                    />
                  )}
                </svg>

                <p className="bisection-hint" style={{ marginTop: 6 }}>
                  Rueda: zoom • Arrastrar: mover • Slider: ver secante por iteración
                </p>
              </>
            );
          })()}
        </div>

        {/* ---- Primeras 3 líneas secantes + ecuación ---- */}
        {rows.length > 0 && viewA && (
          <div className="graph-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 className="graph-title">Primeras 3 líneas secantes</h4>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button className="btn-download" onClick={() => zoomIn(rangeA, setRangeA)}>
                  Zoom +
                </button>
                <button className="btn-download btn-download-secondary" onClick={() => zoomOut(rangeA, setRangeA)}>
                  Zoom −
                </button>
                <button className="btn-secondary" onClick={autoA}>
                  Auto
                </button>
                <span style={{ fontSize: 12 }}>xMin</span>
                <input style={{ width: 90 }} type="number" step="any" value={rangeA.xMin} onChange={(e) => setRangeA((r) => ({ ...r, xMin: parseFloat(e.target.value) }))} />
                <span style={{ fontSize: 12 }}>xMax</span>
                <input style={{ width: 90 }} type="number" step="any" value={rangeA.xMax} onChange={(e) => setRangeA((r) => ({ ...r, xMax: parseFloat(e.target.value) }))} />
              </div>
            </div>

            <div style={{ margin: "6px 0 10px", fontSize: 13 }}>
              {viewA.secants.map((s, i) => (
                <div key={`eqA-${s.n}`} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ width: 14, height: 14, background: colorA[i], display: "inline-block", borderRadius: 3 }} />
                  <strong>Secante {s.n}:</strong> <code>{lineEq(s.m, s.b)}</code>
                </div>
              ))}
            </div>

            <svg className="graph-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" {...panZoomA} style={{ touchAction: "none" }}>
              {(() => {
                const v = viewA;
                const { xAxisY, yAxisX, xTicks, yTicks } = v.axis;
                return (
                  <>
                    {xTicks.map((t, i) => (
                      <line key={`a-gx-${i}`} x1={t.X} x2={t.X} y1={padT} y2={height - padB} stroke="#e5e7eb" />
                    ))}
                    {yTicks.map((t, i) => (
                      <line key={`a-gy-${i}`} x1={padL} x2={width - padR} y1={t.Y} y2={t.Y} stroke="#e5e7eb" />
                    ))}
                    <line x1={padL} x2={width - padR} y1={xAxisY} y2={xAxisY} stroke="#9ca3af" />
                    <line x1={yAxisX} x2={yAxisX} y1={padT} y2={height - padB} stroke="#9ca3af" />

                    {xTicks.map((t, i) => (
                      <g key={`a-xt-${i}`}>
                        <line x1={t.X} x2={t.X} y1={xAxisY - 3} y2={xAxisY + 3} stroke="#6b7280" />
                        <text x={t.X} y={height - 6} fontSize="9" textAnchor="middle" fill="#374151">
                          {t.x.toFixed(2)}
                        </text>
                      </g>
                    ))}
                    {yTicks.map((t, i) => (
                      <g key={`a-yt-${i}`}>
                        <line x1={yAxisX - 3} x2={yAxisX + 3} y1={t.Y} y2={t.Y} stroke="#6b7280" />
                        <text x={padL - 6} y={t.Y + 3} fontSize="9" textAnchor="end" fill="#374151">
                          {t.y.toFixed(2)}
                        </text>
                      </g>
                    ))}

                    <path d={v.basePath} fill="none" stroke="#2563eb" strokeOpacity="0.5" strokeWidth="1.4" />

                    {v.secants.map((sc, i) => (
                      <path key={`a-sc-${sc.n}`} d={sc.path} fill="none" stroke={colorA[i]} strokeWidth="2" />
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
        )}

        {/* ---- Últimas 3 líneas secantes + ecuación ---- */}
        {rows.length > 0 && viewB && (
          <div className="graph-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 className="graph-title">Últimas 3 líneas secantes</h4>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button className="btn-download" onClick={() => zoomIn(rangeB, setRangeB)}>
                  Zoom +
                </button>
                <button className="btn-download btn-download-secondary" onClick={() => zoomOut(rangeB, setRangeB)}>
                  Zoom −
                </button>
                <button className="btn-secondary" onClick={autoB}>
                  Auto
                </button>
                <span style={{ fontSize: 12 }}>xMin</span>
                <input style={{ width: 90 }} type="number" step="any" value={rangeB.xMin} onChange={(e) => setRangeB((r) => ({ ...r, xMin: parseFloat(e.target.value) }))} />
                <span style={{ fontSize: 12 }}>xMax</span>
                <input style={{ width: 90 }} type="number" step="any" value={rangeB.xMax} onChange={(e) => setRangeB((r) => ({ ...r, xMax: parseFloat(e.target.value) }))} />
              </div>
            </div>

            <div style={{ margin: "6px 0 10px", fontSize: 13 }}>
              {viewB.secants.map((s, i) => (
                <div key={`eqB-${s.n}`} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ width: 14, height: 14, background: colorB[i], display: "inline-block", borderRadius: 3 }} />
                  <strong>Secante {s.n}:</strong> <code>{lineEq(s.m, s.b)}</code>
                </div>
              ))}
            </div>

            <svg className="graph-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" {...panZoomB} style={{ touchAction: "none" }}>
              {(() => {
                const v = viewB;
                const { xAxisY, yAxisX, xTicks, yTicks } = v.axis;
                return (
                  <>
                    {xTicks.map((t, i) => (
                      <line key={`b-gx-${i}`} x1={t.X} x2={t.X} y1={padT} y2={height - padB} stroke="#e5e7eb" />
                    ))}
                    {yTicks.map((t, i) => (
                      <line key={`b-gy-${i}`} x1={padL} x2={width - padR} y1={t.Y} y2={t.Y} stroke="#e5e7eb" />
                    ))}
                    <line x1={padL} x2={width - padR} y1={xAxisY} y2={xAxisY} stroke="#9ca3af" />
                    <line x1={yAxisX} x2={yAxisX} y1={padT} y2={height - padB} stroke="#9ca3af" />

                    {xTicks.map((t, i) => (
                      <g key={`b-xt-${i}`}>
                        <line x1={t.X} x2={t.X} y1={xAxisY - 3} y2={xAxisY + 3} stroke="#6b7280" />
                        <text x={t.X} y={height - 6} fontSize="9" textAnchor="middle" fill="#374151">
                          {t.x.toFixed(2)}
                        </text>
                      </g>
                    ))}
                    {yTicks.map((t, i) => (
                      <g key={`b-yt-${i}`}>
                        <line x1={yAxisX - 3} x2={yAxisX + 3} y1={t.Y} y2={t.Y} stroke="#6b7280" />
                        <text x={padL - 6} y={t.Y + 3} fontSize="9" textAnchor="end" fill="#374151">
                          {t.y.toFixed(2)}
                        </text>
                      </g>
                    ))}

                    <path d={v.basePath} fill="none" stroke="#2563eb" strokeOpacity="0.5" strokeWidth="1.4" />

                    {v.secants.map((sc, i) => (
                      <path key={`b-sc-${sc.n}`} d={sc.path} fill="none" stroke={colorB[i]} strokeWidth="2" />
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