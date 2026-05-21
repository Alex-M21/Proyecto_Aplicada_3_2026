// src/metodos/NewtonNoLineal.jsx
import { useMemo, useRef, useState } from "react";
import { create, all } from "mathjs";
import "./Biseccion.css";

const math = create(all, {});

const ejemplosNewton = {
  2: {
    nombre: "Ejemplo 2x2 trigonométrico",
    variables: "x,y",
    funciones: [
      "5*x^2-y^2",
      "y-0.25*(sin(x)+cos(y))"
    ],
    inicial: "0.1,0.5",
    tolerancia: "0.0001",
    iteraciones: "25",
    decimales: "5"
  },

  3: {
    nombre: "Ejemplo 3x3 no lineal clásico",
    variables: "x,y,z",
    funciones: [
      "3*x-cos(y*z)-0.5",
      "x^2-81*(y+0.1)^2+sin(z)+1.06",
      "exp(-x*y)+20*z+(10*pi-3)/3"
    ],
    inicial: "0.1,0.1,-0.1",
    tolerancia: "0.0001",
    iteraciones: "25",
    decimales: "8"
  },

  4: {
    nombre: "Ejemplo 4x4 cuadrático",
    variables: "x,y,z,w",
    funciones: [
      "x^2-4",
      "y^2-9",
      "z^2-16",
      "w^2-25"
    ],
    inicial: "1,2,3,4",
    tolerancia: "0.0001",
    iteraciones: "25",
    decimales: "6"
  },

  5: {
    nombre: "Ejemplo 5x5 cuadrático",
    variables: "x,y,z,w,v",
    funciones: [
      "x^2-4",
      "y^2-9",
      "z^2-16",
      "w^2-25",
      "v^2-36"
    ],
    inicial: "1,2,3,4,5",
    tolerancia: "0.0001",
    iteraciones: "25",
    decimales: "6"
  },

  6: {
    nombre: "Ejemplo 6x6 cuadrático",
    variables: "x,y,z,w,v,u",
    funciones: [
      "x^2-4",
      "y^2-9",
      "z^2-16",
      "w^2-25",
      "v^2-36",
      "u^2-49"
    ],
    inicial: "1,2,3,4,5,6",
    tolerancia: "0.0001",
    iteraciones: "25",
    decimales: "6"
  }
};

export default function NewtonNoLineal() {
  const [dimension, setDimension] = useState("2");
  const [variablesInput, setVariablesInput] = useState(ejemplosNewton[2].variables);
  const [funcionesInput, setFuncionesInput] = useState([...ejemplosNewton[2].funciones]);
  const [inicialInput, setInicialInput] = useState(ejemplosNewton[2].inicial);
  const [toleranciaInput, setToleranciaInput] = useState(ejemplosNewton[2].tolerancia);
  const [iteracionesInput, setIteracionesInput] = useState(ejemplosNewton[2].iteraciones);
  const [decimalesInput, setDecimalesInput] = useState(ejemplosNewton[2].decimales);

  const [filas, setFilas] = useState([]);
  const [jacobianoSimbolico, setJacobianoSimbolico] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [advertenciaMsg, setAdvertenciaMsg] = useState("");

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const svgRef = useRef(null);

  const normalizarExpresion = (expr) =>
    String(expr ?? "")
      .trim()
      .replace(/sen/gi, "sin")
      .replace(/ln/gi, "log")
      .replace(/EXP/gi, "exp")
      .replace(/SIN/gi, "sin")
      .replace(/COS/gi, "cos")
      .replace(/TAN/gi, "tan");

  const leerVariables = () => {
    return variablesInput
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
  };

  const leerVector = (texto) => {
    return texto
      .split(",")
      .map((v) => parseFloat(v.trim()))
      .filter((v) => Number.isFinite(v));
  };

  const crearScope = (variables, valores) => {
    const scope = {};

    variables.forEach((variable, index) => {
      scope[variable] = valores[index];
    });

    return scope;
  };

  const maximoAbsoluto = (vector) => {
    return Math.max(...vector.map((v) => Math.abs(v)));
  };

  const matrizAArreglo = (matriz) => {
    if (Array.isArray(matriz)) return matriz;

    if (matriz && typeof matriz.toArray === "function") {
      return matriz.toArray();
    }

    return [];
  };

  const obtenerDecimales = () => {
    const d = parseInt(decimalesInput, 10);

    if (Number.isNaN(d) || d < 0) return 6;

    return Math.min(d, 12);
  };

  const formatearNumero = (valor) => {
    const decimales = obtenerDecimales();

    if (!Number.isFinite(valor)) return "NaN";

    return valor.toFixed(decimales);
  };

  const variables = useMemo(() => leerVariables(), [variablesInput]);

  const toleranciaNumerica = useMemo(() => {
    const t = parseFloat(toleranciaInput);
    return Number.isFinite(t) ? t : NaN;
  }, [toleranciaInput]);

  const cargarEjemplo = (n) => {
    const ejemplo = ejemplosNewton[n];

    setDimension(String(n));
    setVariablesInput(ejemplo.variables);
    setFuncionesInput([...ejemplo.funciones]);
    setInicialInput(ejemplo.inicial);
    setToleranciaInput(ejemplo.tolerancia);
    setIteracionesInput(ejemplo.iteraciones);
    setDecimalesInput(ejemplo.decimales);

    setFilas([]);
    setJacobianoSimbolico([]);
    setMensaje("");
    setErrorMsg("");
    setAdvertenciaMsg("");
    reiniciarGrafica();
  };

  const cambiarDimension = (value) => {
    const n = parseInt(value, 10);

    if (!ejemplosNewton[n]) {
      setErrorMsg("Solo se permiten sistemas cuadrados de 2x2 hasta 6x6.");
      return;
    }

    cargarEjemplo(n);
  };

  const cambiarFuncion = (index, value) => {
    setFuncionesInput((prev) => {
      const copia = [...prev];
      copia[index] = value;
      return copia;
    });

    setFilas([]);
    setJacobianoSimbolico([]);
    setMensaje("");
    setErrorMsg("");
    setAdvertenciaMsg("");
    reiniciarGrafica();
  };

  const calcularNewton = (e) => {
    e.preventDefault();

    setFilas([]);
    setJacobianoSimbolico([]);
    setMensaje("");
    setErrorMsg("");
    setAdvertenciaMsg("");
    reiniciarGrafica();

    const n = parseInt(dimension, 10);
    const tolerancia = parseFloat(toleranciaInput);
    const maxIteraciones = parseInt(iteracionesInput, 10);

    const variables = leerVariables();
    const vectorInicial = leerVector(inicialInput);

    if (!Number.isFinite(n) || n < 2 || n > 6) {
      setErrorMsg("La dimensión debe estar entre 2 y 6.");
      return;
    }

    if (variables.length !== n) {
      setErrorMsg(`Debes ingresar exactamente ${n} variables separadas por coma.`);
      return;
    }

    if (funcionesInput.length !== n || funcionesInput.some((f) => !f.trim())) {
      setErrorMsg(`Debes ingresar exactamente ${n} funciones.`);
      return;
    }

    if (vectorInicial.length !== n) {
      setErrorMsg(`El vector inicial debe tener exactamente ${n} valores.`);
      return;
    }

    if (!Number.isFinite(tolerancia) || tolerancia <= 0) {
      setErrorMsg("La tolerancia debe ser un número positivo.");
      return;
    }

    if (!Number.isFinite(maxIteraciones) || maxIteraciones <= 0) {
      setErrorMsg("El número de iteraciones debe ser mayor que cero.");
      return;
    }

    let funcionesCompiladas = [];
    let jacobianoCompilado = [];
    let jacobianoTexto = [];

    try {
      funcionesCompiladas = funcionesInput.map((funcion) =>
        math.compile(normalizarExpresion(funcion))
      );

      jacobianoCompilado = funcionesInput.map((funcion) => {
        const nodo = math.parse(normalizarExpresion(funcion));

        return variables.map((variable) =>
          math.derivative(nodo, variable).compile()
        );
      });

      jacobianoTexto = funcionesInput.map((funcion) => {
        const nodo = math.parse(normalizarExpresion(funcion));

        return variables.map((variable) =>
          math.derivative(nodo, variable).toString()
        );
      });

      setJacobianoSimbolico(jacobianoTexto);
    } catch {
      setErrorMsg("No se pudieron interpretar las funciones o sus derivadas.");
      return;
    }

    let valoresActuales = [...vectorInicial];
    const nuevasFilas = [];
    let encontrado = false;
    let advertenciaLocal = "";

    try {
      for (let k = 1; k <= maxIteraciones; k++) {
        const scope = crearScope(variables, valoresActuales);

        const fValores = funcionesCompiladas.map((funcion) => {
          const valor = funcion.evaluate(scope);
          return Number.isFinite(valor) ? valor : NaN;
        });

        if (fValores.some((valor) => !Number.isFinite(valor))) {
          setErrorMsg("No se pudo evaluar alguna función. Revisa dominio o sintaxis.");
          return;
        }

        const jValores = jacobianoCompilado.map((fila) =>
          fila.map((derivada) => {
            const valor = derivada.evaluate(scope);
            return Number.isFinite(valor) ? valor : NaN;
          })
        );

        if (jValores.flat().some((valor) => !Number.isFinite(valor))) {
          setErrorMsg("No se pudo evaluar el Jacobiano.");
          return;
        }

        try {
          const detJ = math.det(jValores);

          if (Number.isFinite(detJ) && Math.abs(detJ) < 1e-10) {
            advertenciaLocal =
              "Advertencia: el Jacobiano está cerca de ser singular. El método puede ser inestable.";
          }
        } catch {
          advertenciaLocal =
            "Advertencia: no se pudo calcular el determinante del Jacobiano.";
        }

        const menosF = fValores.map((valor) => [-valor]);

        let deltaRaw;

        try {
          deltaRaw = math.lusolve(jValores, menosF);
        } catch {
          setErrorMsg("No se pudo resolver J·ΔX = -F. El Jacobiano puede ser singular.");
          return;
        }

        const deltaMatriz = matrizAArreglo(deltaRaw);
        const delta = deltaMatriz.map((fila) => fila[0]);

        if (delta.length !== n || delta.some((valor) => !Number.isFinite(valor))) {
          setErrorMsg("El incremento ΔX contiene valores inválidos.");
          return;
        }

        const valoresSiguientes = valoresActuales.map(
          (valor, index) => valor + delta[index]
        );

        const errores = valoresSiguientes.map((valor, index) =>
          Math.abs(valor - valoresActuales[index])
        );

        const error = maximoAbsoluto(errores);

        nuevasFilas.push({
          iteracion: k,
          valoresActuales,
          fValores,
          delta,
          valoresSiguientes,
          errores,
          error
        });

        if (error < tolerancia || error === 0) {
          encontrado = true;
          break;
        }

        valoresActuales = valoresSiguientes;
      }
    } catch {
      setErrorMsg("Ocurrió un error durante el cálculo.");
      return;
    }

    setFilas(nuevasFilas);
    setAdvertenciaMsg(advertenciaLocal);

    if (nuevasFilas.length === 0) return;

    const ultimaFila = nuevasFilas[nuevasFilas.length - 1];

    setMensaje(
      encontrado
        ? `Se encontró la solución en ${ultimaFila.iteracion} iteraciones: (${ultimaFila.valoresSiguientes
            .map((valor) => formatearNumero(valor))
            .join(", ")})`
        : "Se alcanzó el número máximo de iteraciones sin cumplir la tolerancia."
    );
  };

  const exportarCSV = () => {
    if (filas.length === 0) return;

    const encabezados = [
      "n",
      ...variables,
      ...variables.map((v) => `E_${v}`),
      "Error"
    ];

    const contenido = filas.map((fila) => {
      return [
        fila.iteracion,
        ...fila.valoresSiguientes.map((valor) => formatearNumero(valor)),
        ...fila.errores.map((valor) => formatearNumero(valor)),
        formatearNumero(fila.error)
      ].join(",");
    });

    const csv = [encabezados.join(","), ...contenido].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `newton_no_lineal_${dimension}x${dimension}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const descargarGraficaPNG = () => {
    if (!svgRef.current || filas.length === 0) return;

    const svgElement = svgRef.current;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);

    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8"
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
      link.download = `grafica_error_newton_${dimension}x${dimension}.png`;
      link.click();

      URL.revokeObjectURL(url);
    };

    image.src = url;
  };

  const limpiar = () => {
    cargarEjemplo(2);
  };

  const reiniciarGrafica = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setDragging(false);
    setDragStart({ x: 0, y: 0 });
  };

  const aumentarZoom = () => {
    setZoom((prev) => Math.min(prev * 1.25, 8));
  };

  const disminuirZoom = () => {
    setZoom((prev) => Math.max(prev / 1.25, 0.5));
  };

  const manejarWheel = (e) => {
    if (filas.length === 0) return;

    e.preventDefault();

    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    setZoom((prev) => Math.min(Math.max(prev * factor, 0.5), 8));
  };

  const iniciarArrastre = (e) => {
    if (filas.length === 0) return;

    setDragging(true);
    setDragStart({
      x: e.clientX - pan.x,
      y: e.clientY - pan.y
    });
  };

  const moverArrastre = (e) => {
    if (!dragging) return;

    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const terminarArrastre = () => {
    setDragging(false);
  };

  const ultimaFilaIndex = filas.length - 1;

  const solucionEncontrada =
    filas.length > 0 &&
    Number.isFinite(filas[ultimaFilaIndex]?.error) &&
    Number.isFinite(toleranciaNumerica) &&
    (filas[ultimaFilaIndex].error < toleranciaNumerica ||
      filas[ultimaFilaIndex].error === 0);

  const erroresGrafica = filas.map((fila) => fila.error);

  const maxErrorGrafica =
    erroresGrafica.length > 0 ? Math.max(...erroresGrafica) : 1;

  const minErrorGrafica =
    erroresGrafica.length > 0 ? Math.min(...erroresGrafica) : 0;

  const width = 760;
  const height = 360;
  const marginLeft = 75;
  const marginRight = 30;
  const marginTop = 35;
  const marginBottom = 70;

  const graphWidth = width - marginLeft - marginRight;
  const graphHeight = height - marginTop - marginBottom;

  const puntosGrafica = erroresGrafica.map((error, index) => {
    const x =
      erroresGrafica.length === 1
        ? marginLeft + graphWidth / 2
        : marginLeft + (index * graphWidth) / (erroresGrafica.length - 1);

    const escalaY =
      maxErrorGrafica === minErrorGrafica
        ? 0.5
        : (error - minErrorGrafica) / (maxErrorGrafica - minErrorGrafica);

    const y = marginTop + graphHeight - escalaY * graphHeight;

    return { x, y, error, iteracion: index + 1 };
  });

  const pathGrafica = puntosGrafica
    .map((punto, index) =>
      index === 0 ? `M ${punto.x} ${punto.y}` : `L ${punto.x} ${punto.y}`
    )
    .join(" ");

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((factor) => {
    const value = minErrorGrafica + factor * (maxErrorGrafica - minErrorGrafica);
    const y = marginTop + graphHeight - factor * graphHeight;

    return { value, y };
  });

  const xTicks = puntosGrafica.filter((_, index) => {
    if (puntosGrafica.length <= 8) return true;
    return index % Math.ceil(puntosGrafica.length / 8) === 0;
  });

  return (
    <div className="bisection-grid">
      <div className="bisection-form">
        <h3>Método de Newton No Lineal {dimension}x{dimension}</h3>

        <p className="bisection-hint">
          Resuelve sistemas cuadrados de la forma <strong>F(X) = 0</strong>.
          En cada iteración se usa el Jacobiano del sistema.
        </p>

        <form onSubmit={calcularNewton}>
          <div className="bisection-form-row">
            <label>Tamaño del sistema =</label>

            <select
              value={dimension}
              onChange={(e) => cambiarDimension(e.target.value)}
            >
              <option value="2">2x2</option>
              <option value="3">3x3</option>
              <option value="4">4x4</option>
              <option value="5">5x5</option>
              <option value="6">6x6</option>
            </select>
          </div>

          <div className="bisection-form-row">
            <label>Variables =</label>

            <input
              type="text"
              value={variablesInput}
              onChange={(e) => setVariablesInput(e.target.value)}
              placeholder="Ej: x,y,z,w,v,u"
            />
          </div>

          <div className="method-section">
            <h4>Funciones del sistema</h4>

            {funcionesInput.map((funcion, index) => (
              <div className="bisection-form-row" key={index}>
                <label>
                  F<sub>{index + 1}</sub>({variables.join(",")}) =
                </label>

                <input
                  type="text"
                  value={funcion}
                  onChange={(e) => cambiarFuncion(index, e.target.value)}
                  placeholder={`Función F${index + 1}`}
                />
              </div>
            ))}
          </div>

          <div className="method-two-columns">
            <div className="bisection-form-row">
              <label>Vector inicial =</label>

              <input
                type="text"
                value={inicialInput}
                onChange={(e) => setInicialInput(e.target.value)}
                placeholder="Ej: 0.1,0.5"
              />
            </div>

            <div className="bisection-form-row">
              <label>Tolerancia =</label>

              <input
                type="number"
                step="any"
                value={toleranciaInput}
                onChange={(e) => setToleranciaInput(e.target.value)}
              />
            </div>

            <div className="bisection-form-row">
              <label>Iteraciones =</label>

              <input
                type="number"
                value={iteracionesInput}
                onChange={(e) => setIteracionesInput(e.target.value)}
              />
            </div>

            <div className="bisection-form-row">
              <label>Decimales =</label>

              <input
                type="number"
                value={decimalesInput}
                onChange={(e) => setDecimalesInput(e.target.value)}
              />
            </div>
          </div>

          <div className="bisection-buttons">
            <button type="submit" className="btn-primary">
              CALCULAR
            </button>

            <button type="button" className="btn-secondary" onClick={limpiar}>
              BORRAR CELDAS
            </button>
          </div>
        </form>

        {mensaje && <p className="bisection-message">{mensaje}</p>}
        {advertenciaMsg && <p className="bisection-warning">{advertenciaMsg}</p>}
        {errorMsg && <p className="bisection-error">{errorMsg}</p>}
      </div>

      <div className="bisection-results">
        <div className="graph-card">
          <h4 className="graph-title">Sistema ingresado</h4>

          <div className="system-preview">
            {funcionesInput.map((funcion, index) => (
              <p key={`sistema-${index}`}>
                <strong>
                  F<sub>{index + 1}</sub>({variables.join(",")}) =
                </strong>{" "}
                {funcion || "—"}
              </p>
            ))}
          </div>
        </div>

        <div className="graph-card">
          <h4 className="graph-title">Jacobiano simbólico</h4>

          {jacobianoSimbolico.length === 0 ? (
            <p className="bisection-hint">
              Presiona <strong>CALCULAR</strong> para generar el Jacobiano.
            </p>
          ) : (
            <div className="jacobian-box">
              <table className="jacobian-table">
                <tbody>
                  {jacobianoSimbolico.map((fila, i) => (
                    <tr key={`jac-row-${i}`}>
                      {fila.map((valor, j) => (
                        <td key={`jac-${i}-${j}`}>{valor}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="graph-card">
          <h4 className="graph-title">Forma del método</h4>

          <p className="bisection-hint">En cada iteración se resuelve:</p>
          <p>
            <strong>J(Xₙ) ΔX = -F(Xₙ)</strong>
          </p>

          <p className="bisection-hint">Luego se actualiza:</p>
          <p>
            <strong>Xₙ₊₁ = Xₙ + ΔX</strong>
          </p>

          <p className="bisection-hint">Criterio de parada:</p>
          <p>
            <strong>Error = max(E₁, E₂, ..., Eₙ) &lt; tolerancia</strong>
          </p>
        </div>
      </div>

      <div className="bisection-results full-width-results">
        <div className="graph-card">
          <div className="table-header-actions">
            <h4 className="graph-title">Gráfica interactiva de error</h4>

            <div className="chart-actions">
              <button type="button" className="btn-export" onClick={aumentarZoom}>
                +
              </button>

              <button type="button" className="btn-export" onClick={disminuirZoom}>
                -
              </button>

              <button type="button" className="btn-export" onClick={reiniciarGrafica}>
                Reiniciar
              </button>

              <button
                type="button"
                className="btn-export"
                onClick={descargarGraficaPNG}
                disabled={filas.length === 0}
              >
                PNG
              </button>
            </div>
          </div>

          {filas.length === 0 ? (
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
                  onWheel={manejarWheel}
                  onMouseDown={iniciarArrastre}
                  onMouseMove={moverArrastre}
                  onMouseUp={terminarArrastre}
                  onMouseLeave={terminarArrastre}
                >
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
                        {formatearNumero(tick.value)}
                      </text>
                    </g>
                  ))}

                  {xTicks.map((punto) => (
                    <g key={`xtick-${punto.iteracion}`}>
                      <line
                        x1={punto.x}
                        y1={marginTop + graphHeight}
                        x2={punto.x}
                        y2={marginTop + graphHeight + 6}
                        className="chart-axis"
                      />
                      <text
                        x={punto.x - 4}
                        y={marginTop + graphHeight + 22}
                        className="chart-label"
                      >
                        {punto.iteracion}
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
                    <path d={pathGrafica} className="chart-line" fill="none" />

                    {puntosGrafica.map((punto, index) => (
                      <g key={`punto-${index}`}>
                        <circle
                          cx={punto.x}
                          cy={punto.y}
                          r="4"
                          className="chart-point"
                        />

                        <title>
                          Iteración {punto.iteracion} | Error:{" "}
                          {formatearNumero(punto.error)}
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
              onClick={exportarCSV}
              disabled={filas.length === 0}
            >
              Descargar CSV
            </button>
          </div>

          {filas.length === 0 ? (
            <p className="bisection-hint">
              Ingresa los datos y presiona <strong>CALCULAR</strong>.
            </p>
          ) : (
            <div className="table-scroll">
              <table className="bisection-table">
                <thead>
                  <tr>
                    <th>n</th>

                    {variables.map((variable) => (
                      <th key={`var-${variable}`}>{variable}</th>
                    ))}

                    {variables.map((variable) => (
                      <th key={`err-${variable}`}>
                        E<sub>{variable}</sub>
                      </th>
                    ))}

                    <th>Error</th>
                  </tr>
                </thead>

                <tbody>
                  {filas.map((fila, index) => {
                    const esUltima =
                      index === ultimaFilaIndex && solucionEncontrada;

                    return (
                      <tr key={fila.iteracion}>
                        <td>{fila.iteracion}</td>

                        {fila.valoresSiguientes.map((valor, i) => (
                          <td
                            key={`valor-${fila.iteracion}-${i}`}
                            className={esUltima ? "cell-green" : ""}
                          >
                            {formatearNumero(valor)}
                          </td>
                        ))}

                        {fila.errores.map((valor, i) => (
                          <td key={`error-${fila.iteracion}-${i}`}>
                            {formatearNumero(valor)}
                          </td>
                        ))}

                        <td className={esUltima ? "cell-red" : ""}>
                          {formatearNumero(fila.error)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {solucionEncontrada && (
            <p className="bisection-message">
              SE ENCONTRÓ LA SOLUCIÓN porque{" "}
              {formatearNumero(filas[ultimaFilaIndex].error)} &lt;{" "}
              {toleranciaInput}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}