// src/metodos/PosicionFalsa2.jsx
import { useState, useMemo } from "react";
import { create, all } from "mathjs";
import "./Biseccion.css"; // reutilizamos estilos

const math = create(all, {});

export default function PosicionFalsa2() {
  const [fxInput, setFxInput] = useState("x^5-7*x^2-1");
  const [xPrevInput, setXPrevInput] = useState("1"); // extremo izquierdo (a)
  const [xCurrInput, setXCurrInput] = useState("2"); // extremo derecho (b)
  const [tolInput, setTolInput] = useState("0.001");
  const [maxIterInput, setMaxIterInput] = useState("30");
  const [decimalsInput, setDecimalsInput] = useState("5");

  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // -------------------------
  // Utilidades
  // -------------------------
  const normalizeExpr = (expr) =>
    expr.trim().replace(/ln/gi, "log").replace(/sen/gi, "sin");

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
    return Number.isNaN(d) || d < 0 ? 6 : d;
  };

  const roundTo = (v) => {
    const d = getDecimals();
    const f = 10 ** d;
    return Math.round(v * f) / f;
  };

  const formatNumber = (value) => {
    const d = getDecimals();
    return Number.isFinite(value) ? value.toFixed(d) : "NaN";
  };

  // -------------------------
  // Cálculo (Posición Falsa 2)
  // - Mantiene el intervalo con cambio de signo.
  // - Error COMO EN TU IMAGEN: |x_{n+1} - x_n|
  //   donde para la 1a iteración x_n = b (xCurr).
  //   Luego x_n = aproximación previa (c_prev).
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

    let a = parseFloat(xPrevInput);
    let b = parseFloat(xCurrInput);
    const tol = parseFloat(tolInput);
    const maxIter = parseInt(maxIterInput, 10);

    if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(tol) || !Number.isFinite(maxIter)) {
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
    if (a === b) {
      setErrorMsg('Los valores iniciales no pueden ser iguales. Debe haber un intervalo [a, b].');
      return;
    }

    // asegurar a < b (solo para orden visual; el método funciona igual)
    if (a > b) {
      const tmp = a;
      a = b;
      b = tmp;
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

    let fa = evalF(a);
    let fb = evalF(b);

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
    let hadError = false;

    // para que la 1a fila dé 0.3 como tu imagen:
    // cPrev inicia en b, así error1 = |c1 - b|
    let cPrev = b;

    try {
      for (let n = 1; n <= maxIter; n++) {
        fa = evalF(a);
        fb = evalF(b);

        if (!Number.isFinite(fa) || !Number.isFinite(fb)) {
          setErrorMsg("No se pudo evaluar f(x) en alguna iteración.");
          hadError = true;
          break;
        }

        const denom = fb - fa;
        if (denom === 0) {
          setErrorMsg("Apareció f(b) - f(a) = 0. No se puede continuar (división entre cero).");
          hadError = true;
          break;
        }

        // Regula falsi: c = b - f(b)*(b-a)/(f(b)-f(a))
        let c = b - (fb * (b - a)) / denom;
        let fc = evalF(c);

        if (!Number.isFinite(fc)) {
          setErrorMsg("No se pudo evaluar f(x_{n+1}) en alguna iteración.");
          hadError = true;
          break;
        }

        // redondeo tipo “Excel” para que coincidan las tablas
        a = roundTo(a);
        b = roundTo(b);
        c = roundTo(c);
        fc = roundTo(fc);

        // ERROR como en tu programa: |x_{n+1} - x_n|
        // (x_n = cPrev; en la 1a iteración cPrev = b)
        const error = roundTo(Math.abs(c - cPrev));

        newRows.push({
          n,
          xPrev: a,
          xCurr: b,
          xNext: c,
          error
        });

        if (Math.abs(fc) < tol || error < tol) {
          found = true;
          break;
        }

        // Actualizar intervalo manteniendo cambio de signo
        // fa * fc < 0 => raíz en [a, c]  -> b = c
        // de lo contrario raíz en [c, b] -> a = c
        if (fa * fc < 0) {
          b = c;
          fb = fc;
        } else {
          a = c;
          fa = fc;
        }

        // para la próxima iteración, el “x_n” del error será la aproximación anterior
        cPrev = c;
      }
    } catch {
      setErrorMsg("Ocurrió un error inesperado durante las iteraciones.");
      hadError = true;
    }

    setRows(newRows);

    if (!newRows.length || hadError) return;

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

    const headers = ["n", "x_{n-1}", "x_n", "x_{n+1}", "Error"];
    const csvRows = [headers.join(",")];

    rows.forEach((row) => {
      const values = [
        row.n,
        formatNumber(row.xPrev),
        formatNumber(row.xCurr),
        formatNumber(row.xNext),
        formatNumber(row.error)
      ];
      csvRows.push(values.join(","));
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

  // -------------------------
  // Gráfica de f(x) (opcional, igual estilo que los otros)
  // -------------------------
  const graphData = useMemo(() => {
    const compiledF = buildCompiled(fxInput);
    if (!compiledF) {
      return { points: [], xMin: -5, xMax: 5, yMin: -1, yMax: 1, xTicks: [], yTicks: [] };
    }

    const evalF = (x) => {
      try {
        const r = compiledF.evaluate({ x });
        return Number.isFinite(r) ? r : NaN;
      } catch {
        return NaN;
      }
    };

    const x0 = parseFloat(xPrevInput);
    const x1 = parseFloat(xCurrInput);

    let xMin, xMax;
    if (Number.isFinite(x0) && Number.isFinite(x1)) {
      xMin = Math.min(x0, x1);
      xMax = Math.max(x0, x1);
      const span = Math.max(1e-6, xMax - xMin);
      const m = span * 0.2;
      xMin -= m;
      xMax += m;
    } else {
      xMin = -5;
      xMax = 5;
    }

    const steps = 140;
    const step = (xMax - xMin) / steps;
    const points = [];
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * step;
      const y = evalF(x);
      if (Number.isFinite(y)) points.push({ x, y });
    }

    if (!points.length) {
      return { points: [], xMin, xMax, yMin: -1, yMax: 1, xTicks: [], yTicks: [] };
    }

    const ys = points.map((p) => p.y);
    let yMin = Math.min(...ys);
    let yMax = Math.max(...ys);
    if (yMin === yMax) {
      yMin -= 1;
      yMax += 1;
    } else {
      const m = (yMax - yMin) * 0.2;
      yMin -= m;
      yMax += m;
    }

    const ticks = (min, max, count = 4) => {
      const out = [];
      for (let i = 0; i <= count; i++) out.push(min + (i * (max - min)) / count);
      return out;
    };

    return { points, xMin, xMax, yMin, yMax, xTicks: ticks(xMin, xMax, 4), yTicks: ticks(yMin, yMax, 4) };
  }, [fxInput, xPrevInput, xCurrInput, decimalsInput]);

  const lastRow = rows.length ? rows[rows.length - 1] : null;

  const width = 400;
  const height = 240;
  const paddingLeft = 46;
  const paddingRight = 10;
  const paddingTop = 10;
  const paddingBottom = 28;

  const xToSvg = (x) => {
    const { xMin, xMax } = graphData;
    const w = width - paddingLeft - paddingRight;
    if (xMax === xMin) return paddingLeft + w / 2;
    return paddingLeft + ((x - xMin) / (xMax - xMin)) * w;
  };

  const yToSvg = (y) => {
    const { yMin, yMax } = graphData;
    const h = height - paddingTop - paddingBottom;
    if (yMax === yMin) return paddingTop + h / 2;
    return paddingTop + (1 - (y - yMin) / (yMax - yMin)) * h;
  };

  const pathF =
    graphData.points.length > 0
      ? graphData.points
          .map((pt, idx) => `${idx === 0 ? "M" : "L"} ${xToSvg(pt.x)} ${yToSvg(pt.y)}`)
          .join(" ")
      : "";

  const xAxisY =
    graphData.yMin <= 0 && graphData.yMax >= 0 ? yToSvg(0) : yToSvg(graphData.yMin);

  const yAxisX =
    graphData.xMin <= 0 && graphData.xMax >= 0 ? xToSvg(0) : xToSvg(graphData.xMin);

  // -------------------------
  // Render
  // -------------------------
  return (
    <div className="bisection-grid">
      {/* Formulario */}
      <div className="bisection-form">
        <h3>Método de la Posición Falsa II</h3>
        <p className="bisection-hint">
          Ingresa f(x) y un intervalo inicial [xₙ₋₁, xₙ] con cambio de signo.
          Ejemplo: <code>x^5-7*x^2-1</code>, xₙ₋₁=1, xₙ=2. Acepta <code>ln(x)</code> y <code>sen(x)</code>.
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
            <button type="submit" className="btn-primary">CALCULAR</button>
            <button type="button" className="btn-secondary" onClick={handleClear}>BORRAR CELDAS</button>
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
              Ingresa los datos y presiona <strong>CALCULAR</strong> para ver las iteraciones.
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
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.n}>
                      <td>{row.n}</td>
                      <td>{formatNumber(row.xPrev)}</td>
                      <td>{formatNumber(row.xCurr)}</td>
                      <td>{formatNumber(row.xNext)}</td>
                      <td>{formatNumber(row.error)}</td>
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

        <div className="graph-card">
          <h4 className="graph-title">Gráfica de f(x)</h4>
          {graphData.points.length === 0 ? (
            <p className="bisection-hint">No se pudo generar la gráfica. Revisa la función y el intervalo.</p>
          ) : (
            <svg className="graph-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
              {/* sombrear intervalo actual (últimos a,b) */}
              {rows.length > 0 && (
                <rect
                  x={xToSvg(Math.min(rows[rows.length - 1].xPrev, rows[rows.length - 1].xCurr))}
                  y={paddingTop}
                  width={Math.abs(
                    xToSvg(rows[rows.length - 1].xCurr) - xToSvg(rows[rows.length - 1].xPrev)
                  )}
                  height={height - paddingTop - paddingBottom}
                  fill="#fee2e2"
                />
              )}

              {/* ejes */}
              <line x1={paddingLeft} x2={width - paddingRight} y1={xAxisY} y2={xAxisY} stroke="#9ca3af" strokeWidth="1" />
              <line x1={yAxisX} x2={yAxisX} y1={paddingTop} y2={height - paddingBottom} stroke="#9ca3af" strokeWidth="1" />

              {/* ticks X */}
              {graphData.xTicks.map((xt, idx) => (
                <g key={`xt-${idx}`}>
                  <line x1={xToSvg(xt)} x2={xToSvg(xt)} y1={xAxisY - 3} y2={xAxisY + 3} stroke="#9ca3af" strokeWidth="1" />
                  <text x={xToSvg(xt)} y={height - 6} fontSize="9" textAnchor="middle" fill="#4b5563">
                    {xt.toFixed(2)}
                  </text>
                </g>
              ))}

              {/* ticks Y */}
              {graphData.yTicks.map((yt, idx) => (
                <g key={`yt-${idx}`}>
                  <line x1={yAxisX - 3} x2={yAxisX + 3} y1={yToSvg(yt)} y2={yToSvg(yt)} stroke="#9ca3af" strokeWidth="1" />
                  <text x={paddingLeft - 6} y={yToSvg(yt) + 3} fontSize="9" textAnchor="end" fill="#4b5563">
                    {yt.toFixed(2)}
                  </text>
                </g>
              ))}

              {/* curva */}
              <path d={pathF} fill="none" stroke="#2563eb" strokeWidth="1.5" />

              {/* última aproximación */}
              {lastRow && (
                <line
                  x1={xToSvg(lastRow.xNext)}
                  x2={xToSvg(lastRow.xNext)}
                  y1={paddingTop}
                  y2={height - paddingBottom}
                  stroke="#ef4444"
                  strokeWidth="1.3"
                  strokeDasharray="4 3"
                />
              )}
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
