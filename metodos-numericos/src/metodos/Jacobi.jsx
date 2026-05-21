// src/metodos/Jacobi.jsx
import { useMemo, useRef, useState } from "react";
import "./Biseccion.css";

const ejemplosJacobi = {
  2: {
    nombre: "Matriz de 2x2",
    descripcion: "Ejemplo con solución cercana a x1=2, x2=1",
    Aumentada: [
      ["4", "1", "9"],
      ["1", "3", "5"],
    ],
    x0: ["0", "0"],
    tolerancia: "0.001",
    iteraciones: "50",
    decimales: "6",
  },

  3: {
    nombre: "Matriz de 3x3",
    descripcion: "Ejemplo con solución cercana a x1=1, x2=2, x3=3",
    Aumentada: [
      ["10", "2", "-1", "11"],
      ["-3", "12", "2", "27"],
      ["1", "-1", "8", "23"],
    ],
    x0: ["0", "0", "0"],
    tolerancia: "0.001",
    iteraciones: "80",
    decimales: "6",
  },

  4: {
    nombre: "Matriz de 4x4",
    descripcion: "Ejemplo con solución cercana a x1=1, x2=2, x3=3, x4=4",
    Aumentada: [
      ["12", "-1", "2", "1", "20"],
      ["1", "14", "-1", "2", "34"],
      ["2", "1", "15", "-1", "45"],
      ["-1", "2", "1", "16", "70"],
    ],
    x0: ["0", "0", "0", "0"],
    tolerancia: "0.001",
    iteraciones: "100",
    decimales: "6",
  },

  5: {
    nombre: "Matriz de 5x5",
    descripcion: "Ejemplo con solución cercana a x1=1, x2=2, x3=3, x4=4, x5=5",
    Aumentada: [
      ["15", "1", "-1", "2", "0", "22"],
      ["2", "16", "1", "-1", "2", "43"],
      ["-1", "2", "17", "1", "-1", "53"],
      ["1", "-1", "2", "18", "1", "82"],
      ["2", "1", "-1", "2", "19", "104"],
    ],
    x0: ["0", "0", "0", "0", "0"],
    tolerancia: "0.001",
    iteraciones: "120",
    decimales: "6",
  },

  6: {
    nombre: "Matriz de 6x6",
    descripcion: "Ejemplo con solución cercana a x1=1, x2=2, x3=3, x4=4, x5=5, x6=6",
    Aumentada: [
      ["20", "1", "-1", "2", "0", "1", "33"],
      ["1", "21", "2", "-1", "1", "0", "50"],
      ["-1", "2", "22", "1", "-1", "2", "80"],
      ["2", "-1", "1", "23", "2", "-1", "99"],
      ["0", "1", "-1", "2", "24", "1", "133"],
      ["1", "0", "2", "-1", "1", "25", "158"],
    ],
    x0: ["0", "0", "0", "0", "0", "0"],
    tolerancia: "0.001",
    iteraciones: "150",
    decimales: "6",
  },
};

const crearMatrizVacia = (n) => {
  return Array.from({ length: n }, () =>
    Array.from({ length: n + 1 }, () => "")
  );
};

const crearVectorInicial = (n) => {
  return Array.from({ length: n }, () => "0");
};

export default function Jacobi() {
  const [dimension, setDimension] = useState("3");
  const [matrix, setMatrix] = useState(
    ejemplosJacobi[3].Aumentada.map((row) => [...row])
  );
  const [x0, setX0] = useState([...ejemplosJacobi[3].x0]);

  const [tolInput, setTolInput] = useState(ejemplosJacobi[3].tolerancia);
  const [iterInput, setIterInput] = useState(ejemplosJacobi[3].iteraciones);
  const [decimalsInput, setDecimalsInput] = useState(
    ejemplosJacobi[3].decimales
  );

  const [rows, setRows] = useState([]);
  const [solution, setSolution] = useState(null);
  const [residualMax, setResidualMax] = useState(null);
  const [dominanceMsg, setDominanceMsg] = useState("");
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [warningMsg, setWarningMsg] = useState("");

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const svgRef = useRef(null);

  const n = useMemo(() => {
    const value = parseInt(dimension, 10);
    return Number.isFinite(value) && value >= 2 ? value : 3;
  }, [dimension]);

  const variables = useMemo(() => {
    return Array.from({ length: n }, (_, i) => `x${i + 1}`);
  }, [n]);

  const parseNum = (value) => {
    const v = parseFloat(String(value ?? "").replace(",", ".").trim());
    return Number.isFinite(v) ? v : NaN;
  };

  const getDecimals = () => {
    const d = parseInt(decimalsInput, 10);
    if (Number.isNaN(d) || d < 0) return 6;
    return Math.min(d, 12);
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
    setRows([]);
    setSolution(null);
    setResidualMax(null);
    setDominanceMsg("");
    setMessage("");
    setErrorMsg("");
    setWarningMsg("");
    resetChart();
  };

  const loadSize = (size) => {
    setDimension(String(size));

    if (ejemplosJacobi[size]) {
      const ejemplo = ejemplosJacobi[size];

      setMatrix(ejemplo.Aumentada.map((row) => [...row]));
      setX0([...ejemplo.x0]);
      setTolInput(ejemplo.tolerancia);
      setIterInput(ejemplo.iteraciones);
      setDecimalsInput(ejemplo.decimales);
    } else {
      setMatrix(crearMatrizVacia(size));
      setX0(crearVectorInicial(size));
      setTolInput("0.001");
      setIterInput("100");
      setDecimalsInput("6");
    }

    resetResults();
  };

  const handleDimensionChange = (value) => {
    setDimension(value);

    const size = parseInt(value, 10);

    if (!Number.isFinite(size)) {
      resetResults();
      return;
    }

    if (size < 2) {
      setErrorMsg("La dimensión mínima permitida es 2.");
      return;
    }

    loadSize(size);
  };

  const setCell = (i, j, value) => {
    setMatrix((prev) => {
      const next = prev.map((row) => [...row]);

      if (!next[i]) {
        next[i] = Array.from({ length: n + 1 }, () => "");
      }

      next[i][j] = value;
      return next;
    });

    resetResults();
  };

  const setX0Cell = (i, value) => {
    setX0((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });

    resetResults();
  };

  const clearAll = () => {
    if (!Number.isFinite(n) || n < 2) {
      setErrorMsg("Primero ingresa una dimensión válida.");
      return;
    }

    setMatrix(crearMatrizVacia(n));
    setX0(crearVectorInicial(n));
    resetResults();
  };

  const buildSystem = () => {
    const A = [];
    const b = [];

    if (!Number.isFinite(n) || n < 2) {
      return {
        ok: false,
        error: "Ingresa una dimensión válida mayor o igual a 2.",
      };
    }

    for (let i = 0; i < n; i++) {
      const row = [];

      for (let j = 0; j < n; j++) {
        const value = parseNum(matrix[i]?.[j]);

        if (!Number.isFinite(value)) {
          return {
            ok: false,
            error: `Valor inválido en A[${i + 1}, ${j + 1}].`,
          };
        }

        row.push(value);
      }

      const rhs = parseNum(matrix[i]?.[n]);

      if (!Number.isFinite(rhs)) {
        return {
          ok: false,
          error: `Valor inválido en b[${i + 1}].`,
        };
      }

      A.push(row);
      b.push(rhs);
    }

    const xInit = [];

    for (let i = 0; i < n; i++) {
      const value = parseNum(x0[i]);

      if (!Number.isFinite(value)) {
        return {
          ok: false,
          error: `Valor inválido en el vector inicial x${i + 1}.`,
        };
      }

      xInit.push(value);
    }

    for (let i = 0; i < n; i++) {
      if (Math.abs(A[i][i]) < 1e-14) {
        return {
          ok: false,
          error: `La diagonal principal no puede contener ceros. Revisa a[${i + 1}, ${i + 1}].`,
        };
      }
    }

    return { ok: true, A, b, xInit };
  };

  const checkDiagonalDominance = (A) => {
    let strict = false;
    const details = [];

    for (let i = 0; i < A.length; i++) {
      const diag = Math.abs(A[i][i]);

      const sum = A[i].reduce((acc, value, j) => {
        return i === j ? acc : acc + Math.abs(value);
      }, 0);

      details.push({ row: i + 1, diag, sum });

      if (diag < sum) {
        return { ok: false, strict: false, details };
      }

      if (diag > sum) strict = true;
    }

    return { ok: true, strict, details };
  };

  const getPermutations = (array) => {
    if (array.length <= 1) return [array];

    const result = [];

    array.forEach((item, index) => {
      const rest = [...array.slice(0, index), ...array.slice(index + 1)];

      getPermutations(rest).forEach((perm) => {
        result.push([item, ...perm]);
      });
    });

    return result;
  };

  const tryReorderRows = () => {
    resetResults();

    if (n > 7) {
      setWarningMsg(
        "El reordenamiento automático se limita a matrices de hasta 7x7 para evitar cálculos demasiado pesados."
      );
      return;
    }

    const built = buildSystem();

    if (!built.ok) {
      setErrorMsg(built.error);
      return;
    }

    const indices = Array.from({ length: n }, (_, i) => i);
    const permutations = getPermutations(indices);

    for (const permutation of permutations) {
      const Aperm = permutation.map((index) => built.A[index]);
      const dominance = checkDiagonalDominance(Aperm);

      if (dominance.ok) {
        const reorderedMatrix = permutation.map((index) => [...matrix[index]]);
        setMatrix(reorderedMatrix);
        setMessage("Se reordenaron las filas para mejorar la dominancia diagonal.");
        return;
      }
    }

    setWarningMsg("No se encontró un reordenamiento diagonalmente dominante.");
  };

  const calculateResidualMax = (A, b, x) => {
    const residuals = A.map((row, i) => {
      const Ax = row.reduce((acc, value, j) => acc + value * x[j], 0);
      return Ax - b[i];
    });

    return Math.max(...residuals.map((value) => Math.abs(value)));
  };

  const jacobi = (A, b, xInit, maxIter, tol) => {
    let xOld = [...xInit];
    const history = [];

    for (let iter = 1; iter <= maxIter; iter++) {
      const xNew = [...xOld];

      for (let i = 0; i < n; i++) {
        let sum = b[i];

        for (let j = 0; j < n; j++) {
          if (j !== i) {
            sum -= A[i][j] * xOld[j];
          }
        }

        xNew[i] = sum / A[i][i];
      }

      const errors = xNew.map((value, i) => Math.abs(value - xOld[i]));
      const maxErr = Math.max(...errors);

      history.push({
        iter,
        xs: [...xNew],
        errs: errors,
        maxErr,
      });

      if (maxErr < tol || maxErr === 0) {
        return {
          rows: history,
          solution: [...xNew],
          converged: true,
        };
      }

      xOld = [...xNew];
    }

    return {
      rows: history,
      solution: [...xOld],
      converged: false,
    };
  };

  const handleCalculate = (e) => {
    e.preventDefault();

    resetResults();

    const tol = parseNum(tolInput);
    const maxIter = parseInt(iterInput, 10);

    if (!Number.isFinite(tol) || tol <= 0) {
      setErrorMsg("La tolerancia debe ser un número positivo.");
      return;
    }

    if (!Number.isFinite(maxIter) || maxIter <= 0) {
      setErrorMsg("El número de iteraciones debe ser mayor que cero.");
      return;
    }

    const built = buildSystem();

    if (!built.ok) {
      setErrorMsg(built.error);
      return;
    }

    const { A, b, xInit } = built;
    const dominance = checkDiagonalDominance(A);

    if (dominance.ok) {
      setDominanceMsg(
        dominance.strict
          ? "La matriz es diagonalmente dominante. Hay buena condición práctica de convergencia."
          : "La matriz cumple dominancia diagonal débil. El método puede converger, pero conviene revisar el error."
      );
    } else {
      setWarningMsg("La matriz no es diagonalmente dominante. El método puede no converger.");
    }

    const result = jacobi(A, b, xInit, maxIter, tol);
    const residual = calculateResidualMax(A, b, result.solution);

    setRows(result.rows);
    setSolution(result.solution);
    setResidualMax(residual);

    if (result.converged) {
      setMessage(`Se encontró la solución en ${result.rows.length} iteraciones.`);
    } else {
      setMessage("Se alcanzó el número máximo de iteraciones sin cumplir la tolerancia.");
    }
  };

  const exportCSV = () => {
    if (rows.length === 0) return;

    const headers = [
      "n",
      ...variables,
      ...variables.map((variable) => `E_${variable}`),
      "Error",
    ];

    const content = rows.map((row) => {
      return [
        row.iter,
        ...row.xs.map((value) => fmt(value)),
        ...row.errs.map((value) => fmt(value)),
        fmt(row.maxErr),
      ].join(",");
    });

    const csv = [headers.join(","), ...content].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `jacobi_matriz_${n}x${n}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const downloadChartPNG = () => {
    if (!svgRef.current || rows.length === 0) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgRef.current);

    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });

    const url = URL.createObjectURL(svgBlob);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 900;
      canvas.height = 500;

      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");

      link.href = pngUrl;
      link.download = `grafica_error_jacobi_matriz_${n}x${n}.png`;
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
    if (rows.length === 0) return;

    e.preventDefault();

    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;

    setZoom((prev) => Math.min(Math.max(prev * factor, 0.5), 8));
  };

  const startDrag = (e) => {
    if (rows.length === 0) return;

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

  const lastIndex = rows.length - 1;

  const foundFinal =
    rows.length > 0 &&
    Number.isFinite(rows[lastIndex]?.maxErr) &&
    parseNum(tolInput) > 0 &&
    (rows[lastIndex].maxErr < parseNum(tolInput) ||
      rows[lastIndex].maxErr === 0);

  const errorValues = rows.map((row) => row.maxErr);

  const maxErrorChart = errorValues.length > 0 ? Math.max(...errorValues) : 1;
  const minErrorChart = errorValues.length > 0 ? Math.min(...errorValues) : 0;

  const width = 760;
  const height = 360;
  const marginLeft = 75;
  const marginRight = 30;
  const marginTop = 35;
  const marginBottom = 70;

  const graphWidth = width - marginLeft - marginRight;
  const graphHeight = height - marginTop - marginBottom;

  const chartPoints = errorValues.map((error, index) => {
    const x =
      errorValues.length === 1
        ? marginLeft + graphWidth / 2
        : marginLeft + (index * graphWidth) / (errorValues.length - 1);

    const yScale =
      maxErrorChart === minErrorChart
        ? 0.5
        : (error - minErrorChart) / (maxErrorChart - minErrorChart);

    const y = marginTop + graphHeight - yScale * graphHeight;

    return {
      x,
      y,
      error,
      iter: index + 1,
    };
  });

  const chartPath = chartPoints
    .map((point, index) =>
      index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
    )
    .join(" ");

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((factor) => {
    const value = minErrorChart + factor * (maxErrorChart - minErrorChart);
    const y = marginTop + graphHeight - factor * graphHeight;

    return { value, y };
  });

  const xTicks = chartPoints.filter((_, index) => {
    if (chartPoints.length <= 8) return true;
    return index % Math.ceil(chartPoints.length / 8) === 0;
  });

  return (
    <div className="bisection-grid">
      <div className="bisection-form">
        <h3>Método de Jacobi</h3>

        <p className="bisection-hint">
          Ingresa la dimensión de la matriz cuadrada. Si es de 2x2 a 6x6,
          se cargará un ejemplo funcional. Si es mayor, se generará una matriz
          vacía para ingresar tus propios valores.
        </p>

        <form onSubmit={handleCalculate}>
          <div className="method-section">
            <h4>Configuración del sistema</h4>

            <div className="method-two-columns">
              <div className="bisection-form-row">
                <label>Dimensión n =</label>

                <input
                  type="number"
                  min="2"
                  step="1"
                  value={dimension}
                  onChange={(e) => handleDimensionChange(e.target.value)}
                  placeholder="Ej: 3"
                />
              </div>

              <div className="bisection-form-row">
                <label>Iteraciones =</label>

                <input
                  type="number"
                  min="1"
                  value={iterInput}
                  onChange={(e) => {
                    setIterInput(e.target.value);
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
              {ejemplosJacobi[n]
                ? `Ejemplo cargado: ${ejemplosJacobi[n].descripcion}`
                : `Matriz de ${n}x${n}: ingresa manualmente los coeficientes y el vector b.`}
            </p>
          </div>

          <div className="method-section">
            <div className="table-header-actions">
              <h4>Matriz aumentada [A|b] — Matriz de {n}x{n}</h4>

              <button
                type="button"
                className="btn-export"
                onClick={tryReorderRows}
              >
                Intentar ordenar
              </button>
            </div>

            <div className="table-scroll">
              <table className="bisection-table">
                <thead>
                  <tr>
                    <th>Ec.</th>

                    {variables.map((variable) => (
                      <th key={`coef-${variable}`}>Coef. {variable}</th>
                    ))}

                    <th>b</th>
                  </tr>
                </thead>

                <tbody>
                  {Array.from({ length: n }).map((_, i) => (
                    <tr key={`row-${i}`}>
                      <td>Ec. {i + 1}</td>

                      {Array.from({ length: n + 1 }).map((_, j) => (
                        <td key={`cell-${i}-${j}`}>
                          <input
                            type="number"
                            step="any"
                            value={matrix[i]?.[j] ?? ""}
                            onChange={(e) => setCell(i, j, e.target.value)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="method-section">
            <h4>Vector inicial</h4>

            <div className="method-vector-grid">
              {variables.map((variable, i) => (
                <div className="bisection-form-row" key={`x0-${variable}`}>
                  <label>
                    {variable}
                    <sub>0</sub> =
                  </label>

                  <input
                    type="number"
                    step="any"
                    value={x0[i] ?? ""}
                    onChange={(e) => setX0Cell(i, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bisection-buttons">
            <button type="submit" className="btn-primary">
              CALCULAR
            </button>

            <button type="button" className="btn-secondary" onClick={clearAll}>
              BORRAR CELDAS
            </button>
          </div>
        </form>

        {message && <p className="bisection-message">{message}</p>}
        {dominanceMsg && <p className="bisection-message">{dominanceMsg}</p>}
        {warningMsg && <p className="bisection-warning">{warningMsg}</p>}
        {errorMsg && <p className="bisection-error">{errorMsg}</p>}
      </div>

      <div className="bisection-results">
        <div className="graph-card">
          <h4 className="graph-title">Respuesta final</h4>

          {!solution ? (
            <p className="bisection-hint">
              Aún no hay resultado. Completa los datos y presiona{" "}
              <strong>CALCULAR</strong>.
            </p>
          ) : (
            <>
              <div className="method-result-grid">
                {solution.map((value, index) => (
                  <div className="mini-info-card" key={`solution-${index}`}>
                    <div className="mini-info-card-title">{variables[index]}</div>
                    <div className="mini-info-card-value">{fmt(value)}</div>
                  </div>
                ))}
              </div>

              <p className="bisection-hint" style={{ marginTop: "0.8rem" }}>
                Residuo máximo:{" "}
                <strong>
                  {residualMax === null ? "Pendiente" : fmt(residualMax)}
                </strong>
              </p>
            </>
          )}
        </div>

        <div className="graph-card">
          <h4 className="graph-title">Sistema ingresado</h4>

          <div className="system-preview">
            {matrix.map((row, i) => {
              const equation = variables
                .map((variable, j) => {
                  const coef = row[j] || "0";
                  return `${coef}${variable}`;
                })
                .join(" + ");

              return (
                <p key={`eq-${i}`}>
                  <strong>Ec. {i + 1}:</strong> {equation} = {row[n] || "0"}
                </p>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bisection-results full-width-results">
        <div className="graph-card">
          <div className="table-header-actions">
            <h4 className="graph-title">Gráfica interactiva de error</h4>

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
                disabled={rows.length === 0}
              >
                PNG
              </button>
            </div>
          </div>

          {rows.length === 0 ? (
            <p className="bisection-hint">
              La gráfica aparecerá después de calcular.
            </p>
          ) : (
            <>
              <p className="bisection-hint">
                Usa la rueda del mouse para acercar o alejar. Arrastra la gráfica
                para desplazarla.
              </p>

              <div className="interactive-chart-wrapper">
                <svg
                  ref={svgRef}
                  className="error-chart"
                  viewBox={`0 0 ${width} ${height}`}
                  role="img"
                  aria-label="Gráfica de error contra iteración"
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
                      .chart-point { fill: #dc2626; stroke: white; stroke-width: 1.5; }
                      .chart-label { font-size: 11px; fill: #334155; }
                      .chart-axis-title { font-size: 13px; fill: #0f172a; font-weight: 700; }
                      .chart-title-text { font-size: 16px; fill: #111827; font-weight: 800; }
                    `}
                  </style>

                  <rect x="0" y="0" width={width} height={height} fill="white" />

                  <text x={width / 2 - 80} y="22" className="chart-title-text">
                    Error vs Iteración
                  </text>

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

                  {yTicks.map((tick, index) => (
                    <g key={`ytick-${index}`}>
                      <line
                        x1={marginLeft}
                        y1={tick.y}
                        x2={marginLeft + graphWidth}
                        y2={tick.y}
                        className="chart-grid-line"
                      />

                      <text x="8" y={tick.y + 4} className="chart-label">
                        {fmt(tick.value)}
                      </text>
                    </g>
                  ))}

                  {xTicks.map((point) => (
                    <g key={`xtick-${point.iter}`}>
                      <line
                        x1={point.x}
                        y1={marginTop + graphHeight}
                        x2={point.x}
                        y2={marginTop + graphHeight + 6}
                        className="chart-axis"
                      />

                      <text
                        x={point.x - 4}
                        y={marginTop + graphHeight + 22}
                        className="chart-label"
                      >
                        {point.iter}
                      </text>
                    </g>
                  ))}

                  <text
                    x={width / 2 - 40}
                    y={height - 18}
                    className="chart-axis-title"
                  >
                    Eje X: Iteración
                  </text>

                  <text
                    x="-220"
                    y="18"
                    transform="rotate(-90)"
                    className="chart-axis-title"
                  >
                    Eje Y: Error máximo
                  </text>

                  <g
                    transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
                    className={dragging ? "chart-dragging" : "chart-draggable"}
                  >
                    <path d={chartPath} className="chart-line" fill="none" />

                    {chartPoints.map((point, index) => (
                      <g key={`point-${index}`}>
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="4"
                          className="chart-point"
                        />

                        <title>
                          Iteración {point.iter} | Error: {fmt(point.error)}
                        </title>
                      </g>
                    ))}
                  </g>
                </svg>
              </div>
            </>
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
              Aquí aparecerán las iteraciones del método.
            </p>
          ) : (
            <div className="table-scroll">
              <table className="bisection-table">
                <thead>
                  <tr>
                    <th>n</th>

                    {variables.map((variable) => (
                      <th key={`x-${variable}`}>{variable}</th>
                    ))}

                    {variables.map((variable) => (
                      <th key={`e-${variable}`}>
                        E<sub>{variable}</sub>
                      </th>
                    ))}

                    <th>Error</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row, index) => {
                    const isLast = index === lastIndex && foundFinal;

                    return (
                      <tr key={row.iter}>
                        <td>{row.iter}</td>

                        {row.xs.map((value, i) => (
                          <td
                            key={`x-${row.iter}-${i}`}
                            className={isLast ? "cell-green" : ""}
                          >
                            {fmt(value)}
                          </td>
                        ))}

                        {row.errs.map((value, i) => (
                          <td key={`err-${row.iter}-${i}`}>
                            {fmt(value)}
                          </td>
                        ))}

                        <td className={isLast ? "cell-red" : ""}>
                          {fmt(row.maxErr)}
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
              SE ENCONTRÓ LA SOLUCIÓN porque {fmt(rows[lastIndex].maxErr)} &lt;{" "}
              {tolInput}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}