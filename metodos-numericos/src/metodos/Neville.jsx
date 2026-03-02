// src/metodos/Neville.jsx
import { useMemo, useState } from "react";
import "./Biseccion.css"; // reutiliza tu layout/estilos base

export default function Neville() {
  // ---- Inputs principales (como la imagen) ----
  const [xEvalInput, setXEvalInput] = useState("8"); // dato a interpolar
  const [nInput, setNInput] = useState("4"); // cantidad de puntos
  const [decimalsInput, setDecimalsInput] = useState("4");

  // Ejemplo de la imagen:
  // (4,5), (6,7), (12,23), (14,56)
  const [points, setPoints] = useState([
    { x: "4", y: "5" },
    { x: "6", y: "7" },
    { x: "12", y: "23" },
    { x: "14", y: "56" },
  ]);

  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // ---- Helpers ----
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
    const n = clampInt(newN, 2, 12); // límite razonable para UI
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

  // ---- Núcleo: Neville (tabla completa) ----
  const computeNevilleTable = (xs, ys, xEval) => {
    const n = xs.length;
    // Q[i][0] = y_i ; Q[i][j] definido para i>=j
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

  // Evaluar solo Q(n-1,n-1) para graficar (sin guardar toda la tabla)
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
        Q[i][j] = ((xEval - xij) * Q[i][j - 1] - (xEval - xi) * Q[i - 1][j - 1]) / denom;
      }
    }
    return Q[n - 1][n - 1];
  };

  // ---- Calcular ----
  const [table, setTable] = useState(null); // matriz Q
  const [result, setResult] = useState(null);

  const handleCalculate = (e) => {
    e.preventDefault();
    setMessage("");
    setErrorMsg("");
    setTable(null);
    setResult(null);

    const n = clampInt(parseInt(nInput, 10), 2, 12);
    if (!Number.isFinite(n)) {
      setErrorMsg("Ingresa un número de puntos válido.");
      return;
    }

    const xEval = parseNum(xEvalInput);
    if (!Number.isFinite(xEval)) {
      setErrorMsg("Ingresa un valor válido para el dato a interpolar (a).");
      return;
    }

    const xs = [];
    const ys = [];
    for (let i = 0; i < n; i++) {
      const xi = parseNum(points[i]?.x);
      const yi = parseNum(points[i]?.y);
      if (!Number.isFinite(xi) || !Number.isFinite(yi)) {
        setErrorMsg("Revisa la tabla de puntos: todos los x y y deben ser numéricos.");
        return;
      }
      xs.push(xi);
      ys.push(yi);
    }

    // validar x distintos
    const setX = new Set(xs.map((v) => String(v)));
    if (setX.size !== xs.length) {
      setErrorMsg("Hay valores de x repetidos. En interpolación, los x deben ser distintos.");
      return;
    }

    const { Q, result: r } = computeNevilleTable(xs, ys, xEval);
    if (!Q || !Number.isFinite(r)) {
      setErrorMsg("No se pudo calcular Neville (revisa puntos y valores).");
      return;
    }

    setTable(Q);
    setResult(r);
    setMessage("SE ENCONTRÓ LA SOLUCIÓN");
  };

  const handleClear = () => {
    setXEvalInput("");
    setNInput("4");
    setDecimalsInput("4");
    setPoints([{ x: "", y: "" }, { x: "", y: "" }, { x: "", y: "" }, { x: "", y: "" }]);
    setTable(null);
    setResult(null);
    setMessage("");
    setErrorMsg("");
  };

  // ---- Gráfica (SVG) ----
  const graph = useMemo(() => {
    const n = clampInt(parseInt(nInput, 10), 2, 12);
    const xEval = parseNum(xEvalInput);

    const xs = [];
    const ys = [];
    for (let i = 0; i < n; i++) {
      const xi = parseNum(points[i]?.x);
      const yi = parseNum(points[i]?.y);
      if (!Number.isFinite(xi) || !Number.isFinite(yi)) {
        return { ok: false, pts: [], curve: [], xMin: -1, xMax: 1, yMin: -1, yMax: 1, xEval: NaN };
      }
      xs.push(xi);
      ys.push(yi);
    }
    if (new Set(xs.map(String)).size !== xs.length) {
      return { ok: false, pts: [], curve: [], xMin: -1, xMax: 1, yMin: -1, yMax: 1, xEval: NaN };
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
    const steps = 140;
    const step = (xMax - xMin) / steps;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * step;
      const y = nevilleEval(xs, ys, x);
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
      xEval: Number.isFinite(xEval) ? xEval : NaN,
    };
  }, [points, nInput, xEvalInput]);

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
      ? graph.curve
          .map((p, i) => `${i === 0 ? "M" : "L"} ${xToSvg(p.x)} ${yToSvg(p.y)}`)
          .join(" ")
      : "";

  const xAxisY = graph.ok && graph.yMin <= 0 && graph.yMax >= 0 ? yToSvg(0) : yToSvg(graph.yMin);
  const yAxisX = graph.ok && graph.xMin <= 0 && graph.xMax >= 0 ? xToSvg(0) : xToSvg(graph.xMin);

  // ---- Render ----
  const n = clampInt(parseInt(nInput, 10) || 4, 2, 12);
  const lastCellIsGreen = table && result != null;

  return (
    <div className="bisection-grid">
      {/* Form */}
      <div className="bisection-form">
        <h3>Aproximación de Neville</h3>
        <p className="bisection-hint">
          Ingresa el <strong>dato a interpolar</strong> y los pares (x, y). La tabla se llena como en Excel:
          <strong> COL 0..COL n-1</strong> y el resultado es <strong>Q(a)</strong>.
        </p>

        <form onSubmit={handleCalculate}>
          <div className="bisection-form-row">
            <label>Ingrese el dato a interpolar (a) =</label>
            <input
              type="number"
              step="any"
              value={xEvalInput}
              onChange={(e) => setXEvalInput(e.target.value)}
            />
          </div>

          <div className="bisection-form-row">
            <label>Número de puntos (n) =</label>
            <input
              type="number"
              min={2}
              max={12}
              value={nInput}
              onChange={(e) => setNPoints(parseInt(e.target.value || "0", 10))}
            />
          </div>

          <div className="bisection-form-row">
            <label>Número de decimales =</label>
            <input
              type="number"
              min={0}
              value={decimalsInput}
              onChange={(e) => setDecimalsInput(e.target.value)}
            />
          </div>

          <div className="bisection-buttons">
            <button type="submit" className="btn-primary">CALCULAR</button>
            <button type="button" className="btn-secondary" onClick={handleClear}>
              BORRAR CELDAS
            </button>
          </div>
        </form>

        {/* Tabla de puntos (como Excel) */}
        <div style={{ marginTop: 14 }}>
          <h4 style={{ margin: "8px 0" }}>Puntos (x, y)</h4>
          <table className="bisection-table">
            <thead>
              <tr>
                <th>#</th>
                <th>x</th>
                <th>y</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: n }).map((_, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>
                    <input
                      type="number"
                      step="any"
                      value={points[i]?.x ?? ""}
                      onChange={(e) => updatePoint(i, "x", e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="any"
                      value={points[i]?.y ?? ""}
                      onChange={(e) => updatePoint(i, "y", e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {message && result != null && (
          <p className="bisection-message">
            {message} — Q({xEvalInput}) ≈ <strong>{fmt(result)}</strong>
          </p>
        )}
        {errorMsg && <p className="bisection-error">{errorMsg}</p>}
      </div>

      {/* Results */}
      <div className="bisection-results">
        <div className="bisection-table-wrapper">
          <h4>Tabla de iteraciones (Neville)</h4>

          {!table ? (
            <p className="bisection-hint">
              Ingresa los datos y presiona <strong>CALCULAR</strong>.
              <br />
              Ejemplo (imagen): a = 8 con (4,5), (6,7), (12,23), (14,56) → Q(8)=5.8
            </p>
          ) : (
            <>
              <table className="bisection-table">
                <thead>
                  <tr>
                    <th>x</th>
                    <th>COL 0</th>
                    {Array.from({ length: n - 1 }).map((_, j) => (
                      <th key={j + 1}>COL {j + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.map((row, i) => (
                    <tr key={i}>
                      <td>{fmt(parseNum(points[i]?.x))}</td>
                      {row.map((cell, j) => {
                        // solo mostrar cuando i>=j (triangular)
                        const show = i >= j;
                        const isLast = i === n - 1 && j === n - 1;
                        return (
                          <td
                            key={`${i}-${j}`}
                            className={isLast && lastCellIsGreen ? "cell-green" : ""}
                          >
                            {show && cell != null ? fmt(cell) : ""}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: 10, textAlign: "center", fontWeight: 700 }}>
                Q({xEvalInput}) ≈ {fmt(result)}
              </div>
            </>
          )}
        </div>

        {/* Gráfica */}
        <div className="graph-card" style={{ marginTop: 14 }}>
          <h4 className="graph-title">NEVILLE (Puntos en el Plano)</h4>

          {!graph.ok ? (
            <p className="bisection-hint">No se pudo generar la gráfica. Revisa los puntos.</p>
          ) : (
            <svg className="graph-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
              {/* Ejes */}
              <line x1={paddingLeft} x2={width - paddingRight} y1={xAxisY} y2={xAxisY} stroke="#9ca3af" strokeWidth="1" />
              <line x1={yAxisX} x2={yAxisX} y1={paddingTop} y2={height - paddingBottom} stroke="#9ca3af" strokeWidth="1" />

              {/* Curva interpolada */}
              <path d={curvePath} fill="none" stroke="#2563eb" strokeWidth="1.8" />

              {/* Puntos */}
              {graph.pts.map((p, i) => (
                <circle key={i} cx={xToSvg(p.x)} cy={yToSvg(p.y)} r="3.2" fill="#111827" />
              ))}

              {/* Línea vertical en a */}
              {Number.isFinite(graph.xEval) && (
                <line
                  x1={xToSvg(graph.xEval)}
                  x2={xToSvg(graph.xEval)}
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
