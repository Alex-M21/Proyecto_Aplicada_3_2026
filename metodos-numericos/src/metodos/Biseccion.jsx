/**
 *  Desarrollador : Alexander Mejia
 *  GitHub        : Alex-M21
 *  Email         : b.alex.mejia@gmail.com
 *
 *  ADVERTENCIA:
 *  Estás modificando código protegido. DO NOT COPY AND PASTE.
 *  Para cualquier cambio comunícate con: b.alex.mejia@gmail.com
 *
 *  
."-,.__
                 `.     `.  ,
              .--'  .._,'"-' `.
             .    .'         `'
             `.   /          ,'
               `  '--.   ,-"'
                `"`   |  \
                   -. \, |
                    `--Y.'      ___.
                         \     L._, \
               _.,        `.   <  <\                _
             ,' '           `, `.   | \            ( `
          ../, `.            `  |    .\`.           \ \_
         ,' ,..  .           _.,'    ||\l            )  '".
        , ,'   \           ,'.-.`-._,'  |           .  _._`.
      ,' /      \ \        `' ' `--/   | \          / /   ..\
    .'  /        \ .         |\__ - _ ,'` `        / /     `.`.
    |  '          ..         `-...-"  |  `-'      / /        . `.
    | /           |L__           |    |          / /          `. `.
   , /            .   .          |    |         / /             ` `
  / /          ,. ,`._ `-_       |    |  _   ,-' /               ` \
 / .           \"`_/. `-_ \_,.  ,'    +-' `-'  _,        ..,-.    \`.
.  '         .-f    ,'   `    '.       \__.---'     _   .'   '     \ \
' /          `.'    l     .' /          \..      ,_|/   `.  ,'`     L`
|'      _.-""` `.    \ _,'  `            \ `.___`.'"`-.  , |   |    | \
||    ,'      `. `.   '       _,...._        `  |    `/ '  |   '     .|
||  ,'          `. ;.,.---' ,'       `.   `.. `-'  .-' /_ .'    ;_   ||
|| '              V      / /           `   | `   ,'   ,' '.    !  `. ||
||/            _,-------7 '              . |  `-'    l         /    `||
. |          ,' .-   ,' ||               | .-.        `.      .'     ||
 `'        ,'    `".'    |               |    `.        '. -.'       `'
          /      ,'      |               |,'    \-.._,.'/'
          .     /        .               .       \    .''
        .`.    |         `.             /         :_,'.'
          \ `...\   _     ,'-.        .'         /_.-'
           `-.__ `,  `'   .  _.>----''.  _  __  /
                .'        /"'          |  "'   '_
               /_|.-'\ ,".             '.'`__'-( \
                 / ,"'"\,'               `/  `-.|"
 */
import { useState, useMemo, useRef } from "react";
import { create, all } from "mathjs";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./Biseccion.css";

const math = create(all, {});

export default function Biseccion() {
  const [fxInput, setFxInput] = useState("3*log(x-1)+2*cos(x-1)");
  const [aInput, setAInput] = useState("1.4");
  const [bInput, setBInput] = useState("2");
  const [tolInput, setTolInput] = useState("0.02");
  const [maxIterInput, setMaxIterInput] = useState("25");
  const [decimalsInput, setDecimalsInput] = useState("5");

  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Refs para exportar tabla y gráfica
  const tableRef = useRef(null);
  const svgRef = useRef(null);

  // Compila la expresión de f(x) que escribe el usuario
  const buildCompiled = (expr) => {
    const trimmed = expr.trim();
    if (!trimmed) return null;

    const normalized = trimmed
      .replace(/ln/gi, "log") // permitir ln(x)
      .replace(/sen/gi, "sin"); // permitir sen(x)

    try {
      return math.compile(normalized);
    } catch {
      return null;
    }
  };

  const formatNumber = (value) => {
    const d = parseInt(decimalsInput, 10);
    const decimals = Number.isNaN(d) ? 6 : d;
    return Number.isFinite(value) ? value.toFixed(decimals) : "NaN";
  };

  const handleCalculate = (e) => {
    e.preventDefault();
    setMessage("");
    setErrorMsg("");
    setRows([]);

    if (!fxInput.trim()) {
      setErrorMsg("Debes ingresar una expresión para f(x).");
      return;
    }

    const a0 = parseFloat(aInput);
    const b0 = parseFloat(bInput);
    const tol = parseFloat(tolInput);
    const maxIter = parseInt(maxIterInput, 10);

    if (
      !Number.isFinite(a0) ||
      !Number.isFinite(b0) ||
      !Number.isFinite(tol) ||
      !Number.isFinite(maxIter)
    ) {
      setErrorMsg("Por favor ingresa valores numéricos válidos.");
      return;
    }

    if (a0 >= b0) {
      setErrorMsg('Debe cumplirse que "a" < "b" en el intervalo [a, b].');
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

    const compiled = buildCompiled(fxInput);
    if (!compiled) {
      setErrorMsg(
        "La función f(x) no se pudo interpretar. Revisa la sintaxis. Ejemplos: x^3 - x - 1, sin(x), exp(-x)."
      );
      return;
    }

    const evalFx = (x) => {
      try {
        const res = compiled.evaluate({ x });
        return Number.isFinite(res) ? res : NaN;
      } catch {
        return NaN;
      }
    };

    let a = a0;
    let b = b0;
    let fa = evalFx(a);
    let fb = evalFx(b);

    if (!Number.isFinite(fa) || !Number.isFinite(fb)) {
      setErrorMsg(
        "No se pudo evaluar f(x) en a o b. Revisa que el intervalo esté en el dominio de la función."
      );
      return;
    }

    if (fa * fb > 0) {
      setErrorMsg(
        "f(a) y f(b) tienen el mismo signo. El método de bisección requiere un cambio de signo en [a, b]."
      );
      return;
    }

    const newRows = [];
    let found = false;
    let hadError = false;

    try {
      for (let n = 1; n <= maxIter; n++) {
        const p = (a + b) / 2;
        const fp = evalFx(p);
        fa = evalFx(a);
        fb = evalFx(b);
        const fa_fp = fa * fp;
        const error = (b - a) / 2; // error como en tu hoja de Excel

        newRows.push({
          n,
          a,
          b,
          p,
          fa,
          fb,
          fp,
          fa_fp,
          error
        });

        if (!Number.isFinite(fp)) {
          setErrorMsg(
            "No se pudo evaluar f(p) en alguna iteración. Revisa la función y el intervalo."
          );
          hadError = true;
          break;
        }

        if (Math.abs(fp) === 0 || error < tol) {
          found = true;
          break;
        }

        if (fa_fp < 0) {
          b = p;
          fb = fp;
        } else {
          a = p;
          fa = fp;
        }
      }
    } catch {
      setErrorMsg(
        "Ocurrió un error inesperado durante las iteraciones. Revisa los datos ingresados."
      );
      hadError = true;
    }

    setRows(newRows);

    if (newRows.length === 0 || hadError) return;

    const last = newRows[newRows.length - 1];

    if (found) {
      setMessage(
        `Se encontró una aproximación a la solución: p ≈ ${formatNumber(
          last.p
        )}`
      );
    } else {
      setMessage(
        "Se alcanzó el número máximo de iteraciones sin cumplir la tolerancia."
      );
    }
  };

  const handleClear = () => {
    setFxInput("");
    setAInput("");
    setBInput("");
    setTolInput("");
    setMaxIterInput("");
    setDecimalsInput("5");
    setRows([]);
    setMessage("");
    setErrorMsg("");
  };

  // ----- descarga de tabla en CSV -----
  const handleDownloadTableCsv = () => {
    if (!rows.length) return;

    const headers = [
      "n",
      "a",
      "b",
      "p",
      "f(a)",
      "f(b)",
      "f(p)",
      "f(a)*f(p)",
      "error"
    ];

    const csvRows = [];
    csvRows.push(headers.join(","));

    rows.forEach((row) => {
      const values = [
        row.n,
        formatNumber(row.a),
        formatNumber(row.b),
        formatNumber(row.p),
        formatNumber(row.fa),
        formatNumber(row.fb),
        formatNumber(row.fp),
        formatNumber(row.fa_fp),
        formatNumber(row.error)
      ];
      csvRows.push(values.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "biseccion_iteraciones.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ----- descarga de tabla en PDF -----
  const handleDownloadTablePdf = async () => {
    if (!rows.length || !tableRef.current) return;

    try {
      const element = tableRef.current;
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Ajustar imagen al ancho del PDF manteniendo proporción
      const imgProps = pdf.getImageProperties(imgData);
      const imgRatio = imgProps.height / imgProps.width;
      const imgPdfHeight = pdfWidth * imgRatio;

      const yMargin = 10;
      const finalHeight =
        imgPdfHeight + 2 * yMargin > pdfHeight
          ? pdfHeight - 2 * yMargin
          : imgPdfHeight;

      pdf.text("Método de Bisección - Tabla de iteraciones", 10, 10);
      pdf.addImage(
        imgData,
        "PNG",
        10,
        16,
        pdfWidth - 20,
        finalHeight - 20
      );

      pdf.save("biseccion_iteraciones.pdf");
    } catch (err) {
      console.error(err);
      alert(
        "Ocurrió un problema al generar el PDF. Intenta de nuevo o verifica el tamaño de la tabla."
      );
    }
  };

  // -----------------------
  // Datos para la gráfica
  // -----------------------
  const graphData = useMemo(() => {
    const compiled = buildCompiled(fxInput);
    if (!compiled) {
      return {
        points: [],
        xMin: -5,
        xMax: 5,
        yMin: -1,
        yMax: 1,
        xTicks: [],
        yTicks: []
      };
    }

    const evalFx = (x) => {
      try {
        const res = compiled.evaluate({ x });
        return Number.isFinite(res) ? res : NaN;
      } catch {
        return NaN;
      }
    };

    const a = parseFloat(aInput);
    const b = parseFloat(bInput);

    let xMin;
    let xMax;

    if (Number.isFinite(a) && Number.isFinite(b)) {
      xMin = Math.min(a, b);
      xMax = Math.max(a, b);
      if (xMin === xMax) {
        xMin -= 2;
        xMax += 2;
      } else {
        const margin = (xMax - xMin) * 0.2;
        xMin -= margin;
        xMax += margin;
      }
    } else {
      xMin = -5;
      xMax = 5;
    }

    const points = [];
    const steps = 120;
    const step = (xMax - xMin) / steps;

    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * step;
      const y = evalFx(x);
      if (Number.isFinite(y)) {
        points.push({ x, y });
      }
    }

    if (points.length === 0) {
      return {
        points: [],
        xMin,
        xMax,
        yMin: -1,
        yMax: 1,
        xTicks: [],
        yTicks: []
      };
    }

    const ys = points.map((p) => p.y);
    let yMin = Math.min(...ys);
    let yMax = Math.max(...ys);
    if (yMin === yMax) {
      yMin -= 1;
      yMax += 1;
    } else {
      const margin = (yMax - yMin) * 0.2;
      yMin -= margin;
      yMax += margin;
    }

    const createTicks = (min, max, count = 4) => {
      const ticks = [];
      for (let i = 0; i <= count; i++) {
        ticks.push(min + (i * (max - min)) / count);
      }
      return ticks;
    };

    const xTicks = createTicks(xMin, xMax, 4);
    const yTicks = createTicks(yMin, yMax, 4);

    return { points, xMin, xMax, yMin, yMax, xTicks, yTicks };
  }, [fxInput, aInput, bInput, decimalsInput]);

  const lastP = rows.length ? rows[rows.length - 1].p : null;
  const lastInterval = rows.length
    ? { a: rows[rows.length - 1].a, b: rows[rows.length - 1].b }
    : null;

  const width = 400;
  const height = 240;
  const paddingLeft = 46;
  const paddingRight = 10;
  const paddingTop = 10;
  const paddingBottom = 28;

  const xToSvg = (x) => {
    const { xMin, xMax } = graphData;
    const w = width - paddingLeft - paddingRight;
    if (xMax === xMin) return paddingLeft + w / 2;
    return paddingLeft + ((x - xMin) / (xMax - xMin)) * w;
  };

  const yToSvg = (y) => {
    const { yMin, yMax } = graphData;
    const h = height - paddingTop - paddingBottom;
    if (yMax === yMin) return paddingTop + h / 2;
    return paddingTop + (1 - (y - yMin) / (yMax - yMin)) * h;
  };

  const pathD =
    graphData.points.length > 0
      ? graphData.points
          .map((pt, idx) => {
            const x = xToSvg(pt.x);
            const y = yToSvg(pt.y);
            return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
          })
          .join(" ")
      : "";

  const xAxisY =
    graphData.yMin <= 0 && graphData.yMax >= 0
      ? yToSvg(0)
      : yToSvg(graphData.yMin);

  const yAxisX =
    graphData.xMin <= 0 && graphData.xMax >= 0
      ? xToSvg(0)
      : xToSvg(graphData.xMin);

  // ----- descarga de gráfica como imagen (PNG / JPG) -----
  const handleDownloadGraph = (format = "png") => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);

    const svgBlob = new Blob([source], {
      type: "image/svg+xml;charset=utf-8"
    });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      // Fondo blanco para JPG
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      URL.revokeObjectURL(url);

      const mime =
        format === "jpg" || format === "jpeg"
          ? "image/jpeg"
          : "image/png";

      const imgURI = canvas.toDataURL(mime);
      const link = document.createElement("a");
      link.href = imgURI;
      link.download =
        format === "jpg" || format === "jpeg"
          ? "biseccion_grafica.jpg"
          : "biseccion_grafica.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      alert(
        "No se pudo exportar la gráfica. Intenta de nuevo o revisa la compatibilidad del navegador."
      );
    };

    img.src = url;
  };

  return (
    <div className="bisection-grid">
      {/* Columna: formulario */}
      <div className="bisection-form">
        <h3>Método de Bisección</h3>
        <p className="bisection-hint">
          Ingresa cualquier función f(x) usando sintaxis de JavaScript/mathjs.
          Ejemplos: <code>x^3 - x - 1</code>, <code>sin(x)</code>,{" "}
          <code>exp(-x) - x</code>. También se aceptan <code>ln(x)</code> y{" "}
          <code>sen(x)</code>.
        </p>

        <form onSubmit={handleCalculate}>
          <div className="bisection-form-row">
            <label>Ingrese la función f(x) =</label>
            <input
              type="text"
              value={fxInput}
              onChange={(e) => setFxInput(e.target.value)}
              placeholder="Ej: x^3 - x - 1"
            />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese el valor "a" =</label>
            <input
              type="number"
              value={aInput}
              onChange={(e) => setAInput(e.target.value)}
            />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese el valor "b" =</label>
            <input
              type="number"
              value={bInput}
              onChange={(e) => setBInput(e.target.value)}
            />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese tolerancia o exactitud =</label>
            <input
              type="number"
              step="any"
              value={tolInput}
              onChange={(e) => setTolInput(e.target.value)}
            />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese número de iteraciones =</label>
            <input
              type="number"
              value={maxIterInput}
              onChange={(e) => setMaxIterInput(e.target.value)}
            />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese número de decimales =</label>
            <input
              type="number"
              value={decimalsInput}
              onChange={(e) => setDecimalsInput(e.target.value)}
            />
          </div>

          <div className="bisection-buttons">
            <button type="submit" className="btn-primary">
              CALCULAR
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClear}
            >
              BORRAR CELDAS
            </button>
          </div>
        </form>

        {message && <p className="bisection-message">{message}</p>}
        {errorMsg && <p className="bisection-error">{errorMsg}</p>}
      </div>

      {/* Columna: tabla + gráfica */}
      <div className="bisection-results">
        <div className="bisection-table-wrapper" ref={tableRef}>
          <h4>Tabla de iteraciones</h4>
          {rows.length === 0 ? (
            <p className="bisection-hint">
              Ingresa los datos y presiona <strong>CALCULAR</strong> para ver
              las iteraciones.
            </p>
          ) : (
            <table className="bisection-table">
              <thead>
                <tr>
                  <th>n</th>
                  <th>a</th>
                  <th>b</th>
                  <th>p</th>
                  <th>f(a)</th>
                  <th>f(b)</th>
                  <th>f(p)</th>
                  <th>f(a)·f(p)</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.n}>
                    <td>{row.n}</td>
                    <td>{formatNumber(row.a)}</td>
                    <td>{formatNumber(row.b)}</td>
                    <td>{formatNumber(row.p)}</td>
                    <td>{formatNumber(row.fa)}</td>
                    <td>{formatNumber(row.fb)}</td>
                    <td>{formatNumber(row.fp)}</td>
                    <td>{formatNumber(row.fa_fp)}</td>
                    <td>{formatNumber(row.error)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {rows.length > 0 && (
          <div className="bisection-download">
            <button
              type="button"
              className="btn-download"
              onClick={handleDownloadTableCsv}
            >
              Tabla (CSV)
            </button>
            <button
              type="button"
              className="btn-download btn-download-secondary"
              onClick={handleDownloadTablePdf}
            >
              Tabla (PDF)
            </button>
          </div>
        )}

        <div className="graph-card">
          <h4 className="graph-title">Gráfica de f(x)</h4>
          {graphData.points.length === 0 ? (
            <p className="bisection-hint">
              No se pudo generar la gráfica. Revisa la función y el intervalo.
            </p>
          ) : (
            <>
              <svg
                className="graph-svg"
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
                ref={svgRef}
              >
                {/* Zona del intervalo actual [a, b] */}
                {lastInterval && (
                  <rect
                    x={xToSvg(lastInterval.a)}
                    y={paddingTop}
                    width={Math.abs(
                      xToSvg(lastInterval.b) - xToSvg(lastInterval.a)
                    )}
                    height={height - paddingTop - paddingBottom}
                    fill="#fee2e2"
                  />
                )}

                {/* Eje X */}
                <line
                  x1={paddingLeft}
                  x2={width - paddingRight}
                  y1={xAxisY}
                  y2={xAxisY}
                  stroke="#9ca3af"
                  strokeWidth="1"
                />

                {/* Eje Y */}
                <line
                  x1={yAxisX}
                  x2={yAxisX}
                  y1={paddingTop}
                  y2={height - paddingBottom}
                  stroke="#9ca3af"
                  strokeWidth="1"
                />

                {/* Ticks y etiquetas en X */}
                {graphData.xTicks.map((xt, idx) => (
                  <g key={`xtick-${idx}`}>
                    <line
                      x1={xToSvg(xt)}
                      x2={xToSvg(xt)}
                      y1={xAxisY - 3}
                      y2={xAxisY + 3}
                      stroke="#9ca3af"
                      strokeWidth="1"
                    />
                    <text
                      x={xToSvg(xt)}
                      y={height - 6}
                      fontSize="9"
                      textAnchor="middle"
                      fill="#4b5563"
                    >
                      {xt.toFixed(2)}
                    </text>
                  </g>
                ))}

                {/* Ticks y etiquetas en Y */}
                {graphData.yTicks.map((yt, idx) => (
                  <g key={`ytick-${idx}`}>
                    <line
                      x1={yAxisX - 3}
                      x2={yAxisX + 3}
                      y1={yToSvg(yt)}
                      y2={yToSvg(yt)}
                      stroke="#9ca3af"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingLeft - 6}
                      y={yToSvg(yt) + 3}
                      fontSize="9"
                      textAnchor="end"
                      fill="#4b5563"
                    >
                      {yt.toFixed(2)}
                    </text>
                  </g>
                ))}

                {/* Curva de f(x) */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="1.5"
                />

                {/* Última aproximación p */}
                {lastP != null && (
                  <line
                    x1={xToSvg(lastP)}
                    x2={xToSvg(lastP)}
                    y1={paddingTop}
                    y2={height - paddingBottom}
                    stroke="#ef4444"
                    strokeWidth="1.3"
                    strokeDasharray="4 3"
                  />
                )}
              </svg>

              <div className="graph-download">
                <button
                  type="button"
                  className="btn-download"
                  onClick={() => handleDownloadGraph("png")}
                >
                  Gráfica (PNG)
                </button>
                <button
                  type="button"
                  className="btn-download btn-download-secondary"
                  onClick={() => handleDownloadGraph("jpg")}
                >
                  Gráfica (JPG)
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
