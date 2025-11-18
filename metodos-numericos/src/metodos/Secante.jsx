// src/metodos/Secante.jsx
import { useState, useMemo } from "react";
import { create, all } from "mathjs";
import "./Biseccion.css"; // reutilizamos los mismos estilos

const math = create(all, {});

export default function Secante() {
  const [fxInput, setFxInput] = useState("3*ln(x-1)+2*cos(x-1)");
  const [xPrevInput, setXPrevInput] = useState("1.1");  // x_{n-1}
  const [xCurrInput, setXCurrInput] = useState("2");    // x_n
  const [tolInput, setTolInput] = useState("0.001");
  const [maxIterInput, setMaxIterInput] = useState("23");
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

    if (!fxInput.trim()) {
      setErrorMsg("Debes ingresar una expresión para f(x).");
      return;
    }

    let xPrev = parseFloat(xPrevInput);
    let xCurr = parseFloat(xCurrInput);
    const tol = parseFloat(tolInput);
    const maxIter = parseInt(maxIterInput, 10);

    if (
      !Number.isFinite(xPrev) ||
      !Number.isFinite(xCurr) ||
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
      setErrorMsg(
        "La función f(x) no se pudo interpretar. Revisa la sintaxis. Ejemplos: x^3 - x - 1, sin(x), exp(-x)."
      );
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

    const newRows = [];
    let found = false;
    let hadError = false;

    try {
      for (let n = 1; n <= maxIter; n++) {
        const fxPrev = evalF(xPrev);
        const fxCurr = evalF(xCurr);

        if (!Number.isFinite(fxPrev) || !Number.isFinite(fxCurr)) {
          setErrorMsg(
            "No se pudo evaluar f(x) en alguna iteración. Revisa la función y el dominio de x."
          );
          hadError = true;
          break;
        }

        const denom = fxCurr - fxPrev;
        if (denom === 0) {
          setErrorMsg(
            "En alguna iteración f(xₙ) - f(xₙ₋₁) = 0. El método de la secante no puede continuar (división entre cero)."
          );
          hadError = true;
          break;
        }

        const xNext = xCurr - fxCurr * (xCurr - xPrev) / denom;
        const error = Math.abs(xNext - xCurr);

        newRows.push({
          n,
          xPrev,
          xCurr,
          xNext,
          error
        });

        if (error < tol) {
          found = true;
          break;
        }

        // Avanzamos: x_{n-1} <- x_n,  x_n <- x_{n+1}
        xPrev = xCurr;
        xCurr = xNext;
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
        `Se encontró una aproximación a la solución: x ≈ ${formatNumber(
          last.xNext
        )}`
      );
    } else {
      setMessage(
        "Se alcanzó el número máximo de iteraciones sin cumplir la tolerancia."
      );
    }
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
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "secante_iteraciones.csv");
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

    const x0 = parseFloat(xPrevInput);
    const x1 = parseFloat(xCurrInput);

    let xMin;
    let xMax;

    if (Number.isFinite(x0) && Number.isFinite(x1)) {
      xMin = Math.min(x0, x1);
      xMax = Math.max(x0, x1);
      if (xMin === xMax) {
        xMin -= 2;
        xMax += 2;
      } else {
        const margin = (xMax - xMin) * 0.2;
        xMin -= margin;
        xMax += margin;
      }
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
        <h3>Método de la Secante</h3>
        <p className="bisection-hint">
          Ingresa f(x) y dos aproximaciones iniciales x₀ (xₙ₋₁) y x₁ (xₙ).{" "}
          Ejemplo: <code>3*ln(x-1)+2*cos(x-1)</code>, con x₀ = 1.1 y x₁ = 2.
          Acepta <code>ln(x)</code> y <code>sen(x)</code>.
        </p>

        <form onSubmit={handleCalculate}>
          <div className="bisection-form-row">
            <label>Ingrese la función f(x) =</label>
            <input
              type="text"
              value={fxInput}
              onChange={(e) => setFxInput(e.target.value)}
              placeholder="Ej: 3*ln(x-1)+2*cos(x-1)"
            />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese el valor xₙ₋₁ =</label>
            <input
              type="number"
              step="any"
              value={xPrevInput}
              onChange={(e) => setXPrevInput(e.target.value)}
            />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese el valor xₙ =</label>
            <input
              type="number"
              step="any"
              value={xCurrInput}
              onChange={(e) => setXCurrInput(e.target.value)}
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
                    <th>xₙ₋₁</th>
                    <th>xₙ</th>
                    <th>xₙ₊₁</th>
                    <th>Error = |xₙ₊₁ - xₙ|</th>
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
              No se pudo generar la gráfica. Revisa la función y los valores
              iniciales.
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

              {/* Última aproximación x_{n+1} */}
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
