// src/metodos/Newton.jsx
import { useState, useMemo } from "react";
import { create, all } from "mathjs";
import "./Biseccion.css"; // reutilizamos estilos

const math = create(all, {});

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

  // -------------------------
  // Utilidades
  // -------------------------

  const normalizeExpr = (expr) =>
    expr
      .trim()
      .replace(/ln/gi, "log") // ln -> log
      .replace(/sen/gi, "sin"); // sen -> sin

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

  const roundTo = (value) => {
    const decimals = getDecimals();
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  };

  const formatNumber = (value) => {
    const decimals = getDecimals();
    return Number.isFinite(value) ? value.toFixed(decimals) : "NaN";
  };

  // -------------------------
  // Cálculo del método
  // -------------------------

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
      setErrorMsg("La tolerancia debe ser un número positivo.");
      return;
    }

    if (maxIter <= 0) {
      setErrorMsg("El número de iteraciones debe ser mayor que cero.");
      return;
    }

    // x0 también lo redondeamos al número de decimales, como en Excel
    x0 = roundTo(x0);

    const compiledF = buildCompiled(fxInput);
    const compiledDf = buildCompiled(dfxInput);

    if (!compiledF || !compiledDf) {
      setErrorMsg(
        "No se pudo interpretar f(x) o f'(x). Revisa la sintaxis. Ejemplos: 1-cos(x), sin(x), exp(-x)."
      );
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

    const evalDf = (x) => {
      try {
        const r = compiledDf.evaluate({ x });
        return Number.isFinite(r) ? r : NaN;
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
        // Evaluamos con xn (ya redondeado)
        const fx_raw = evalF(xn);
        const dfx_raw = evalDf(xn);

        if (!Number.isFinite(fx_raw) || !Number.isFinite(dfx_raw)) {
          setErrorMsg(
            "No se pudo evaluar f(x) o f'(x) en alguna iteración. Revisa las funciones y el dominio."
          );
          hadError = true;
          break;
        }

        // 🔹 Redondeamos f(xn) y f'(xn) al número de decimales
        const fxn = roundTo(fx_raw);
        const dfxn = roundTo(dfx_raw);

        if (dfxn === 0) {
          setErrorMsg(
            "En alguna iteración f'(xₙ) = 0. El método de Newton no puede continuar (división entre cero)."
          );
          hadError = true;
          break;
        }

        // 🔹 Calculamos x_{n+1} usando los valores redondeados
        const xNext_raw = xn - fxn / dfxn;
        const xNext = roundTo(xNext_raw);

        // 🔹 Error con valores redondeados (como tu Excel)
        const error = roundTo(Math.abs(xNext - xn));

        newRows.push({
          n,
          xn,
          fxn,
          dfxn,
          xNext,
          error
        });

        if (error < tol) {
          found = true;
          break;
        }

        // Siguiente iteración: usamos xNext ya redondeado
        xn = xNext;
      }
    } catch {
      setErrorMsg(
        "Ocurrió un error inesperado durante las iteraciones. Revisa los datos ingresados."
      );
      hadError = true;
    }

    setRows(newRows);

    if (newRows.length === 0 || hadError) return;

    const last = newRows[newRows.length - 1];

    if (found) {
      setMessage(
        `Se encontró una aproximación a la raíz: x ≈ ${formatNumber(last.xNext)}`
      );
    } else {
      setMessage(
        "Se alcanzó el número máximo de iteraciones sin cumplir la tolerancia."
      );
    }
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

  // -------------------------
  // Descarga tabla (CSV)
  // -------------------------

  const handleDownloadTable = () => {
    if (!rows.length) return;

    const headers = ["n", "xn", "f(xn)", "f'(xn)", "x_{n+1}", "Error"];
    const csvRows = [headers.join(",")];

    rows.forEach((row) => {
      const values = [
        row.n,
        formatNumber(row.xn),
        formatNumber(row.fxn),
        formatNumber(row.dfxn),
        formatNumber(row.xNext),
        formatNumber(row.error)
      ];
      csvRows.push(values.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "newton_iteraciones.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // -------------------------
  // Gráfica de f(x)
  // -------------------------

  const graphData = useMemo(() => {
    const compiledF = buildCompiled(fxInput);
    if (!compiledF) {
      return {
        points: [],
        xMin: -5,
        xMax: 5,
        yMin: -1,
        yMax: 1,
        xTicks: [],
        yTicks: []
      };
    }

    const evalF = (x) => {
      try {
        const r = compiledF.evaluate({ x });
        return Number.isFinite(r) ? r : NaN;
      } catch {
        return NaN;
      }
    };

    const x0 = parseFloat(x0Input);
    let xMin;
    let xMax;

    if (Number.isFinite(x0)) {
      const range = 2;
      xMin = x0 - range;
      xMax = x0 + range;
    } else {
      xMin = -5;
      xMax = 5;
    }

    const steps = 120;
    const step = (xMax - xMin) / steps;
    const points = [];

    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * step;
      const y = evalF(x);
      if (Number.isFinite(y)) {
        points.push({ x, y });
      }
    }

    if (!points.length) {
      return {
        points: [],
        xMin,
        xMax,
        yMin: -1,
        yMax: 1,
        xTicks: [],
        yTicks: []
      };
    }

    const ys = points.map((p) => p.y);
    let yMin = Math.min(...ys);
    let yMax = Math.max(...ys);
    if (yMin === yMax) {
      yMin -= 1;
      yMax += 1;
    } else {
      const margin = (yMax - yMin) * 0.2;
      yMin -= margin;
      yMax += margin;
    }

    const createTicks = (min, max, count = 4) => {
      const ticks = [];
      for (let i = 0; i <= count; i++) {
        ticks.push(min + (i * (max - min)) / count);
      }
      return ticks;
    };

    const xTicks = createTicks(xMin, xMax, 4);
    const yTicks = createTicks(yMin, yMax, 4);

    return { points, xMin, xMax, yMin, yMax, xTicks, yTicks };
  }, [fxInput, x0Input, decimalsInput]);

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
          .map((pt, idx) => {
            const x = xToSvg(pt.x);
            const y = yToSvg(pt.y);
            return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
          })
          .join(" ")
      : "";

  const xAxisY =
    graphData.yMin <= 0 && graphData.yMax >= 0
      ? yToSvg(0)
      : yToSvg(graphData.yMin);

  const yAxisX =
    graphData.xMin <= 0 && graphData.xMax >= 0
      ? xToSvg(0)
      : xToSvg(graphData.xMin);

  return (
    <div className="bisection-grid">
      {/* Columna: formulario */}
      <div className="bisection-form">
        <h3>Método de Newton-Raphson</h3>
        <p className="bisection-hint">
          Ingresa f(x) y su derivada f&apos;(x). Ejemplos:{" "}
          <code>1-cos(x)</code> y <code>sin(x)</code>,{" "}
          <code>x^3 - x - 1</code> y <code>3*x^2 - 1</code>. Acepta{" "}
          <code>ln(x)</code> y <code>sen(x)</code>.
        </p>

        <form onSubmit={handleCalculate}>
          <div className="bisection-form-row">
            <label>Ingrese la función f(x) =</label>
            <input
              type="text"
              value={fxInput}
              onChange={(e) => setFxInput(e.target.value)}
              placeholder="Ej: 1-cos(x)"
            />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese la función f&apos;(x) =</label>
            <input
              type="text"
              value={dfxInput}
              onChange={(e) => setDfxInput(e.target.value)}
              placeholder="Ej: sin(x)"
            />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese el valor x₀ =</label>
            <input
              type="number"
              step="any"
              value={x0Input}
              onChange={(e) => setX0Input(e.target.value)}
            />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese tolerancia o exactitud =</label>
            <input
              type="number"
              step="any"
              value={tolInput}
              onChange={(e) => setTolInput(e.target.value)}
            />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese número de iteraciones =</label>
            <input
              type="number"
              value={maxIterInput}
              onChange={(e) => setMaxIterInput(e.target.value)}
            />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese número de decimales =</label>
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
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClear}
            >
              BORRAR CELDAS
            </button>
          </div>
        </form>

        {message && <p className="bisection-message">{message}</p>}
        {errorMsg && <p className="bisection-error">{errorMsg}</p>}
      </div>

      {/* Columna: tabla + gráfica */}
      <div className="bisection-results">
        <div className="bisection-table-wrapper">
          <h4>Tabla de iteraciones</h4>
          {rows.length === 0 ? (
            <p className="bisection-hint">
              Ingresa los datos y presiona <strong>CALCULAR</strong> para ver
              las iteraciones.
            </p>
          ) : (
            <>
              <table className="bisection-table">
                <thead>
                  <tr>
                    <th>n</th>
                    <th>xₙ</th>
                    <th>f(xₙ)</th>
                    <th>f&apos;(xₙ)</th>
                    <th>xₙ₊₁</th>
                    <th>Error = |xₙ₊₁ - xₙ|</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.n}>
                      <td>{row.n}</td>
                      <td>{formatNumber(row.xn)}</td>
                      <td>{formatNumber(row.fxn)}</td>
                      <td>{formatNumber(row.dfxn)}</td>
                      <td>{formatNumber(row.xNext)}</td>
                      <td>{formatNumber(row.error)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="bisection-download">
                <button
                  type="button"
                  className="btn-download"
                  onClick={handleDownloadTable}
                >
                  Descargar tabla (CSV)
                </button>
              </div>
            </>
          )}
        </div>

        <div className="graph-card">
          <h4 className="graph-title">Gráfica de f(x)</h4>
          {graphData.points.length === 0 ? (
            <p className="bisection-hint">
              No se pudo generar la gráfica. Revisa la función f(x) y el valor
              inicial.
            </p>
          ) : (
            <svg
              className="graph-svg"
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="none"
            >
              {/* Eje X */}
              <line
                x1={paddingLeft}
                x2={width - paddingRight}
                y1={xAxisY}
                y2={xAxisY}
                stroke="#9ca3af"
                strokeWidth="1"
              />

              {/* Eje Y */}
              <line
                x1={yAxisX}
                x2={yAxisX}
                y1={paddingTop}
                y2={height - paddingBottom}
                stroke="#9ca3af"
                strokeWidth="1"
              />

              {/* Ticks X */}
              {graphData.xTicks.map((xt, idx) => (
                <g key={`xtick-${idx}`}>
                  <line
                    x1={xToSvg(xt)}
                    x2={xToSvg(xt)}
                    y1={xAxisY - 3}
                    y2={xAxisY + 3}
                    stroke="#9ca3af"
                    strokeWidth="1"
                  />
                  <text
                    x={xToSvg(xt)}
                    y={height - 6}
                    fontSize="9"
                    textAnchor="middle"
                    fill="#4b5563"
                  >
                    {xt.toFixed(2)}
                  </text>
                </g>
              ))}

              {/* Ticks Y */}
              {graphData.yTicks.map((yt, idx) => (
                <g key={`ytick-${idx}`}>
                  <line
                    x1={yAxisX - 3}
                    x2={yAxisX + 3}
                    y1={yToSvg(yt)}
                    y2={yToSvg(yt)}
                    stroke="#9ca3af"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingLeft - 6}
                    y={yToSvg(yt) + 3}
                    fontSize="9"
                    textAnchor="end"
                    fill="#4b5563"
                  >
                    {yt.toFixed(2)}
                  </text>
                </g>
              ))}

              {/* Curva f(x) */}
              <path
                d={pathF}
                fill="none"
                stroke="#2563eb"
                strokeWidth="1.5"
              />

              {/* Última aproximación */}
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
