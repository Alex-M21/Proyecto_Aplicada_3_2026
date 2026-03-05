// src/metodos/MullerNoReal.jsx
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

// helpers complejos
const isComplex = (v) => v && typeof v === "object" && v.re != null && v.im != null;
const toComplex = (v) => (isComplex(v) ? v : math.complex(v, 0));

export default function MullerNoReal() {
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

  // slider para ver iteración en la gráfica
  const [iterView, setIterView] = useState(0);

  // -------------------------
  // Utilidades
  // -------------------------
  const normalizeExpr = (expr) =>
    String(expr ?? "")
      .trim()
      .replace(/LN/gi, "log")
      .replace(/ln/gi, "log")
      .replace(/sen/gi, "sin")
      .replace(/j/gi, "i"); // por si usan j

  const buildCompiled = (expr) => {
    const t = normalizeExpr(expr);
    if (!t) return null;
    try {
      return math.compile(t);
    } catch {
      return null;
    }
  };

  const getDecimals = () => {
    const d = parseInt(decimalsInput, 10);
    if (Number.isNaN(d) || d < 0) return 6;
    return Math.min(12, d);
  };

  const roundNum = (x, d) => {
    const f = 10 ** d;
    return Math.round(x * f) / f;
  };

  const roundTo = (v) => {
    const d = getDecimals();
    if (typeof v === "number") return Number.isFinite(v) ? roundNum(v, d) : v;
    if (!isComplex(v)) return v;
    return math.complex(roundNum(v.re, d), roundNum(v.im, d));
  };

  const formatValue = (v) => {
    const d = getDecimals();
    const eps = 10 ** (-(d + 2));

    if (typeof v === "number") return Number.isFinite(v) ? v.toFixed(d) : "NaN";
    if (!isComplex(v)) return "NaN";

    const re = Math.abs(v.re) < eps ? 0 : v.re;
    const im = Math.abs(v.im) < eps ? 0 : v.im;

    if (im === 0) return re.toFixed(d);
    if (re === 0) return `${im.toFixed(d)}i`;

    const sign = im >= 0 ? "+" : "-";
    return `${re.toFixed(d)} ${sign} ${Math.abs(im).toFixed(d)}i`;
  };

  const absVal = (v) => {
    try {
      return math.abs(v);
    } catch {
      return NaN;
    }
  };

  // parse de entradas x0,x1,x2 permitiendo complejos (ej: 1+2i, -0.5i)
  const parseX = (s) => {
    const t = normalizeExpr(s);
    if (!t) return null;
    try {
      const val = math.evaluate(t); // number o Complex
      if (typeof val === "number") return math.complex(val, 0);
      if (isComplex(val)) return val;
      return null;
    } catch {
      return null;
    }
  };

  const tolNum = useMemo(() => {
    const t = parseFloat(tolInput);
    return Number.isFinite(t) ? t : NaN;
  }, [tolInput]);

  // -------------------------
  // Cálculo: Muller COMPLEJO
  // Tabla: n, x0, x1, x2, p, Error = |p - x2|
  // -------------------------
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

    const x0p = parseX(x0Input);
    const x1p = parseX(x1Input);
    const x2p = parseX(x2Input);
    const tol = parseFloat(tolInput);
    const maxIter = parseInt(maxIterInput, 10);

    if (!x0p || !x1p || !x2p || !Number.isFinite(tol) || !Number.isFinite(maxIter)) {
      setErrorMsg('Valores inválidos. Para complejos usa: "1+2i" o "-0.5i".');
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
        if (typeof r === "number") return math.complex(r, 0);
        if (isComplex(r)) return r;
        return math.complex(NaN, NaN);
      } catch {
        return math.complex(NaN, NaN);
      }
    };

    // ✅ OJO: NO redondeamos para calcular (solo para mostrar)
    let x0 = toComplex(x0p);
    let x1 = toComplex(x1p);
    let x2 = toComplex(x2p);

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

        if (![f0, f1, f2].every((z) => isComplex(z) && Number.isFinite(z.re) && Number.isFinite(z.im))) {
          setErrorMsg("No se pudo evaluar f(x) en alguna iteración.");
          bad = true;
          break;
        }

        const h1 = math.subtract(x1_i, x0_i);
        const h2 = math.subtract(x2_i, x1_i);

        if (absVal(h1) < EPS || absVal(h2) < EPS) {
          setErrorMsg("Hay puntos iguales o muy cercanos (x0, x1, x2). Cambia valores iniciales.");
          bad = true;
          break;
        }

        const d1 = math.divide(math.subtract(f1, f0), h1);
        const d2 = math.divide(math.subtract(f2, f1), h2);
        const d = math.divide(math.subtract(d2, d1), math.add(h2, h1));

        let p;

        // Si d ~ 0 => secante compleja
        if (absVal(d) < EPS) {
          const denomSec = math.subtract(f2, f1);
          if (absVal(denomSec) < EPS) {
            setErrorMsg("No se puede avanzar (denominador ~ 0). Cambia valores iniciales.");
            bad = true;
            break;
          }
          p = math.subtract(x2_i, math.divide(math.multiply(f2, math.subtract(x2_i, x1_i)), denomSec));
        } else {
          const b = math.add(d2, math.multiply(h2, d));
          const disc = math.subtract(math.multiply(b, b), math.multiply(4, math.multiply(f2, d)));
          const D = math.sqrt(disc); // complejo permitido

          const denom1 = math.add(b, D);
          const denom2 = math.subtract(b, D);
          const denom = absVal(denom1) >= absVal(denom2) ? denom1 : denom2;

          if (absVal(denom) < EPS) {
            setErrorMsg("Denominador ~ 0 (inestabilidad numérica). Cambia valores iniciales.");
            bad = true;
            break;
          }

          p = math.add(x2_i, math.divide(math.multiply(-2, f2), denom));
        }

        p = toComplex(p);
        const error = absVal(math.subtract(p, x2_i));

        // guardamos raw + display
        newRows.push({
          n,
          x0Raw: x0_i,
          x1Raw: x1_i,
          x2Raw: x2_i,
          pRaw: p,
          f0Raw: f0,
          f1Raw: f1,
          f2Raw: f2,

          x0: roundTo(x0_i),
          x1: roundTo(x1_i),
          x2: roundTo(x2_i),
          p: roundTo(p),
          error: roundTo(error),
          errorRaw: error,
        });

        if (Number.isFinite(error) && error < tol) {
          found = true;
          break;
        }

        // (x0,x1,x2) <- (x1,x2,p)
        x0 = x1_i;
        x1 = x2_i;
        x2 = p;
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
      found ? `Se encontró una aproximación: p ≈ ${formatValue(last.p)}` : "Se alcanzó el número máximo de iteraciones sin cumplir la tolerancia."
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

  // -------------------------
  // CSV
  // -------------------------
  const handleDownloadTable = () => {
    if (!rows.length) return;

    const headers = ["n", "x0", "x1", "x2", "p", "Error"];
    const csvRows = [headers.join(",")];

    rows.forEach((r) => {
      csvRows.push([r.n, formatValue(r.x0), formatValue(r.x1), formatValue(r.x2), formatValue(r.p), String(r.error)].join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "muller_no_real_iteraciones.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // =========================
  // Gráfica (plano real) + recorrido:
  // - dibujamos f(x) SOLO si x real (por tu UI)
  // - marcamos en el eje x: Re(x0), Re(x1), Re(x2), Re(p)
  // - etiquetamos x0,x1,x2,p
  // =========================
  const baseRange = useMemo(() => {
    // usamos solo Re(...) para rango
    const xs = [
      parseX(x0Input)?.re,
      parseX(x1Input)?.re,
      parseX(x2Input)?.re,
    ].filter((v) => Number.isFinite(v));

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

  const width = 420,
    height = 260,
    padL = 50,
    padR = 10,
    padT = 12,
    padB = 30;

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

    // f real: evaluamos en x real
    const fReal = (x) => {
      try {
        const r = cF.evaluate({ x });
        if (typeof r === "number") return Number.isFinite(r) ? r : NaN;
        if (isComplex(r)) return Number.isFinite(r.re) ? r.re : NaN; // mostramos parte real
        return NaN;
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
      const y = fReal(x);
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

    const path = pts.length ? pts.map((p, i) => `${i ? "L" : "M"} ${xTo(p.x)} ${yTo(p.y)}`).join(" ") : "";

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
      fReal,
    };
  }, [fxInput, rangeMain.xMin, rangeMain.xMax]);

  const panZoomMain = makePanZoomHandlers(rangeMain, setRangeMain, width, padL, padR);

  const lastIndex = rows.length - 1;
  const converged = rows.length > 0 && Number.isFinite(tolNum) && Number.isFinite(rows[lastIndex]?.errorRaw) && rows[lastIndex].errorRaw < tolNum;

  const rowView = rows.length ? rows[Math.max(0, Math.min(iterView, rows.length - 1))] : null;

  // historial de p sobre el eje x (Re)
  const pHistory = rows.map((r) => (isComplex(r.pRaw) ? r.pRaw.re : NaN)).filter((v) => Number.isFinite(v));

  // etiqueta tipo “callout”
  const pointLabel = (x, y, text, color = "#111827") => (
    <g>
      <text x={x + 8} y={y - 8} fontSize="11" fill={color} style={{ paintOrder: "stroke", stroke: "#ffffff", strokeWidth: 3 }}>
        {text}
      </text>
      <text x={x + 8} y={y - 8} fontSize="11" fill={color}>
        {text}
      </text>
    </g>
  );

  return (
    <div className="bisection-grid">
      {/* Formulario */}
      <div className="bisection-form">
        <h3>Método de Muller (Complejo / No real)</h3>
        <p className="bisection-hint">
          Permite raíces complejas. Puedes ingresar x₀, x₁, x₂ como reales o complejos: <code>1+2i</code>, <code>-0.5i</code>.
          Acepta <code>ln(x)</code> y <code>sen(x)</code>.
        </p>

        <form onSubmit={handleCalculate}>
          <div className="bisection-form-row">
            <label>Ingrese f(x) =</label>
            <input type="text" value={fxInput} onChange={(e) => setFxInput(e.target.value)} />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese el valor x₀ =</label>
            <input type="text" value={x0Input} onChange={(e) => setX0Input(e.target.value)} placeholder='Ej: 0  ó  1+0.2i' />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese el valor x₁ =</label>
            <input type="text" value={x1Input} onChange={(e) => setX1Input(e.target.value)} placeholder='Ej: 1  ó  1.2-0.1i' />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese el valor x₂ =</label>
            <input type="text" value={x2Input} onChange={(e) => setX2Input(e.target.value)} placeholder='Ej: 2  ó  1.4+0.05i' />
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

      {/* Resultados */}
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
                      <tr key={r.n} style={isSelected ? { outline: "2px solid #93c5fd" } : undefined}>
                        <td>{r.n}</td>
                        <td>{formatValue(r.x0)}</td>
                        <td>{formatValue(r.x1)}</td>
                        <td>{formatValue(r.x2)}</td>
                        <td className={isLastOk ? "cell-green" : ""}>{formatValue(r.p)}</td>
                        <td className={isLastOk ? "cell-red" : ""}>
                          {typeof r.error === "number" ? r.error.toFixed(getDecimals()) : formatValue(r.error)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* slider */}
              <div style={{ marginTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span>
                    Iteración: <strong>{rows[iterView]?.n}</strong>
                  </span>
                  <span>
                    p: <strong>{rowView ? formatValue(rowView.p) : "-"}</strong>
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

        {/* Gráfica */}
        <div className="graph-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 className="graph-title">Recorrido de Muller (complejo) — vista en eje real</h4>
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

          {!graphData ? (
            <p className="bisection-hint">No se pudo graficar f(x).</p>
          ) : (
            <>
              <svg className="graph-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" {...panZoomMain} style={{ touchAction: "none" }}>
                {/* grid */}
                {graphData.xTicks.map((t, i) => (
                  <line key={`gx${i}`} x1={t.X} x2={t.X} y1={padT} y2={height - padB} stroke="#e5e7eb" />
                ))}
                {graphData.yTicks.map((t, i) => (
                  <line key={`gy${i}`} x1={padL} x2={width - padR} y1={t.Y} y2={t.Y} stroke="#e5e7eb" />
                ))}

                {/* ejes */}
                <line x1={padL} x2={width - padR} y1={graphData.xAxisY} y2={graphData.xAxisY} stroke="#9ca3af" />
                <line x1={graphData.yAxisX} x2={graphData.yAxisX} y1={padT} y2={height - padB} stroke="#9ca3af" />

                {/* f(x) (parte real si aplica) */}
                <path d={graphData.path} fill="none" stroke="#2563eb" strokeWidth="1.7" />

                {/* historial de p (Re) sobre eje x */}
                {pHistory.map((pr, i) => (
                  <circle key={`ph-${i}`} cx={graphData.xTo(pr)} cy={graphData.xAxisY} r="2.6" fill="#111827" opacity="0.6" />
                ))}

                {/* overlay iteración: puntos x0,x1,x2 y p (en eje real) */}
                {rowView && (() => {
                  const rx0 = rowView.x0Raw.re;
                  const rx1 = rowView.x1Raw.re;
                  const rx2 = rowView.x2Raw.re;
                  const rp = rowView.pRaw.re;

                  const fx0 = graphData.fReal(rx0);
                  const fx1 = graphData.fReal(rx1);
                  const fx2 = graphData.fReal(rx2);

                  const X0 = graphData.xTo(rx0);
                  const X1 = graphData.xTo(rx1);
                  const X2 = graphData.xTo(rx2);
                  const Xp = graphData.xTo(rp);

                  const Y0 = graphData.yTo(fx0);
                  const Y1 = graphData.yTo(fx1);
                  const Y2 = graphData.yTo(fx2);

                  return (
                    <>
                      <circle cx={X0} cy={Y0} r="4" fill="#10b981" />
                      <circle cx={X1} cy={Y1} r="4" fill="#0ea5e9" />
                      <circle cx={X2} cy={Y2} r="4" fill="#ef4444" />

                      {pointLabel(X0, Y0, "x0", "#065f46")}
                      {pointLabel(X1, Y1, "x1", "#075985")}
                      {pointLabel(X2, Y2, "x2", "#7f1d1d")}

                      <line x1={Xp} x2={Xp} y1={padT} y2={height - padB} stroke="#10b981" strokeWidth="1.6" strokeDasharray="4 3" />
                      <circle cx={Xp} cy={graphData.xAxisY} r="4.2" fill="#10b981" />
                      {pointLabel(Xp, graphData.xAxisY, "p", "#065f46")}
                    </>
                  );
                })()}
              </svg>

              <p className="bisection-hint" style={{ marginTop: 6 }}>
                Nota: esta vista es en el <strong>eje real</strong> (Re). El algoritmo trabaja en complejo; en la tabla ves el valor completo.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}