// src/metodos/Lagrange.jsx
import { useEffect, useMemo, useState } from "react";
import { create, all } from "mathjs";
import "./Biseccion.css";

const math = create(all, {});
math.config({ number: "number" });

export default function Lagrange() {
  const [degree, setDegree] = useState(3); // grado m => m+1 puntos
  const [xEvalInput, setXEvalInput] = useState("7");
  const [decimalsInput, setDecimalsInput] = useState("5");

  // ejemplo como tu imagen
  const [points, setPoints] = useState([
    { x: "4", y: "9" },
    { x: "8", y: "12" },
    { x: "12", y: "11" },
    { x: "15", y: "23" }
  ]);

  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [polyFactor, setPolyFactor] = useState("");
  const [polySimpl, setPolySimpl] = useState("");
  const [polyExpand, setPolyExpand] = useState("");

  // -------------------------
  // Utils
  // -------------------------
  const getDecimals = () => {
    const d = parseInt(decimalsInput, 10);
    return Number.isNaN(d) || d < 0 ? 6 : d;
  };

  const fmtN = (v) => {
    const d = getDecimals();
    return Number.isFinite(v) ? v.toFixed(d) : "NaN";
  };

  const safeNumber = (s) => {
    const v = parseFloat(String(s ?? "").trim());
    return Number.isFinite(v) ? v : NaN;
  };

  // -------------------------
  // Ajustar puntos al cambiar grado
  // -------------------------
  useEffect(() => {
    const needed = Number(degree) + 1;
    setPoints((prev) => {
      const next = [...prev];
      while (next.length < needed) next.push({ x: "", y: "" });
      while (next.length > needed) next.pop();
      return next;
    });
  }, [degree]);

  // -------------------------
  // Parse / Validación
  // -------------------------
  const parsed = useMemo(() => {
    const xs = [];
    const ys = [];

    for (let i = 0; i < points.length; i++) {
      const xi = safeNumber(points[i].x);
      const yi = safeNumber(points[i].y);
      if (!Number.isFinite(xi) || !Number.isFinite(yi)) {
        return { ok: false, error: `Punto ${i + 1} inválido (x,y).` };
      }
      xs.push(xi);
      ys.push(yi);
    }

    const seen = new Set();
    for (const x of xs) {
      const k = x.toString();
      if (seen.has(k)) return { ok: false, error: `No se permiten x repetidos. x=${x} está repetido.` };
      seen.add(k);
    }

    return { ok: true, xs, ys };
  }, [points]);

  // -------------------------
  // Lagrange simbólico
  // -------------------------
  const buildLagrangeStrings = (xs, ys) => {
    const n = xs.length;
    const c = (num) => {
      if (Math.abs(num - Math.round(num)) < 1e-12) return String(Math.round(num));
      return math.format(num, { precision: 14 });
    };

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
      const li = Li(i);
      terms.push(`(${c(ys[i])})*(${li})`);
    }

    return { P: terms.join(" + ") };
  };

  const trySimplify = (exprStr) => {
    try {
      return math.simplify(exprStr).toString();
    } catch {
      return "";
    }
  };

  const tryExpand = (exprStr) => {
    try {
      const s = math.simplify(exprStr);
      if (math.simplify?.rules?.expand) {
        const e = math.simplify(s, [math.simplify.rules.expand]);
        return e.toString();
      }
      return s.toString();
    } catch {
      return "";
    }
  };

  // -------------------------
  // Lagrange numérico
  // -------------------------
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
    setPolyFactor("");
    setPolySimpl("");
    setPolyExpand("");

    const xEval = safeNumber(xEvalInput);
    if (!Number.isFinite(xEval)) {
      setErrorMsg("El valor a interpolar (dato a) debe ser numérico.");
      return;
    }

    if (!parsed.ok) {
      setErrorMsg(parsed.error);
      return;
    }

    const { xs, ys } = parsed;

    const pVal = evalLagrange(xs, ys, xEval);

    const { P } = buildLagrangeStrings(xs, ys);
    setPolyFactor(`P(x) = ${P}`);

    const simp = trySimplify(P);
    setPolySimpl(simp ? `P(x) = ${simp}` : "");

    const exp = tryExpand(P);
    setPolyExpand(exp ? `P(x) = ${exp}` : "");

    setMessage(`Interpolación: P(${fmtN(xEval)}) ≈ ${fmtN(pVal)}`);
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
    setPolyFactor("");
    setPolySimpl("");
    setPolyExpand("");
  };

  const setPointValue = (idx, key, value) => {
    setPoints((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      return next;
    });
  };

  // -------------------------
  // GRÁFICA tipo Excel
  // -------------------------
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

    // ticks “bonitos” (5 divisiones)
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
  const pAtEval = parsed.ok && Number.isFinite(xEval) ? evalLagrange(parsed.xs, parsed.ys, xEval) : NaN;

  // SVG layout
  const W = 620, H = 320;
  const PL = 56, PR = 12, PT = 14, PB = 38;

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

  return (
    <div className="bisection-grid">
      {/* Formulario */}
      <div className="bisection-form">
        <h3>Polinomio de Lagrange</h3>

        <p className="bisection-hint">
          Selecciona grado <strong>m</strong> (se generan <strong>m+1</strong> puntos). Luego ingresa el{" "}
          <strong>dato a</strong> para interpolar.
        </p>

        <form onSubmit={handleCalculate}>
          <div className="bisection-form-row">
            <label>Grado del polinomio (m) =</label>
            <input
              type="number"
              min={1}
              max={20}
              value={degree}
              onChange={(e) => setDegree(Math.max(1, parseInt(e.target.value || "1", 10)))}
            />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese el dato a (interpolación) =</label>
            <input
              type="number"
              step="any"
              value={xEvalInput}
              onChange={(e) => setXEvalInput(e.target.value)}
            />
          </div>

          <div className="bisection-form-row">
            <label>Número de decimales =</label>
            <input
              type="number"
              value={decimalsInput}
              onChange={(e) => setDecimalsInput(e.target.value)}
            />
          </div>

          <div className="bisection-form-row">
            <label>Tabla (x, y)</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%" }}>
              {points.map((p, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <input
                    type="number"
                    step="any"
                    value={p.x}
                    onChange={(e) => setPointValue(idx, "x", e.target.value)}
                    placeholder={`x${idx}`}
                  />
                  <input
                    type="number"
                    step="any"
                    value={p.y}
                    onChange={(e) => setPointValue(idx, "y", e.target.value)}
                    placeholder={`y${idx}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bisection-buttons">
            <button type="submit" className="btn-primary">CALCULAR</button>
            <button type="button" className="btn-secondary" onClick={handleClear}>
              BORRAR CELDAS
            </button>
          </div>
        </form>

        {message && <p className="bisection-message">{message}</p>}
        {errorMsg && <p className="bisection-error">{errorMsg}</p>}
      </div>

      {/* Resultados */}
      <div className="bisection-results">
        <div className="bisection-table-wrapper">
          <h4>Resultados</h4>

          {polyFactor && (
            <>
              <div style={{ fontWeight: 700, marginTop: 8 }}>Polinomio (forma Lagrange / factorizada):</div>
              <div style={{ fontFamily: "monospace", fontSize: 12, whiteSpace: "pre-wrap" }}>
                {polyFactor}
              </div>
            </>
          )}

          {polySimpl && (
            <>
              <div style={{ fontWeight: 700, marginTop: 12 }}>Polinomio simplificado:</div>
              <div style={{ fontFamily: "monospace", fontSize: 12, whiteSpace: "pre-wrap" }}>
                {polySimpl}
              </div>
            </>
          )}

          {polyExpand && (
            <>
              <div style={{ fontWeight: 700, marginTop: 12 }}>Polinomio expandido:</div>
              <div style={{ fontFamily: "monospace", fontSize: 12, whiteSpace: "pre-wrap" }}>
                {polyExpand}
              </div>
            </>
          )}
        </div>

        {/* GRÁFICA */}
        <div className="graph-card">
          <h4 className="graph-title">POLINOMIO DE LAGRANGE (Puntos en el Plano)</h4>

          {!graph ? (
            <p className="bisection-hint">Ingresa puntos válidos para ver la gráfica.</p>
          ) : (
            <svg className="graph-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
              {/* Fondo */}
              <rect x="0" y="0" width={W} height={H} fill="#ffffff" />

              {/* Cuadrícula (grid) */}
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

              {/* Ejes */}
              <line x1={PL} x2={W - PR} y1={H - PB} y2={H - PB} stroke="#9ca3af" strokeWidth="1.2" />
              <line x1={PL} x2={PL} y1={PT} y2={H - PB} stroke="#9ca3af" strokeWidth="1.2" />

              {/* Ticks y etiquetas X */}
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

              {/* Ticks y etiquetas Y */}
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

              {/* Curva interpolada */}
              <path d={curvePath} fill="none" stroke="#2563eb" strokeWidth="2" />

              {/* Puntos (marcadores) */}
              {graph.xs.map((x, i) => (
                <g key={`pt-${i}`}>
                  <circle cx={xToSvg(x)} cy={yToSvg(graph.ys[i])} r="3.5" fill="#111827" />
                </g>
              ))}

              {/* Línea vertical en x = dato a y punto P(a) */}
              {Number.isFinite(xEval) && xEval >= graph.xMin && xEval <= graph.xMax && Number.isFinite(pAtEval) && (
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
                  <circle cx={xToSvg(xEval)} cy={yToSvg(pAtEval)} r="4.2" fill="#ef4444" />
                </>
              )}
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
