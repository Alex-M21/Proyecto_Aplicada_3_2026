/**
 *  Desarrollador : Alexander Mejia
 *  GitHub        : Alex-M21
 *  Email         : b.alex.mejia@gmail.com
 *
 *  ADVERTENCIA:
 *  Estás modificando código protegido. DO NOT COPY AND PASTE.
 *  Para cualquier cambio comunícate con: b.alex.mejia@gmail.com
 */
import { useState, useMemo, useRef, useEffect } from "react";
import { create, all } from "mathjs";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./Biseccion.css";

const math = create(all, {});

// === Pan & Zoom (igual a Newton) ===
const makePanZoomHandlers = (range, setRange, width, padL, padR) => {
  let dragging = false;
  let lastClientX = 0;

  const innerW = width - padL - padR;

  const clientXToX = (svg, clientX, xMin, xMax) => {
    const rect = svg.getBoundingClientRect();
    let px = clientX - rect.left;
    px = Math.max(padL, Math.min(width - padR, px));
    const t = (px - padL) / innerW;
    return xMin + t * (xMax - xMin);
  };

  const onWheel = (e) => {
    e.preventDefault();
    const svg = e.currentTarget;
    const { xMin, xMax } = range;
    if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMin === xMax) return;

    const mouseX = clientXToX(svg, e.clientX, xMin, xMax);

    // deltaY < 0 acerca; > 0 aleja
    const k = e.deltaY < 0 ? 1 / 1.2 : 1.2;
    const span = Math.max(1e-9, (xMax - xMin) * k);

    const t = (mouseX - xMin) / (xMax - xMin);
    const newXMin = mouseX - t * span;
    const newXMax = newXMin + span;

    setRange({ xMin: newXMin, xMax: newXMax });
  };

  const onMouseDown = (e) => {
    dragging = true;
    lastClientX = e.clientX;
    e.currentTarget.style.cursor = "grabbing";
  };

  const onMouseMove = (e) => {
    if (!dragging) return;
    const dxPx = e.clientX - lastClientX;
    lastClientX = e.clientX;

    const { xMin, xMax } = range;
    const dxX = (-dxPx * (xMax - xMin)) / innerW;
    setRange({ xMin: xMin + dxX, xMax: xMax + dxX });
  };

  const finish = (e) => {
    dragging = false;
    if (e?.currentTarget) e.currentTarget.style.cursor = "grab";
  };

  return {
    onWheel,
    onMouseDown,
    onMouseMove,
    onMouseUp: finish,
    onMouseLeave: finish,
    style: { cursor: "grab" }
  };
};

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

  // Iteración a visualizar en la gráfica (slider)
  const [iterView, setIterView] = useState(0);

  const tableRef = useRef(null);
  const svgRef = useRef(null);

  const buildCompiled = (expr) => {
    const trimmed = expr.trim();
    if (!trimmed) return null;
    const normalized = trimmed.replace(/ln/gi, "log").replace(/sen/gi, "sin");
    try {
      return math.compile(normalized);
    } catch {
      return null;
    }
  };

  const getDecimals = () => {
    const d = parseInt(decimalsInput, 10);
    if (Number.isNaN(d) || d < 0) return 6;
    return Math.min(12, d);
  };

  const formatNumber = (value) => {
    const decimals = getDecimals();
    return Number.isFinite(value) ? value.toFixed(decimals) : "NaN";
  };

  const handleCalculate = (e) => {
    e.preventDefault();
    setMessage("");
    setErrorMsg("");
    setRows([]);
    setIterView(0);

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
      setErrorMsg("La función f(x) no se pudo interpretar. Revisa la sintaxis.");
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
      setErrorMsg("No se pudo evaluar f(x) en a o b. Revisa el dominio.");
      return;
    }
    if (fa * fb > 0) {
      setErrorMsg("f(a) y f(b) tienen el mismo signo. Se requiere cambio de signo.");
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
        const error = (b - a) / 2;

        newRows.push({ n, a, b, p, fa, fb, fp, fa_fp, error });

        if (!Number.isFinite(fp)) {
          setErrorMsg("No se pudo evaluar f(p) en alguna iteración.");
          hadError = true;
          break;
        }

        // ✅ criterio de parada correcto
        if (Math.abs(fp) === 0 || error < tol) {
          found = true;
          break;
        }

        if (fa_fp < 0) b = p;
        else a = p;
      }
    } catch {
      setErrorMsg("Ocurrió un error inesperado durante las iteraciones.");
      hadError = true;
    }

    setRows(newRows);
    if (!newRows.length || hadError) return;

    // Slider apunta a la última iteración por defecto
    setIterView(newRows.length - 1);

    const last = newRows[newRows.length - 1];
    setMessage(
      found
        ? `Se encontró una aproximación a la solución: p ≈ ${formatNumber(last.p)}`
        : "Se alcanzó el número máximo de iteraciones sin cumplir la tolerancia."
    );
  };

  const handleClear = () => {
    setFxInput("");
    setAInput("");
    setBInput("");
    setTolInput("");
    setMaxIterInput("");
    setDecimalsInput("5");
    setRows([]);
    setIterView(0);
    setMessage("");
    setErrorMsg("");
  };

  // ✅ Detectar fila final para pintar (p verde, error rojo)
  const lastIndex = rows.length - 1;
  const tolNum = parseFloat(tolInput);
  const foundFinal =
    rows.length > 0 &&
    (Number.isFinite(rows[lastIndex]?.error) && Number.isFinite(tolNum)) &&
    (rows[lastIndex].error < tolNum || Math.abs(rows[lastIndex]?.fp ?? NaN) === 0);

  // ----- descarga de tabla en CSV -----
  const handleDownloadTableCsv = () => {
    if (!rows.length) return;

    const headers = ["n", "a", "b", "p", "f(a)", "f(b)", "f(p)", "f(a)*f(p)", "error"];
    const csvRows = [headers.join(",")];

    rows.forEach((row) => {
      csvRows.push(
        [
          row.n,
          formatNumber(row.a),
          formatNumber(row.b),
          formatNumber(row.p),
          formatNumber(row.fa),
          formatNumber(row.fb),
          formatNumber(row.fp),
          formatNumber(row.fa_fp),
          formatNumber(row.error)
        ].join(",")
      );
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
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

      const imgProps = pdf.getImageProperties(imgData);
      const imgRatio = imgProps.height / imgProps.width;
      const imgPdfHeight = pdfWidth * imgRatio;

      const yMargin = 10;
      const finalHeight =
        imgPdfHeight + 2 * yMargin > pdfHeight ? pdfHeight - 2 * yMargin : imgPdfHeight;

      pdf.text("Método de Bisección - Tabla de iteraciones", 10, 10);
      pdf.addImage(imgData, "PNG", 10, 16, pdfWidth - 20, finalHeight - 20);
      pdf.save("biseccion_iteraciones.pdf");
    } catch (err) {
      console.error(err);
      alert("Ocurrió un problema al generar el PDF. Intenta de nuevo.");
    }
  };

  // =========================
  // Gráfica dinámica con pan/zoom
  // =========================
  const width = 400;
  const height = 240;
  const padL = 46;
  const padR = 10;
  const padT = 10;
  const padB = 28;

  const lastRow = rows.length ? rows[Math.max(0, Math.min(iterView, rows.length - 1))] : null;
  const intervalToShow = lastRow ? { a: lastRow.a, b: lastRow.b } : null;
  const pToShow = lastRow ? lastRow.p : null;

  const [rangeX, setRangeX] = useState({ xMin: -5, xMax: 5 });

  // Auto-ajuste del rango X cuando cambia a/b o f(x)
  useEffect(() => {
    const a = parseFloat(aInput);
    const b = parseFloat(bInput);

    let xMin = -5;
    let xMax = 5;

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
    }
    setRangeX({ xMin, xMax });
  }, [fxInput, aInput, bInput]);

  const panZoom = makePanZoomHandlers(rangeX, setRangeX, width, padL, padR);

  const graphView = useMemo(() => {
    const compiled = buildCompiled(fxInput);
    if (!compiled) return null;

    const f = (x) => {
      try {
        const r = compiled.evaluate({ x });
        return Number.isFinite(r) ? r : NaN;
      } catch {
        return NaN;
      }
    };

    const xMin = rangeX.xMin;
    const xMax = rangeX.xMax;
    if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMin === xMax) return null;

    const pts = [];
    const steps = 220;
    const step = (xMax - xMin) / steps;

    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * step;
      const y = f(x);
      if (Number.isFinite(y)) pts.push({ x, y });
    }
    if (!pts.length) return null;

    let yMin = Infinity;
    let yMax = -Infinity;
    pts.forEach((p) => {
      yMin = Math.min(yMin, p.y);
      yMax = Math.max(yMax, p.y);
    });
    if (!Number.isFinite(yMin) || !Number.isFinite(yMax) || yMin === yMax) {
      yMin = -1;
      yMax = 1;
    } else {
      const m = (yMax - yMin) * 0.15;
      yMin -= m;
      yMax += m;
    }

    const innerW = width - padL - padR;
    const innerH = height - padT - padB;

    const xTo = (x) => padL + ((x - xMin) / (xMax - xMin)) * innerW;
    const yTo = (y) => padT + (1 - (y - yMin) / (yMax - yMin)) * innerH;

    const pathD = pts.map((p, i) => `${i ? "L" : "M"} ${xTo(p.x)} ${yTo(p.y)}`).join(" ");

    const ticks = (min, max, count = 6) => {
      const arr = [];
      for (let i = 0; i <= count; i++) arr.push(min + (i * (max - min)) / count);
      return arr;
    };

    const xTicks = ticks(xMin, xMax, 6).map((x) => ({ x, X: xTo(x) }));
    const yTicks = ticks(yMin, yMax, 6).map((y) => ({ y, Y: yTo(y) }));

    const xAxisY = yMin <= 0 && yMax >= 0 ? yTo(0) : yTo(yMin);
    const yAxisX = xMin <= 0 && xMax >= 0 ? xTo(0) : xTo(xMin);

    return { xMin, xMax, yMin, yMax, xTo, yTo, pathD, xTicks, yTicks, xAxisY, yAxisX };
  }, [fxInput, rangeX, decimalsInput]);

  // Botones zoom
  const zoomIn = () => {
    const c = (rangeX.xMin + rangeX.xMax) / 2;
    const s = (rangeX.xMax - rangeX.xMin) / 2 / 1.8;
    setRangeX({ xMin: c - s, xMax: c + s });
  };
  const zoomOut = () => {
    const c = (rangeX.xMin + rangeX.xMax) / 2;
    const s = (rangeX.xMax - rangeX.xMin) / 2 * 1.8;
    setRangeX({ xMin: c - s, xMax: c + s });
  };
  const autoRange = () => {
    const a = parseFloat(aInput);
    const b = parseFloat(bInput);
    let xMin = -5, xMax = 5;
    if (Number.isFinite(a) && Number.isFinite(b)) {
      xMin = Math.min(a, b);
      xMax = Math.max(a, b);
      const m = (xMax - xMin) * 0.2 || 0.5;
      xMin -= m; xMax += m;
    }
    setRangeX({ xMin, xMax });
  };

  // ----- descarga de gráfica -----
  const handleDownloadGraph = (format = "png") => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);

    const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const mime = format === "jpg" || format === "jpeg" ? "image/jpeg" : "image/png";
      const imgURI = canvas.toDataURL(mime);

      const link = document.createElement("a");
      link.href = imgURI;
      link.download = format === "jpg" || format === "jpeg" ? "biseccion_grafica.jpg" : "biseccion_grafica.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      alert("No se pudo exportar la gráfica. Intenta de nuevo.");
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
            <input type="number" value={aInput} onChange={(e) => setAInput(e.target.value)} />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese el valor "b" =</label>
            <input type="number" value={bInput} onChange={(e) => setBInput(e.target.value)} />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese tolerancia o exactitud =</label>
            <input type="number" step="any" value={tolInput} onChange={(e) => setTolInput(e.target.value)} />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese número de iteraciones =</label>
            <input type="number" value={maxIterInput} onChange={(e) => setMaxIterInput(e.target.value)} />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese número de decimales =</label>
            <input type="number" value={decimalsInput} onChange={(e) => setDecimalsInput(e.target.value)} />
          </div>

          <div className="bisection-buttons">
            <button type="submit" className="btn-primary">CALCULAR</button>
            <button type="button" className="btn-secondary" onClick={handleClear}>BORRAR CELDAS</button>
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
              Ingresa los datos y presiona <strong>CALCULAR</strong> para ver las iteraciones.
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
                {rows.map((row, idx) => {
                  const isLast = idx === lastIndex && foundFinal;
                  return (
                    <tr key={row.n}>
                      <td>{row.n}</td>
                      <td>{formatNumber(row.a)}</td>
                      <td>{formatNumber(row.b)}</td>
                      <td className={isLast ? "cell-green" : ""}>{formatNumber(row.p)}</td>
                      <td>{formatNumber(row.fa)}</td>
                      <td>{formatNumber(row.fb)}</td>
                      <td>{formatNumber(row.fp)}</td>
                      <td>{formatNumber(row.fa_fp)}</td>
                      <td className={isLast ? "cell-red" : ""}>{formatNumber(row.error)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {rows.length > 0 && (
          <div className="bisection-download">
            <button type="button" className="btn-download" onClick={handleDownloadTableCsv}>Tabla (CSV)</button>
            <button type="button" className="btn-download btn-download-secondary" onClick={handleDownloadTablePdf}>Tabla (PDF)</button>
          </div>
        )}

        <div className="graph-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 className="graph-title">Gráfica de f(x) (zoom y pan)</h4>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn-download" onClick={zoomIn}>Zoom +</button>
              <button type="button" className="btn-download btn-download-secondary" onClick={zoomOut}>Zoom −</button>
              <button type="button" className="btn-secondary" onClick={autoRange}>Auto</button>
            </div>
          </div>

          {/* Slider: elegir iteración */}
          {rows.length > 0 && (
            <div style={{ margin: "8px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span>Iteración: <strong>{rows[iterView]?.n}</strong></span>
                <span>
                  p: <strong>{pToShow != null ? formatNumber(pToShow) : "-"}</strong>
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(0, rows.length - 1)}
                value={iterView}
                onChange={(e) => setIterView(parseInt(e.target.value, 10))}
                style={{ width: "100%" }}
              />
            </div>
          )}

          {!graphView ? (
            <p className="bisection-hint">No se pudo generar la gráfica. Revisa la función y el intervalo.</p>
          ) : (
            <>
              <svg
                className="graph-svg"
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
                ref={svgRef}
                {...panZoom}
              >
                {/* Grid */}
                {graphView.xTicks.map((t, i) => (
                  <line key={`gx${i}`} x1={t.X} x2={t.X} y1={padT} y2={height - padB} stroke="#e5e7eb" />
                ))}
                {graphView.yTicks.map((t, i) => (
                  <line key={`gy${i}`} x1={padL} x2={width - padR} y1={t.Y} y2={t.Y} stroke="#e5e7eb" />
                ))}

                {/* Intervalo [a,b] de la iteración seleccionada */}
                {intervalToShow && (
                  <rect
                    x={graphView.xTo(intervalToShow.a)}
                    y={padT}
                    width={Math.abs(graphView.xTo(intervalToShow.b) - graphView.xTo(intervalToShow.a))}
                    height={height - padT - padB}
                    fill="#fee2e2"
                  />
                )}

                {/* Ejes */}
                <line x1={padL} x2={width - padR} y1={graphView.xAxisY} y2={graphView.xAxisY} stroke="#9ca3af" strokeWidth="1" />
                <line x1={graphView.yAxisX} x2={graphView.yAxisX} y1={padT} y2={height - padB} stroke="#9ca3af" strokeWidth="1" />

                {/* Ticks X */}
                {graphView.xTicks.map((t, i) => (
                  <g key={`xt${i}`}>
                    <line x1={t.X} x2={t.X} y1={graphView.xAxisY - 3} y2={graphView.xAxisY + 3} stroke="#6b7280" />
                    <text x={t.X} y={height - 6} fontSize="9" textAnchor="middle" fill="#374151">
                      {t.x.toFixed(2)}
                    </text>
                  </g>
                ))}

                {/* Ticks Y */}
                {graphView.yTicks.map((t, i) => (
                  <g key={`yt${i}`}>
                    <line x1={graphView.yAxisX - 3} x2={graphView.yAxisX + 3} y1={t.Y} y2={t.Y} stroke="#6b7280" />
                    <text x={padL - 6} y={t.Y + 3} fontSize="9" textAnchor="end" fill="#374151">
                      {t.y.toFixed(2)}
                    </text>
                  </g>
                ))}

                {/* Curva f(x) */}
                <path d={graphView.pathD} fill="none" stroke="#2563eb" strokeWidth="1.6" />

                {/* Línea en p de la iteración seleccionada */}
                {pToShow != null && (
                  <line
                    x1={graphView.xTo(pToShow)}
                    x2={graphView.xTo(pToShow)}
                    y1={padT}
                    y2={height - padB}
                    stroke="#ef4444"
                    strokeWidth="1.3"
                    strokeDasharray="4 3"
                  />
                )}
              </svg>

              <div className="graph-download">
                <button type="button" className="btn-download" onClick={() => handleDownloadGraph("png")}>
                  Gráfica (PNG)
                </button>
                <button type="button" className="btn-download btn-download-secondary" onClick={() => handleDownloadGraph("jpg")}>
                  Gráfica (JPG)
                </button>
              </div>

              <p className="bisection-hint" style={{ marginTop: 6 }}>
                Rueda: zoom • Arrastrar: mover • Slider: ver intervalos por iteración
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}