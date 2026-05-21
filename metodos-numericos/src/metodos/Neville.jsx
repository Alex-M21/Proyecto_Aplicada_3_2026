// src/metodos/Neville.jsx
import { useMemo, useRef, useState } from "react";
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

  const [table, setTable] = useState(null);
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

  const resetChart = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setDragging(false);
    setDragStart({ x: 0, y: 0 });
  };

  const resetResults = () => {
    setTable(null);
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

  const computeNevilleTable = (xs, ys, xEval) => {
    const n = xs.length;
    const Q = Array.from({ length: n }, () => Array(n).fill(null));

    for (let i = 0; i < n; i++) {
      Q[i][0] = ys[i];
    }

    for (let j = 1; j < n; j++) {
      for (let i = j; i < n; i++) {
        const xi = xs[i];
        const xij = xs[i - j];
        const denom = xi - xij;

        if (Math.abs(denom) < 1e-14) {
          return { Q: null, result: NaN };
        }

        const a = (xEval - xij) * Q[i][j - 1];
        const b = (xEval - xi) * Q[i - 1][j - 1];

        Q[i][j] = (a - b) / denom;
      }
    }

    return { Q, result: Q[n - 1][n - 1] };
  };

  const nevilleEval = (xs, ys, xEval) => {
    const { result: value } = computeNevilleTable(xs, ys, xEval);
    return value;
  };

  const getNevilleHeader = (order) => {
    if (order === 0) {
      return (
        <div className="dd-header">
          <span className="dd-header-title">Orden 0</span>
          <span className="dd-header-formula">Qᵢ,₀</span>
          <span className="dd-header-note">f(xᵢ)</span>
        </div>
      );
    }

    if (order === 1) {
      return (
        <div className="dd-header">
          <span className="dd-header-title">Orden 1</span>
          <span className="dd-header-formula">Qᵢ,₁</span>
          <span className="dd-header-note">2 puntos</span>
        </div>
      );
    }

    return (
      <div className="dd-header">
        <span className="dd-header-title">Orden {order}</span>
        <span className="dd-header-formula">Qᵢ,{order}</span>
        <span className="dd-header-note">{order + 1} puntos</span>
      </div>
    );
  };

  const getNevilleHeaderText = (order) => {
    if (order === 0) {
      return "Orden 0: Q_i0 = f(x_i)";
    }

    if (order === 1) {
      return "Orden 1: Q_i1 / interpolacion con 2 puntos";
    }

    return `Orden ${order}: Q_i${order} / interpolacion con ${
      order + 1
    } puntos`;
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
      setErrorMsg("Ingresa un valor válido para x.");
      return;
    }

    const rawPoints = [];

    for (let i = 0; i < n; i++) {
      const xi = parseNum(points[i]?.x);
      const yi = parseNum(points[i]?.y);

      if (!Number.isFinite(xi) || !Number.isFinite(yi)) {
        setErrorMsg(
          "Todos los valores de la tabla de puntos deben ser numéricos."
        );
        return;
      }

      rawPoints.push({ x: xi, y: yi });
    }

    const uniqueX = new Set(rawPoints.map((p) => String(p.x)));

    if (uniqueX.size !== rawPoints.length) {
      setErrorMsg(
        "Hay valores de x repetidos. Los valores de x deben ser distintos."
      );
      return;
    }

    const sortedPoints = [...rawPoints].sort((a, b) => a.x - b.x);
    const wasSorted = rawPoints.every((p, i) => p.x === sortedPoints[i].x);

    const xs = sortedPoints.map((p) => p.x);
    const ys = sortedPoints.map((p) => p.y);

    setPoints(sortedPoints.map((p) => ({ x: String(p.x), y: String(p.y) })));

    const { Q, result: r } = computeNevilleTable(xs, ys, xEval);

    if (!Q || !Number.isFinite(r)) {
      setErrorMsg("No se pudo calcular el método de Neville.");
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
    setTable(Q);
    setResult(r);

    if (warning) {
      setWarningMsg(warning);
    }

    setMessage(
      `Se evaluó correctamente el método de Neville en x = ${fmt(xEval)}.`
    );
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
        getNevilleHeaderText(order)
      ),
    ];

    const csvRows = [headers.join(",")];

    for (let i = 0; i < n; i++) {
      const row = [i, fmt(activeXs[i])];

      for (let j = 0; j < n; j++) {
        const show = i >= j;
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
    link.download = "tabla_neville.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const downloadChartPNG = () => {
    if (!svgRef.current || !table) return;

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
      link.download = "grafica_neville.png";
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
    if (!table) return;

    e.preventDefault();

    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;

    setZoom((prev) => Math.min(Math.max(prev * factor, 0.5), 8));
  };

  const startDrag = (e) => {
    if (!table) return;

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

    if (table && activeXs.length) {
      const steps = 200;
      const step = (baseXMax - baseXMin) / steps;

      for (let i = 0; i <= steps; i++) {
        const x = baseXMin + i * step;
        const y = nevilleEval(activeXs, activeYs, x);

        if (Number.isFinite(y)) {
          baseCurve.push({ x, y });
        }
      }
    }

    const yEval =
      table && activeXs.length && Number.isFinite(xEval)
        ? nevilleEval(activeXs, activeYs, xEval)
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

    if (table && activeXs.length) {
      const steps = 250;
      const step = (xMax - xMin) / steps;

      for (let i = 0; i <= steps; i++) {
        const x = xMin + i * step;
        const y = nevilleEval(activeXs, activeYs, x);

        if (Number.isFinite(y)) {
          curve.push({ x, y });
        }
      }
    }

    const ticks = (min, max, count = 5) =>
      Array.from(
        { length: count + 1 },
        (_, i) => min + (i * (max - min)) / count
      );

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
  }, [points, activeXs, activeYs, table, xEvalInput, zoom, pan]);

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
          .map(
            (p, i) =>
              `${i === 0 ? "M" : "L"} ${xToSvg(p.x)} ${yToSvg(p.y)}`
          )
          .join(" ")
      : "";

  const n = Math.max(2, parseInt(nInput, 10) || 2);

  return (
    <div className="bisection-grid">
      <div className="bisection-form">
        <h3>Método de Neville</h3>

        <p className="bisection-hint">
          Ingresa el valor de <strong>x</strong> a interpolar y los puntos
          conocidos. El método construye una tabla triangular Qᵢ,ⱼ y el resultado
          final aparece en la última fila y última columna.
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
                  placeholder="Ejemplo: 8"
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

                <button
                  type="button"
                  className="btn-export"
                  onClick={removePoint}
                >
                  Quitar punto
                </button>

                <button
                  type="button"
                  className="btn-export"
                  onClick={sortPointsByX}
                >
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
                <div className="mini-info-card-value">
                  x = {fmt(parseNum(xEvalInput))}
                </div>
              </div>

              <div className="mini-info-card">
                <div className="mini-info-card-title">Resultado</div>
                <div className="mini-info-card-value">Q(x) = {fmt(result)}</div>
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
      </div>

      <div className="bisection-results full-width-results">
        <div className="graph-card">
          <div className="table-header-actions">
            <h4 className="graph-title">Gráfica interactiva de Neville</h4>

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
                disabled={!table}
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
                para desplazarla. Los valores de los ejes se actualizan con el
                zoom y el desplazamiento.
              </p>

              <div className="interactive-chart-wrapper">
                <svg
                  ref={svgRef}
                  className="error-chart"
                  viewBox={`0 0 ${width} ${height}`}
                  role="img"
                  aria-label="Gráfica del método de Neville"
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

                  <text x={width / 2 - 95} y="22" className="chart-title-text">
                    Interpolación por Neville
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
                    <clipPath id="plot-area-clip-neville">
                      <rect
                        x={marginLeft}
                        y={marginTop}
                        width={graphWidth}
                        height={graphHeight}
                      />
                    </clipPath>
                  </defs>

                  <g
                    clipPath="url(#plot-area-clip-neville)"
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
                              Q({fmt(graph.xEval)}) = {fmt(graph.yEval)}
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
            <h4>Tabla de Neville</h4>

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
              Ingresa los datos y presiona <strong>CALCULAR</strong>. El resultado
              final aparece en la última fila y última columna.
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
                      <th key={`neville-header-${order}`}>
                        {getNevilleHeader(order)}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {table.map((row, i) => (
                    <tr key={`neville-row-${i}`}>
                      <td>{i}</td>
                      <td>{fmt(activeXs[i])}</td>

                      {row.map((cell, j) => {
                        const show = i >= j;
                        const isLast =
                          i === activeXs.length - 1 &&
                          j === activeXs.length - 1;

                        return (
                          <td
                            key={`neville-${i}-${j}`}
                            className={isLast ? "cell-green" : ""}
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
          )}

          {table && result !== null && (
            <p className="bisection-message">
              Resultado final: Q({fmt(parseNum(xEvalInput))}) = {fmt(result)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}