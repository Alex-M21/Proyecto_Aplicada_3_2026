// src/metodos/NewtonDivididas.jsx
import { useMemo, useState } from "react";
import "./Biseccion.css";

export default function NewtonDivididas() {
  const [xEvalInput, setXEvalInput] = useState("5");
  const [nInput, setNInput] = useState("4");
  const [decimalsInput, setDecimalsInput] = useState("4");

  const [points, setPoints] = useState([
    { x: "2", y: "4" },
    { x: "5", y: "8" },
    { x: "9", y: "12" },
    { x: "12", y: "34" },
  ]);

  const [table, setTable] = useState(null);
  const [coeffs, setCoeffs] = useState(null);
  const [result, setResult] = useState(null);

  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

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

  const buildDividedDifferences = (xs, ys) => {
    const n = xs.length;
    const dd = Array.from({ length: n }, () => Array(n).fill(null));

    for (let i = 0; i < n; i++) dd[i][0] = ys[i];

    for (let j = 1; j < n; j++) {
      for (let i = 0; i < n - j; i++) {
        const denom = xs[i + j] - xs[i];
        if (denom === 0) return { dd: null, a: null };
        dd[i][j] = (dd[i + 1][j - 1] - dd[i][j - 1]) / denom;
      }
    }

    const a = Array.from({ length: n }, (_, j) => dd[0][j]);
    return { dd, a };
  };

  const evalNewton = (xs, a, x) => {
    let p = a[a.length - 1];
    for (let k = a.length - 2; k >= 0; k--) {
      p = p * (x - xs[k]) + a[k];
    }
    return p;
  };

  const polyAdd = (A, B) => {
    const m = Math.max(A.length, B.length);
    const C = Array(m).fill(0);
    for (let i = 0; i < m; i++) C[i] = (A[i] || 0) + (B[i] || 0);
    return C;
  };

  const polyMul = (A, B) => {
    const C = Array(A.length + B.length - 1).fill(0);
    for (let i = 0; i < A.length; i++) {
      for (let j = 0; j < B.length; j++) {
        C[i + j] += A[i] * B[j];
      }
    }
    return C;
  };

  const polyFromNewton = (xs, a) => {
    let P = [0];
    let basis = [1];

    for (let k = 0; k < a.length; k++) {
      const term = basis.map((c) => c * a[k]);
      P = polyAdd(P, term);

      if (k < a.length - 1) {
        basis = polyMul(basis, [-xs[k], 1]);
      }
    }

    return P;
  };

  const polyToString = (c, decimals) => {
    const d = decimals;
    const eps = 10 ** (-(d + 2));
    let s = "";

    for (let p = c.length - 1; p >= 0; p--) {
      const val = c[p];
      if (!Number.isFinite(val) || Math.abs(val) < eps) continue;

      const sign = val >= 0 ? "+" : "-";
      const abs = Math.abs(val);
      const coeff = abs.toFixed(d);

      const part =
        p === 0 ? `${coeff}` :
        p === 1 ? `${coeff}x` :
        `${coeff}x^${p}`;

      if (!s) {
        s = val >= 0 ? part : `-${part}`;
      } else {
        s += ` ${sign} ${part}`;
      }
    }

    return s || "0";
  };

  const newtonToProductString = (xs, a, decimals) => {
    const d = decimals;
    const termStr = (num) => (Number.isFinite(num) ? Number(num).toFixed(d) : "NaN");

    let s = `P(x) = ${termStr(a[0])}`;
    for (let k = 1; k < a.length; k++) {
      let prod = "";
      for (let j = 0; j < k; j++) {
        const xj = xs[j];
        if (xj === 0) prod += `(x)`;
        else if (xj < 0) prod += `(x+${Math.abs(xj).toFixed(d)})`;
        else prod += `(x-${xj.toFixed(d)})`;
      }

      const ak = a[k];
      const sign = ak >= 0 ? " + " : " - ";
      s += `${sign}${Math.abs(ak).toFixed(d)}·${prod}`;
    }
    return s;
  };

  const handleCalculate = (e) => {
    e.preventDefault();
    setMessage("");
    setErrorMsg("");
    setTable(null);
    setCoeffs(null);
    setResult(null);

    const n = clampInt(parseInt(nInput, 10), 2, 12);
    const xEval = parseNum(xEvalInput);

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

    if (new Set(xs.map(String)).size !== xs.length) {
      setErrorMsg("Hay valores de x repetidos. Los valores de x deben ser distintos.");
      return;
    }

    const { dd, a } = buildDividedDifferences(xs, ys);
    if (!dd || !a) {
      setErrorMsg("No se pudo construir la tabla de diferencias divididas.");
      return;
    }

    const yEval = evalNewton(xs, a, xEval);
    if (!Number.isFinite(yEval)) {
      setErrorMsg("No se pudo evaluar el polinomio.");
      return;
    }

    setTable(dd);
    setCoeffs(a);
    setResult(yEval);
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
    setCoeffs(null);
    setResult(null);
    setMessage("");
    setErrorMsg("");
  };

  const polyStrings = useMemo(() => {
    if (!coeffs) return { product: "", expanded: "" };

    const n = clampInt(parseInt(nInput, 10), 2, 12);
    const xs = [];
    for (let i = 0; i < n; i++) xs.push(parseNum(points[i]?.x));

    const d = getDecimals();
    const product = newtonToProductString(xs, coeffs, d);
    const expandedCoeffs = polyFromNewton(xs, coeffs);
    const expanded = `P(x) = ${polyToString(expandedCoeffs, d)}`;

    return { product, expanded };
  }, [coeffs, nInput, points, decimalsInput]);

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

    const buildTicks = (min, max, k = 5) => {
      const arr = [];
      for (let i = 0; i <= k; i++) arr.push(min + (i * (max - min)) / k);
      return arr;
    };

    if (!coeffs) {
      const yMin0 = Math.min(...ys);
      const yMax0 = Math.max(...ys);
      return {
        ok: true,
        pts: xs.map((x, i) => ({ x, y: ys[i] })),
        curve: [],
        xMin,
        xMax,
        yMin: yMin0 - 1,
        yMax: yMax0 + 1,
        xEval: Number.isFinite(xEval) ? xEval : NaN,
        yEval: NaN,
        xTicks: buildTicks(xMin, xMax, 5),
        yTicks: buildTicks(yMin0 - 1, yMax0 + 1, 5),
      };
    }

    const curve = [];
    const steps = 180;
    const step = (xMax - xMin) / steps;

    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * step;
      const y = evalNewton(xs, coeffs, x);
      if (Number.isFinite(y)) curve.push({ x, y });
    }

    const yEval = Number.isFinite(xEval) ? evalNewton(xs, coeffs, xEval) : NaN;
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
  }, [points, nInput, coeffs, xEvalInput]);

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
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>Diferencias divididas de Newton</h3>
          <p className="bisection-hint" style={{ margin: 0 }}>
            Ingresa los puntos conocidos y el valor de <strong>x</strong> que deseas interpolar.
            Se construye la tabla de diferencias divididas, los coeficientes del polinomio
            y el resultado final.
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
                placeholder="Ejemplo: 5"
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
                El valor interpolado obtenido con Newton en:
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
                P(x) = {fmt(result)}
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
            <MiniInfoCard title="Método" value="Newton DD" />
          </div>
        </div>

        <div style={sectionCard}>
          <h4 style={{ marginTop: 0 }}>Tabla de diferencias divididas</h4>

          {!table ? (
            <p className="bisection-hint" style={{ margin: 0 }}>
              Ingresa los datos y presiona <strong>CALCULAR</strong>.
              <br />
              Los coeficientes del polinomio son los valores de la primera fila.
            </p>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table className="bisection-table">
                  <thead>
                    <tr>
                      <th>x</th>
                      <th>f[xᵢ]</th>
                      {Array.from({ length: n - 1 }).map((_, j) => (
                        <th key={j}>f[·] orden {j + 1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: n }).map((_, i) => (
                      <tr key={i}>
                        <td>{fmt(parseNum(points[i]?.x))}</td>

                        {Array.from({ length: n }).map((_, j) => {
                          const show = j === 0 ? i < n : i <= n - j - 1;
                          const val = table[i]?.[j];
                          const isCoeff = i === 0 && val != null;

                          return (
                            <td
                              key={j}
                              style={
                                isCoeff
                                  ? {
                                      background: "#dcfce7",
                                      color: "#166534",
                                      fontWeight: 800,
                                    }
                                  : undefined
                              }
                            >
                              {show && val != null ? fmt(val) : ""}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {coeffs && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Coeficientes del polinomio</div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                      gap: 10,
                    }}
                  >
                    {coeffs.map((c, i) => (
                      <MiniInfoCard key={i} title={`a${i}`} value={fmt(c)} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div style={sectionCard}>
          <h4 style={{ marginTop: 0 }}>Ecuaciones del polinomio</h4>

          {!coeffs ? (
            <p className="bisection-hint" style={{ margin: 0 }}>
              Aquí aparecerán la forma producto y la forma expandida después de calcular.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              <FormulaBlock title="Forma de Newton / producto" value={polyStrings.product} />
              <FormulaBlock title="Forma expandida" value={polyStrings.expanded} />
            </div>
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
              <LegendDot color="#2563eb" label="Polinomio" />
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
                y={height - 4}
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

              {curvePath && <path d={curvePath} fill="none" stroke="#2563eb" strokeWidth="2" />}

              {graph.pts.map((p, i) => (
                <circle key={i} cx={xToSvg(p.x)} cy={yToSvg(p.y)} r="4" fill="#111827" />
              ))}

              {Number.isFinite(graph.xEval) && coeffs && (
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

function FormulaBlock({ title, value }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 12,
        background: "#fcfcfd",
      }}
    >
      <div
        style={{
          fontWeight: 700,
          marginBottom: 8,
          color: "#374151",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 12,
          whiteSpace: "pre-wrap",
          color: "#111827",
          lineHeight: 1.55,
        }}
      >
        {value}
      </div>
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