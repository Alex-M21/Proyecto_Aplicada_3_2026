// src/metodos/Lagrange.jsx
import { useMemo, useRef, useState } from "react";
import "./Biseccion.css";

export default function Lagrange() {
  const [xEvalInput, setXEvalInput] = useState("7");
  const [nInput, setNInput] = useState("4");
  const [decimalsInput, setDecimalsInput] = useState("5");

  const [points, setPoints] = useState([
    { x: "4", y: "9" },
    { x: "8", y: "12" },
    { x: "12", y: "11" },
    { x: "15", y: "23" },
  ]);

  const [resultValue, setResultValue] = useState(null);
  const [activeXs, setActiveXs] = useState([]);
  const [activeYs, setActiveYs] = useState([]);
  const [basisDetails, setBasisDetails] = useState([]);
  const [expandedCoeffs, setExpandedCoeffs] = useState(null);

  const [polyLagrange, setPolyLagrange] = useState("");
  const [polyFactorized, setPolyFactorized] = useState("");
  const [polyExpanded, setPolyExpanded] = useState("");

  const [message, setMessage] = useState("");
  const [warningMsg, setWarningMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

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

  const parseNum = (value) => {
    const v = parseFloat(String(value ?? "").replace(",", ".").trim());
    return Number.isFinite(v) ? v : NaN;
  };

  const getDecimals = () => {
    const d = parseInt(decimalsInput, 10);
    return Number.isNaN(d) || d < 0 ? 6 : Math.min(d, 12);
  };

  const fmt = (value) => {
    const d = getDecimals();
    return Number.isFinite(value) ? Number(value).toFixed(d) : "NaN";
  };

  const compactNumber = (value) => {
    if (!Number.isFinite(value)) return "NaN";

    if (Math.abs(value - Math.round(value)) < 1e-12) {
      return String(Math.round(value));
    }

    return Number(value).toFixed(getDecimals());
  };

  const resetChart = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setDragging(false);
    setDragStart({ x: 0, y: 0 });
  };

  const resetResults = () => {
    setResultValue(null);
    setActiveXs([]);
    setActiveYs([]);
    setBasisDetails([]);
    setExpandedCoeffs(null);
    setPolyLagrange("");
    setPolyFactorized("");
    setPolyExpanded("");
    setMessage("");
    setWarningMsg("");
    setErrorMsg("");
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

  const updatePoint = (index, key, value) => {
    setPoints((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
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

  const polyAdd = (a, b) => {
    const n = Math.max(a.length, b.length);
    const out = Array(n).fill(0);

    for (let i = 0; i < n; i++) {
      out[i] = (a[i] || 0) + (b[i] || 0);
    }

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

  const polyScale = (poly, factor) => {
    return poly.map((value) => value * factor);
  };

  const coeffsToString = (coeffs) => {
    const d = getDecimals();
    const eps = 10 ** (-(d + 2));
    let output = "";

    for (let power = coeffs.length - 1; power >= 0; power--) {
      const value = coeffs[power];

      if (!Number.isFinite(value) || Math.abs(value) < eps) continue;

      const sign = value >= 0 ? "+" : "-";
      const abs = Math.abs(value);
      const coeff = Number(abs.toFixed(d));

      let term = "";

      if (power === 0) {
        term = `${coeff}`;
      } else if (power === 1) {
        term = `${coeff}x`;
      } else {
        term = `${coeff}x^${power}`;
      }

      if (!output) {
        output = value < 0 ? `-${term}` : term;
      } else {
        output += ` ${sign} ${term}`;
      }
    }

    return output || "0";
  };

  const buildExpandedCoeffs = (xs, ys) => {
    const n = xs.length;
    let polynomial = [0];

    for (let i = 0; i < n; i++) {
      let basis = [1];
      let denominator = 1;

      for (let j = 0; j < n; j++) {
        if (j === i) continue;

        basis = polyMul(basis, [-xs[j], 1]);
        denominator *= xs[i] - xs[j];
      }

      const factor = ys[i] / denominator;
      polynomial = polyAdd(polynomial, polyScale(basis, factor));
    }

    return polynomial.map((value) => (Math.abs(value) < 1e-12 ? 0 : value));
  };

  const evalLagrange = (xs, ys, xEval) => {
    const n = xs.length;
    let result = 0;

    for (let i = 0; i < n; i++) {
      let Li = 1;

      for (let j = 0; j < n; j++) {
        if (j === i) continue;

        Li *= (xEval - xs[j]) / (xs[i] - xs[j]);
      }

      result += ys[i] * Li;
    }

    return result;
  };

  const buildBasisDetails = (xs, ys) => {
    const n = xs.length;
    const details = [];

    for (let i = 0; i < n; i++) {
      let denominator = 1;
      const numeratorFactors = [];
      const denominatorFactors = [];

      for (let j = 0; j < n; j++) {
        if (j === i) continue;

        numeratorFactors.push(`(x - ${compactNumber(xs[j])})`);
        denominatorFactors.push(`(${compactNumber(xs[i])} - ${compactNumber(xs[j])})`);
        denominator *= xs[i] - xs[j];
      }

      const Li = numeratorFactors.length
        ? `${numeratorFactors.join(" · ")} / ${compactNumber(denominator)}`
        : "1";

      const termCoefficient = ys[i] / denominator;

      const factorizedTerm = numeratorFactors.length
        ? `${compactNumber(termCoefficient)} · ${numeratorFactors.join(" · ")}`
        : `${compactNumber(ys[i])}`;

      details.push({
        index: i,
        xi: xs[i],
        yi: ys[i],
        denominator,
        denominatorFactors: denominatorFactors.join(" · "),
        Li,
        termCoefficient,
        factorizedTerm,
      });
    }

    return details;
  };

  const buildLagrangeString = (details) => {
    const terms = details.map((detail) => {
      return `${compactNumber(detail.yi)} · [${detail.Li}]`;
    });

    return `P(x) = ${terms.join(" + ")}`;
  };

  const buildFactorizedString = (details) => {
    const terms = details.map((detail) => detail.factorizedTerm);
    return `P(x) = ${terms.join(" + ")}`;
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
      setErrorMsg("Ingresa un valor numérico válido para evaluar x.");
      return;
    }

    const rawPoints = [];

    for (let i = 0; i < n; i++) {
      const xi = parseNum(points[i]?.x);
      const yi = parseNum(points[i]?.y);

      if (!Number.isFinite(xi) || !Number.isFinite(yi)) {
        setErrorMsg("Todos los puntos deben tener valores numéricos en x e y.");
        return;
      }

      rawPoints.push({ x: xi, y: yi });
    }

    const uniqueX = new Set(rawPoints.map((point) => String(point.x)));

    if (uniqueX.size !== rawPoints.length) {
      setErrorMsg("Hay valores repetidos en x. Para Lagrange, todos los x deben ser distintos.");
      return;
    }

    const sortedPoints = [...rawPoints].sort((a, b) => a.x - b.x);
    const wasSorted = rawPoints.every((point, i) => point.x === sortedPoints[i].x);

    const xs = sortedPoints.map((point) => point.x);
    const ys = sortedPoints.map((point) => point.y);

    setPoints(sortedPoints.map((point) => ({
      x: String(point.x),
      y: String(point.y),
    })));

    const result = evalLagrange(xs, ys, xEval);
    const details = buildBasisDetails(xs, ys);
    const coeffs = buildExpandedCoeffs(xs, ys);

    if (!Number.isFinite(result)) {
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
    setBasisDetails(details);
    setExpandedCoeffs(coeffs);

    setPolyLagrange(buildLagrangeString(details));
    setPolyFactorized(buildFactorizedString(details));
    setPolyExpanded(`P(x) = ${coeffsToString(coeffs)}`);

    setResultValue(result);

    if (warning) {
      setWarningMsg(warning);
    }

    setMessage(`Se evaluó correctamente el polinomio interpolante en x = ${fmt(xEval)}.`);
  };

  const handleClear = () => {
    setXEvalInput("");
    setNInput("4");
    setDecimalsInput("5");
    setPoints([
      { x: "", y: "" },
      { x: "", y: "" },
      { x: "", y: "" },
      { x: "", y: "" },
    ]);
    resetResults();
  };

  const quoteCSV = (value) => {
    const text = String(value ?? "");
    return `"${text.replaceAll('"', '""')}"`;
  };

  const exportCSV = () => {
    if (!basisDetails.length) return;

    const headers = [
      "i",
      "x_i",
      "f(x_i)",
      "Denominador de L_i",
      "L_i(x)",
      "Coeficiente del termino",
      "Termino del polinomio",
    ];

    const rows = basisDetails.map((detail) => [
      detail.index,
      fmt(detail.xi),
      fmt(detail.yi),
      fmt(detail.denominator),
      detail.Li,
      fmt(detail.termCoefficient),
      detail.factorizedTerm,
    ]);

    const csv = [
      headers.map(quoteCSV).join(","),
      ...rows.map((row) => row.map(quoteCSV).join(",")),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "lagrange_paso_a_paso.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const downloadChartPNG = () => {
    if (!svgRef.current || !expandedCoeffs) return;

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
      link.download = "grafica_lagrange.png";
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
    if (!expandedCoeffs) return;

    e.preventDefault();

    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;

    setZoom((prev) => Math.min(Math.max(prev * factor, 0.5), 8));
  };

  const startDrag = (e) => {
    if (!expandedCoeffs) return;

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

  const graph = useMemo(() => {
    const xs = activeXs.length
      ? activeXs
      : points.map((point) => parseNum(point.x)).filter(Number.isFinite);

    const ys = activeYs.length
      ? activeYs
      : points.map((point) => parseNum(point.y)).filter(Number.isFinite);

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

    if (expandedCoeffs && activeXs.length) {
      const steps = 200;
      const step = (baseXMax - baseXMin) / steps;

      for (let i = 0; i <= steps; i++) {
        const x = baseXMin + i * step;
        const y = evalLagrange(activeXs, activeYs, x);

        if (Number.isFinite(y)) {
          baseCurve.push({ x, y });
        }
      }
    }

    const yEval =
      expandedCoeffs && activeXs.length && Number.isFinite(xEval)
        ? evalLagrange(activeXs, activeYs, xEval)
        : NaN;

    const allY = [...ys, ...baseCurve.map((point) => point.y), yEval].filter(
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

    if (expandedCoeffs && activeXs.length) {
      const steps = 250;
      const step = (xMax - xMin) / steps;

      for (let i = 0; i <= steps; i++) {
        const x = xMin + i * step;
        const y = evalLagrange(activeXs, activeYs, x);

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
  }, [points, activeXs, activeYs, expandedCoeffs, xEvalInput, zoom, pan]);

  const xToSvg = (x) => {
    if (graph.xMax === graph.xMin) return marginLeft + graphWidth / 2;

    return (
      marginLeft +
      ((x - graph.xMin) / (graph.xMax - graph.xMin)) * graphWidth
    );
  };

  const yToSvg = (y) => {
    if (graph.yMax === graph.yMin) return marginTop + graphHeight / 2;

    return (
      marginTop +
      graphHeight -
      ((y - graph.yMin) / (graph.yMax - graph.yMin)) * graphHeight
    );
  };

  const curvePath =
    graph.ok && graph.curve.length
      ? graph.curve
          .map((point, index) =>
            `${index === 0 ? "M" : "L"} ${xToSvg(point.x)} ${yToSvg(point.y)}`
          )
          .join(" ")
      : "";

  const n = Math.max(2, parseInt(nInput, 10) || 2);

  return (
  <div className="bisection-grid">
    <div className="bisection-form">
      <h3>Interpolación de Lagrange</h3>

      <p className="bisection-hint">
        Ingresa los puntos conocidos y el valor de <strong>x</strong> que deseas interpolar.
        El programa construye las bases Lᵢ(x), arma el polinomio y evalúa el resultado.
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
                placeholder="Ejemplo: 7"
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

          <p className="bisection-hint">
            Grado máximo del polinomio: <strong>{n - 1}</strong>
          </p>
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

        {resultValue !== null ? (
          <div className="method-result-grid">
            <div className="mini-info-card">
              <div className="mini-info-card-title">Valor evaluado</div>
              <div className="mini-info-card-value">
                x = {fmt(parseNum(xEvalInput))}
              </div>
            </div>

            <div className="mini-info-card">
              <div className="mini-info-card-title">Resultado</div>
              <div className="mini-info-card-value">
                P(x) = {fmt(resultValue)}
              </div>
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
            Aún no hay resultado. Completa los datos y presiona{" "}
            <strong>CALCULAR</strong>.
          </p>
        )}
      </div>

      <div className="graph-card">
        <h4 className="graph-title">Polinomio interpolante</h4>

        {!polyLagrange && !polyFactorized && !polyExpanded ? (
          <p className="bisection-hint">
            Aquí aparecerá el polinomio después de calcular.
          </p>
        ) : (
          <div className="system-preview">
            <p>
              <strong>Forma de Lagrange:</strong>
            </p>
            <p>{polyLagrange}</p>

            <p>
              <strong>Forma factorizada:</strong>
            </p>
            <p>{polyFactorized}</p>

            <p>
              <strong>Forma expandida:</strong>
            </p>
            <p>{polyExpanded}</p>
          </div>
        )}
      </div>

      <div className="graph-card">
        <div className="table-header-actions">
          <h4 className="graph-title">Gráfica interactiva de Lagrange</h4>

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
              disabled={!expandedCoeffs}
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
              Usa la rueda del mouse para acercar o alejar. Arrastra la gráfica
              para desplazarla. Los valores de los ejes se actualizan con el zoom
              y el desplazamiento.
            </p>

            <div className="interactive-chart-wrapper">
              <svg
                ref={svgRef}
                className="error-chart"
                viewBox={`0 0 ${width} ${height}`}
                role="img"
                aria-label="Gráfica del polinomio de Lagrange"
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

                <text x={width / 2 - 130} y="22" className="chart-title-text">
                  Polinomio interpolante de Lagrange
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
                  <clipPath id="plot-area-clip-lagrange">
                    <rect
                      x={marginLeft}
                      y={marginTop}
                      width={graphWidth}
                      height={graphHeight}
                    />
                  </clipPath>
                </defs>

                <g
                  clipPath="url(#plot-area-clip-lagrange)"
                  className={dragging ? "chart-dragging" : "chart-draggable"}
                >
                  {curvePath && (
                    <path d={curvePath} className="chart-line" fill="none" />
                  )}

                  {graph.points.map((point, index) => (
                    <circle
                      key={`point-${index}`}
                      cx={xToSvg(point.x)}
                      cy={yToSvg(point.y)}
                      r="4"
                      className="chart-point"
                    >
                      <title>
                        Punto {index + 1}: ({fmt(point.x)}, {fmt(point.y)})
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
          <h4>Construcción paso a paso de Lagrange</h4>

          <button
            type="button"
            className="btn-export"
            onClick={exportCSV}
            disabled={!basisDetails.length}
          >
            Descargar CSV
          </button>
        </div>

        {!basisDetails.length ? (
          <p className="bisection-hint">
            Ingresa los datos y presiona <strong>CALCULAR</strong>.
            Aquí aparecerá la construcción de cada base Lᵢ(x).
          </p>
        ) : (
          <div className="table-scroll">
            <table className="bisection-table">
              <thead>
                <tr>
                  <th>i</th>
                  <th>xᵢ</th>
                  <th>f(xᵢ)</th>
                  <th>Denominador</th>
                  <th>Lᵢ(x)</th>
                  <th>Coeficiente</th>
                  <th>Término</th>
                </tr>
              </thead>

              <tbody>
                {basisDetails.map((detail) => (
                  <tr key={`basis-${detail.index}`}>
                    <td>{detail.index}</td>
                    <td>{fmt(detail.xi)}</td>
                    <td>{fmt(detail.yi)}</td>
                    <td>{fmt(detail.denominator)}</td>
                    <td>{detail.Li}</td>
                    <td>{fmt(detail.termCoefficient)}</td>
                    <td>{detail.factorizedTerm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {resultValue !== null && (
          <p className="bisection-message">
            Resultado final: P({fmt(parseNum(xEvalInput))}) = {fmt(resultValue)}
          </p>
        )}
      </div>
    </div>
  </div>
);
}