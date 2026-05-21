// src/metodos/MullerNoReal.jsx
import { useMemo, useRef, useState } from "react";
import { create, all } from "mathjs";
import "./Biseccion.css";

const math = create(all, {});

const ejemplosMullerComplejo = {
  cuadraticaCompleja: {
    nombre: "Ejemplo: x² - 8x + 25",
    fx: "x^2 - 8*x + 25",
    x0: "3",
    x1: "4",
    x2: "5",
    tol: "0.01",
    iter: "50",
    dec: "4",
  },
  x2mas1: {
    nombre: "Ejemplo: x² + 1",
    fx: "x^2 + 1",
    x0: "0",
    x1: "1",
    x2: "2",
    tol: "0.0001",
    iter: "50",
    dec: "6",
  },
  complejoCuadratico: {
    nombre: "Ejemplo: 3x² - x + 1",
    fx: "3*x^2 - x + 1",
    x0: "1.5",
    x1: "2.1",
    x2: "2.5",
    tol: "0.001",
    iter: "50",
    dec: "4",
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
  complejoInicial: {
    nombre: "Ejemplo con valores iniciales complejos",
    fx: "x^3 - 1",
    x0: "0.5+0.8i",
    x1: "0.2+1i",
    x2: "-0.5+0.9i",
    tol: "0.0001",
    iter: "50",
    dec: "6",
  },
};

export default function MullerNoReal() {
  const [fxInput, setFxInput] = useState(ejemplosMullerComplejo.cuadraticaCompleja.fx);
  const [x0Input, setX0Input] = useState(ejemplosMullerComplejo.cuadraticaCompleja.x0);
  const [x1Input, setX1Input] = useState(ejemplosMullerComplejo.cuadraticaCompleja.x1);
  const [x2Input, setX2Input] = useState(ejemplosMullerComplejo.cuadraticaCompleja.x2);
  const [tolInput, setTolInput] = useState(ejemplosMullerComplejo.cuadraticaCompleja.tol);
  const [maxIterInput, setMaxIterInput] = useState(ejemplosMullerComplejo.cuadraticaCompleja.iter);
  const [decimalsInput, setDecimalsInput] = useState(ejemplosMullerComplejo.cuadraticaCompleja.dec);

  const [rows, setRows] = useState([]);
  const [iterView, setIterView] = useState(0);

  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [warningMsg, setWarningMsg] = useState("");

  const [realZoom, setRealZoom] = useState(1);
  const [realPan, setRealPan] = useState({ x: 0, y: 0 });
  const [realDragging, setRealDragging] = useState(false);
  const [realDragStart, setRealDragStart] = useState({ x: 0, y: 0 });

  const [complexZoom, setComplexZoom] = useState(1);
  const [complexPan, setComplexPan] = useState({ x: 0, y: 0 });
  const [complexDragging, setComplexDragging] = useState(false);
  const [complexDragStart, setComplexDragStart] = useState({ x: 0, y: 0 });

  const realSvgRef = useRef(null);
  const complexSvgRef = useRef(null);

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
      .replace(/,/g, ".")
      .replace(/j/gi, "i");

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
    if (!esPolinomioValido(t)) return null;

    try {
      return math.compile(t);
    } catch {
      return null;
    }
  };

  const getDecimals = () => {
    const d = parseInt(decimalsInput, 10);
    if (Number.isNaN(d) || d < 0) return 6;
    return Math.min(d, 12);
  };

  const isComplexLike = (value) =>
    value != null &&
    typeof value === "object" &&
    typeof value.re === "number" &&
    typeof value.im === "number";

  const toComplex = (value) => {
    if (isComplexLike(value)) return value;

    if (typeof value === "number") {
      return math.complex(value, 0);
    }

    try {
      const n = math.number(value);
      return math.complex(n, 0);
    } catch {
      return math.complex(NaN, NaN);
    }
  };

  const parseX = (value) => {
    const t = normalizeExpr(value);

    if (!t) return null;

    const patronEntrada = /^[0-9iI+\-*/^().\s]*$/;

    if (!patronEntrada.test(t)) return null;

    try {
      const parsed = math.evaluate(t);
      return toComplex(parsed);
    } catch {
      return null;
    }
  };

  const absVal = (value) => {
    try {
      const a = math.abs(value);
      const n = typeof a === "number" ? a : math.number(a);
      return Number.isFinite(n) ? n : NaN;
    } catch {
      return NaN;
    }
  };

  const roundNum = (x, d) => {
    const factor = 10 ** d;
    return Math.round(x * factor) / factor;
  };

  const formatComplexExcelFixed = (value) => {
    const d = getDecimals();
    const c = toComplex(value);

    if (!Number.isFinite(c.re) || !Number.isFinite(c.im)) return "NaN";

    const fixNegZero = (n) => {
      const s = n.toFixed(d);
      return s === (-0).toFixed(d) ? (0).toFixed(d) : s;
    };

    const re0 = Math.abs(c.re) < 0.5 * 10 ** -d ? 0 : c.re;
    const im0 = Math.abs(c.im) < 0.5 * 10 ** -d ? 0 : c.im;

    if (im0 === 0) return fixNegZero(re0);
    if (re0 === 0) return `${fixNegZero(im0)}i`;

    const sign = im0 >= 0 ? "+" : "-";
    return `${fixNegZero(re0)}${sign}${fixNegZero(Math.abs(im0))}i`;
  };

  const formatError = (value) => {
    const d = getDecimals();
    return Number.isFinite(value) ? value.toFixed(d) : "NaN";
  };

  const compiledF = useMemo(() => buildCompiled(fxInput), [fxInput]);

  const evalF = (x) => {
    if (!compiledF) return math.complex(NaN, NaN);

    try {
      const r = compiledF.evaluate({ x: toComplex(x) });
      return toComplex(r);
    } catch {
      return math.complex(NaN, NaN);
    }
  };

  const resetCharts = () => {
    setRealZoom(1);
    setRealPan({ x: 0, y: 0 });
    setRealDragging(false);
    setRealDragStart({ x: 0, y: 0 });

    setComplexZoom(1);
    setComplexPan({ x: 0, y: 0 });
    setComplexDragging(false);
    setComplexDragStart({ x: 0, y: 0 });
  };

  const resetResults = () => {
    setRows([]);
    setIterView(0);
    setMessage("");
    setErrorMsg("");
    setWarningMsg("");
    resetCharts();
  };

  const cargarEjemplo = (key) => {
    const ejemplo = ejemplosMullerComplejo[key];

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
        "Muller Imaginario está configurado para funciones polinomiales en x. Usa expresiones como: x^2 - 8*x + 25, x^3 - 1 o x^4 - 2*x^3 - 12*x^2 + 16*x - 40."
      );
      return;
    }

    if (!compiledF) {
      setErrorMsg("No se pudo interpretar el polinomio. Revisa la sintaxis.");
      return;
    }

    let x0 = parseX(x0Input);
    let x1 = parseX(x1Input);
    let x2 = parseX(x2Input);

    const tol = parseFloat(tolInput);
    const maxIter = parseInt(maxIterInput, 10);

    if (!x0 || !x1 || !x2 || !Number.isFinite(tol) || !Number.isFinite(maxIter)) {
      setErrorMsg('Valores inválidos. Para complejos usa: "1+2i", "-0.5i", "2i" o "4-3i".');
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

    const newRows = [];
    let found = false;
    const EPS = 1e-14;

    for (let n = 1; n <= maxIter; n++) {
      const x0_i = x0;
      const x1_i = x1;
      const x2_i = x2;

      const f0 = evalF(x0_i);
      const f1 = evalF(x1_i);
      const f2 = evalF(x2_i);

      const okF =
        Number.isFinite(f0.re) &&
        Number.isFinite(f0.im) &&
        Number.isFinite(f1.re) &&
        Number.isFinite(f1.im) &&
        Number.isFinite(f2.re) &&
        Number.isFinite(f2.im);

      if (!okF) {
        setErrorMsg("No se pudo evaluar P(x) en alguna iteración. Revisa el polinomio o los valores iniciales.");
        break;
      }

      const h1 = math.subtract(x1_i, x0_i);
      const h2 = math.subtract(x2_i, x1_i);

      if (absVal(h1) < EPS || absVal(h2) < EPS) {
        setErrorMsg("Hay puntos iguales o muy cercanos (x₀, x₁, x₂). Cambia los valores iniciales.");
        break;
      }

      const r1 = math.divide(math.subtract(f1, f0), h1);
      const r2 = math.divide(math.subtract(f2, f1), h2);

      const denomD = math.add(h2, h1);

      if (absVal(denomD) < EPS) {
        setErrorMsg("No se puede avanzar porque h₂ + h₁ es cercano a cero.");
        break;
      }

      const d = math.divide(math.subtract(r2, r1), denomD);
      const b = math.add(r2, math.multiply(h2, d));
      const c = f2;

      let p;

      if (absVal(d) < EPS) {
        const denomSec = math.subtract(f2, f1);

        if (absVal(denomSec) < EPS) {
          setErrorMsg("No se puede avanzar porque el denominador es cercano a cero.");
          break;
        }

        p = math.subtract(
          x2_i,
          math.divide(math.multiply(f2, math.subtract(x2_i, x1_i)), denomSec)
        );
      } else {
        const discriminante = math.subtract(
          math.multiply(b, b),
          math.multiply(4, math.multiply(d, c))
        );

        const D = math.sqrt(discriminante);

        const denom1 = math.add(b, D);
        const denom2 = math.subtract(b, D);
        const E = absVal(denom1) >= absVal(denom2) ? denom1 : denom2;

        if (absVal(E) < EPS) {
          setErrorMsg("Denominador cercano a cero. Cambia los valores iniciales.");
          break;
        }

        const h = math.divide(math.multiply(-2, c), E);
        p = math.add(x2_i, h);
      }

      p = toComplex(p);

      if (!Number.isFinite(p.re) || !Number.isFinite(p.im)) {
        setErrorMsg("El método generó un valor no numérico. Cambia los valores iniciales.");
        break;
      }

      const errRaw = absVal(math.subtract(p, x2_i));
      const errorDisp = roundNum(errRaw, getDecimals());

      newRows.push({
        n,
        x0: x0_i,
        x1: x1_i,
        x2: x2_i,
        p,
        errRaw,
        errorDisp,
      });

      if (Number.isFinite(errRaw) && errRaw < tol) {
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
    setDecimalsInput("4");
    resetResults();
  };

  const exportCSV = () => {
    if (rows.length === 0) return;

    const headers = ["n", "x0", "x1", "x2", "p", "Error"];

    const csvRows = rows.map((row) => [
      row.n,
      formatComplexExcelFixed(row.x0),
      formatComplexExcelFixed(row.x1),
      formatComplexExcelFixed(row.x2),
      formatComplexExcelFixed(row.p),
      formatError(row.errorDisp),
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
    link.download = "muller_imaginario.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const downloadSVGAsPNG = (ref, filename) => {
    if (!ref.current) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(ref.current);

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
      link.download = filename;
      link.click();

      URL.revokeObjectURL(url);
    };

    image.src = url;
  };

  const tol = parseFloat(tolInput);
  const lastIndex = rows.length - 1;

  const foundFinal =
    rows.length > 0 &&
    Number.isFinite(tol) &&
    Number.isFinite(rows[lastIndex]?.errRaw) &&
    rows[lastIndex].errRaw < tol;

  const finalRow = rows.length > 0 ? rows[lastIndex] : null;
  const rowView = rows.length > 0 ? rows[Math.min(iterView, rows.length - 1)] : null;

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

  const realGraph = useMemo(() => {
    const initial = [parseX(x0Input), parseX(x1Input), parseX(x2Input)]
      .filter(Boolean)
      .map((z) => z.re);

    const pRe = rows.map((row) => row.p.re);

    const range = buildRange([...initial, ...pRe], -5, 5);

    const baseXMin = range.min;
    const baseXMax = range.max;

    const curveBase = [];

    if (compiledF && esPolinomioValido(fxInput)) {
      const steps = 220;
      const step = (baseXMax - baseXMin) / steps;

      for (let i = 0; i <= steps; i++) {
        const x = baseXMin + i * step;
        const y = evalF(math.complex(x, 0)).re;

        if (Number.isFinite(y)) {
          curveBase.push({ x, y });
        }
      }
    }

    const yValues = curveBase.map((point) => point.y);
    const yRange = buildRange(yValues, -5, 5);

    const baseYMin = yRange.min;
    const baseYMax = yRange.max;

    const visibleXSpan = (baseXMax - baseXMin) / Math.max(realZoom, 0.5);
    const visibleYSpan = (baseYMax - baseYMin) / Math.max(realZoom, 0.5);

    const shiftX = (-realPan.x / graphWidth) * visibleXSpan;
    const shiftY = (realPan.y / graphHeight) * visibleYSpan;

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
        const y = evalF(math.complex(x, 0)).re;

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
  }, [fxInput, rows, x0Input, x1Input, x2Input, realZoom, realPan]);

  const complexGraph = useMemo(() => {
    const values = [];

    const x0 = parseX(x0Input);
    const x1 = parseX(x1Input);
    const x2 = parseX(x2Input);

    if (x0) values.push(x0);
    if (x1) values.push(x1);
    if (x2) values.push(x2);

    rows.forEach((row) => values.push(row.p));

    const reRange = buildRange(values.map((z) => z.re), -5, 5);
    const imRange = buildRange(values.map((z) => z.im), -5, 5);

    const visibleXSpan = (reRange.max - reRange.min) / Math.max(complexZoom, 0.5);
    const visibleYSpan = (imRange.max - imRange.min) / Math.max(complexZoom, 0.5);

    const shiftX = (-complexPan.x / graphWidth) * visibleXSpan;
    const shiftY = (complexPan.y / graphHeight) * visibleYSpan;

    const centerX = (reRange.min + reRange.max) / 2 + shiftX;
    const centerY = (imRange.min + imRange.max) / 2 + shiftY;

    const xMin = centerX - visibleXSpan / 2;
    const xMax = centerX + visibleXSpan / 2;
    const yMin = centerY - visibleYSpan / 2;
    const yMax = centerY + visibleYSpan / 2;

    const ticks = (min, max, count = 5) =>
      Array.from({ length: count + 1 }, (_, i) => min + (i * (max - min)) / count);

    return {
      path: rows.map((row) => row.p),
      xMin,
      xMax,
      yMin,
      yMax,
      xTicks: ticks(xMin, xMax),
      yTicks: ticks(yMin, yMax),
    };
  }, [rows, x0Input, x1Input, x2Input, complexZoom, complexPan]);

  const xToSvg = (x, graph) => {
    if (graph.xMax === graph.xMin) return marginLeft + graphWidth / 2;

    return (
      marginLeft +
      ((x - graph.xMin) / (graph.xMax - graph.xMin)) * graphWidth
    );
  };

  const yToSvg = (y, graph) => {
    if (graph.yMax === graph.yMin) return marginTop + graphHeight / 2;

    return (
      marginTop +
      graphHeight -
      ((y - graph.yMin) / (graph.yMax - graph.yMin)) * graphHeight
    );
  };

  const realCurvePath =
    realGraph.curve.length > 0
      ? realGraph.curve
          .map((point, index) =>
            `${index === 0 ? "M" : "L"} ${xToSvg(point.x, realGraph)} ${yToSvg(point.y, realGraph)}`
          )
          .join(" ")
      : "";

  const complexPath =
    complexGraph.path.length > 0
      ? complexGraph.path
          .map((point, index) =>
            `${index === 0 ? "M" : "L"} ${xToSvg(point.re, complexGraph)} ${yToSvg(point.im, complexGraph)}`
          )
          .join(" ")
      : "";

  const zoomInReal = () => setRealZoom((prev) => Math.min(prev * 1.25, 8));
  const zoomOutReal = () => setRealZoom((prev) => Math.max(prev / 1.25, 0.5));

  const zoomInComplex = () => setComplexZoom((prev) => Math.min(prev * 1.25, 8));
  const zoomOutComplex = () => setComplexZoom((prev) => Math.max(prev / 1.25, 0.5));

  const handleRealWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    setRealZoom((prev) => Math.min(Math.max(prev * factor, 0.5), 8));
  };

  const handleComplexWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    setComplexZoom((prev) => Math.min(Math.max(prev * factor, 0.5), 8));
  };

  const startRealDrag = (e) => {
    setRealDragging(true);
    setRealDragStart({
      x: e.clientX - realPan.x,
      y: e.clientY - realPan.y,
    });
  };

  const moveRealDrag = (e) => {
    if (!realDragging) return;

    setRealPan({
      x: e.clientX - realDragStart.x,
      y: e.clientY - realDragStart.y,
    });
  };

  const endRealDrag = () => setRealDragging(false);

  const startComplexDrag = (e) => {
    setComplexDragging(true);
    setComplexDragStart({
      x: e.clientX - complexPan.x,
      y: e.clientY - complexPan.y,
    });
  };

  const moveComplexDrag = (e) => {
    if (!complexDragging) return;

    setComplexPan({
      x: e.clientX - complexDragStart.x,
      y: e.clientY - complexDragStart.y,
    });
  };

  const endComplexDrag = () => setComplexDragging(false);

  return (
    <div className="bisection-grid">
      <div className="bisection-form">
        <h3>Método de Muller Imaginario</h3>

        <p className="bisection-hint">
          Este módulo trabaja con <strong>polinomios</strong> y permite raíces
          complejas. Puedes ingresar valores iniciales reales o complejos como{" "}
          <code>1+2i</code>, <code>-0.5i</code>, <code>2i</code> o <code>4-3i</code>.
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
                <strong>Válidos:</strong> x^2 - 8*x + 25, x^2 + 1,
                3*x^2 - x + 1, x^3 - 1
              </p>

              <p>
                <strong>No usar aquí:</strong> ln(x), log(x), sen(x), sin(x),
                cos(x), tan(x), exp(x), sqrt(x)
              </p>

              <p className="bisection-warning">
                En este método sí se permite que el proceso genere números
                imaginarios o complejos.
              </p>
            </div>

            <div className="bisection-form-row">
              <label>Ejemplo opcional =</label>

              <select onChange={(e) => cargarEjemplo(e.target.value)} defaultValue="">
                <option value="" disabled>
                  Usar ejemplo de apoyo
                </option>

                {Object.entries(ejemplosMullerComplejo).map(([key, ejemplo]) => (
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
                placeholder="Ej: x^2 - 8*x + 25"
              />
            </div>

            <div className="method-two-columns">
              <div className="bisection-form-row">
                <label>x₀ =</label>

                <input
                  type="text"
                  value={x0Input}
                  onChange={(e) => {
                    setX0Input(e.target.value);
                    resetResults();
                  }}
                  placeholder="Ej: 3 o 1+2i"
                />
              </div>

              <div className="bisection-form-row">
                <label>x₁ =</label>

                <input
                  type="text"
                  value={x1Input}
                  onChange={(e) => {
                    setX1Input(e.target.value);
                    resetResults();
                  }}
                  placeholder="Ej: 4 o -0.5i"
                />
              </div>

              <div className="bisection-form-row">
                <label>x₂ =</label>

                <input
                  type="text"
                  value={x2Input}
                  onChange={(e) => {
                    setX2Input(e.target.value);
                    resetResults();
                  }}
                  placeholder="Ej: 5 o 4-3i"
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
                  {formatComplexExcelFixed(finalRow.p)}
                </div>
              </div>

              <div className="mini-info-card">
                <div className="mini-info-card-title">Parte real</div>
                <div className="mini-info-card-value">
                  {formatError(finalRow.p.re)}
                </div>
              </div>

              <div className="mini-info-card">
                <div className="mini-info-card-title">Parte imaginaria</div>
                <div className="mini-info-card-value">
                  {formatError(finalRow.p.im)}
                </div>
              </div>

              <div className="mini-info-card">
                <div className="mini-info-card-title">Error final</div>
                <div className="mini-info-card-value">
                  {formatError(finalRow.errorDisp)}
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
                    {formatComplexExcelFixed(rowView.p)}
                  </div>
                </div>

                <div className="mini-info-card">
                  <div className="mini-info-card-title">Error</div>
                  <div className="mini-info-card-value">
                    {formatError(rowView.errorDisp)}
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
      </div>

      <div className="bisection-results full-width-results">
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
                        style={
                          isSelected
                            ? { outline: "2px solid #93c5fd", outlineOffset: "-2px" }
                            : undefined
                        }
                      >
                        <td>{row.n}</td>
                        <td>{formatComplexExcelFixed(row.x0)}</td>
                        <td>{formatComplexExcelFixed(row.x1)}</td>
                        <td>{formatComplexExcelFixed(row.x2)}</td>
                        <td className={isLast ? "cell-green" : ""}>
                          {formatComplexExcelFixed(row.p)}
                        </td>
                        <td className={isLast ? "cell-red" : ""}>
                          {formatError(row.errorDisp)}
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
              SE ENCONTRÓ LA SOLUCIÓN porque {formatError(rows[lastIndex].errorDisp)} &lt;{" "}
              {tolInput}
            </p>
          )}
        </div>

        <div className="graph-card">
          <div className="table-header-actions">
            <h4 className="graph-title">Vista real de P(x)</h4>

            <div className="chart-actions">
              <button type="button" className="btn-export" onClick={zoomInReal}>
                +
              </button>

              <button type="button" className="btn-export" onClick={zoomOutReal}>
                -
              </button>

              <button type="button" className="btn-export" onClick={resetCharts}>
                Reiniciar
              </button>

              <button
                type="button"
                className="btn-export"
                onClick={() => downloadSVGAsPNG(realSvgRef, "muller_imaginario_vista_real.png")}
                disabled={!realCurvePath}
              >
                PNG
              </button>
            </div>
          </div>

          <p className="bisection-hint">
            Muestra la parte real de P(x) sobre el eje real. Los puntos marcados
            sobre el eje X representan la parte real de las aproximaciones.
          </p>

          <div className="interactive-chart-wrapper">
            <svg
              ref={realSvgRef}
              className="error-chart"
              viewBox={`0 0 ${width} ${height}`}
              role="img"
              aria-label="Vista real del método de Muller imaginario"
              onWheel={handleRealWheel}
              onMouseDown={startRealDrag}
              onMouseMove={moveRealDrag}
              onMouseUp={endRealDrag}
              onMouseLeave={endRealDrag}
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
                Vista real de P(x)
              </text>

              {realGraph.yTicks.map((tick, index) => (
                <g key={`real-y-${index}`}>
                  <line
                    x1={marginLeft}
                    y1={yToSvg(tick, realGraph)}
                    x2={marginLeft + graphWidth}
                    y2={yToSvg(tick, realGraph)}
                    className="chart-grid-line"
                  />

                  <text x="8" y={yToSvg(tick, realGraph) + 4} className="chart-label">
                    {formatError(tick)}
                  </text>
                </g>
              ))}

              {realGraph.xTicks.map((tick, index) => (
                <g key={`real-x-${index}`}>
                  <line
                    x1={xToSvg(tick, realGraph)}
                    y1={marginTop}
                    x2={xToSvg(tick, realGraph)}
                    y2={marginTop + graphHeight}
                    className="chart-grid-line"
                  />

                  <text
                    x={xToSvg(tick, realGraph) - 8}
                    y={marginTop + graphHeight + 22}
                    className="chart-label"
                  >
                    {formatError(tick)}
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

              <text x={width / 2 - 35} y={height - 18} className="chart-axis-title">
                Eje X
              </text>

              <text
                x="-215"
                y="18"
                transform="rotate(-90)"
                className="chart-axis-title"
              >
                Re(P(x))
              </text>

              <defs>
                <clipPath id="plot-area-muller-real-imaginario">
                  <rect
                    x={marginLeft}
                    y={marginTop}
                    width={graphWidth}
                    height={graphHeight}
                  />
                </clipPath>
              </defs>

              <g
                clipPath="url(#plot-area-muller-real-imaginario)"
                className={realDragging ? "chart-dragging" : "chart-draggable"}
              >
                {realCurvePath && (
                  <path d={realCurvePath} className="chart-line" fill="none" />
                )}

                {pHistory.map((p, index) => (
                  <circle
                    key={`real-p-${index}`}
                    cx={xToSvg(p.re, realGraph)}
                    cy={yToSvg(0, realGraph)}
                    r="4"
                    className={index === lastIndex ? "chart-eval-point" : "chart-point"}
                  >
                    <title>
                      Iteración {index + 1}: Re(p) = {formatError(p.re)}
                    </title>
                  </circle>
                ))}
              </g>
            </svg>
          </div>
        </div>

        <div className="graph-card">
          <div className="table-header-actions">
            <h4 className="graph-title">Recorrido en el plano complejo</h4>

            <div className="chart-actions">
              <button type="button" className="btn-export" onClick={zoomInComplex}>
                +
              </button>

              <button type="button" className="btn-export" onClick={zoomOutComplex}>
                -
              </button>

              <button type="button" className="btn-export" onClick={resetCharts}>
                Reiniciar
              </button>

              <button
                type="button"
                className="btn-export"
                onClick={() => downloadSVGAsPNG(complexSvgRef, "muller_imaginario_plano_complejo.png")}
                disabled={rows.length === 0}
              >
                PNG
              </button>
            </div>
          </div>

          <p className="bisection-hint">
            Muestra el recorrido de las aproximaciones en el plano complejo:
            Re(p) contra Im(p).
          </p>

          <div className="interactive-chart-wrapper">
            <svg
              ref={complexSvgRef}
              className="error-chart"
              viewBox={`0 0 ${width} ${height}`}
              role="img"
              aria-label="Recorrido de Muller en el plano complejo"
              onWheel={handleComplexWheel}
              onMouseDown={startComplexDrag}
              onMouseMove={moveComplexDrag}
              onMouseUp={endComplexDrag}
              onMouseLeave={endComplexDrag}
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
                Recorrido en el plano complejo
              </text>

              {complexGraph.yTicks.map((tick, index) => (
                <g key={`complex-y-${index}`}>
                  <line
                    x1={marginLeft}
                    y1={yToSvg(tick, complexGraph)}
                    x2={marginLeft + graphWidth}
                    y2={yToSvg(tick, complexGraph)}
                    className="chart-grid-line"
                  />

                  <text x="8" y={yToSvg(tick, complexGraph) + 4} className="chart-label">
                    {formatError(tick)}
                  </text>
                </g>
              ))}

              {complexGraph.xTicks.map((tick, index) => (
                <g key={`complex-x-${index}`}>
                  <line
                    x1={xToSvg(tick, complexGraph)}
                    y1={marginTop}
                    x2={xToSvg(tick, complexGraph)}
                    y2={marginTop + graphHeight}
                    className="chart-grid-line"
                  />

                  <text
                    x={xToSvg(tick, complexGraph) - 8}
                    y={marginTop + graphHeight + 22}
                    className="chart-label"
                  >
                    {formatError(tick)}
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

              <text x={width / 2 - 55} y={height - 18} className="chart-axis-title">
                Re(p)
              </text>

              <text
                x="-215"
                y="18"
                transform="rotate(-90)"
                className="chart-axis-title"
              >
                Im(p)
              </text>

              <defs>
                <clipPath id="plot-area-muller-complex-imaginario">
                  <rect
                    x={marginLeft}
                    y={marginTop}
                    width={graphWidth}
                    height={graphHeight}
                  />
                </clipPath>
              </defs>

              <g
                clipPath="url(#plot-area-muller-complex-imaginario)"
                className={complexDragging ? "chart-dragging" : "chart-draggable"}
              >
                {complexPath && (
                  <path d={complexPath} className="chart-line" fill="none" />
                )}

                {complexGraph.path.map((p, index) => (
                  <circle
                    key={`complex-p-${index}`}
                    cx={xToSvg(p.re, complexGraph)}
                    cy={yToSvg(p.im, complexGraph)}
                    r="4"
                    className={index === lastIndex ? "chart-eval-point" : "chart-point"}
                  >
                    <title>
                      Iteración {index + 1}: {formatComplexExcelFixed(p)}
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