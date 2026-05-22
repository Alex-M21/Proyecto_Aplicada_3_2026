// src/metodos/MullerReal.jsx
import { useMemo, useRef, useState } from "react";
import { create, all } from "mathjs";
import "./Biseccion.css";

const math = create(all, {});

const ejemplosMullerReal = {
  cubica: {
    nombre: "Ejemplo: x³ + 3x² + 4x - 12",
    fx: "x^3 + 3*x^2 + 4*x - 12",
    x0: "0",
    x1: "1",
    x2: "2",
    tol: "0.001",
    iter: "50",
    dec: "6",
  },
  cuadratica: {
    nombre: "Ejemplo: x² - 4",
    fx: "x^2 - 4",
    x0: "0",
    x1: "1",
    x2: "3",
    tol: "0.001",
    iter: "50",
    dec: "6",
  },
  cuartoGrado: {
    nombre: "Ejemplo: x⁴ - 2x³ - 12x² + 16x - 40",
    fx: "x^4 - 2*x^3 - 12*x^2 + 16*x - 40",
    x0: "4",
    x1: "4.5",
    x2: "5",
    tol: "0.01",
    iter: "50",
    dec: "4",
  },
  quintoGrado: {
    nombre: "Ejemplo: x⁵ - 3x³ + x - 1",
    fx: "x^5 - 3*x^3 + x - 1",
    x0: "1",
    x1: "1.2",
    x2: "1.5",
    tol: "0.0001",
    iter: "60",
    dec: "6",
  },
};

export default function MullerReal() {
  const [fxInput, setFxInput] = useState(ejemplosMullerReal.cubica.fx);
  const [x0Input, setX0Input] = useState(ejemplosMullerReal.cubica.x0);
  const [x1Input, setX1Input] = useState(ejemplosMullerReal.cubica.x1);
  const [x2Input, setX2Input] = useState(ejemplosMullerReal.cubica.x2);
  const [tolInput, setTolInput] = useState(ejemplosMullerReal.cubica.tol);
  const [maxIterInput, setMaxIterInput] = useState(ejemplosMullerReal.cubica.iter);
  const [decimalsInput, setDecimalsInput] = useState(ejemplosMullerReal.cubica.dec);

  const [rows, setRows] = useState([]);
  const [iterView, setIterView] = useState(0);
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

  const normalizeExpr = (expr) =>
    String(expr ?? "")
      .trim()
      .replace(/,/g, ".");

  const esPolinomioValido = (expr) => {
    const t = normalizeExpr(expr).toLowerCase();

    if (!t) return false;

    const funcionesNoPermitidas = [
      "sin",
      "sen",
      "cos",
      "tan",
      "log",
      "ln",
      "exp",
      "sqrt",
      "abs",
      "asin",
      "acos",
      "atan",
    ];

    if (funcionesNoPermitidas.some((fn) => t.includes(fn))) {
      return false;
    }

    const patronPermitido = /^[0-9xX+\-*/^().\s]*$/;

    if (!patronPermitido.test(t)) {
      return false;
    }

    if (!/[xX]/.test(t)) {
      return false;
    }

    return true;
  };

  const buildCompiled = (expr) => {
    const t = normalizeExpr(expr);

    if (!t) return null;

    try {
      return math.compile(t);
    } catch {
      return null;
    }
  };

  const compiledF = useMemo(() => buildCompiled(fxInput), [fxInput]);

  const evalF = (x) => {
    if (!compiledF) return NaN;

    try {
      const r = compiledF.evaluate({ x });

      if (typeof r === "number") {
        return Number.isFinite(r) ? r : NaN;
      }

      if (
        r &&
        typeof r === "object" &&
        typeof r.re === "number" &&
        typeof r.im === "number"
      ) {
        if (Math.abs(r.im) > 1e-10) return NaN;
        return Number.isFinite(r.re) ? r.re : NaN;
      }

      return NaN;
    } catch {
      return NaN;
    }
  };

  const parseNum = (value) => {
    const v = parseFloat(String(value ?? "").replace(",", ".").trim());
    return Number.isFinite(v) ? v : NaN;
  };

  const getDecimals = () => {
    const d = parseInt(decimalsInput, 10);
    if (Number.isNaN(d) || d < 0) return 6;
    return Math.min(d, 12);
  };

  const formatNumber = (value) => {
    const d = getDecimals();
    return Number.isFinite(value) ? Number(value).toFixed(d) : "NaN";
  };

  const roundTo = (value) => {
    const d = getDecimals();
    const factor = 10 ** d;
    return Math.round(value * factor) / factor;
  };

  const resetChart = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setDragging(false);
    setDragStart({ x: 0, y: 0 });
  };

  const resetResults = () => {
    setRows([]);
    setIterView(0);
    setMessage("");
    setErrorMsg("");
    setWarningMsg("");
    resetChart();
  };

  const cargarEjemplo = (key) => {
    const ejemplo = ejemplosMullerReal[key];

    setFxInput(ejemplo.fx);
    setX0Input(ejemplo.x0);
    setX1Input(ejemplo.x1);
    setX2Input(ejemplo.x2);
    setTolInput(ejemplo.tol);
    setMaxIterInput(ejemplo.iter);
    setDecimalsInput(ejemplo.dec);

    resetResults();
  };

  const handleCalculate = (e) => {
    e.preventDefault();

    resetResults();

    if (!fxInput.trim()) {
      setErrorMsg("Debes ingresar una función polinomial P(x).");
      return;
    }

    if (!esPolinomioValido(fxInput)) {
      setErrorMsg(
        "Muller Real está configurado para funciones polinomiales en x. Usa expresiones como: x^3 + 3*x^2 + 4*x - 12. No uses ln, log, sen, sin, cos, tan, exp o sqrt en este método."
      );
      return;
    }

    if (!compiledF) {
      setErrorMsg("No se pudo interpretar el polinomio. Revisa la sintaxis.");
      return;
    }

    let x0 = parseNum(x0Input);
    let x1 = parseNum(x1Input);
    let x2 = parseNum(x2Input);
    const tol = parseNum(tolInput);
    const maxIter = parseInt(maxIterInput, 10);

    if (
      !Number.isFinite(x0) ||
      !Number.isFinite(x1) ||
      !Number.isFinite(x2) ||
      !Number.isFinite(tol) ||
      !Number.isFinite(maxIter)
    ) {
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

    const EPS = 1e-14;
    const newRows = [];
    let found = false;

    for (let n = 1; n <= maxIter; n++) {
      const x0_i = x0;
      const x1_i = x1;
      const x2_i = x2;

      const f0 = evalF(x0_i);
      const f1 = evalF(x1_i);
      const f2 = evalF(x2_i);

      if (!Number.isFinite(f0) || !Number.isFinite(f1) || !Number.isFinite(f2)) {
        setErrorMsg(
          "No se pudo evaluar el polinomio con los valores actuales. Revisa los valores iniciales."
        );
        break;
      }

      const h1 = x1_i - x0_i;
      const h2 = x2_i - x1_i;

      if (Math.abs(h1) < EPS || Math.abs(h2) < EPS) {
        setErrorMsg("Hay dos puntos iguales o muy cercanos. Cambia x₀, x₁ o x₂.");
        break;
      }

      const r1 = (f1 - f0) / h1;
      const r2 = (f2 - f1) / h2;

      const denomD = h2 + h1;

      if (Math.abs(denomD) < EPS) {
        setErrorMsg("No se puede avanzar porque h₁ + h₂ es cercano a cero.");
        break;
      }

      const d = (r2 - r1) / denomD;
      const b = r2 + h2 * d;
      const c = f2;

      let p;

      if (Math.abs(d) < EPS) {
        const denomSec = f2 - f1;

        if (Math.abs(denomSec) < EPS) {
          setErrorMsg("No se puede avanzar porque el denominador es cercano a cero.");
          break;
        }

        p = x2_i - (f2 * (x2_i - x1_i)) / denomSec;
      } else {
        const discriminante = b * b - 4 * d * c;

        if (discriminante < 0) {
          setErrorMsg(
            "El proceso generó una raíz imaginaria o compleja porque el discriminante fue negativo. Este caso ya no pertenece a Muller Real. Usa el método de Muller Imaginario."
          );

          setWarningMsg(
            "Sugerencia: conserva el mismo polinomio y los mismos valores iniciales, pero resuélvelo en Muller Imaginario."
          );

          break;
        }

        const D = Math.sqrt(discriminante);

        const denom1 = b + D;
        const denom2 = b - D;
        const E = Math.abs(denom1) >= Math.abs(denom2) ? denom1 : denom2;

        if (Math.abs(E) < EPS) {
          setErrorMsg("Denominador cercano a cero. Cambia los valores iniciales.");
          break;
        }

        const h = (-2 * c) / E;
        p = x2_i + h;
      }

      if (!Number.isFinite(p)) {
        setErrorMsg("El método generó un valor no numérico. Cambia los valores iniciales.");
        break;
      }

      const error = Math.abs(p - x2_i);
      const errorDisp = roundTo(error);

      newRows.push({
        n,
        x0: x0_i,
        x1: x1_i,
        x2: x2_i,
        p,
        error,
        errorDisp,
      });

      if (error < tol || error === 0) {
        found = true;
        break;
      }

      x0 = x1_i;
      x1 = x2_i;
      x2 = p;
    }

    setRows(newRows);

    if (!newRows.length) return;

    setIterView(newRows.length - 1);
    setMessage(found ? "SE ENCONTRÓ LA SOLUCIÓN" : "Se alcanzó el máximo de iteraciones.");
  };

  const handleClear = () => {
    setFxInput("");
    setX0Input("");
    setX1Input("");
    setX2Input("");
    setTolInput("");
    setMaxIterInput("");
    setDecimalsInput("6");
    resetResults();
  };

  const exportCSV = () => {
    if (rows.length === 0) return;

    const headers = ["n", "x0", "x1", "x2", "p", "Error"];

    const csvRows = rows.map((row) => [
      row.n,
      formatNumber(row.x0),
      formatNumber(row.x1),
      formatNumber(row.x2),
      formatNumber(row.p),
      formatNumber(row.errorDisp),
    ]);

    const quoteCSV = (value) => {
      const text = String(value ?? "");
      return `"${text.replaceAll('"', '""')}"`;
    };

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
    link.download = "muller_real.csv";
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
      link.download = "grafica_muller_real.png";
      link.click();

      URL.revokeObjectURL(url);
    };

    image.src = url;
  };

  const finalRow = rows.length > 0 ? rows[rows.length - 1] : null;
  const rowView = rows.length > 0 ? rows[Math.min(iterView, rows.length - 1)] : null;

  const tol = parseNum(tolInput);
  const lastIndex = rows.length - 1;

  const foundFinal =
    rows.length > 0 &&
    Number.isFinite(tol) &&
    Number.isFinite(rows[lastIndex]?.error) &&
    rows[lastIndex].error < tol;

  const pHistory = rows.map((row) => row.p);

  const buildRange = (values, fallbackMin = -5, fallbackMax = 5) => {
    const clean = values.filter(Number.isFinite);

    if (!clean.length) {
      return { min: fallbackMin, max: fallbackMax };
    }

    let min = Math.min(...clean);
    let max = Math.max(...clean);

    if (min === max) {
      min -= 1;
      max += 1;
    } else {
      const pad = (max - min) * 0.18;
      min -= pad;
      max += pad;
    }

    return { min, max };
  };

  const graph = useMemo(() => {
    const initialXs = [parseNum(x0Input), parseNum(x1Input), parseNum(x2Input)].filter(
      Number.isFinite
    );

    const pXs = rows.map((row) => row.p).filter(Number.isFinite);

    const xRange = buildRange([...initialXs, ...pXs], -5, 5);

    const baseXMin = xRange.min;
    const baseXMax = xRange.max;

    const baseCurve = [];

    if (compiledF && esPolinomioValido(fxInput)) {
      const steps = 220;
      const step = (baseXMax - baseXMin) / steps;

      for (let i = 0; i <= steps; i++) {
        const x = baseXMin + i * step;
        const y = evalF(x);

        if (Number.isFinite(y)) {
          baseCurve.push({ x, y });
        }
      }
    }

    const yValues = baseCurve.map((point) => point.y);
    const yRange = buildRange(yValues, -5, 5);

    const baseYMin = yRange.min;
    const baseYMax = yRange.max;

    const visibleXSpan = (baseXMax - baseXMin) / Math.max(zoom, 0.5);
    const visibleYSpan = (baseYMax - baseYMin) / Math.max(zoom, 0.5);

    const shiftX = (-pan.x / graphWidth) * visibleXSpan;
    const shiftY = (pan.y / graphHeight) * visibleYSpan;

    const centerX = (baseXMin + baseXMax) / 2 + shiftX;
    const centerY = (baseYMin + baseYMax) / 2 + shiftY;

    const xMin = centerX - visibleXSpan / 2;
    const xMax = centerX + visibleXSpan / 2;
    const yMin = centerY - visibleYSpan / 2;
    const yMax = centerY + visibleYSpan / 2;

    const curve = [];

    if (compiledF && esPolinomioValido(fxInput)) {
      const steps = 250;
      const step = (xMax - xMin) / steps;

      for (let i = 0; i <= steps; i++) {
        const x = xMin + i * step;
        const y = evalF(x);

        if (Number.isFinite(y)) {
          curve.push({ x, y });
        }
      }
    }

    const ticks = (min, max, count = 5) =>
      Array.from({ length: count + 1 }, (_, i) => min + (i * (max - min)) / count);

    return {
      curve,
      xMin,
      xMax,
      yMin,
      yMax,
      xTicks: ticks(xMin, xMax),
      yTicks: ticks(yMin, yMax),
    };
  }, [fxInput, rows, x0Input, x1Input, x2Input, zoom, pan]);

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
    graph.curve.length > 0
      ? graph.curve
          .map((point, index) =>
            `${index === 0 ? "M" : "L"} ${xToSvg(point.x)} ${yToSvg(point.y)}`
          )
          .join(" ")
      : "";

  const increaseZoom = () => {
    setZoom((prev) => Math.min(prev * 1.25, 8));
  };

  const decreaseZoom = () => {
    setZoom((prev) => Math.max(prev / 1.25, 0.5));
  };

  const handleWheel = (e) => {
    e.preventDefault();

    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;

    setZoom((prev) => Math.min(Math.max(prev * factor, 0.5), 8));
  };

  const startDrag = (e) => {
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

 
    return (
  <div className="bisection-grid">
    <div className="bisection-form">
      <h3>Método de Muller Real</h3>

      <p className="bisection-hint">
        Este módulo está orientado a funciones polinomiales de la forma{" "}
        <strong>P(x)=a₀+a₁x+a₂x²+...+aₙxⁿ</strong>. Ingresa tres valores
        iniciales reales <strong>x₀, x₁, x₂</strong>. Si durante el proceso
        aparece una raíz compleja, usa <strong>Muller Imaginario</strong>.
      </p>

      <form onSubmit={handleCalculate}>
        <div className="method-section">
          <h4>Guía para ingresar el polinomio</h4>

          <p className="bisection-hint">
            Escribe el polinomio usando la variable <strong>x</strong>. Usa{" "}
            <code>*</code> para multiplicar y <code>^</code> para potencias.
          </p>

          <div className="system-preview">
            <p>
              <strong>Válidos:</strong> x^2 - 4, x^3 + 3*x^2 + 4*x - 12,
              x^4 - 2*x^3 - 12*x^2 + 16*x - 40
            </p>

            <p>
              <strong>No usar aquí:</strong> ln(x), log(x), sen(x), sin(x),
              cos(x), tan(x), exp(x), sqrt(x)
            </p>

            <p className="bisection-warning">
              Si el discriminante del método se vuelve negativo, el proceso
              entra al caso imaginario. En ese caso conserva el mismo polinomio
              y resuélvelo en <strong>Muller Imaginario</strong>.
            </p>
          </div>

          <div className="bisection-form-row">
            <label>Ejemplo opcional =</label>

            <select onChange={(e) => cargarEjemplo(e.target.value)} defaultValue="">
              <option value="" disabled>
                Usar ejemplo de apoyo
              </option>

              {Object.entries(ejemplosMullerReal).map(([key, ejemplo]) => (
                <option key={key} value={key}>
                  {ejemplo.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="method-section">
          <h4>Datos de entrada</h4>

          <div className="bisection-form-row">
            <label>P(x) =</label>

            <input
              type="text"
              value={fxInput}
              onChange={(e) => {
                setFxInput(e.target.value);
                resetResults();
              }}
              placeholder="Ej: x^3 + 3*x^2 + 4*x - 12"
            />
          </div>

          <div className="method-two-columns">
            <div className="bisection-form-row">
              <label>x₀ =</label>

              <input
                type="number"
                step="any"
                value={x0Input}
                onChange={(e) => {
                  setX0Input(e.target.value);
                  resetResults();
                }}
              />
            </div>

            <div className="bisection-form-row">
              <label>x₁ =</label>

              <input
                type="number"
                step="any"
                value={x1Input}
                onChange={(e) => {
                  setX1Input(e.target.value);
                  resetResults();
                }}
              />
            </div>

            <div className="bisection-form-row">
              <label>x₂ =</label>

              <input
                type="number"
                step="any"
                value={x2Input}
                onChange={(e) => {
                  setX2Input(e.target.value);
                  resetResults();
                }}
              />
            </div>

            <div className="bisection-form-row">
              <label>Tolerancia =</label>

              <input
                type="number"
                step="any"
                value={tolInput}
                onChange={(e) => {
                  setTolInput(e.target.value);
                  resetResults();
                }}
              />
            </div>

            <div className="bisection-form-row">
              <label>Iteraciones =</label>

              <input
                type="number"
                value={maxIterInput}
                onChange={(e) => {
                  setMaxIterInput(e.target.value);
                  resetResults();
                }}
              />
            </div>

            <div className="bisection-form-row">
              <label>Decimales =</label>

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
      {warningMsg && <p className="bisection-warning">{warningMsg}</p>}
      {errorMsg && <p className="bisection-error">{errorMsg}</p>}
    </div>

    <div className="bisection-results">
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
              <div className="mini-info-card-title">Raíz aproximada</div>
              <div className="mini-info-card-value">
                {formatNumber(finalRow.p)}
              </div>
            </div>

            <div className="mini-info-card">
              <div className="mini-info-card-title">Error final</div>
              <div className="mini-info-card-value">
                {formatNumber(finalRow.errorDisp)}
              </div>
            </div>

            <div className="mini-info-card">
              <div className="mini-info-card-title">Iteraciones usadas</div>
              <div className="mini-info-card-value">{rows.length}</div>
            </div>

            <div className="mini-info-card">
              <div className="mini-info-card-title">Estado</div>
              <div className="mini-info-card-value">
                {foundFinal ? "Converge" : "Revisar"}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="graph-card">
        <h4 className="graph-title">Iteración seleccionada</h4>

        {rowView ? (
          <>
            <div className="method-result-grid">
              <div className="mini-info-card">
                <div className="mini-info-card-title">Iteración</div>
                <div className="mini-info-card-value">{rowView.n}</div>
              </div>

              <div className="mini-info-card">
                <div className="mini-info-card-title">p</div>
                <div className="mini-info-card-value">
                  {formatNumber(rowView.p)}
                </div>
              </div>

              <div className="mini-info-card">
                <div className="mini-info-card-title">Error</div>
                <div className="mini-info-card-value">
                  {formatNumber(rowView.errorDisp)}
                </div>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max={Math.max(0, rows.length - 1)}
              value={iterView}
              onChange={(e) => setIterView(parseInt(e.target.value, 10))}
              style={{ width: "100%", marginTop: "1rem" }}
            />
          </>
        ) : (
          <p className="bisection-hint">
            Calcula el método para visualizar una iteración específica.
          </p>
        )}
      </div>

      <div className="bisection-table-wrapper">
        <div className="table-header-actions">
          <h4>Tabla de iteraciones</h4>

          <button
            type="button"
            className="btn-export"
            onClick={exportCSV}
            disabled={rows.length === 0}
          >
            Descargar CSV
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="bisection-hint">
            Ingresa los datos y presiona <strong>CALCULAR</strong>.
          </p>
        ) : (
          <div className="table-scroll">
            <table className="bisection-table">
              <thead>
                <tr>
                  <th>n</th>
                  <th>x₀</th>
                  <th>x₁</th>
                  <th>x₂</th>
                  <th>p</th>
                  <th>Error</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => {
                  const isLast = index === lastIndex && foundFinal;
                  const isSelected = index === iterView;

                  return (
                    <tr
                      key={row.n}
                      className={isSelected ? "row-selected" : ""}
                    >
                      <td>{row.n}</td>
                      <td>{formatNumber(row.x0)}</td>
                      <td>{formatNumber(row.x1)}</td>
                      <td>{formatNumber(row.x2)}</td>
                      <td className={isLast ? "cell-green" : ""}>
                        {formatNumber(row.p)}
                      </td>
                      <td className={isLast ? "cell-red" : ""}>
                        {formatNumber(row.errorDisp)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {foundFinal && (
          <p className="bisection-message">
            SE ENCONTRÓ LA SOLUCIÓN porque{" "}
            {formatNumber(rows[lastIndex].errorDisp)} &lt; {tolInput}
          </p>
        )}
      </div>

      <div className="graph-card">
        <div className="table-header-actions">
          <h4 className="graph-title">Gráfica interactiva de P(x)</h4>

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
              disabled={!curvePath}
            >
              PNG
            </button>
          </div>
        </div>

        <p className="bisection-hint">
          Usa la rueda del mouse para acercar o alejar. Arrastra la gráfica
          para desplazarla. Los puntos marcados sobre el eje X representan las
          aproximaciones p.
        </p>

        <div className="interactive-chart-wrapper">
          <svg
            ref={svgRef}
            className="error-chart"
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="Gráfica del método de Muller real"
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

            <text x={width / 2 - 105} y="22" className="chart-title-text">
              Método de Muller Real
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
                  {formatNumber(tick)}
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
                  {formatNumber(tick)}
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
              P(x)
            </text>

            <defs>
              <clipPath id="plot-area-muller-real">
                <rect
                  x={marginLeft}
                  y={marginTop}
                  width={graphWidth}
                  height={graphHeight}
                />
              </clipPath>
            </defs>

            <g
              clipPath="url(#plot-area-muller-real)"
              className={dragging ? "chart-dragging" : "chart-draggable"}
            >
              {curvePath && (
                <path d={curvePath} className="chart-line" fill="none" />
              )}

              {pHistory.map((p, index) => (
                <circle
                  key={`p-${index}`}
                  cx={xToSvg(p)}
                  cy={yToSvg(0)}
                  r="4"
                  className={index === lastIndex ? "chart-eval-point" : "chart-point"}
                >
                  <title>
                    Iteración {index + 1}: p = {formatNumber(p)}
                  </title>
                </circle>
              ))}
            </g>
          </svg>
        </div>
      </div>
    </div>
  </div>
);
}