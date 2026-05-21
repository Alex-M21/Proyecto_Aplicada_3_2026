// src/metodos/NewtonDivididas.jsx
import { useMemo, useRef, useState } from "react";
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
  const [activeXs, setActiveXs] = useState([]);
  const [activeYs, setActiveYs] = useState([]);

  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [warningMsg, setWarningMsg] = useState("");

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const svgRef = useRef(null);

  const width = 760;
  const height = 360;
  const marginLeft = 75;
  const marginRight = 30;
  const marginTop = 35;
  const marginBottom = 70;

  const graphWidth = width - marginLeft - marginRight;
  const graphHeight = height - marginTop - marginBottom;

  const parseNum = (s) => {
    const v = parseFloat(String(s ?? "").replace(",", ".").trim());
    return Number.isFinite(v) ? v : NaN;
  };

  const getDecimals = () => {
    const d = parseInt(decimalsInput, 10);
    return Number.isNaN(d) || d < 0 ? 6 : Math.min(d, 12);
  };

  const fmt = (v) => {
    const d = getDecimals();
    return Number.isFinite(v) ? Number(v).toFixed(d) : "NaN";
  };

  const resetChart = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setDragging(false);
    setDragStart({ x: 0, y: 0 });
  };

  const resetResults = () => {
    setTable(null);
    setCoeffs(null);
    setResult(null);
    setActiveXs([]);
    setActiveYs([]);
    setMessage("");
    setErrorMsg("");
    setWarningMsg("");
    resetChart();
  };

  const setNPoints = (value) => {
    const n = parseInt(value, 10);

    if (!Number.isFinite(n)) {
      setNInput(value);
      return;
    }

    if (n < 2) {
      setErrorMsg("Debes ingresar como mínimo 2 puntos.");
      return;
    }

    setNInput(String(n));

    setPoints((prev) => {
      const copy = [...prev];

      if (copy.length < n) {
        for (let i = copy.length; i < n; i++) {
          copy.push({ x: "", y: "" });
        }
      }

      if (copy.length > n) {
        copy.length = n;
      }

      return copy;
    });

    resetResults();
  };

  const addPoint = () => {
    const nextN = points.length + 1;
    setNInput(String(nextN));
    setPoints((prev) => [...prev, { x: "", y: "" }]);
    resetResults();
  };

  const removePoint = () => {
    if (points.length <= 2) {
      setErrorMsg("No puedes trabajar con menos de 2 puntos.");
      return;
    }

    const nextN = points.length - 1;
    setNInput(String(nextN));
    setPoints((prev) => prev.slice(0, -1));
    resetResults();
  };

  const updatePoint = (idx, key, value) => {
    setPoints((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [key]: value };
      return copy;
    });

    resetResults();
  };

  const sortPointsByX = () => {
    const sorted = [...points].sort((a, b) => parseNum(a.x) - parseNum(b.x));
    setPoints(sorted);
    resetResults();
    setMessage("Los puntos fueron ordenados de menor a mayor según x.");
  };

  const buildDividedDifferences = (xs, ys) => {
    const n = xs.length;
    const dd = Array.from({ length: n }, () => Array(n).fill(null));

    for (let i = 0; i < n; i++) {
      dd[i][0] = ys[i];
    }

    for (let j = 1; j < n; j++) {
      for (let i = 0; i < n - j; i++) {
        const denom = xs[i + j] - xs[i];

        if (Math.abs(denom) < 1e-14) {
          return { dd: null, a: null };
        }

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

    for (let i = 0; i < m; i++) {
      C[i] = (A[i] || 0) + (B[i] || 0);
    }

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

    const termStr = (num) =>
      Number.isFinite(num) ? Number(num).toFixed(d) : "NaN";

    let s = `P(x) = ${termStr(a[0])}`;

    for (let k = 1; k < a.length; k++) {
      let product = "";

      for (let j = 0; j < k; j++) {
        const xj = xs[j];

        if (xj === 0) {
          product += `(x)`;
        } else if (xj < 0) {
          product += `(x + ${Math.abs(xj).toFixed(d)})`;
        } else {
          product += `(x - ${xj.toFixed(d)})`;
        }
      }

      const ak = a[k];
      const sign = ak >= 0 ? " + " : " - ";

      s += `${sign}${Math.abs(ak).toFixed(d)}·${product}`;
    }

    return s;
  };

  const getDividedDifferenceHeader = (order) => {
    if (order === 0) {
      return (
        <div className="dd-header">
          <span className="dd-header-title">Orden 0</span>
          <span className="dd-header-formula">f[xᵢ]</span>
          <span className="dd-header-note">Valores y</span>
        </div>
      );
    }

    if (order === 1) {
      return (
        <div className="dd-header">
          <span className="dd-header-title">Orden 1</span>
          <span className="dd-header-formula">f[xᵢ, xᵢ₊₁]</span>
          <span className="dd-header-note">Primera diferencia</span>
        </div>
      );
    }

    return (
      <div className="dd-header">
        <span className="dd-header-title">Orden {order}</span>
        <span className="dd-header-formula">
          f[xᵢ, xᵢ₊₁, ..., xᵢ₊{order}]
        </span>
        <span className="dd-header-note">
          Diferencia de orden {order}
        </span>
      </div>
    );
  };

  const getDividedDifferenceHeaderText = (order) => {
    if (order === 0) {
      return "Orden 0: f[x_i] / valores y";
    }

    if (order === 1) {
      return "Orden 1: f[x_i,x_i+1] / primera diferencia";
    }

    return `Orden ${order}: f[x_i,x_i+1,...,x_i+${order}]`;
  };

  const handleCalculate = (e) => {
    e.preventDefault();

    resetResults();

    const n = parseInt(nInput, 10);
    const xEval = parseNum(xEvalInput);

    if (!Number.isFinite(n) || n < 2) {
      setErrorMsg("El número de puntos debe ser mayor o igual a 2.");
      return;
    }

    if (!Number.isFinite(xEval)) {
      setErrorMsg("Ingresa un valor válido para el dato a interpolar.");
      return;
    }

    const rawPoints = [];

    for (let i = 0; i < n; i++) {
      const xi = parseNum(points[i]?.x);
      const yi = parseNum(points[i]?.y);

      if (!Number.isFinite(xi) || !Number.isFinite(yi)) {
        setErrorMsg("Todos los valores de la tabla de puntos deben ser numéricos.");
        return;
      }

      rawPoints.push({ x: xi, y: yi });
    }

    const uniqueX = new Set(rawPoints.map((p) => String(p.x)));

    if (uniqueX.size !== rawPoints.length) {
      setErrorMsg("Hay valores de x repetidos. Los valores de x deben ser distintos.");
      return;
    }

    const sortedPoints = [...rawPoints].sort((a, b) => a.x - b.x);
    const wasSorted = rawPoints.every((p, i) => p.x === sortedPoints[i].x);

    const xs = sortedPoints.map((p) => p.x);
    const ys = sortedPoints.map((p) => p.y);

    setPoints(sortedPoints.map((p) => ({ x: String(p.x), y: String(p.y) })));

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

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);

    let warning = "";

    if (!wasSorted) {
      warning = "Los puntos se ordenaron automáticamente de menor a mayor según x.";
    }

    if (xEval < minX || xEval > maxX) {
      warning += warning
        ? " Además, el valor evaluado está fuera del intervalo de datos; esto es extrapolación."
        : "El valor evaluado está fuera del intervalo de datos; esto es extrapolación.";
    }

    setActiveXs(xs);
    setActiveYs(ys);
    setTable(dd);
    setCoeffs(a);
    setResult(yEval);

    if (warning) {
      setWarningMsg(warning);
    }

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
    resetResults();
  };

  const exportCSV = () => {
    if (!table || !activeXs.length) return;

    const n = activeXs.length;

    const headers = [
      "Indice i",
      "Dato x_i",
      ...Array.from({ length: n }).map((_, order) =>
        getDividedDifferenceHeaderText(order)
      ),
    ];

    const csvRows = [headers.join(",")];

    for (let i = 0; i < n; i++) {
      const row = [i, fmt(activeXs[i])];

      for (let j = 0; j < n; j++) {
        const show = j === 0 ? i < n : i <= n - j - 1;
        const val = table[i]?.[j];

        row.push(show && val != null ? fmt(val) : "");
      }

      csvRows.push(row.join(","));
    }

    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "diferencias_divididas_newton.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const downloadChartPNG = () => {
    if (!svgRef.current || !coeffs) return;

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
      link.download = "grafica_diferencias_divididas.png";
      link.click();

      URL.revokeObjectURL(url);
    };

    image.src = url;
  };

  const increaseZoom = () => {
    setZoom((prev) => Math.min(prev * 1.25, 8));
  };

  const decreaseZoom = () => {
    setZoom((prev) => Math.max(prev / 1.25, 0.5));
  };

  const handleWheel = (e) => {
    if (!coeffs) return;

    e.preventDefault();

    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;

    setZoom((prev) => Math.min(Math.max(prev * factor, 0.5), 8));
  };

  const startDrag = (e) => {
    if (!coeffs) return;

    setDragging(true);

    setDragStart({
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    });
  };

  const moveDrag = (e) => {
    if (!dragging) return;

    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const endDrag = () => {
    setDragging(false);
  };

  const polyStrings = useMemo(() => {
    if (!coeffs || !activeXs.length) {
      return { product: "", expanded: "" };
    }

    const d = getDecimals();
    const product = newtonToProductString(activeXs, coeffs, d);
    const expandedCoeffs = polyFromNewton(activeXs, coeffs);
    const expanded = `P(x) = ${polyToString(expandedCoeffs, d)}`;

    return { product, expanded };
  }, [coeffs, activeXs, decimalsInput]);

  const graph = useMemo(() => {
    const xs = activeXs.length
      ? activeXs
      : points.map((p) => parseNum(p.x)).filter(Number.isFinite);

    const ys = activeYs.length
      ? activeYs
      : points.map((p) => parseNum(p.y)).filter(Number.isFinite);

    if (!xs.length || xs.length !== ys.length) {
      return {
        ok: false,
        points: [],
        curve: [],
        xMin: -1,
        xMax: 1,
        yMin: -1,
        yMax: 1,
        xTicks: [],
        yTicks: [],
        xEval: NaN,
        yEval: NaN,
      };
    }

    let baseXMin = Math.min(...xs);
    let baseXMax = Math.max(...xs);

    if (baseXMin === baseXMax) {
      baseXMin -= 1;
      baseXMax += 1;
    } else {
      const margin = (baseXMax - baseXMin) * 0.15;
      baseXMin -= margin;
      baseXMax += margin;
    }

    const xEval = parseNum(xEvalInput);

    if (Number.isFinite(xEval)) {
      baseXMin = Math.min(baseXMin, xEval);
      baseXMax = Math.max(baseXMax, xEval);
    }

    const baseCurve = [];

    if (coeffs && activeXs.length) {
      const steps = 200;
      const step = (baseXMax - baseXMin) / steps;

      for (let i = 0; i <= steps; i++) {
        const x = baseXMin + i * step;
        const y = evalNewton(activeXs, coeffs, x);

        if (Number.isFinite(y)) {
          baseCurve.push({ x, y });
        }
      }
    }

    const yEval =
      coeffs && activeXs.length && Number.isFinite(xEval)
        ? evalNewton(activeXs, coeffs, xEval)
        : NaN;

    const allY = [...ys, ...baseCurve.map((p) => p.y), yEval].filter(
      Number.isFinite
    );

    let baseYMin = allY.length ? Math.min(...allY) : -1;
    let baseYMax = allY.length ? Math.max(...allY) : 1;

    if (baseYMin === baseYMax) {
      baseYMin -= 1;
      baseYMax += 1;
    } else {
      const margin = (baseYMax - baseYMin) * 0.15;
      baseYMin -= margin;
      baseYMax += margin;
    }

    const baseXSpan = baseXMax - baseXMin;
    const baseYSpan = baseYMax - baseYMin;

    const currentZoom = Math.max(zoom, 0.5);

    const visibleXSpan = baseXSpan / currentZoom;
    const visibleYSpan = baseYSpan / currentZoom;

    const shiftX = (-pan.x / graphWidth) * visibleXSpan;
    const shiftY = (pan.y / graphHeight) * visibleYSpan;

    const centerX = (baseXMin + baseXMax) / 2 + shiftX;
    const centerY = (baseYMin + baseYMax) / 2 + shiftY;

    const xMin = centerX - visibleXSpan / 2;
    const xMax = centerX + visibleXSpan / 2;
    const yMin = centerY - visibleYSpan / 2;
    const yMax = centerY + visibleYSpan / 2;

    const curve = [];

    if (coeffs && activeXs.length) {
      const steps = 250;
      const step = (xMax - xMin) / steps;

      for (let i = 0; i <= steps; i++) {
        const x = xMin + i * step;
        const y = evalNewton(activeXs, coeffs, x);

        if (Number.isFinite(y)) {
          curve.push({ x, y });
        }
      }
    }

    const ticks = (min, max, count = 5) =>
      Array.from({ length: count + 1 }, (_, i) => min + (i * (max - min)) / count);

    return {
      ok: true,
      points: xs.map((x, i) => ({ x, y: ys[i] })),
      curve,
      xMin,
      xMax,
      yMin,
      yMax,
      xTicks: ticks(xMin, xMax),
      yTicks: ticks(yMin, yMax),
      xEval,
      yEval,
    };
  }, [points, activeXs, activeYs, coeffs, xEvalInput, zoom, pan]);

  const xToSvg = (x) => {
    if (graph.xMax === graph.xMin) return marginLeft + graphWidth / 2;
    return marginLeft + ((x - graph.xMin) / (graph.xMax - graph.xMin)) * graphWidth;
  };

  const yToSvg = (y) => {
    if (graph.yMax === graph.yMin) return marginTop + graphHeight / 2;
    return marginTop + graphHeight - ((y - graph.yMin) / (graph.yMax - graph.yMin)) * graphHeight;
  };

  const curvePath =
    graph.ok && graph.curve.length
      ? graph.curve
          .map((p, i) => `${i === 0 ? "M" : "L"} ${xToSvg(p.x)} ${yToSvg(p.y)}`)
          .join(" ")
      : "";

  const n = Math.max(2, parseInt(nInput, 10) || 2);

  return (
    <div className="bisection-grid">
      <div className="bisection-form">
        <h3>Diferencias divididas de Newton</h3>

        <p className="bisection-hint">
          Ingresa los puntos conocidos y el valor de <strong>x</strong> a interpolar.
          El programa ordena los puntos, construye la tabla, genera el polinomio y grafica el resultado.
        </p>

        <form onSubmit={handleCalculate}>
          <div className="method-section">
            <h4>Configuración</h4>

            <div className="method-two-columns">
              <div className="bisection-form-row">
                <label>Valor de x =</label>

                <input
                  type="number"
                  step="any"
                  value={xEvalInput}
                  onChange={(e) => {
                    setXEvalInput(e.target.value);
                    resetResults();
                  }}
                  placeholder="Ejemplo: 5"
                />
              </div>

              <div className="bisection-form-row">
                <label>Número de puntos =</label>

                <input
                  type="number"
                  min="2"
                  step="1"
                  value={nInput}
                  onChange={(e) => setNPoints(e.target.value)}
                />
              </div>

              <div className="bisection-form-row">
                <label>Decimales =</label>

                <input
                  type="number"
                  min="0"
                  value={decimalsInput}
                  onChange={(e) => setDecimalsInput(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="method-section">
            <div className="table-header-actions">
              <h4>Tabla de puntos</h4>

              <div className="chart-actions">
                <button type="button" className="btn-export" onClick={addPoint}>
                  Agregar punto
                </button>

                <button type="button" className="btn-export" onClick={removePoint}>
                  Quitar punto
                </button>

                <button type="button" className="btn-export" onClick={sortPointsByX}>
                  Ordenar por x
                </button>
              </div>
            </div>

            <div className="table-scroll">
              <table className="bisection-table">
                <thead>
                  <tr>
                    <th>Punto</th>
                    <th>xᵢ</th>
                    <th>f(xᵢ)</th>
                  </tr>
                </thead>

                <tbody>
                  {Array.from({ length: n }).map((_, i) => (
                    <tr key={`point-${i}`}>
                      <td>P{i + 1}</td>

                      <td>
                        <input
                          type="number"
                          step="any"
                          value={points[i]?.x ?? ""}
                          onChange={(e) => updatePoint(i, "x", e.target.value)}
                          placeholder={`x${i + 1}`}
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          step="any"
                          value={points[i]?.y ?? ""}
                          onChange={(e) => updatePoint(i, "y", e.target.value)}
                          placeholder={`f(x${i + 1})`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
        {warningMsg && <p className="bisection-warning">{warningMsg}</p>}
        {errorMsg && <p className="bisection-error">{errorMsg}</p>}
      </div>

      <div className="bisection-results">
        <div className="graph-card">
          <h4 className="graph-title">Respuesta final</h4>

          {result !== null ? (
            <div className="method-result-grid">
              <div className="mini-info-card">
                <div className="mini-info-card-title">Valor evaluado</div>
                <div className="mini-info-card-value">x = {fmt(parseNum(xEvalInput))}</div>
              </div>

              <div className="mini-info-card">
                <div className="mini-info-card-title">Resultado</div>
                <div className="mini-info-card-value">P(x) = {fmt(result)}</div>
              </div>

              <div className="mini-info-card">
                <div className="mini-info-card-title">Puntos usados</div>
                <div className="mini-info-card-value">{activeXs.length}</div>
              </div>

              <div className="mini-info-card">
                <div className="mini-info-card-title">Grado máximo</div>
                <div className="mini-info-card-value">{activeXs.length - 1}</div>
              </div>
            </div>
          ) : (
            <p className="bisection-hint">
              Aún no hay resultado. Completa los datos y presiona <strong>CALCULAR</strong>.
            </p>
          )}
        </div>

        <div className="graph-card">
          <h4 className="graph-title">Polinomio interpolante</h4>

          {!coeffs ? (
            <p className="bisection-hint">
              Aquí aparecerá el polinomio después de calcular.
            </p>
          ) : (
            <div className="system-preview">
              <p>
                <strong>Forma de Newton:</strong>
              </p>
              <p>{polyStrings.product}</p>

              <p>
                <strong>Forma expandida:</strong>
              </p>
              <p>{polyStrings.expanded}</p>
            </div>
          )}
        </div>

        <div className="graph-card">
          <h4 className="graph-title">Coeficientes</h4>

          {!coeffs ? (
            <p className="bisection-hint">
              Los coeficientes aparecerán después de calcular.
            </p>
          ) : (
            <div className="method-result-grid">
              {coeffs.map((c, i) => (
                <div className="mini-info-card" key={`coef-${i}`}>
                  <div className="mini-info-card-title">a{i}</div>
                  <div className="mini-info-card-value">{fmt(c)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bisection-results full-width-results">
        <div className="graph-card">
          <div className="table-header-actions">
            <h4 className="graph-title">Gráfica interactiva del polinomio</h4>

            <div className="chart-actions">
              <button type="button" className="btn-export" onClick={increaseZoom}>
                +
              </button>

              <button type="button" className="btn-export" onClick={decreaseZoom}>
                -
              </button>

              <button type="button" className="btn-export" onClick={resetChart}>
                Reiniciar
              </button>

              <button
                type="button"
                className="btn-export"
                onClick={downloadChartPNG}
                disabled={!coeffs}
              >
                PNG
              </button>
            </div>
          </div>

          {!graph.ok ? (
            <p className="bisection-hint">
              La gráfica aparecerá después de ingresar puntos válidos.
            </p>
          ) : (
            <>
              <p className="bisection-hint">
                Usa la rueda del mouse para acercar o alejar. Arrastra la gráfica para desplazarla.
                Los valores de los ejes se actualizan con el zoom y el desplazamiento.
              </p>

              <div className="interactive-chart-wrapper">
                <svg
                  ref={svgRef}
                  className="error-chart"
                  viewBox={`0 0 ${width} ${height}`}
                  role="img"
                  aria-label="Gráfica del polinomio interpolante"
                  onWheel={handleWheel}
                  onMouseDown={startDrag}
                  onMouseMove={moveDrag}
                  onMouseUp={endDrag}
                  onMouseLeave={endDrag}
                >
                  <style>
                    {`
                      .chart-axis { stroke: #334155; stroke-width: 1.5; }
                      .chart-grid-line { stroke: #e2e8f0; stroke-width: 1; }
                      .chart-line { stroke: #2563eb; stroke-width: 2.5; }
                      .chart-point { fill: #111827; stroke: white; stroke-width: 1.5; }
                      .chart-eval-point { fill: #dc2626; stroke: white; stroke-width: 1.5; }
                      .chart-label { font-size: 11px; fill: #334155; }
                      .chart-axis-title { font-size: 13px; fill: #0f172a; font-weight: 700; }
                      .chart-title-text { font-size: 16px; fill: #111827; font-weight: 800; }
                    `}
                  </style>

                  <rect x="0" y="0" width={width} height={height} fill="white" />

                  <text x={width / 2 - 125} y="22" className="chart-title-text">
                    Polinomio interpolante de Newton
                  </text>

                  {graph.yTicks.map((tick, index) => (
                    <g key={`ytick-${index}`}>
                      <line
                        x1={marginLeft}
                        y1={yToSvg(tick)}
                        x2={marginLeft + graphWidth}
                        y2={yToSvg(tick)}
                        className="chart-grid-line"
                      />

                      <text x="8" y={yToSvg(tick) + 4} className="chart-label">
                        {fmt(tick)}
                      </text>
                    </g>
                  ))}

                  {graph.xTicks.map((tick, index) => (
                    <g key={`xtick-${index}`}>
                      <line
                        x1={xToSvg(tick)}
                        y1={marginTop}
                        x2={xToSvg(tick)}
                        y2={marginTop + graphHeight}
                        className="chart-grid-line"
                      />

                      <text
                        x={xToSvg(tick) - 8}
                        y={marginTop + graphHeight + 22}
                        className="chart-label"
                      >
                        {fmt(tick)}
                      </text>
                    </g>
                  ))}

                  <line
                    x1={marginLeft}
                    y1={marginTop + graphHeight}
                    x2={marginLeft + graphWidth}
                    y2={marginTop + graphHeight}
                    className="chart-axis"
                  />

                  <line
                    x1={marginLeft}
                    y1={marginTop}
                    x2={marginLeft}
                    y2={marginTop + graphHeight}
                    className="chart-axis"
                  />

                  <text
                    x={width / 2 - 35}
                    y={height - 18}
                    className="chart-axis-title"
                  >
                    Eje X
                  </text>

                  <text
                    x="-215"
                    y="18"
                    transform="rotate(-90)"
                    className="chart-axis-title"
                  >
                    Eje Y
                  </text>

                  <defs>
                    <clipPath id="plot-area-clip-newton-divididas">
                      <rect
                        x={marginLeft}
                        y={marginTop}
                        width={graphWidth}
                        height={graphHeight}
                      />
                    </clipPath>
                  </defs>

                  <g
                    clipPath="url(#plot-area-clip-newton-divididas)"
                    className={dragging ? "chart-dragging" : "chart-draggable"}
                  >
                    {curvePath && (
                      <path d={curvePath} className="chart-line" fill="none" />
                    )}

                    {graph.points.map((p, i) => (
                      <circle
                        key={`point-${i}`}
                        cx={xToSvg(p.x)}
                        cy={yToSvg(p.y)}
                        r="4"
                        className="chart-point"
                      >
                        <title>
                          Punto {i + 1}: ({fmt(p.x)}, {fmt(p.y)})
                        </title>
                      </circle>
                    ))}

                    {Number.isFinite(graph.xEval) &&
                      Number.isFinite(graph.yEval) && (
                        <>
                          <line
                            x1={xToSvg(graph.xEval)}
                            y1={marginTop}
                            x2={xToSvg(graph.xEval)}
                            y2={marginTop + graphHeight}
                            stroke="#dc2626"
                            strokeWidth="1.4"
                            strokeDasharray="5 4"
                          />

                          <circle
                            cx={xToSvg(graph.xEval)}
                            cy={yToSvg(graph.yEval)}
                            r="5"
                            className="chart-eval-point"
                          >
                            <title>
                              P({fmt(graph.xEval)}) = {fmt(graph.yEval)}
                            </title>
                          </circle>
                        </>
                      )}
                  </g>
                </svg>
              </div>
            </>
          )}
        </div>

        <div className="bisection-table-wrapper">
          <div className="table-header-actions">
            <h4>Tabla de diferencias divididas</h4>

            <button
              type="button"
              className="btn-export"
              onClick={exportCSV}
              disabled={!table}
            >
              Descargar CSV
            </button>
          </div>

          {!table ? (
            <p className="bisection-hint">
              Ingresa los datos y presiona <strong>CALCULAR</strong>.
              Los coeficientes del polinomio son los valores de la primera fila.
            </p>
          ) : (
            <div className="table-scroll">
              <table className="bisection-table">
                <thead>
                  <tr>
                    <th>
                      <div className="dd-header">
                        <span className="dd-header-title">Índice</span>
                        <span className="dd-header-formula">i</span>
                      </div>
                    </th>

                    <th>
                      <div className="dd-header">
                        <span className="dd-header-title">Dato x</span>
                        <span className="dd-header-formula">xᵢ</span>
                      </div>
                    </th>

                    {Array.from({ length: activeXs.length }).map((_, order) => (
                      <th key={`header-${order}`}>
                        {getDividedDifferenceHeader(order)}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {Array.from({ length: activeXs.length }).map((_, i) => (
                    <tr key={`row-${i}`}>
                      <td>{i}</td>
                      <td>{fmt(activeXs[i])}</td>

                      {Array.from({ length: activeXs.length }).map((_, j) => {
                        const show =
                          j === 0
                            ? i < activeXs.length
                            : i <= activeXs.length - j - 1;

                        const val = table[i]?.[j];
                        const isCoeff = i === 0 && val != null;

                        return (
                          <td
                            key={`dd-${i}-${j}`}
                            className={isCoeff ? "cell-green" : ""}
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
          )}
        </div>
      </div>
    </div>
  );
}