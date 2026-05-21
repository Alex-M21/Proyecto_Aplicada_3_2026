// src/metodos/Steffensen.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { create, all } from "mathjs";
import "./Biseccion.css";

const math = create(all, {});

export default function Steffensen() {
  const [gInput, setGInput] = useState("(-1)*(ln(x)/ln(2))");
  const [p0Input, setP0Input] = useState("0.5");
  const [tolInput, setTolInput] = useState("0.001");
  const [maxIterInput, setMaxIterInput] = useState("15");
  const [decimalsInput, setDecimalsInput] = useState("5");

  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [iterView, setIterView] = useState(0);

  const [rangeMain, setRangeMain] = useState({ xMin: -2, xMax: 3 });
  const svgRef = useRef(null);

  const width = 620;
  const height = 270;
  const padL = 58;
  const padR = 18;
  const padT = 22;
  const padB = 38;

  const normalizeExpr = (expr) =>
    String(expr ?? "")
      .trim()
      .replace(/LN/gi, "log")
      .replace(/ln/gi, "log")
      .replace(/sen/gi, "sin");

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
    return Math.min(d, 12);
  };

  const formatNumber = (value) =>
    Number.isFinite(value) ? Number(value).toFixed(getDecimals()) : "NaN";

  const roundTo = (value) => {
    const d = getDecimals();
    const factor = 10 ** d;
    return Math.round(value * factor) / factor;
  };

  const tolNum = useMemo(() => {
    const t = parseFloat(tolInput);
    return Number.isFinite(t) ? t : NaN;
  }, [tolInput]);

  const compiledG = useMemo(() => buildCompiled(gInput), [gInput]);

  const evalG = (x) => {
    if (!compiledG) return NaN;

    try {
      const result = compiledG.evaluate({ x });
      return Number.isFinite(result) ? result : NaN;
    } catch {
      return NaN;
    }
  };

  const getBaseRange = () => {
    const p0 = parseFloat(p0Input);

    if (Number.isFinite(p0)) {
      return {
        xMin: p0 - 2,
        xMax: p0 + 2,
      };
    }

    return {
      xMin: -5,
      xMax: 5,
    };
  };

  useEffect(() => {
    setRangeMain(getBaseRange());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p0Input, gInput]);

  const clearResults = () => {
    setRows([]);
    setMessage("");
    setErrorMsg("");
    setIterView(0);
  };

  const handleCalculate = (e) => {
    e.preventDefault();

    clearResults();

    if (!gInput.trim()) {
      setErrorMsg("Debes ingresar una expresión para g(x).");
      return;
    }

    const compiled = buildCompiled(gInput);

    if (!compiled) {
      setErrorMsg(
        "La función g(x) no se pudo interpretar. Ejemplos válidos: (-1)*(ln(x)/ln(2)), (sin(x)+2*cos(x))/2, exp(-x)."
      );
      return;
    }

    const localEvalG = (x) => {
      try {
        const result = compiled.evaluate({ x });
        return Number.isFinite(result) ? result : NaN;
      } catch {
        return NaN;
      }
    };

    let p0 = parseFloat(p0Input);
    const tol = parseFloat(tolInput);
    const maxIter = parseInt(maxIterInput, 10);

    if (!Number.isFinite(p0) || !Number.isFinite(tol) || !Number.isFinite(maxIter)) {
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

    const newRows = [];
    let found = false;
    const EPS = 1e-15;

    for (let n = 1; n <= maxIter; n++) {
      const p0Raw = p0;
      const p1 = localEvalG(p0Raw);

      if (!Number.isFinite(p1)) {
        setErrorMsg("No se pudo evaluar g(p₀). Revisa el dominio de la función.");
        break;
      }

      const p2 = localEvalG(p1);

      if (!Number.isFinite(p2)) {
        setErrorMsg("No se pudo evaluar g(p₁). Revisa el dominio de la función.");
        break;
      }

      const denominator = p2 - 2 * p1 + p0Raw;

      if (!Number.isFinite(denominator) || Math.abs(denominator) < EPS) {
        setErrorMsg(
          "Apareció p₂ - 2p₁ + p₀ ≈ 0. Steffensen no puede continuar por división entre cero."
        );
        break;
      }

      const pNext = p0Raw - ((p1 - p0Raw) ** 2) / denominator;

      if (!Number.isFinite(pNext)) {
        setErrorMsg("No se pudo calcular pₙ₊₁. Revisa la función o el valor inicial.");
        break;
      }

      const error = Math.abs(pNext - p0Raw);

      newRows.push({
        n,
        p0Raw,
        p1Raw: p1,
        p2Raw: p2,
        pNextRaw: pNext,
        errorRaw: error,
        p0: roundTo(p0Raw),
        p1: roundTo(p1),
        p2: roundTo(p2),
        pNext: roundTo(pNext),
        error: roundTo(error),
      });

      if (error < tol || error === 0) {
        found = true;
        break;
      }

      p0 = pNext;
    }

    setRows(newRows);

    if (!newRows.length) return;

    setIterView(newRows.length - 1);

    const last = newRows[newRows.length - 1];

    setMessage(
      found
        ? `Se encontró una aproximación a la solución: p ≈ ${formatNumber(last.pNextRaw)}`
        : "Se alcanzó el número máximo de iteraciones sin cumplir la tolerancia."
    );
  };

  const handleClear = () => {
    setGInput("");
    setP0Input("");
    setTolInput("");
    setMaxIterInput("");
    setDecimalsInput("5");
    setRows([]);
    setMessage("");
    setErrorMsg("");
    setIterView(0);
    setRangeMain({ xMin: -5, xMax: 5 });
  };

  const quoteCSV = (value) => {
    const text = String(value ?? "");
    return `"${text.replaceAll('"', '""')}"`;
  };

  const downloadCSV = () => {
    if (!rows.length) return;

    const headers = [
      "Iteracion n",
      "p0",
      "p1 = g(p0)",
      "p2 = g(p1)",
      "p_n+1",
      "Error |p_n+1 - p0|",
    ];

    const csvRows = rows.map((row) => [
      row.n,
      formatNumber(row.p0Raw),
      formatNumber(row.p1Raw),
      formatNumber(row.p2Raw),
      formatNumber(row.pNextRaw),
      formatNumber(row.errorRaw),
    ]);

    const csv = [
      headers.map(quoteCSV).join(","),
      ...csvRows.map((row) => row.map(quoteCSV).join(",")),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "steffensen_iteraciones.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const downloadChartPNG = () => {
    if (!svgRef.current) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgRef.current);

    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });

    const url = URL.createObjectURL(svgBlob);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");

      canvas.width = 1000;
      canvas.height = 560;

      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");

      link.href = pngUrl;
      link.download = "grafica_steffensen.png";
      link.click();

      URL.revokeObjectURL(url);
    };

    image.src = url;
  };

  const buildTicks = (min, max, count = 5) => {
    if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return [];

    return Array.from(
      { length: count + 1 },
      (_, i) => min + (i * (max - min)) / count
    );
  };

  const toXY = (xMin, xMax, yMin, yMax) => {
    const xTo = (x) => padL + ((x - xMin) / (xMax - xMin)) * (width - padL - padR);

    const yTo = (y) =>
      padT + (1 - (y - yMin) / (yMax - yMin)) * (height - padT - padB);

    return { xTo, yTo };
  };

  const pathFromPts = (pts, xTo, yTo) => {
    if (!pts.length) return "";

    return pts
      .map((p, i) => `${i === 0 ? "M" : "L"} ${xTo(p.x)} ${yTo(p.y)}`)
      .join(" ");
  };

  const graphData = useMemo(() => {
    if (!compiledG) return null;

    const xMin = rangeMain.xMin;
    const xMax = rangeMain.xMax;

    if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMin === xMax) {
      return null;
    }

    const steps = 220;
    const step = (xMax - xMin) / steps;

    const ptsG = [];
    const ptsI = [];

    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * step;
      const yg = evalG(x);

      if (Number.isFinite(yg)) {
        ptsG.push({ x, y: yg });
      }

      ptsI.push({ x, y: x });
    }

    let yMin = Infinity;
    let yMax = -Infinity;

    [...ptsG, ...ptsI].forEach((p) => {
      yMin = Math.min(yMin, p.y);
      yMax = Math.max(yMax, p.y);
    });

    rows.forEach((row) => {
      [row.p0Raw, row.p1Raw, row.p2Raw, row.pNextRaw].forEach((value) => {
        if (Number.isFinite(value)) {
          yMin = Math.min(yMin, value);
          yMax = Math.max(yMax, value);
        }
      });
    });

    if (!Number.isFinite(yMin) || !Number.isFinite(yMax) || yMin === yMax) {
      yMin = -1;
      yMax = 1;
    } else {
      const margin = (yMax - yMin) * 0.15;
      yMin -= margin;
      yMax += margin;
    }

    const { xTo, yTo } = toXY(xMin, xMax, yMin, yMax);

    const xTicks = buildTicks(xMin, xMax);
    const yTicks = buildTicks(yMin, yMax);

    const xAxisY = yMin <= 0 && yMax >= 0 ? yTo(0) : yTo(yMin);
    const yAxisX = xMin <= 0 && xMax >= 0 ? xTo(0) : xTo(xMin);

    return {
      xMin,
      xMax,
      yMin,
      yMax,
      xTo,
      yTo,
      pathG: pathFromPts(ptsG, xTo, yTo),
      pathI: pathFromPts(ptsI, xTo, yTo),
      xTicks: xTicks.map((x) => ({ x, X: xTo(x) })),
      yTicks: yTicks.map((y) => ({ y, Y: yTo(y) })),
      xAxisY,
      yAxisX,
    };
  }, [compiledG, gInput, rangeMain.xMin, rangeMain.xMax, rows, decimalsInput]);

  const zoomInMain = () => {
    setRangeMain((prev) => {
      const center = (prev.xMin + prev.xMax) / 2;
      const span = (prev.xMax - prev.xMin) / 2 / 1.5;

      return {
        xMin: center - span,
        xMax: center + span,
      };
    });
  };

  const zoomOutMain = () => {
    setRangeMain((prev) => {
      const center = (prev.xMin + prev.xMax) / 2;
      const span = ((prev.xMax - prev.xMin) / 2) * 1.5;

      return {
        xMin: center - span,
        xMax: center + span,
      };
    });
  };

  const moveLeft = () => {
    setRangeMain((prev) => {
      const shift = (prev.xMax - prev.xMin) * 0.2;

      return {
        xMin: prev.xMin - shift,
        xMax: prev.xMax - shift,
      };
    });
  };

  const moveRight = () => {
    setRangeMain((prev) => {
      const shift = (prev.xMax - prev.xMin) * 0.2;

      return {
        xMin: prev.xMin + shift,
        xMax: prev.xMax + shift,
      };
    });
  };

  const resetGraph = () => {
    setRangeMain(getBaseRange());
  };

  const lastIndex = rows.length - 1;

  const converged =
    rows.length > 0 &&
    Number.isFinite(tolNum) &&
    (rows[lastIndex]?.errorRaw < tolNum || rows[lastIndex]?.errorRaw === 0);

  const finalRow = rows.length > 0 ? rows[lastIndex] : null;

  const rowView = rows.length
    ? rows[Math.max(0, Math.min(iterView, rows.length - 1))]
    : null;

  return (
    <div className="bisection-grid">
      <div className="bisection-form">
        <h3>Método de Steffensen</h3>

        <p className="bisection-hint">
          Ingresa <strong>g(x)</strong> y un valor inicial <strong>p₀</strong>.
          Acepta <code>ln(x)</code>, <code>sen(x)</code>, <code>sin(x)</code>,{" "}
          <code>cos(x)</code> y <code>exp(x)</code>.
          <br />
          Ejemplo: <code>(-1)*(ln(x)/ln(2))</code>
        </p>

        <form onSubmit={handleCalculate}>
          <div className="method-section">
            <h4>Datos de entrada</h4>

            <div className="bisection-form-row">
              <label>Función g(x)</label>

              <input
                type="text"
                value={gInput}
                onChange={(e) => {
                  setGInput(e.target.value);
                  clearResults();
                }}
                placeholder="Ejemplo: (-1)*(ln(x)/ln(2))"
              />
            </div>

            <div className="method-two-columns">
              <div className="bisection-form-row">
                <label>Valor inicial p₀</label>

                <input
                  type="number"
                  step="any"
                  value={p0Input}
                  onChange={(e) => {
                    setP0Input(e.target.value);
                    clearResults();
                  }}
                />
              </div>

              <div className="bisection-form-row">
                <label>Tolerancia</label>

                <input
                  type="number"
                  step="any"
                  value={tolInput}
                  onChange={(e) => {
                    setTolInput(e.target.value);
                    clearResults();
                  }}
                />
              </div>

              <div className="bisection-form-row">
                <label>Iteraciones</label>

                <input
                  type="number"
                  value={maxIterInput}
                  onChange={(e) => {
                    setMaxIterInput(e.target.value);
                    clearResults();
                  }}
                />
              </div>

              <div className="bisection-form-row">
                <label>Decimales</label>

                <input
                  type="number"
                  value={decimalsInput}
                  onChange={(e) => setDecimalsInput(e.target.value)}
                />
              </div>
            </div>
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

      <div className="bisection-results steffensen-right-panel">
        <div className="graph-card">
          <h4 className="graph-title">Respuesta final</h4>

          {!finalRow ? (
            <p className="bisection-hint">
              Aún no hay resultado. Completa los datos y presiona{" "}
              <strong>CALCULAR</strong>.
            </p>
          ) : (
            <div className="method-result-grid">
              <div className="mini-info-card">
                <div className="mini-info-card-title">Aproximación</div>
                <div className="mini-info-card-value">
                  p = {formatNumber(finalRow.pNextRaw)}
                </div>
              </div>

              <div className="mini-info-card">
                <div className="mini-info-card-title">Error final</div>
                <div className="mini-info-card-value">
                  {formatNumber(finalRow.errorRaw)}
                </div>
              </div>

              <div className="mini-info-card">
                <div className="mini-info-card-title">Iteraciones usadas</div>
                <div className="mini-info-card-value">{rows.length}</div>
              </div>

              <div className="mini-info-card">
                <div className="mini-info-card-title">Estado</div>
                <div className="mini-info-card-value">
                  {converged ? "Converge" : "Revisar"}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bisection-table-wrapper">
          <div className="table-header-actions">
            <h4>Tabla de iteraciones</h4>

            <button
              type="button"
              className="btn-export"
              onClick={downloadCSV}
              disabled={!rows.length}
            >
              Descargar CSV
            </button>
          </div>

          {!rows.length ? (
            <p className="bisection-hint">
              Ingresa los datos y presiona <strong>CALCULAR</strong>.
            </p>
          ) : (
            <div className="table-scroll">
              <table className="bisection-table">
                <thead>
                  <tr>
                    <th>n</th>
                    <th>p₀</th>
                    <th>p₁ = g(p₀)</th>
                    <th>p₂ = g(p₁)</th>
                    <th>pₙ₊₁</th>
                    <th>Error</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row, index) => {
                    const isLast = index === lastIndex && converged;
                    const isSelected = index === iterView;

                    return (
                      <tr
                        key={row.n}
                        style={
                          isSelected
                            ? {
                                outline: "2px solid #93c5fd",
                                outlineOffset: "-2px",
                              }
                            : undefined
                        }
                      >
                        <td>{row.n}</td>
                        <td>{formatNumber(row.p0Raw)}</td>
                        <td>{formatNumber(row.p1Raw)}</td>
                        <td>{formatNumber(row.p2Raw)}</td>
                        <td className={isLast ? "cell-green" : ""}>
                          {formatNumber(row.pNextRaw)}
                        </td>
                        <td className={isLast ? "cell-red" : ""}>
                          {formatNumber(row.errorRaw)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {converged && (
            <p className="bisection-message">
              SE ENCONTRÓ LA SOLUCIÓN porque{" "}
              {formatNumber(rows[lastIndex].errorRaw)} &lt; {tolInput}
            </p>
          )}
        </div>

        <div className="graph-card steffensen-graph-card">
          <div className="table-header-actions">
            <div>
              <h4 className="graph-title">Gráfica de g(x)</h4>

              {rowView && (
                <p className="bisection-hint steffensen-iteration-label">
                  Iteración: <strong>{rowView.n}</strong> &nbsp; | &nbsp;
                  p = <strong>{formatNumber(rowView.pNextRaw)}</strong>
                </p>
              )}
            </div>

            <div className="chart-actions">
              <button type="button" className="btn-export" onClick={zoomInMain}>
                Zoom +
              </button>

              <button type="button" className="btn-export" onClick={zoomOutMain}>
                Zoom -
              </button>

              <button type="button" className="btn-export" onClick={moveLeft}>
                ←
              </button>

              <button type="button" className="btn-export" onClick={moveRight}>
                →
              </button>

              <button type="button" className="btn-export" onClick={resetGraph}>
                Auto
              </button>

              <button
                type="button"
                className="btn-export"
                onClick={downloadChartPNG}
                disabled={!graphData}
              >
                PNG
              </button>
            </div>
          </div>

          {rows.length > 0 && (
            <input
              type="range"
              min="0"
              max={Math.max(0, rows.length - 1)}
              value={iterView}
              onChange={(e) => setIterView(parseInt(e.target.value, 10))}
              className="steffensen-slider"
            />
          )}

          {!graphData ? (
            <p className="bisection-hint">
              La gráfica aparecerá cuando la función g(x) sea válida.
            </p>
          ) : (
            <div className="interactive-chart-wrapper steffensen-chart-wrapper">
              <svg
                ref={svgRef}
                className="error-chart"
                viewBox={`0 0 ${width} ${height}`}
                role="img"
                aria-label="Gráfica del método de Steffensen"
              >
                <style>
                  {`
                    .chart-axis { stroke: #334155; stroke-width: 1.4; }
                    .chart-grid-line { stroke: #e2e8f0; stroke-width: 1; }
                    .chart-line { stroke: #2563eb; stroke-width: 2.4; }
                    .chart-line-secondary { stroke: #64748b; stroke-width: 2; stroke-dasharray: 5 4; }
                    .chart-point { fill: #111827; stroke: white; stroke-width: 1.5; }
                    .chart-eval-point { fill: #dc2626; stroke: white; stroke-width: 1.5; }
                    .chart-label { font-size: 9px; fill: #334155; }
                    .chart-axis-title { font-size: 11px; fill: #0f172a; font-weight: 700; }
                    .chart-title-text { font-size: 14px; fill: #111827; font-weight: 800; }
                  `}
                </style>

                <rect x="0" y="0" width={width} height={height} fill="white" />

                <text x={width / 2 - 72} y="16" className="chart-title-text">
                  Método de Steffensen
                </text>

                {graphData.xTicks.map((tick, i) => (
                  <g key={`x-${i}`}>
                    <line
                      x1={tick.X}
                      x2={tick.X}
                      y1={padT}
                      y2={height - padB}
                      className="chart-grid-line"
                    />

                    <text
                      x={tick.X}
                      y={height - 9}
                      textAnchor="middle"
                      className="chart-label"
                    >
                      {tick.x.toFixed(2)}
                    </text>
                  </g>
                ))}

                {graphData.yTicks.map((tick, i) => (
                  <g key={`y-${i}`}>
                    <line
                      x1={padL}
                      x2={width - padR}
                      y1={tick.Y}
                      y2={tick.Y}
                      className="chart-grid-line"
                    />

                    <text
                      x={padL - 7}
                      y={tick.Y + 3}
                      textAnchor="end"
                      className="chart-label"
                    >
                      {tick.y.toFixed(2)}
                    </text>
                  </g>
                ))}

                <line
                  x1={padL}
                  x2={width - padR}
                  y1={graphData.xAxisY}
                  y2={graphData.xAxisY}
                  className="chart-axis"
                />

                <line
                  x1={graphData.yAxisX}
                  x2={graphData.yAxisX}
                  y1={padT}
                  y2={height - padB}
                  className="chart-axis"
                />

                <text
                  x={(padL + width - padR) / 2}
                  y={height - 2}
                  textAnchor="middle"
                  className="chart-axis-title"
                >
                  x
                </text>

                <text
                  x={16}
                  y={(padT + height - padB) / 2}
                  textAnchor="middle"
                  className="chart-axis-title"
                  transform={`rotate(-90 16 ${(padT + height - padB) / 2})`}
                >
                  y
                </text>

                <defs>
                  <clipPath id="plot-area-steffensen">
                    <rect
                      x={padL}
                      y={padT}
                      width={width - padL - padR}
                      height={height - padT - padB}
                    />
                  </clipPath>
                </defs>

                <g clipPath="url(#plot-area-steffensen)">
                  {graphData.pathG && (
                    <path d={graphData.pathG} className="chart-line" fill="none" />
                  )}

                  {graphData.pathI && (
                    <path
                      d={graphData.pathI}
                      className="chart-line-secondary"
                      fill="none"
                    />
                  )}

                  {rows.map((row, index) => (
                    <circle
                      key={`point-${index}`}
                      cx={graphData.xTo(row.pNextRaw)}
                      cy={graphData.yTo(row.pNextRaw)}
                      r="4"
                      className={
                        index === iterView ? "chart-eval-point" : "chart-point"
                      }
                    >
                      <title>
                        Iteración {row.n}: p = {formatNumber(row.pNextRaw)}
                      </title>
                    </circle>
                  ))}
                </g>
              </svg>
            </div>
          )}

          <p className="bisection-hint steffensen-graph-note">
            Botones: zoom y desplazamiento. Slider: ver aproximación por iteración.
          </p>
        </div>
      </div>
    </div>
  );
}