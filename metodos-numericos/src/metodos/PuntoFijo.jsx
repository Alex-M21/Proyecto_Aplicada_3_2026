// src/metodos/PuntoFijo.jsx
import { useState, useMemo } from "react";
import { create, all } from "mathjs";
import "./Biseccion.css"; // reutilizamos estilos

const math = create(all, {});

export default function PuntoFijo() {
  const [gInput, setGInput] = useState("(sin(x)+2*cos(x))/2");
  const [x0Input, setX0Input] = useState("0.6");
  const [tolInput, setTolInput] = useState("0.003");
  const [maxIterInput, setMaxIterInput] = useState("10");
  const [decimalsInput, setDecimalsInput] = useState("5");

  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // -------------------------
  // Utilidades
  // -------------------------

  const buildCompiled = (expr) => {
    const trimmed = expr.trim();
    if (!trimmed) return null;

    const normalized = trimmed
      .replace(/ln/gi, "log") // permitir ln(x)
      .replace(/sen/gi, "sin"); // permitir sen(x)

    try {
      return math.compile(normalized);
    } catch {
      return null;
    }
  };

  const formatNumber = (value) => {
    const d = parseInt(decimalsInput, 10);
    const decimals = Number.isNaN(d) ? 6 : d;
    return Number.isFinite(value) ? value.toFixed(decimals) : "NaN";
  };

  // -------------------------
  // Derivada g'(x) y evaluación en x0
  // -------------------------

  const derivativeInfo = useMemo(() => {
    const trimmed = gInput.trim();
    if (!trimmed) {
      return { expr: null, valueAtX0: null };
    }

    const normalized = trimmed
      .replace(/ln/gi, "log")
      .replace(/sen/gi, "sin");

    try {
      const node = math.parse(normalized);
      const derNode = math.derivative(node, "x");
      const derExpr = derNode.toString(); // g'(x) como texto
      const compiledDer = derNode.compile();

      const x0 = parseFloat(x0Input);
      let valueAtX0 = null;

      if (Number.isFinite(x0)) {
        try {
          const v = compiledDer.evaluate({ x: x0 });
          valueAtX0 = Number.isFinite(v) ? v : null;
        } catch {
          valueAtX0 = null;
        }
      }

      return { expr: derExpr, valueAtX0 };
    } catch {
      return { expr: null, valueAtX0: null };
    }
  }, [gInput, x0Input]);

  // -------------------------
  // Cálculo del método
  // -------------------------

  const handleCalculate = (e) => {
    e.preventDefault();
    setMessage("");
    setErrorMsg("");
    setRows([]);

    if (!gInput.trim()) {
      setErrorMsg("Debes ingresar una expresión para g(x).");
      return;
    }

    const x0 = parseFloat(x0Input);
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

    const compiled = buildCompiled(gInput);
    if (!compiled) {
      setErrorMsg(
        "La función g(x) no se pudo interpretar. Revisa la sintaxis. Ejemplos: (sin(x)+2*cos(x))/2, exp(-x), x^2/(1+x)."
      );
      return;
    }

    const evalG = (x) => {
      try {
        const res = compiled.evaluate({ x });
        return Number.isFinite(res) ? res : NaN;
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
        const gxn = evalG(xn);

        if (!Number.isFinite(gxn)) {
          setErrorMsg(
            "No se pudo evaluar g(x) en alguna iteración. Revisa la función y el dominio de la variable."
          );
          hadError = true;
          break;
        }

        const error = Math.abs(gxn - xn); // |g(xn) - xn|

        newRows.push({
          n,
          xn,
          gxn,
          error
        });

        if (error < tol) {
          found = true;
          break;
        }

        xn = gxn; // siguiente iteración
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
        `Se encontró una aproximación al punto fijo: x ≈ ${formatNumber(last.gxn)}`
      );
    } else {
      setMessage(
        "Se alcanzó el número máximo de iteraciones sin cumplir la tolerancia."
      );
    }
  };

  const handleClear = () => {
    setGInput("");
    setX0Input("");
    setTolInput("");
    setMaxIterInput("");
    setDecimalsInput("5");
    setRows([]);
    setMessage("");
    setErrorMsg("");
  };

  // -------------------------
  // Datos para la gráfica g(x) y y=x
  // -------------------------

  const graphData = useMemo(() => {
    const compiled = buildCompiled(gInput);
    if (!compiled) {
      return {
        gPoints: [],
        diagPoints: [],
        xMin: -5,
        xMax: 5,
        yMin: -1,
        yMax: 1,
        xTicks: [],
        yTicks: []
      };
    }

    const evalG = (x) => {
      try {
        const res = compiled.evaluate({ x });
        return Number.isFinite(res) ? res : NaN;
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

    const gPoints = [];
    const diagPoints = [];

    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * step;
      const gx = evalG(x);
      if (Number.isFinite(gx)) {
        gPoints.push({ x, y: gx });
      }
      diagPoints.push({ x, y: x }); // recta y = x
    }

    if (gPoints.length === 0 && diagPoints.length === 0) {
      return {
        gPoints: [],
        diagPoints: [],
        xMin,
        xMax,
        yMin: -1,
        yMax: 1,
        xTicks: [],
        yTicks: []
      };
    }

    const ys = [
      ...gPoints.map((p) => p.y),
      ...diagPoints.map((p) => p.y)
    ];
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

    return { gPoints, diagPoints, xMin, xMax, yMin, yMax, xTicks, yTicks };
  }, [gInput, x0Input, decimalsInput]);

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

  const pathG =
    graphData.gPoints.length > 0
      ? graphData.gPoints
          .map((pt, idx) => {
            const x = xToSvg(pt.x);
            const y = yToSvg(pt.y);
            return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
          })
          .join(" ")
      : "";

  const pathDiag =
    graphData.diagPoints.length > 0
      ? graphData.diagPoints
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

  // -------------------------
  // Render
  // -------------------------

  return (
    <div className="bisection-grid">
      {/* Columna: formulario + análisis de g'(x) */}
      <div className="bisection-form">
        <h3>Método de Punto Fijo</h3>
        <p className="bisection-hint">
          Ingresa g(x) para resolver f(x)=0 reescrita como x=g(x).{" "}
          Ejemplos: <code>(sin(x)+2*cos(x))/2</code>, <code>exp(-x)</code>,{" "}
          <code>(x^2+1)/3</code>. También se aceptan <code>ln(x)</code> y{" "}
          <code>sen(x)</code>.
        </p>

        <form onSubmit={handleCalculate}>
          <div className="bisection-form-row">
            <label>Ingrese la función g(x) =</label>
            <input
              type="text"
              value={gInput}
              onChange={(e) => setGInput(e.target.value)}
              placeholder="Ej: (sin(x)+2*cos(x))/2"
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

        {/* Panel de derivada g'(x) y criterio de convergencia */}
        <div className="graph-card" style={{ marginTop: "1rem" }}>
          <h4 className="graph-title">Análisis de convergencia</h4>
          {!derivativeInfo.expr ? (
            <p className="bisection-hint">
              No se pudo obtener la derivada de g(x). Revisa la expresión.
            </p>
          ) : (
            <>
              <p>
                <strong>g&apos;(x) = </strong>
                <code>{derivativeInfo.expr}</code>
              </p>
              {derivativeInfo.valueAtX0 == null || !Number.isFinite(derivativeInfo.valueAtX0) ? (
                <p className="bisection-hint">
                  No se pudo evaluar g&apos;(x₀). Asegúrate de que x₀ sea un número válido y
                  que g(x) esté bien definida en ese punto.
                </p>
              ) : (
                <>
                  <p>
                    <strong>g&apos;(x₀)</strong> con x₀ ={" "}
                    <code>{x0Input || "?"}</code> es aproximadamente{" "}
                    <code>{formatNumber(derivativeInfo.valueAtX0)}</code>.
                  </p>
                  <p className="bisection-hint">
                    Criterio local de convergencia: se desea que{" "}
                    <strong>|g&apos;(x₀)| &lt; 1</strong>.  
                    Mientras más cercano a 0, mejor comportamiento del método.
                  </p>
                  {Math.abs(derivativeInfo.valueAtX0) < 1 ? (
                    <p className="bisection-message">
                      |g&apos;(x₀)| &lt; 1 ⇒ buena indicación de convergencia cerca de este
                      punto.
                    </p>
                  ) : (
                    <p className="bisection-error">
                      |g&apos;(x₀)| ≥ 1 ⇒ es posible que el método no converja desde este
                      valor inicial. Considera otra forma de g(x) o cambiar x₀.
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </div>

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
            <table className="bisection-table">
              <thead>
                <tr>
                  <th>n</th>
                  <th>xₙ</th>
                  <th>g(xₙ)</th>
                  <th>Error = |g(xₙ) - xₙ|</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.n}>
                    <td>{row.n}</td>
                    <td>{formatNumber(row.xn)}</td>
                    <td>{formatNumber(row.gxn)}</td>
                    <td>{formatNumber(row.error)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="graph-card">
          <h4 className="graph-title">Gráfica de g(x) y recta y = x</h4>
          {graphData.gPoints.length === 0 ? (
            <p className="bisection-hint">
              No se pudo generar la gráfica. Revisa la función g(x) y el valor
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

              {/* Ticks y etiquetas en X */}
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

              {/* Ticks y etiquetas en Y */}
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

              {/* Recta y = x */}
              <path
                d={pathDiag}
                fill="none"
                stroke="#9ca3af"
                strokeWidth="1"
                strokeDasharray="4 3"
              />

              {/* Curva g(x) */}
              <path
                d={pathG}
                fill="none"
                stroke="#2563eb"
                strokeWidth="1.5"
              />

              {/* Último punto (xₙ, g(xₙ)) */}
              {lastRow && (
                <circle
                  cx={xToSvg(lastRow.xn)}
                  cy={yToSvg(lastRow.gxn)}
                  r={4}
                  fill="#ef4444"
                />
              )}
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
