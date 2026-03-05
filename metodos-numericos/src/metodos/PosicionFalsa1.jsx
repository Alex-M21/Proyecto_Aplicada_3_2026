// src/metodos/PosicionFalsa1.jsx
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

export default function PosicionFalsa1() {
  const [fxInput, setFxInput] = useState("x^5-7*x^2-1");
  const [xPrevInput, setXPrevInput] = useState("1"); // x_{n-1}
  const [xCurrInput, setXCurrInput] = useState("2"); // x_n
  const [tolInput, setTolInput] = useState("0.001");
  const [maxIterInput, setMaxIterInput] = useState("30");
  const [decimalsInput, setDecimalsInput] = useState("5");

  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // ✅ slider para ver iteración en la gráfica
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
    return Number.isNaN(d) || d < 0 ? 6 : Math.min(12, d);
  };

  const formatNumber = (value) => (Number.isFinite(value) ? value.toFixed(getDecimals()) : "NaN");

  const tolNum = useMemo(() => {
    const t = parseFloat(tolInput);
    return Number.isFinite(t) ? t : NaN;
  }, [tolInput]);

  // -------------------------
  // Cálculo del método
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

    const compiledF = buildCompiled(fxInput);
    if (!compiledF) {
      setErrorMsg("La función f(x) no se pudo interpretar. Revisa la sintaxis.");
      return;
    }

    const evalF = (x) => {
      try {
        const res = compiledF.evaluate({ x });
        return Number.isFinite(res) ? res : NaN;
      } catch {
        return NaN;
      }
    };

    const fPrev0 = evalF(xPrev);
    const fCurr0 = evalF(xCurr);
    if (!Number.isFinite(fPrev0) || !Number.isFinite(fCurr0)) {
      setErrorMsg("No se pudo evaluar f(x) en los extremos iniciales. Revisa dominio.");
      return;
    }
    if (fPrev0 * fCurr0 > 0) {
      setErrorMsg("f(xₙ₋₁) y f(xₙ) tienen el mismo signo. Se requiere cambio de signo en [xₙ₋₁, xₙ].");
      return;
    }

    const newRows = [];
    let found = false;
    let hadError = false;

    try {
      for (let n = 1; n <= maxIter; n++) {
        const xPrev_i = xPrev;
        const xCurr_i = xCurr;

        const fPrev = evalF(xPrev_i);
        const fCurr = evalF(xCurr_i);

        if (!Number.isFinite(fPrev) || !Number.isFinite(fCurr)) {
          setErrorMsg("No se pudo evaluar f(x) en alguna iteración. Revisa la función y el intervalo.");
          hadError = true;
          break;
        }

        const denom = fCurr - fPrev;
        if (denom === 0) {
          setErrorMsg("En alguna iteración f(xₙ) - f(xₙ₋₁) = 0. No se puede continuar.");
          hadError = true;
          break;
        }

        const xNext = xCurr_i - (fCurr * (xCurr_i - xPrev_i)) / denom;
        const fNext = evalF(xNext);

        if (!Number.isFinite(fNext)) {
          setErrorMsg("No se pudo evaluar f(xₙ₊₁) en alguna iteración. Revisa dominio.");
          hadError = true;
          break;
        }

        const prod = fPrev * fNext;
        const error = Math.abs(xNext - xPrev_i); // como tu tabla

        newRows.push({
          n,
          // display
          xPrev: xPrev_i,
          xCurr: xCurr_i,
          xNext,
          fPrev,
          fCurr,
          fNext,
          prod,
          error,
          // raw para gráfica
          xPrevRaw: xPrev_i,
          xCurrRaw: xCurr_i,
          xNextRaw: xNext,
          fPrevRaw: fPrev,
          fCurrRaw: fCurr,
        });

        if (Math.abs(fNext) < tol || error < tol) {
          found = true;
          break;
        }

        // actualizar intervalo manteniendo cambio de signo
        if (prod < 0) xCurr = xNext;
        else xPrev = xNext;
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

  // -------------------------
  // Descarga tabla (CSV)
  // -------------------------
  const handleDownloadTable = () => {
    if (!rows.length) return;

    const headers = [
      "n",
      "x_{n-1}",
      "x_n",
      "x_{n+1}",
      "f(x_{n-1})",
      "f(x_n)",
      "f(x_{n+1})",
      "f(x_{n-1})*f(x_{n+1})",
      "Error",
    ];
    const csvRows = [headers.join(",")];

    rows.forEach((row) => {
      const values = [
        row.n,
        formatNumber(row.xPrev),
        formatNumber(row.xCurr),
        formatNumber(row.xNext),
        formatNumber(row.fPrev),
        formatNumber(row.fCurr),
        formatNumber(row.fNext),
        formatNumber(row.prod),
        formatNumber(row.error),
      ];
      csvRows.push(values.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "posicion_falsa_1_iteraciones.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // -------------------------
  // Rango "auto" inicial para la vista (x)
  // -------------------------
  const baseRange = useMemo(() => {
    const x0 = parseFloat(xPrevInput);
    const x1 = parseFloat(xCurrInput);

    if (Number.isFinite(x0) && Number.isFinite(x1)) {
      let xMin = Math.min(x0, x1);
      let xMax = Math.max(x0, x1);
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
  }, [xPrevInput, xCurrInput, fxInput]);

  // ✅ RANGO INTERACTIVO (zoom/pan)
  const [rangeMain, setRangeMain] = useState({ xMin: -5, xMax: 5 });
  useEffect(() => {
    setRangeMain({ xMin: baseRange.xMin, xMax: baseRange.xMax });
  }, [baseRange.xMin, baseRange.xMax]);

  const width = 420;
  const height = 260;
  const padL = 50;
  const padR = 10;
  const padT = 12;
  const padB = 30;

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

  const pathFromPts = (pts, xTo, yTo) => (pts.length ? pts.map((p, i) => `${i ? "L" : "M"} ${xTo(p.x)} ${yTo(p.y)}`).join(" ") : "");

  // =========================
  // Gráfica principal f(x)
  // =========================
  const graphData = useMemo(() => {
    const compiledF = buildCompiled(fxInput);
    if (!compiledF) return null;

    const f = (x) => {
      try {
        const r = compiledF.evaluate({ x });
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
      f,
    };
  }, [fxInput, rangeMain.xMin, rangeMain.xMax, decimalsInput]);

  const panZoomMain = makePanZoomHandlers(rangeMain, setRangeMain, width, padL, padR);

  // =========================
  // ✅ Primeras 3 y últimas 3 secantes (como Secante.jsx)
  // =========================
  const first3 = rows.slice(0, 3);
  const last3 = rows.slice(-3);

  const autoRangeFor = (items) => {
    const xs = items.length ? items.flatMap((r) => [r.xPrev, r.xCurr]) : [parseFloat(xPrevInput) || 0, parseFloat(xCurrInput) || 0];
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

  const makeLinePath = (m, b, xMin, xMax, xTo, yTo) => {
    const y1 = m * xMin + b;
    const y2 = m * xMax + b;
    return `M ${xTo(xMin)} ${yTo(y1)} L ${xTo(xMax)} ${yTo(y2)}`;
  };

  const lineEq = (m, b) => {
    if (!Number.isFinite(m) || !Number.isFinite(b)) return "No válida";
    const mm = parseFloat(m.toFixed(getDecimals()));
    const bb = parseFloat(b.toFixed(getDecimals()));
    const sign = bb >= 0 ? "+" : "-";
    return `y = ${mm}x ${sign} ${Math.abs(bb)}`;
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

    const steps = 180;
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

    const secantsInfo = items.map((r) => {
      const x1 = r.xPrev;
      const x2 = r.xCurr;
      const y1 = r.fPrev;
      const y2 = r.fCurr;

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

  const viewA = rows.length ? buildSecantView(first3, rangeA) : null;
  const viewB = rows.length ? buildSecantView(last3, rangeB) : null;

  const panZoomA = makePanZoomHandlers(rangeA, setRangeA, width, padL, padR);
  const panZoomB = makePanZoomHandlers(rangeB, setRangeB, width, padL, padR);

  const colorA = ["#DC2626", "#F59E0B", "#10B981"];
  const colorB = ["#7C3AED", "#0EA5E9", "#EF4444"];

  // =========================
  // Convergencia
  // =========================
  const lastIndex = rows.length - 1;
  const converged =
    rows.length > 0 &&
    Number.isFinite(tolNum) &&
    (Math.abs(rows[lastIndex]?.fNext) < tolNum || rows[lastIndex]?.error < tolNum);

  // ✅ fila seleccionada para overlay
  const rowView = rows.length ? rows[Math.max(0, Math.min(iterView, rows.length - 1))] : null;
  const cHistory = rows.map((r) => r.xNextRaw);

  return (
    <div className="bisection-grid">
      <div className="bisection-form">
        <h3>Método de la Posición Falsa I</h3>
        <p className="bisection-hint">
          Ingresa f(x) y un intervalo inicial [xₙ₋₁, xₙ] con cambio de signo. Acepta <code>ln(x)</code> y <code>sen(x)</code>.
        </p>

        <form onSubmit={handleCalculate}>
          <div className="bisection-form-row">
            <label>Ingrese la función f(x) =</label>
            <input type="text" value={fxInput} onChange={(e) => setFxInput(e.target.value)} />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese el valor xₙ₋₁ =</label>
            <input type="number" step="any" value={xPrevInput} onChange={(e) => setXPrevInput(e.target.value)} />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese el valor xₙ =</label>
            <input type="number" step="any" value={xCurrInput} onChange={(e) => setXCurrInput(e.target.value)} />
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
                    <th>f(xₙ₊₁)</th>
                    <th>f(xₙ₋₁)·f(xₙ₊₁)</th>
                    <th>Error</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row, idx) => {
                    const isLastOk = converged && idx === lastIndex;
                    const isSelected = idx === iterView;

                    return (
                      <tr key={row.n} style={isSelected ? { outline: "2px solid #93c5fd" } : undefined}>
                        <td>{row.n}</td>
                        <td>{formatNumber(row.xPrev)}</td>
                        <td>{formatNumber(row.xCurr)}</td>
                        <td className={isLastOk ? "cell-green" : ""}>{formatNumber(row.xNext)}</td>
                        <td>{formatNumber(row.fPrev)}</td>
                        <td>{formatNumber(row.fCurr)}</td>
                        <td>{formatNumber(row.fNext)}</td>
                        <td>{formatNumber(row.prod)}</td>
                        <td className={isLastOk ? "cell-red" : ""}>{formatNumber(row.error)}</td>
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

        {/* ✅ Gráfica de avance: secante + x_{n+1} + historial */}
        <div className="graph-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 className="graph-title">Aproximación gráfica a la raíz (secante + xₙ₊₁)</h4>
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

                {/* f(x) */}
                <path d={graphData.path} fill="none" stroke="#2563eb" strokeWidth="1.7" />

                {/* historial de x_{n+1} sobre eje x */}
                {cHistory.map((c, i) => {
                  if (!Number.isFinite(c)) return null;
                  const X = graphData.xTo(c);
                  const Y = graphData.xAxisY;
                  return <circle key={`hist-${i}`} cx={X} cy={Y} r="2.6" fill="#111827" opacity="0.6" />;
                })}

                {/* overlay de iteración seleccionada */}
                {rowView && (
                  <>
                    {/* puntos (xPrev,fPrev) y (xCurr,fCurr) */}
                    <circle cx={graphData.xTo(rowView.xPrevRaw)} cy={graphData.yTo(rowView.fPrevRaw)} r="4" fill="#f59e0b" />
                    <circle cx={graphData.xTo(rowView.xCurrRaw)} cy={graphData.yTo(rowView.fCurrRaw)} r="4" fill="#ef4444" />

                    {/* secante */}
                    <line
                      x1={graphData.xTo(rowView.xPrevRaw)}
                      y1={graphData.yTo(rowView.fPrevRaw)}
                      x2={graphData.xTo(rowView.xCurrRaw)}
                      y2={graphData.yTo(rowView.fCurrRaw)}
                      stroke="#ef4444"
                      strokeWidth="2"
                      opacity="0.85"
                    />

                    {/* línea vertical en xNext */}
                    <line
                      x1={graphData.xTo(rowView.xNextRaw)}
                      x2={graphData.xTo(rowView.xNextRaw)}
                      y1={padT}
                      y2={height - padB}
                      stroke="#10b981"
                      strokeWidth="1.6"
                      strokeDasharray="4 3"
                    />

                    {/* punto en (xNext,0) */}
                    <circle cx={graphData.xTo(rowView.xNextRaw)} cy={graphData.xAxisY} r="4.2" fill="#10b981" />

                    {/* etiqueta */}
                    <text x={graphData.xTo(rowView.xNextRaw) + 6} y={graphData.xAxisY - 8} fontSize="11" fill="#065f46">
                      xₙ₊₁={rowView.xNextRaw.toFixed(Math.min(6, getDecimals()))}
                    </text>
                  </>
                )}
              </svg>

              <p className="bisection-hint" style={{ marginTop: 6 }}>
                Rueda: zoom • Arrastrar: mover • Slider: ver secante por iteración • Puntitos: historial de xₙ₊₁ (aproximación a la raíz)
              </p>
            </>
          )}
        </div>

        {/* Primeras 3 / Últimas 3 secantes (como ya tenías) */}
        {rows.length > 0 && viewA && (
          <div className="graph-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 className="graph-title">Primeras 3 rectas secantes</h4>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button className="btn-download" onClick={() => zoomIn(rangeA, setRangeA)}>
                  Zoom +
                </button>
                <button className="btn-download btn-download-secondary" onClick={() => zoomOut(rangeA, setRangeA)}>
                  Zoom −
                </button>
                <button className="btn-secondary" onClick={() => setRangeA(autoRangeFor(first3))}>
                  Auto
                </button>
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

        {rows.length > 0 && viewB && (
          <div className="graph-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 className="graph-title">Últimas 3 rectas secantes</h4>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button className="btn-download" onClick={() => zoomIn(rangeB, setRangeB)}>
                  Zoom +
                </button>
                <button className="btn-download btn-download-secondary" onClick={() => zoomOut(rangeB, setRangeB)}>
                  Zoom −
                </button>
                <button className="btn-secondary" onClick={() => setRangeB(autoRangeFor(last3))}>
                  Auto
                </button>
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