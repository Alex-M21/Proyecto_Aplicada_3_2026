// src/metodos/Neville.jsx
import { useMemo, useState } from "react";
import "./Biseccion.css";

export default function Neville() {
  const [xEvalInput, setXEvalInput] = useState("8");
  const [nInput, setNInput] = useState("4");
  const [decimalsInput, setDecimalsInput] = useState("4");

  const [points, setPoints] = useState([
    { x: "4", y: "5" },
    { x: "6", y: "7" },
    { x: "12", y: "23" },
    { x: "14", y: "56" },
  ]);

  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [table, setTable] = useState(null);
  const [result, setResult] = useState(null);

  const getDecimals = () => {
    const d = parseInt(decimalsInput, 10);
    return Number.isNaN(d) || d < 0 ? 6 : d;
  };

  const fmt = (v) => {
    const d = getDecimals();
    return Number.isFinite(v) ? Number(v).toFixed(d) : "NaN";
  };

  const parseNum = (s) => {
    const v = parseFloat(String(s ?? "").replace(",", ".").trim());
    return Number.isFinite(v) ? v : NaN;
  };

  const clampInt = (v, min, max) => Math.max(min, Math.min(max, v));

  const setNPoints = (newN) => {
    const n = clampInt(newN, 2, 12);
    setNInput(String(n));
    setPoints((prev) => {
      const copy = [...prev];
      if (copy.length < n) {
        for (let i = copy.length; i < n; i++) copy.push({ x: "", y: "" });
      } else if (copy.length > n) {
        copy.length = n;
      }
      return copy;
    });
  };

  const updatePoint = (idx, key, value) => {
    setPoints((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [key]: value };
      return copy;
    });
  };

  const computeNevilleTable = (xs, ys, xEval) => {
    const n = xs.length;
    const Q = Array.from({ length: n }, () => Array(n).fill(null));

    for (let i = 0; i < n; i++) Q[i][0] = ys[i];

    for (let j = 1; j < n; j++) {
      for (let i = j; i < n; i++) {
        const xi = xs[i];
        const xij = xs[i - j];
        const denom = xi - xij;
        if (denom === 0) return { Q: null, result: NaN };

        const a = (xEval - xij) * Q[i][j - 1];
        const b = (xEval - xi) * Q[i - 1][j - 1];
        Q[i][j] = (a - b) / denom;
      }
    }

    return { Q, result: Q[n - 1][n - 1] };
  };

  const nevilleEval = (xs, ys, xEval) => {
    const n = xs.length;
    const Q = Array.from({ length: n }, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) Q[i][0] = ys[i];

    for (let j = 1; j < n; j++) {
      for (let i = j; i < n; i++) {
        const xi = xs[i];
        const xij = xs[i - j];
        const denom = xi - xij;
        if (denom === 0) return NaN;

        Q[i][j] =
          ((xEval - xij) * Q[i][j - 1] - (xEval - xi) * Q[i - 1][j - 1]) / denom;
      }
    }

    return Q[n - 1][n - 1];
  };

  const handleCalculate = (e) => {
    e.preventDefault();
    setMessage("");
    setErrorMsg("");
    setTable(null);
    setResult(null);

    const n = clampInt(parseInt(nInput, 10), 2, 12);
    const xEval = parseNum(xEvalInput);

    if (!Number.isFinite(n)) {
      setErrorMsg("Ingresa un número de puntos válido.");
      return;
    }

    if (!Number.isFinite(xEval)) {
      setErrorMsg("Ingresa un valor válido para el dato a interpolar.");
      return;
    }

    const xs = [];
    const ys = [];

    for (let i = 0; i < n; i++) {
      const xi = parseNum(points[i]?.x);
      const yi = parseNum(points[i]?.y);

      if (!Number.isFinite(xi) || !Number.isFinite(yi)) {
        setErrorMsg("Todos los valores de la tabla de puntos deben ser numéricos.");
        return;
      }

      xs.push(xi);
      ys.push(yi);
    }

    const setX = new Set(xs.map(String));
    if (setX.size !== xs.length) {
      setErrorMsg("Hay valores de x repetidos. Los valores de x deben ser distintos.");
      return;
    }

    const { Q, result: r } = computeNevilleTable(xs, ys, xEval);
    if (!Q || !Number.isFinite(r)) {
      setErrorMsg("No se pudo calcular el método de Neville.");
      return;
    }

    setTable(Q);
    setResult(r);
    setMessage(`Se evaluó correctamente el polinomio interpolante en x = ${fmt(xEval)}.`);
  };

  const handleClear = () => {
    setXEvalInput("");
    setNInput("4");
    setDecimalsInput("4");
    setPoints([
      { x: "", y: "" },
      { x: "", y: "" },
      { x: "", y: "" },
      { x: "", y: "" },
    ]);
    setTable(null);
    setResult(null);
    setMessage("");
    setErrorMsg("");
  };

  const graph = useMemo(() => {
    const n = clampInt(parseInt(nInput, 10), 2, 12);
    const xEval = parseNum(xEvalInput);

    const xs = [];
    const ys = [];

    for (let i = 0; i < n; i++) {
      const xi = parseNum(points[i]?.x);
      const yi = parseNum(points[i]?.y);
      if (!Number.isFinite(xi) || !Number.isFinite(yi)) {
        return {
          ok: false,
          pts: [],
          curve: [],
          xMin: -1,
          xMax: 1,
          yMin: -1,
          yMax: 1,
          xEval: NaN,
          yEval: NaN,
          xTicks: [],
          yTicks: [],
        };
      }
      xs.push(xi);
      ys.push(yi);
    }

    if (new Set(xs.map(String)).size !== xs.length) {
      return {
        ok: false,
        pts: [],
        curve: [],
        xMin: -1,
        xMax: 1,
        yMin: -1,
        yMax: 1,
        xEval: NaN,
        yEval: NaN,
        xTicks: [],
        yTicks: [],
      };
    }

    let xMin = Math.min(...xs);
    let xMax = Math.max(...xs);

    if (xMin === xMax) {
      xMin -= 1;
      xMax += 1;
    } else {
      const m = (xMax - xMin) * 0.15;
      xMin -= m;
      xMax += m;
    }

    const curve = [];
    const steps = 180;
    const step = (xMax - xMin) / steps;

    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * step;
      const y = nevilleEval(xs, ys, x);
      if (Number.isFinite(y)) curve.push({ x, y });
    }

    const yEval = Number.isFinite(xEval) ? nevilleEval(xs, ys, xEval) : NaN;

    const allY = [...ys, ...curve.map((p) => p.y), yEval].filter(Number.isFinite);
    let yMin = Math.min(...allY);
    let yMax = Math.max(...allY);

    if (yMin === yMax) {
      yMin -= 1;
      yMax += 1;
    } else {
      const m = (yMax - yMin) * 0.15;
      yMin -= m;
      yMax += m;
    }

    const buildTicks = (min, max, k = 5) => {
      const arr = [];
      for (let i = 0; i <= k; i++) arr.push(min + (i * (max - min)) / k);
      return arr;
    };

    return {
      ok: true,
      pts: xs.map((x, i) => ({ x, y: ys[i] })),
      curve,
      xMin,
      xMax,
      yMin,
      yMax,
      xEval: Number.isFinite(xEval) ? xEval : NaN,
      yEval,
      xTicks: buildTicks(xMin, xMax, 5),
      yTicks: buildTicks(yMin, yMax, 5),
    };
  }, [points, nInput, xEvalInput]);

  const width = 620;
  const height = 320;
  const paddingLeft = 56;
  const paddingRight = 12;
  const paddingTop = 14;
  const paddingBottom = 38;

  const xToSvg = (x) => {
    const w = width - paddingLeft - paddingRight;
    const { xMin, xMax } = graph;
    if (xMax === xMin) return paddingLeft + w / 2;
    return paddingLeft + ((x - xMin) / (xMax - xMin)) * w;
  };

  const yToSvg = (y) => {
    const h = height - paddingTop - paddingBottom;
    const { yMin, yMax } = graph;
    if (yMax === yMin) return paddingTop + h / 2;
    return paddingTop + (1 - (y - yMin) / (yMax - yMin)) * h;
  };

  const curvePath =
    graph.ok && graph.curve.length
      ? graph.curve
          .map((p, i) => `${i === 0 ? "M" : "L"} ${xToSvg(p.x)} ${yToSvg(p.y)}`)
          .join(" ")
      : "";

  const xAxisY =
    graph.ok && graph.yMin <= 0 && graph.yMax >= 0 ? yToSvg(0) : yToSvg(graph.yMin);

  const yAxisX =
    graph.ok && graph.xMin <= 0 && graph.xMax >= 0 ? xToSvg(0) : xToSvg(graph.xMin);

  const n = clampInt(parseInt(nInput, 10) || 4, 2, 12);
  const lastCellIsGreen = table && result != null;

  const sectionCard = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 16,
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  };

  const labelStyle = {
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 6,
    display: "block",
  };

  return (
    <div
      className="bisection-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "1.02fr 1.25fr",
        gap: 20,
        alignItems: "start",
      }}
    >
      <div className="bisection-form" style={{ display: "grid", gap: 16 }}>
        <div style={sectionCard}>
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>Método de Neville</h3>
          <p className="bisection-hint" style={{ margin: 0 }}>
            Ingresa el valor de <strong>x</strong> a interpolar y los puntos conocidos.
            El método construye una tabla triangular y el resultado final aparece en la última celda.
          </p>
        </div>

        <form onSubmit={handleCalculate} style={{ display: "grid", gap: 16 }}>
          <div style={sectionCard}>
            <h4 style={{ marginTop: 0 }}>1. Configuración</h4>

            <div className="bisection-form-row" style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Valor de x a interpolar</label>
              <input
                type="number"
                step="any"
                value={xEvalInput}
                onChange={(e) => setXEvalInput(e.target.value)}
                placeholder="Ejemplo: 8"
              />
            </div>

            <div className="bisection-form-row" style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Número de puntos</label>
              <input
                type="number"
                min={2}
                max={12}
                value={nInput}
                onChange={(e) => setNPoints(parseInt(e.target.value || "0", 10))}
              />
              <small style={{ color: "#6b7280" }}>
                Puedes trabajar entre <strong>2</strong> y <strong>12</strong> puntos.
              </small>
            </div>

            <div className="bisection-form-row">
              <label style={labelStyle}>Número de decimales</label>
              <input
                type="number"
                min={0}
                value={decimalsInput}
                onChange={(e) => setDecimalsInput(e.target.value)}
              />
            </div>
          </div>

          <div style={sectionCard}>
            <h4 style={{ marginTop: 0, marginBottom: 12 }}>2. Tabla de puntos</h4>

            <div style={{ display: "grid", gap: 10 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 1fr 1fr",
                  gap: 10,
                  alignItems: "center",
                  padding: "0 2px",
                }}
              >
                <div style={{ fontWeight: 700, color: "#374151" }}>Punto</div>
                <div style={{ fontWeight: 700, color: "#374151" }}>x</div>
                <div style={{ fontWeight: 700, color: "#374151" }}>y</div>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 10,
                  maxHeight: "340px",
                  overflowY: "auto",
                  paddingRight: 4,
                }}
              >
                {Array.from({ length: n }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "80px 1fr 1fr",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        padding: "10px 12px",
                        background: "#f3f4f6",
                        borderRadius: 10,
                        fontWeight: 700,
                        textAlign: "center",
                        color: "#374151",
                      }}
                    >
                      P{i + 1}
                    </div>

                    <input
                      type="number"
                      step="any"
                      value={points[i]?.x ?? ""}
                      onChange={(e) => updatePoint(i, "x", e.target.value)}
                      placeholder={`x${i + 1}`}
                      style={{ width: "100%" }}
                    />

                    <input
                      type="number"
                      step="any"
                      value={points[i]?.y ?? ""}
                      onChange={(e) => updatePoint(i, "y", e.target.value)}
                      placeholder={`y${i + 1}`}
                      style={{ width: "100%" }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bisection-buttons" style={{ display: "flex", gap: 10 }}>
            <button type="submit" className="btn-primary">CALCULAR</button>
            <button type="button" className="btn-secondary" onClick={handleClear}>
              LIMPIAR
            </button>
          </div>
        </form>

        {errorMsg && (
          <div
            className="bisection-error"
            style={{
              ...sectionCard,
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#b91c1c",
            }}
          >
            <strong>Error:</strong> {errorMsg}
          </div>
        )}

        {message && !errorMsg && (
          <div
            className="bisection-message"
            style={{
              ...sectionCard,
              border: "1px solid #bbf7d0",
              background: "#f0fdf4",
              color: "#166534",
            }}
          >
            {message}
          </div>
        )}
      </div>

      <div className="bisection-results" style={{ display: "grid", gap: 16 }}>
        <div
          style={{
            background: "linear-gradient(135deg, #eff6ff 0%, #f8fbff 100%)",
            border: "1px solid #bfdbfe",
            borderRadius: 16,
            padding: 18,
            boxShadow: "0 4px 14px rgba(37,99,235,0.08)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.7,
              color: "#1d4ed8",
              marginBottom: 8,
            }}
          >
            RESPUESTA FINAL
          </div>

          {result !== null ? (
            <>
              <div style={{ fontSize: 15, color: "#374151", marginBottom: 8 }}>
                El valor interpolado obtenido con Neville en:
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#111827",
                  marginBottom: 6,
                }}
              >
                x = {fmt(parseNum(xEvalInput))}
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  color: "#2563eb",
                }}
              >
                Q(x) = {fmt(result)}
              </div>
            </>
          ) : (
            <div style={{ color: "#6b7280" }}>
              Aún no hay resultado. Completa los datos y presiona <strong>CALCULAR</strong>.
            </div>
          )}
        </div>

        <div style={sectionCard}>
          <h4 style={{ marginTop: 0 }}>Resumen del cálculo</h4>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(160px, 1fr))",
              gap: 12,
            }}
          >
            <MiniInfoCard title="Puntos usados" value={String(n)} />
            <MiniInfoCard
              title="Valor evaluado"
              value={Number.isFinite(parseNum(xEvalInput)) ? fmt(parseNum(xEvalInput)) : "-"}
            />
            <MiniInfoCard
              title="Resultado"
              value={result !== null ? fmt(result) : "-"}
            />
            <MiniInfoCard title="Método" value="Neville" />
          </div>
        </div>

        <div style={sectionCard}>
          <h4 style={{ marginTop: 0 }}>Tabla de Neville</h4>

          {!table ? (
            <p className="bisection-hint" style={{ margin: 0 }}>
              Ingresa los datos y presiona <strong>CALCULAR</strong>.
              <br />
              El resultado final aparece en la última columna y última fila.
            </p>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table className="bisection-table">
                  <thead>
                    <tr>
                      <th>x</th>
                      <th>Q[i,0]</th>
                      {Array.from({ length: n - 1 }).map((_, j) => (
                        <th key={j + 1}>Q[i,{j + 1}]</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.map((row, i) => (
                      <tr key={i}>
                        <td>{fmt(parseNum(points[i]?.x))}</td>
                        {row.map((cell, j) => {
                          const show = i >= j;
                          const isLast = i === n - 1 && j === n - 1;

                          return (
                            <td
                              key={`${i}-${j}`}
                              className={isLast && lastCellIsGreen ? "cell-green" : ""}
                              style={
                                isLast
                                  ? {
                                      fontWeight: 800,
                                      background: "#dcfce7",
                                      color: "#166534",
                                    }
                                  : undefined
                              }
                            >
                              {show && cell != null ? fmt(cell) : ""}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div
                style={{
                  marginTop: 12,
                  textAlign: "center",
                  fontWeight: 800,
                  fontSize: 18,
                  color: "#111827",
                }}
              >
                Q({fmt(parseNum(xEvalInput))}) ≈ <span style={{ color: "#2563eb" }}>{fmt(result)}</span>
              </div>
            </>
          )}
        </div>

        <div className="graph-card" style={sectionCard}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 10,
            }}
          >
            <h4 className="graph-title" style={{ margin: 0 }}>
              Gráfica del polinomio interpolante
            </h4>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12 }}>
              <LegendDot color="#111827" label="Puntos dados" />
              <LegendDot color="#2563eb" label="Curva interpolada" />
              <LegendDot color="#ef4444" label="Valor evaluado" />
            </div>
          </div>

          {!graph.ok ? (
            <p className="bisection-hint">No se pudo generar la gráfica. Revisa los puntos.</p>
          ) : (
            <svg className="graph-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
              <rect x="0" y="0" width={width} height={height} fill="#ffffff" />

              {/* Cuadrícula vertical */}
              {graph.xTicks.map((xt, i) => (
                <line
                  key={`gx-${i}`}
                  x1={xToSvg(xt)}
                  x2={xToSvg(xt)}
                  y1={paddingTop}
                  y2={height - paddingBottom}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              ))}

              {/* Cuadrícula horizontal */}
              {graph.yTicks.map((yt, i) => (
                <line
                  key={`gy-${i}`}
                  x1={paddingLeft}
                  x2={width - paddingRight}
                  y1={yToSvg(yt)}
                  y2={yToSvg(yt)}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              ))}

              {/* Eje X */}
              <line
                x1={paddingLeft}
                x2={width - paddingRight}
                y1={xAxisY}
                y2={xAxisY}
                stroke="#9ca3af"
                strokeWidth="1.2"
              />

              {/* Eje Y */}
              <line
                x1={yAxisX}
                x2={yAxisX}
                y1={paddingTop}
                y2={height - paddingBottom}
                stroke="#9ca3af"
                strokeWidth="1.2"
              />

              {/* Escala eje X */}
              {graph.xTicks.map((xt, i) => (
                <g key={`xt-${i}`}>
                  <line
                    x1={xToSvg(xt)}
                    x2={xToSvg(xt)}
                    y1={xAxisY - 4}
                    y2={xAxisY + 4}
                    stroke="#9ca3af"
                    strokeWidth="1"
                  />
                  <text
                    x={xToSvg(xt)}
                    y={height - 10}
                    fontSize="10"
                    textAnchor="middle"
                    fill="#374151"
                  >
                    {xt.toFixed(2)}
                  </text>
                </g>
              ))}

              {/* Escala eje Y */}
              {graph.yTicks.map((yt, i) => (
                <g key={`yt-${i}`}>
                  <line
                    x1={yAxisX - 4}
                    x2={yAxisX + 4}
                    y1={yToSvg(yt)}
                    y2={yToSvg(yt)}
                    stroke="#9ca3af"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={yToSvg(yt) + 3}
                    fontSize="10"
                    textAnchor="end"
                    fill="#374151"
                  >
                    {yt.toFixed(2)}
                  </text>
                </g>
              ))}

              {/* Nombre de ejes */}
              <text
                x={(paddingLeft + (width - paddingRight)) / 2}
                y={height - 2}
                fontSize="12"
                textAnchor="middle"
                fill="#374151"
              >
                Eje X
              </text>

              <text
                x={18}
                y={(paddingTop + (height - paddingBottom)) / 2}
                fontSize="12"
                textAnchor="middle"
                fill="#374151"
                transform={`rotate(-90 18 ${(paddingTop + (height - paddingBottom)) / 2})`}
              >
                Eje Y
              </text>

              {/* Curva */}
              <path d={curvePath} fill="none" stroke="#2563eb" strokeWidth="2" />

              {/* Puntos */}
              {graph.pts.map((p, i) => (
                <circle key={i} cx={xToSvg(p.x)} cy={yToSvg(p.y)} r="4" fill="#111827" />
              ))}

              {/* Valor evaluado */}
              {Number.isFinite(graph.xEval) && (
                <>
                  <line
                    x1={xToSvg(graph.xEval)}
                    x2={xToSvg(graph.xEval)}
                    y1={paddingTop}
                    y2={height - paddingBottom}
                    stroke="#ef4444"
                    strokeWidth="1.3"
                    strokeDasharray="4 3"
                  />
                  {Number.isFinite(graph.yEval) && (
                    <circle
                      cx={xToSvg(graph.xEval)}
                      cy={yToSvg(graph.yEval)}
                      r="4.8"
                      fill="#ef4444"
                    />
                  )}
                </>
              )}
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniInfoCard({ title, value }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 12,
        background: "#f9fafb",
      }}
    >
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>{value}</div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: color,
          display: "inline-block",
        }}
      />
      <span style={{ color: "#374151" }}>{label}</span>
    </div>
  );
}