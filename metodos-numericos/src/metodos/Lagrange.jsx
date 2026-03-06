// src/metodos/Lagrange.jsx
import { useEffect, useMemo, useState } from "react";
import { create, all } from "mathjs";
import "./Biseccion.css";

const math = create(all, {});
math.config({ number: "number" });

export default function Lagrange() {
  const [degree, setDegree] = useState(3);
  const [xEvalInput, setXEvalInput] = useState("7");
  const [decimalsInput, setDecimalsInput] = useState("5");

  const [points, setPoints] = useState([
    { x: "4", y: "9" },
    { x: "8", y: "12" },
    { x: "12", y: "11" },
    { x: "15", y: "23" }
  ]);

  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [polyLagrange, setPolyLagrange] = useState("");
  const [polyFactorized, setPolyFactorized] = useState("");
  const [polyExpanded, setPolyExpanded] = useState("");

  const [resultValue, setResultValue] = useState(null);

  const getDecimals = () => {
    const d = parseInt(decimalsInput, 10);
    return Number.isNaN(d) || d < 0 ? 6 : d;
  };

  const fmtN = (v) => {
    const d = getDecimals();
    return Number.isFinite(v) ? Number(v).toFixed(d) : "NaN";
  };

  const safeNumber = (s) => {
    const v = parseFloat(String(s ?? "").trim());
    return Number.isFinite(v) ? v : NaN;
  };

  useEffect(() => {
    const needed = Number(degree) + 1;
    setPoints((prev) => {
      const next = [...prev];
      while (next.length < needed) next.push({ x: "", y: "" });
      while (next.length > needed) next.pop();
      return next;
    });
  }, [degree]);

  const parsed = useMemo(() => {
    const xs = [];
    const ys = [];

    for (let i = 0; i < points.length; i++) {
      const xi = safeNumber(points[i].x);
      const yi = safeNumber(points[i].y);

      if (!Number.isFinite(xi) || !Number.isFinite(yi)) {
        return { ok: false, error: `El punto ${i + 1} no es válido. Verifica x e y.` };
      }

      xs.push(xi);
      ys.push(yi);
    }

    const seen = new Set();
    for (const x of xs) {
      const key = String(x);
      if (seen.has(key)) {
        return {
          ok: false,
          error: `No se permiten valores repetidos en x. El valor x = ${x} está duplicado.`
        };
      }
      seen.add(key);
    }

    return { ok: true, xs, ys };
  }, [points]);

  const c = (num) => {
    if (Math.abs(num - Math.round(num)) < 1e-12) return String(Math.round(num));
    return math.format(num, { precision: 14 });
  };

  const buildLagrangeStrings = (xs, ys) => {
    const n = xs.length;

    const Li = (i) => {
      const xi = xs[i];
      const parts = [];

      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const xj = xs[j];
        const denom = xi - xj;
        parts.push(`(x-(${c(xj)}))/(${c(denom)})`);
      }

      return parts.length ? parts.join("*") : "1";
    };

    const terms = [];
    for (let i = 0; i < n; i++) {
      terms.push(`(${c(ys[i])})*(${Li(i)})`);
    }

    return { P: terms.join(" + ") };
  };

  const buildFactorizedString = (xs, ys) => {
    const n = xs.length;
    const terms = [];

    for (let i = 0; i < n; i++) {
      const xi = xs[i];
      const factors = [];
      let denom = 1;

      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        factors.push(`(x-(${c(xs[j])}))`);
        denom *= xi - xs[j];
      }

      const coeff = ys[i] / denom;
      const coeffStr = c(coeff);

      if (factors.length) {
        terms.push(`(${coeffStr})*${factors.join("*")}`);
      } else {
        terms.push(`(${coeffStr})`);
      }
    }

    return `P(x) = ${terms.join(" + ")}`;
  };

  const polyAdd = (a, b) => {
    const n = Math.max(a.length, b.length);
    const out = Array(n).fill(0);
    for (let i = 0; i < n; i++) out[i] = (a[i] || 0) + (b[i] || 0);
    return out;
  };

  const polyMul = (a, b) => {
    const out = Array(a.length + b.length - 1).fill(0);
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < b.length; j++) {
        out[i + j] += a[i] * b[j];
      }
    }
    return out;
  };

  const polyScale = (a, k) => a.map((v) => v * k);

  const buildExpandedCoeffs = (xs, ys) => {
    const n = xs.length;
    let poly = [0];

    for (let i = 0; i < n; i++) {
      let basis = [1];
      let denom = 1;

      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        basis = polyMul(basis, [-xs[j], 1]);
        denom *= xs[i] - xs[j];
      }

      const factor = ys[i] / denom;
      poly = polyAdd(poly, polyScale(basis, factor));
    }

    return poly.map((v) => (Math.abs(v) < 1e-12 ? 0 : v));
  };

  const coeffsToString = (coeffs, decimals) => {
    const eps = 10 ** (-(decimals + 2));
    let out = "";

    for (let p = coeffs.length - 1; p >= 0; p--) {
      const val = coeffs[p];
      if (!Number.isFinite(val) || Math.abs(val) < eps) continue;

      const sign = val >= 0 ? "+" : "-";
      const abs = Math.abs(val);
      const absRounded = Number(abs.toFixed(decimals));

      let term = "";
      if (p === 0) {
        term = `${absRounded}`;
      } else if (p === 1) {
        term = `${absRounded}x`;
      } else {
        term = `${absRounded}x^${p}`;
      }

      if (!out) {
        out = val < 0 ? `-${term}` : term;
      } else {
        out += ` ${sign} ${term}`;
      }
    }

    return out || "0";
  };

  const evalLagrange = (xs, ys, xEval) => {
    const n = xs.length;
    let P = 0;

    for (let i = 0; i < n; i++) {
      let Li = 1;
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        Li *= (xEval - xs[j]) / (xs[i] - xs[j]);
      }
      P += ys[i] * Li;
    }

    return P;
  };

  const handleCalculate = (e) => {
    e.preventDefault();

    setMessage("");
    setErrorMsg("");
    setPolyLagrange("");
    setPolyFactorized("");
    setPolyExpanded("");
    setResultValue(null);

    const xEval = safeNumber(xEvalInput);
    if (!Number.isFinite(xEval)) {
      setErrorMsg("Ingresa un valor numérico válido para evaluar x.");
      return;
    }

    if (!parsed.ok) {
      setErrorMsg(parsed.error);
      return;
    }

    const { xs, ys } = parsed;
    const pVal = evalLagrange(xs, ys, xEval);
    const { P } = buildLagrangeStrings(xs, ys);

    const coeffs = buildExpandedCoeffs(xs, ys);
    const decimals = getDecimals();

    setPolyLagrange(`P(x) = ${P}`);
    setPolyFactorized(buildFactorizedString(xs, ys));
    setPolyExpanded(`P(x) = ${coeffsToString(coeffs, decimals)}`);

    setResultValue(pVal);
    setMessage(`Se evaluó correctamente el polinomio interpolante en x = ${fmtN(xEval)}.`);
  };

  const handleClear = () => {
    setDegree(3);
    setXEvalInput("");
    setDecimalsInput("5");
    setPoints([
      { x: "", y: "" },
      { x: "", y: "" },
      { x: "", y: "" },
      { x: "", y: "" }
    ]);
    setMessage("");
    setErrorMsg("");
    setPolyLagrange("");
    setPolyFactorized("");
    setPolyExpanded("");
    setResultValue(null);
  };

  const setPointValue = (idx, key, value) => {
    setPoints((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      return next;
    });
  };

  const graph = useMemo(() => {
    if (!parsed.ok) return null;

    const { xs, ys } = parsed;

    const xMin0 = Math.min(...xs);
    const xMax0 = Math.max(...xs);
    const xPad = (xMax0 - xMin0) * 0.2 || 1;

    const xMin = xMin0 - xPad;
    const xMax = xMax0 + xPad;

    const steps = 220;
    const curve = [];

    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i * (xMax - xMin)) / steps;
      const y = evalLagrange(xs, ys, x);
      if (Number.isFinite(y)) curve.push({ x, y });
    }

    if (!curve.length) return null;

    const yMin0 = Math.min(...curve.map((p) => p.y));
    const yMax0 = Math.max(...curve.map((p) => p.y));
    const yPad = (yMax0 - yMin0) * 0.2 || 1;

    const yMin = yMin0 - yPad;
    const yMax = yMax0 + yPad;

    const ticks = (min, max, k = 5) => {
      const arr = [];
      for (let i = 0; i <= k; i++) arr.push(min + (i * (max - min)) / k);
      return arr;
    };

    return {
      xs,
      ys,
      curve,
      xMin,
      xMax,
      yMin,
      yMax,
      xTicks: ticks(xMin, xMax, 5),
      yTicks: ticks(yMin, yMax, 5)
    };
  }, [parsed]);

  const xEval = safeNumber(xEvalInput);
  const pAtEval =
    parsed.ok && Number.isFinite(xEval)
      ? evalLagrange(parsed.xs, parsed.ys, xEval)
      : NaN;

  const W = 620;
  const H = 320;
  const PL = 56;
  const PR = 12;
  const PT = 14;
  const PB = 38;

  const xToSvg = (x) => {
    const w = W - PL - PR;
    return PL + ((x - graph.xMin) / (graph.xMax - graph.xMin)) * w;
  };

  const yToSvg = (y) => {
    const h = H - PT - PB;
    return PT + (1 - (y - graph.yMin) / (graph.yMax - graph.yMin)) * h;
  };

  const curvePath =
    graph?.curve?.length
      ? graph.curve
          .map((p, i) => `${i === 0 ? "M" : "L"} ${xToSvg(p.x)} ${yToSvg(p.y)}`)
          .join(" ")
      : "";

  const sectionCard = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 16,
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
  };

  const labelStyle = {
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 6,
    display: "block"
  };

  return (
    <div
      className="bisection-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "1.02fr 1.25fr",
        gap: 20,
        alignItems: "start"
      }}
    >
      <div className="bisection-form" style={{ display: "grid", gap: 16 }}>
        <div style={sectionCard}>
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>Interpolación de Lagrange</h3>
          <p className="bisection-hint" style={{ margin: 0 }}>
            Ingresa los puntos conocidos y el valor de <strong>x</strong> que deseas interpolar.
          </p>
        </div>

        <form onSubmit={handleCalculate} style={{ display: "grid", gap: 16 }}>
          <div style={sectionCard}>
            <h4 style={{ marginTop: 0 }}>1. Configuración</h4>

            <div className="bisection-form-row" style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Grado del polinomio</label>
              <input
                type="number"
                min={1}
                max={20}
                value={degree}
                onChange={(e) =>
                  setDegree(Math.max(1, parseInt(e.target.value || "1", 10)))
                }
              />
              <small style={{ color: "#6b7280" }}>
                Se usarán <strong>{Number(degree) + 1}</strong> puntos.
              </small>
            </div>

            <div className="bisection-form-row" style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Valor de x a interpolar</label>
              <input
                type="number"
                step="any"
                value={xEvalInput}
                onChange={(e) => setXEvalInput(e.target.value)}
                placeholder="Ejemplo: 7"
              />
            </div>

            <div className="bisection-form-row">
              <label style={labelStyle}>Número de decimales</label>
              <input
                type="number"
                value={decimalsInput}
                onChange={(e) => setDecimalsInput(e.target.value)}
                min={0}
              />
            </div>
          </div>

          <div style={sectionCard}>
            <h4 style={{ marginTop: 0, marginBottom: 12 }}>2. Tabla de puntos</h4>

            <div
              style={{
                display: "grid",
                gap: 10
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 1fr 1fr",
                  gap: 10,
                  alignItems: "center",
                  padding: "0 2px"
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
                  paddingRight: 4
                }}
              >
                {points.map((p, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "80px 1fr 1fr",
                      gap: 10,
                      alignItems: "center"
                    }}
                  >
                    <div
                      style={{
                        padding: "10px 12px",
                        background: "#f3f4f6",
                        borderRadius: 10,
                        fontWeight: 700,
                        textAlign: "center",
                        color: "#374151"
                      }}
                    >
                      P{idx + 1}
                    </div>

                    <input
                      type="number"
                      step="any"
                      value={p.x}
                      onChange={(e) => setPointValue(idx, "x", e.target.value)}
                      placeholder={`x${idx + 1}`}
                      style={{ width: "100%" }}
                    />

                    <input
                      type="number"
                      step="any"
                      value={p.y}
                      onChange={(e) => setPointValue(idx, "y", e.target.value)}
                      placeholder={`y${idx + 1}`}
                      style={{ width: "100%" }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bisection-buttons" style={{ display: "flex", gap: 10 }}>
            <button type="submit" className="btn-primary">
              CALCULAR
            </button>
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
              color: "#b91c1c"
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
              color: "#166534"
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
            boxShadow: "0 4px 14px rgba(37,99,235,0.08)"
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.7,
              color: "#1d4ed8",
              marginBottom: 8
            }}
          >
            RESPUESTA FINAL
          </div>

          {resultValue !== null ? (
            <>
              <div style={{ fontSize: 15, color: "#374151", marginBottom: 8 }}>
                El valor interpolado del polinomio en:
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#111827",
                  marginBottom: 6
                }}
              >
                x = {fmtN(safeNumber(xEvalInput))}
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  color: "#2563eb"
                }}
              >
                P(x) = {fmtN(resultValue)}
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
              gap: 12
            }}
          >
            <MiniInfoCard title="Grado" value={String(degree)} />
            <MiniInfoCard title="Puntos usados" value={String(points.length)} />
            <MiniInfoCard
              title="Valor evaluado"
              value={Number.isFinite(safeNumber(xEvalInput)) ? fmtN(safeNumber(xEvalInput)) : "-"}
            />
            <MiniInfoCard
              title="Resultado"
              value={resultValue !== null ? fmtN(resultValue) : "-"}
            />
          </div>
        </div>

        <div style={sectionCard}>
          <h4 style={{ marginTop: 0 }}>Expresiones del polinomio</h4>

          {!polyLagrange && !polyFactorized && !polyExpanded ? (
            <p className="bisection-hint" style={{ margin: 0 }}>
              Aquí aparecerán las expresiones del polinomio después de calcular.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {polyLagrange && <FormulaBlock title="Forma de Lagrange" value={polyLagrange} />}
              {polyFactorized && <FormulaBlock title="Forma factorizada" value={polyFactorized} />}
              {polyExpanded && <FormulaBlock title="Forma expandida" value={polyExpanded} />}
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
              marginBottom: 10
            }}
          >
            <h4 className="graph-title" style={{ margin: 0 }}>
              Gráfica del polinomio interpolante
            </h4>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12 }}>
              <LegendDot color="#111827" label="Puntos dados" />
              <LegendDot color="#2563eb" label="Polinomio" />
              <LegendDot color="#ef4444" label="Valor interpolado" />
            </div>
          </div>

          {!graph ? (
            <p className="bisection-hint">Ingresa puntos válidos para visualizar la gráfica.</p>
          ) : (
            <svg className="graph-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
              <rect x="0" y="0" width={W} height={H} fill="#ffffff" />

              {graph.xTicks.map((xt, i) => (
                <line
                  key={`gx-${i}`}
                  x1={xToSvg(xt)}
                  x2={xToSvg(xt)}
                  y1={PT}
                  y2={H - PB}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              ))}

              {graph.yTicks.map((yt, i) => (
                <line
                  key={`gy-${i}`}
                  x1={PL}
                  x2={W - PR}
                  y1={yToSvg(yt)}
                  y2={yToSvg(yt)}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              ))}

              <line x1={PL} x2={W - PR} y1={H - PB} y2={H - PB} stroke="#9ca3af" strokeWidth="1.2" />
              <line x1={PL} x2={PL} y1={PT} y2={H - PB} stroke="#9ca3af" strokeWidth="1.2" />

              {graph.xTicks.map((xt, i) => (
                <g key={`xt-${i}`}>
                  <line
                    x1={xToSvg(xt)}
                    x2={xToSvg(xt)}
                    y1={H - PB}
                    y2={H - PB + 5}
                    stroke="#9ca3af"
                    strokeWidth="1"
                  />
                  <text
                    x={xToSvg(xt)}
                    y={H - 10}
                    fontSize="10"
                    textAnchor="middle"
                    fill="#374151"
                  >
                    {xt.toFixed(2)}
                  </text>
                </g>
              ))}

              {graph.yTicks.map((yt, i) => (
                <g key={`yt-${i}`}>
                  <line
                    x1={PL - 5}
                    x2={PL}
                    y1={yToSvg(yt)}
                    y2={yToSvg(yt)}
                    stroke="#9ca3af"
                    strokeWidth="1"
                  />
                  <text
                    x={PL - 8}
                    y={yToSvg(yt) + 3}
                    fontSize="10"
                    textAnchor="end"
                    fill="#374151"
                  >
                    {yt.toFixed(2)}
                  </text>
                </g>
              ))}

              <text
                x={(PL + (W - PR)) / 2}
                y={H - 2}
                fontSize="12"
                textAnchor="middle"
                fill="#374151"
              >
                Eje X
              </text>

              <text
                x={16}
                y={(PT + (H - PB)) / 2}
                fontSize="12"
                textAnchor="middle"
                fill="#374151"
                transform={`rotate(-90 16 ${(PT + (H - PB)) / 2})`}
              >
                Eje Y
              </text>

              <path d={curvePath} fill="none" stroke="#2563eb" strokeWidth="2.2" />

              {graph.xs.map((x, i) => (
                <g key={`pt-${i}`}>
                  <circle cx={xToSvg(x)} cy={yToSvg(graph.ys[i])} r="4" fill="#111827" />
                </g>
              ))}

              {Number.isFinite(xEval) &&
                xEval >= graph.xMin &&
                xEval <= graph.xMax &&
                Number.isFinite(pAtEval) && (
                  <>
                    <line
                      x1={xToSvg(xEval)}
                      x2={xToSvg(xEval)}
                      y1={PT}
                      y2={H - PB}
                      stroke="#ef4444"
                      strokeWidth="1.2"
                      strokeDasharray="5 4"
                    />
                    <circle cx={xToSvg(xEval)} cy={yToSvg(pAtEval)} r="4.8" fill="#ef4444" />
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
        background: "#f9fafb"
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
        background: "#fcfcfd"
      }}
    >
      <div
        style={{
          fontWeight: 700,
          marginBottom: 8,
          color: "#374151"
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
          lineHeight: 1.55
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
          display: "inline-block"
        }}
      />
      <span style={{ color: "#374151" }}>{label}</span>
    </div>
  );
}