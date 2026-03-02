  // src/metodos/PosicionFalsa2.jsx
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

export default function PosicionFalsa2() {
  const [fxInput, setFxInput] = useState("x^5-7*x^2-1");
  const [xPrevInput, setXPrevInput] = useState("1"); // a (puede venir invertido)
  const [xCurrInput, setXCurrInput] = useState("2"); // b (puede venir invertido)
  const [tolInput, setTolInput] = useState("0.001");
  const [maxIterInput, setMaxIterInput] = useState("30");
  const [decimalsInput, setDecimalsInput] = useState("5");

  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

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

  const roundTo = (v) => {
    const d = getDecimals();
    const f = 10 ** d;
    return Math.round(v * f) / f;
  };

  const formatNumber = (value) => (Number.isFinite(value) ? value.toFixed(getDecimals()) : "NaN");

  const tolNum = useMemo(() => {
    const t = parseFloat(tolInput);
    return Number.isFinite(t) ? t : NaN;
  }, [tolInput]);

  // -------------------------
  // POSICIÓN FALSA II (b SIEMPRE FIJO)
  // - Se permite ingresar el intervalo invertido: internamente se define
  //     a = min(input1,input2)
  //     b = max(input1,input2)   <-- ESTE b ES EL QUE QUEDA FIJO
  // - Para evitar "división entre 0" por redondeos:
  //   NO redondeamos a/b/c en el cálculo, solo al guardar en tabla.
  // -------------------------
  const handleCalculate = (e) => {
    e.preventDefault();
    setMessage("");
    setErrorMsg("");
    setRows([]);

    if (!fxInput.trim()) {
      setErrorMsg("Debes ingresar una expresión para f(x).");
      return;
    }

    const x1 = parseFloat(xPrevInput);
    const x2 = parseFloat(xCurrInput);
    const tol = parseFloat(tolInput);
    const maxIter = parseInt(maxIterInput, 10);

    if (!Number.isFinite(x1) || !Number.isFinite(x2) || !Number.isFinite(tol) || !Number.isFinite(maxIter)) {
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
    if (x1 === x2) {
      setErrorMsg("Los valores iniciales no pueden ser iguales. Debe haber un intervalo [a, b].");
      return;
    }

    const compiledF = buildCompiled(fxInput);
    if (!compiledF) {
      setErrorMsg("La función f(x) no se pudo interpretar. Revisa la sintaxis.");
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

    // ✅ b SIEMPRE FIJO = el mayor
    let a = Math.min(x1, x2);
    const b = Math.max(x1, x2);

    const fb = evalF(b);
    let fa = evalF(a);

    if (!Number.isFinite(fa) || !Number.isFinite(fb)) {
      setErrorMsg("No se pudo evaluar f(x) en los extremos iniciales. Revisa dominio/intervalo.");
      return;
    }

    if (fa * fb > 0) {
      setErrorMsg("f(a) y f(b) tienen el mismo signo. Se requiere cambio de signo en [a, b].");
      return;
    }

    const newRows = [];
    let found = false;
    let bad = false;

    // para tu error: |c - cPrev| con cPrev iniciando en b
    let cPrev = b;

    const EPS = 1e-15;

    try {
      for (let n = 1; n <= maxIter; n++) {
        fa = evalF(a);

        if (!Number.isFinite(fa)) {
          setErrorMsg("No se pudo evaluar f(a) en alguna iteración.");
          bad = true;
          break;
        }

        const denom = fb - fa;
        if (!Number.isFinite(denom) || Math.abs(denom) < EPS) {
          setErrorMsg("Apareció f(b) - f(a) ≈ 0 (división entre 0). Cambia el intervalo.");
          bad = true;
          break;
        }

        // Regula falsi con b fijo
        const c = b - (fb * (b - a)) / denom;
        const fc = evalF(c);

        if (!Number.isFinite(fc)) {
          setErrorMsg("No se pudo evaluar f(c) en alguna iteración. Revisa dominio.");
          bad = true;
          break;
        }

        const error = Math.abs(c - cPrev);

        // guardar (solo display redondeado)
        newRows.push({
          n,
          xPrev: roundTo(a),
          xCurr: roundTo(b), // fijo
          xNext: roundTo(c),
          fPrev: roundTo(fa),
          fCurr: roundTo(fb),
          fNext: roundTo(fc),
          error: roundTo(error),
        });

        if (Math.abs(fc) < tol || error < tol) {
          found = true;
          break;
        }

        // ✅ PF2: b NO cambia. Solo se mueve a.
        a = c;
        cPrev = c;
      }
    } catch {
      setErrorMsg("Ocurrió un error inesperado durante las iteraciones.");
      bad = true;
    }

    setRows(newRows);
    if (!newRows.length || bad) return;

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
    setMessage("");
    setErrorMsg("");
  };

  // -------------------------
  // Descarga tabla (CSV)
  // -------------------------
  const handleDownloadTable = () => {
    if (!rows.length) return;

    const headers = ["n", "x_{n-1}", "x_n (fijo)", "x_{n+1}", "f(x_{n-1})", "f(x_n)", "f(x_{n+1})", "Error"];
    const csvRows = [headers.join(",")];

    rows.forEach((row) => {
      csvRows.push(
        [
          row.n,
          formatNumber(row.xPrev),
          formatNumber(row.xCurr),
          formatNumber(row.xNext),
          formatNumber(row.fPrev),
          formatNumber(row.fCurr),
          formatNumber(row.fNext),
          formatNumber(row.error),
        ].join(",")
      );
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "posicion_falsa_2_iteraciones.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // =========================
  // Gráfica principal f(x) con rango interactivo
  // =========================
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

  const pathFromPts = (pts, xTo, yTo) =>
    pts.length ? pts.map((p, i) => `${i ? "L" : "M"} ${xTo(p.x)} ${yTo(p.y)}`).join(" ") : "";

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
      xTicks: xTicks.map((x) => ({ x, X: xTo(x) })),
      yTicks: yTicks.map((y) => ({ y, Y: yTo(y) })),
      xAxisY,
      yAxisX,
      path,
    };
  }, [fxInput, rangeMain.xMin, rangeMain.xMax, decimalsInput]);

  const panZoomMain = makePanZoomHandlers(rangeMain, setRangeMain, width, padL, padR);

  const lastIndex = rows.length - 1;
  const converged =
    rows.length > 0 &&
    Number.isFinite(tolNum) &&
    (Math.abs(rows[lastIndex]?.fNext) < tolNum || rows[lastIndex]?.error < tolNum);

  // -------------------------
  // Render
  // -------------------------
  return (
    <div className="bisection-grid">
      <div className="bisection-form">
        <h3>Método de la Posición Falsa II</h3>
        <p className="bisection-hint">
           En Posicion Falsa 2 el que queda fijo es <strong>b</strong> (el mayor de los dos valores). Puedes ingresar el intervalo en cualquier orden.
        </p>

        <form onSubmit={handleCalculate}>
          <div className="bisection-form-row">
            <label>Ingrese la función f(x) =</label>
            <input type="text" value={fxInput} onChange={(e) => setFxInput(e.target.value)} />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese el valor 1 (a o b) =</label>
            <input type="number" step="any" value={xPrevInput} onChange={(e) => setXPrevInput(e.target.value)} />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese el valor 2 (a o b) =</label>
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
                    <th>xₙ₋₁ (a)</th>
                    <th>xₙ (b fijo)</th>
                    <th>xₙ₊₁</th>
                    <th>f(a)</th>
                    <th>f(b)</th>
                    <th>f(xₙ₊₁)</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => {
                    const isLastOk = converged && idx === lastIndex;
                    return (
                      <tr key={r.n}>
                        <td>{r.n}</td>
                        <td>{formatNumber(r.xPrev)}</td>
                        <td>{formatNumber(r.xCurr)}</td>
                        <td className={isLastOk ? "cell-green" : ""}>{formatNumber(r.xNext)}</td>
                        <td>{formatNumber(r.fPrev)}</td>
                        <td>{formatNumber(r.fCurr)}</td>
                        <td>{formatNumber(r.fNext)}</td>
                        <td className={isLastOk ? "cell-red" : ""}>{formatNumber(r.error)}</td>
                      </tr>
                    );
                  })}
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

          {!graphData ? (
            <p className="bisection-hint">No se pudo graficar f(x).</p>
          ) : (
            <>
              <svg className="graph-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" {...panZoomMain} style={{ touchAction: "none" }}>
                {graphData.xTicks.map((t, i) => (
                  <line key={`gx${i}`} x1={t.X} x2={t.X} y1={padT} y2={height - padB} stroke="#e5e7eb" />
                ))}
                {graphData.yTicks.map((t, i) => (
                  <line key={`gy${i}`} x1={padL} x2={width - padR} y1={t.Y} y2={t.Y} stroke="#e5e7eb" />
                ))}
                <line x1={padL} x2={width - padR} y1={graphData.xAxisY} y2={graphData.xAxisY} stroke="#9ca3af" />
                <line x1={graphData.yAxisX} x2={graphData.yAxisX} y1={padT} y2={height - padB} stroke="#9ca3af" />
                <path d={graphData.path} fill="none" stroke="#2563eb" strokeWidth="1.7" />
              </svg>

              <p className="bisection-hint" style={{ marginTop: 6 }}>
                Rueda: zoom • Arrastrar: mover • Auto: regresa al rango inicial
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}