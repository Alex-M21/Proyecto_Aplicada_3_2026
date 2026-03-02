// src/metodos/NewtonDivididas.jsx
import { useMemo, useState } from "react";
import "./Biseccion.css";

export default function NewtonDivididas() {
  const [xEvalInput, setXEvalInput] = useState("5"); // dato a interpolar
  const [nInput, setNInput] = useState("4");
  const [decimalsInput, setDecimalsInput] = useState("4");

  // Ejemplo parecido a tu imagen
  // (2,4), (5,8), (9,12), (12,34)
  const [points, setPoints] = useState([
    { x: "2", y: "4" },
    { x: "5", y: "8" },
    { x: "9", y: "12" },
    { x: "12", y: "34" },
  ]);

  const [table, setTable] = useState(null); // tabla de diferencias
  const [coeffs, setCoeffs] = useState(null); // a0..a_{n-1}
  const [result, setResult] = useState(null);

  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // ---------- helpers ----------
  const getDecimals = () => {
    const d = parseInt(decimalsInput, 10);
    return Number.isNaN(d) || d < 0 ? 6 : d;
  };

  const fmt = (v) => {
    const d = getDecimals();
    return Number.isFinite(v) ? v.toFixed(d) : "NaN";
  };

  const parseNum = (s) => {
    const v = parseFloat(String(s).replace(",", "."));
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

  // ---------- Newton diferencias divididas ----------
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

    // coeficientes a0..a_{n-1} = dd[0][j]
    const a = Array.from({ length: n }, (_, j) => dd[0][j]);
    return { dd, a };
  };

  const evalNewton = (xs, a, x) => {
    // Horner generalizado para Newton:
    // p = a[n-1]
    // for k = n-2..0: p = p*(x - xs[k]) + a[k]
    let p = a[a.length - 1];
    for (let k = a.length - 2; k >= 0; k--) {
      p = p * (x - xs[k]) + a[k];
    }
    return p;
  };

  // ---------- Polinomio expandido (coeficientes) ----------
  // Representamos polinomio como array c donde:
  // P(x) = c[0] + c[1]x + c[2]x^2 + ...
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
    // P(x)=a0 + a1(x-x0)+a2(x-x0)(x-x1)+...
    let P = [0];
    let basis = [1]; // producto acumulado
    for (let k = 0; k < a.length; k++) {
      // term = a[k] * basis
      const term = basis.map((c) => c * a[k]);
      P = polyAdd(P, term);

      // basis *= (x - xs[k]) para el siguiente
      if (k < a.length - 1) {
        basis = polyMul(basis, [-xs[k], 1]);
      }
    }
    return P; // coeficientes en potencias de x
  };

  const polyToString = (c, decimals) => {
    const d = decimals;
    const eps = 10 ** (-(d + 2));
    // arma desde mayor grado a 0
    let s = "";
    for (let p = c.length - 1; p >= 0; p--) {
      const val = c[p];
      if (!Number.isFinite(val) || Math.abs(val) < eps) continue;

      const sign = val >= 0 ? "+" : "-";
      const abs = Math.abs(val);

      const coeff =
        p === 0
          ? abs.toFixed(d)
          : abs.toFixed(d); // siempre mostrar coef

      const part =
        p === 0
          ? `${coeff}`
          : p === 1
          ? `${coeff}x`
          : `${coeff}x^${p}`;

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
    const termStr = (num) => (Number.isFinite(num) ? num.toFixed(d) : "NaN");

    let s = `P(x) = ${termStr(a[0])}`;
    for (let k = 1; k < a.length; k++) {
      let prod = "";
      for (let j = 0; j < k; j++) {
        const xj = xs[j];
        // (x - xj) con signo correcto
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

  // ---------- Calcular ----------
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
        setErrorMsg("Todos los x y y deben ser numéricos.");
        return;
      }
      xs.push(xi);
      ys.push(yi);
    }

    if (new Set(xs.map(String)).size !== xs.length) {
      setErrorMsg("Hay valores de x repetidos. Deben ser distintos.");
      return;
    }

    const { dd, a } = buildDividedDifferences(xs, ys);
    if (!dd || !a) {
      setErrorMsg("No se pudo construir la tabla (revisa que los x sean distintos).");
      return;
    }

    const yEval = evalNewton(xs, a, xEval);
    if (!Number.isFinite(yEval)) {
      setErrorMsg("No se pudo evaluar el polinomio en x.");
      return;
    }

    setTable(dd);
    setCoeffs(a);
    setResult(yEval);
    setMessage("SE ENCONTRÓ LA SOLUCIÓN");
  };

  const handleClear = () => {
    setXEvalInput("");
    setNInput("4");
    setDecimalsInput("4");
    setPoints([{ x: "", y: "" }, { x: "", y: "" }, { x: "", y: "" }, { x: "", y: "" }]);
    setTable(null);
    setCoeffs(null);
    setResult(null);
    setMessage("");
    setErrorMsg("");
  };

  // ---------- Strings del polinomio ----------
  const polyStrings = useMemo(() => {
    if (!coeffs) return { product: "", expanded: "" };
    const n = clampInt(parseInt(nInput, 10), 2, 12);
    const xs = [];
    for (let i = 0; i < n; i++) xs.push(parseNum(points[i]?.x));
    const d = getDecimals();

    const product = newtonToProductString(xs, coeffs, d);

    const expandedCoeffs = polyFromNewton(xs, coeffs); // coef en potencias
    const expanded = `P(x) = ${polyToString(expandedCoeffs, d)}`;

    return { product, expanded };
  }, [coeffs, nInput, points, decimalsInput]);

  // ---------- Gráfica (SVG) ----------
  const graph = useMemo(() => {
    const n = clampInt(parseInt(nInput, 10), 2, 12);

    const xs = [];
    const ys = [];
    for (let i = 0; i < n; i++) {
      const xi = parseNum(points[i]?.x);
      const yi = parseNum(points[i]?.y);
      if (!Number.isFinite(xi) || !Number.isFinite(yi)) {
        return { ok: false, pts: [], curve: [], xMin: -1, xMax: 1, yMin: -1, yMax: 1 };
      }
      xs.push(xi);
      ys.push(yi);
    }

    if (new Set(xs.map(String)).size !== xs.length) {
      return { ok: false, pts: [], curve: [], xMin: -1, xMax: 1, yMin: -1, yMax: 1 };
    }

    // si ya hay coeficientes, graficar polinomio
    if (!coeffs) {
      return {
        ok: true,
        pts: xs.map((x, i) => ({ x, y: ys[i] })),
        curve: [],
        xMin: Math.min(...xs) - 1,
        xMax: Math.max(...xs) + 1,
        yMin: Math.min(...ys) - 1,
        yMax: Math.max(...ys) + 1,
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
    const steps = 160;
    const step = (xMax - xMin) / steps;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * step;
      const y = evalNewton(xs, coeffs, x);
      if (Number.isFinite(y)) curve.push({ x, y });
    }

    const allY = [...ys, ...curve.map((p) => p.y)].filter(Number.isFinite);
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
    };
  }, [points, nInput, coeffs]);

  const width = 520;
  const height = 260;
  const paddingLeft = 48;
  const paddingRight = 12;
  const paddingTop = 12;
  const paddingBottom = 32;

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
      ? graph.curve.map((p, i) => `${i === 0 ? "M" : "L"} ${xToSvg(p.x)} ${yToSvg(p.y)}`).join(" ")
      : "";

  const xAxisY = graph.ok && graph.yMin <= 0 && graph.yMax >= 0 ? yToSvg(0) : yToSvg(graph.yMin);
  const yAxisX = graph.ok && graph.xMin <= 0 && graph.xMax >= 0 ? xToSvg(0) : xToSvg(graph.xMin);

  // ---------- render ----------
  const n = clampInt(parseInt(nInput, 10) || 4, 2, 12);

  return (
    <div className="bisection-grid">
      {/* Form */}
      <div className="bisection-form">
        <h3>Diferencias Divididas de Newton</h3>
        <p className="bisection-hint">
          Ingresa el <strong>dato a interpolar</strong> y los pares (x, y). Se genera la tabla de
          diferencias y el polinomio de Newton en forma de producto y expandida.
        </p>

        <form onSubmit={handleCalculate}>
          <div className="bisection-form-row">
            <label>Ingrese dato a interpolar (a) =</label>
            <input type="number" step="any" value={xEvalInput} onChange={(e) => setXEvalInput(e.target.value)} />
          </div>

          <div className="bisection-form-row">
            <label>Número de puntos (n) =</label>
            <input type="number" min={2} max={12} value={nInput} onChange={(e) => setNPoints(parseInt(e.target.value || "0", 10))} />
          </div>

          <div className="bisection-form-row">
            <label>Número de decimales =</label>
            <input type="number" min={0} value={decimalsInput} onChange={(e) => setDecimalsInput(e.target.value)} />
          </div>

          <div className="bisection-buttons">
            <button type="submit" className="btn-primary">CALCULAR</button>
            <button type="button" className="btn-secondary" onClick={handleClear}>BORRAR CELDAS</button>
          </div>
        </form>

        {/* Tabla de puntos */}
        <div style={{ marginTop: 14 }}>
          <h4 style={{ margin: "8px 0" }}>Puntos (x, y)</h4>
          <table className="bisection-table">
            <thead>
              <tr><th>#</th><th>x</th><th>y</th></tr>
            </thead>
            <tbody>
              {Array.from({ length: n }).map((_, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>
                    <input type="number" step="any" value={points[i]?.x ?? ""} onChange={(e) => updatePoint(i, "x", e.target.value)} style={{ width: "100%" }} />
                  </td>
                  <td>
                    <input type="number" step="any" value={points[i]?.y ?? ""} onChange={(e) => updatePoint(i, "y", e.target.value)} style={{ width: "100%" }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {message && result != null && (
          <p className="bisection-message">
            {message} — P({xEvalInput}) ≈ <strong>{fmt(result)}</strong>
          </p>
        )}
        {errorMsg && <p className="bisection-error">{errorMsg}</p>}
      </div>

      {/* Results */}
      <div className="bisection-results">
        <div className="bisection-table-wrapper">
          <h4>Tabla de diferencias</h4>

          {!table ? (
            <p className="bisection-hint">Ingresa los datos y presiona <strong>CALCULAR</strong>.</p>
          ) : (
            <>
              <table className="bisection-table">
                <thead>
                  <tr>
                    <th>x</th>
                    <th>y</th>
                    {Array.from({ length: n - 1 }).map((_, j) => (
                      <th key={j}>COL {j + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: n }).map((_, i) => (
                    <tr key={i}>
                      <td>{fmt(parseNum(points[i]?.x))}</td>
                      <td className="cell-green">{fmt(table[i][0])}</td>
                      {Array.from({ length: n - 1 }).map((_, j) => {
                        const val = table[i]?.[j + 1];
                        // triangular: solo hasta n-1-i
                        const show = i <= n - 2 - j;
                        return (
                          <td key={j} className={show && i === 0 ? "cell-green" : ""}>
                            {show && val != null ? fmt(val) : ""}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Ecuación (forma Newton / producto)</div>
                <div style={{ fontFamily: "monospace", fontSize: 12, lineHeight: 1.35 }}>
                  {polyStrings.product}
                </div>

                <div style={{ fontWeight: 700, marginTop: 10, marginBottom: 6 }}>Ecuación (expandida)</div>
                <div style={{ fontFamily: "monospace", fontSize: 12, lineHeight: 1.35 }}>
                  {polyStrings.expanded}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Gráfica */}
        <div className="graph-card" style={{ marginTop: 14 }}>
          <h4 className="graph-title">DIFERENCIAS DIVIDIDAS (Puntos en el Plano)</h4>

          {!graph.ok ? (
            <p className="bisection-hint">No se pudo generar la gráfica. Revisa los puntos.</p>
          ) : (
            <svg className="graph-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
              <line x1={paddingLeft} x2={width - paddingRight} y1={xAxisY} y2={xAxisY} stroke="#9ca3af" strokeWidth="1" />
              <line x1={yAxisX} x2={yAxisX} y1={paddingTop} y2={height - paddingBottom} stroke="#9ca3af" strokeWidth="1" />

              {/* Curva */}
              {curvePath && <path d={curvePath} fill="none" stroke="#2563eb" strokeWidth="1.8" />}

              {/* Puntos */}
              {graph.pts.map((p, i) => (
                <circle key={i} cx={xToSvg(p.x)} cy={yToSvg(p.y)} r="3.2" fill="#111827" />
              ))}
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
