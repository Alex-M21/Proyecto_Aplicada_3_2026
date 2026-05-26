// src/metodos/PuntoFijoNoLineal.jsx
import { useMemo, useRef, useState } from "react";
import { create, all } from "mathjs";
import "./Biseccion.css";

const math = create(all, {});

const ejemplosPuntoFijo = {
  2: {
    nombre: "Ejemplo 2x2 trigonométrico",
    variables: "x,y",
    funciones: ["y/(5)^(1/2)", "(sin(x)+2*cos(y))/4"],
    inicial: "0.1,0.25",
    tolerancia: "0.01",
    iteraciones: "25",
    decimales: "5"
  },

  3: {
    nombre: "Ejemplo 3x3 no lineal clásico",
    variables: "x,y,z",
    funciones: [
      "(1/3)*cos(y*z)+(1/6)",
      "(1/9)*(x^2+sin(z)+1.06)^(1/2)-0.1",
      "(-1)*(1/20)*exp(-x*y)-(10*pi-3)/60"
    ],
    inicial: "0.1,0.01,0.01",
    tolerancia: "0.001",
    iteraciones: "50",
    decimales: "7"
  },

  4: {
    nombre: "Ejemplo 4x4 acoplado",
    variables: "x,y,z,w",
    funciones: [
      "(1/4)*(cos(y*z)+1)",
      "(1/5)*(sin(x)+z+1)",
      "(1/6)*(x+y+w+1)",
      "(1/7)*(cos(z)+x+1)"
    ],
    inicial: "0.1,0.1,0.1,0.1",
    tolerancia: "0.001",
    iteraciones: "50",
    decimales: "7"
  },

  5: {
    nombre: "Ejemplo 5x5 acoplado",
    variables: "x,y,z,w,v",
    funciones: [
      "(1/5)*(cos(y)+1)",
      "(1/6)*(sin(x)+z+1)",
      "(1/7)*(x+y+w+1)",
      "(1/8)*(cos(z)+v+1)",
      "(1/9)*(sin(w)+x+1)"
    ],
    inicial: "0.1,0.1,0.1,0.1,0.1",
    tolerancia: "0.001",
    iteraciones: "50",
    decimales: "7"
  },

  6: {
    nombre: "Ejemplo 6x6 acoplado",
    variables: "x,y,z,w,v,u",
    funciones: [
      "(1/6)*(cos(y)+1)",
      "(1/7)*(sin(x)+z+1)",
      "(1/8)*(x+y+w+1)",
      "(1/9)*(cos(z)+v+1)",
      "(1/10)*(sin(w)+u+1)",
      "(1/11)*(cos(v)+x+1)"
    ],
    inicial: "0.1,0.1,0.1,0.1,0.1,0.1",
    tolerancia: "0.001",
    iteraciones: "50",
    decimales: "7"
  }
};

export default function PuntoFijoNoLineal() {
  const [dimension, setDimension] = useState("2");
  const [variablesInput, setVariablesInput] = useState(
    ejemplosPuntoFijo[2].variables
  );
  const [funcionesInput, setFuncionesInput] = useState([
    ...ejemplosPuntoFijo[2].funciones
  ]);
  const [inicialInput, setInicialInput] = useState(
    ejemplosPuntoFijo[2].inicial
  );
  const [toleranciaInput, setToleranciaInput] = useState(
    ejemplosPuntoFijo[2].tolerancia
  );
  const [iteracionesInput, setIteracionesInput] = useState(
    ejemplosPuntoFijo[2].iteraciones
  );
  const [decimalesInput, setDecimalesInput] = useState(
    ejemplosPuntoFijo[2].decimales
  );

  const [filas, setFilas] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [advertenciaMsg, setAdvertenciaMsg] = useState("");
  const [analisisMsg, setAnalisisMsg] = useState("");

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

  const reiniciarGrafica = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setDragging(false);
    setDragStart({ x: 0, y: 0 });
  };

  const limpiarResultados = () => {
    setFilas([]);
    setMensaje("");
    setErrorMsg("");
    setAdvertenciaMsg("");
    setAnalisisMsg("");
    reiniciarGrafica();
  };

  const cargarEjemplo = (n) => {
    const ejemplo = ejemplosPuntoFijo[n];

    setDimension(String(n));
    setVariablesInput(ejemplo.variables);
    setFuncionesInput([...ejemplo.funciones]);
    setInicialInput(ejemplo.inicial);
    setToleranciaInput(ejemplo.tolerancia);
    setIteracionesInput(ejemplo.iteraciones);
    setDecimalesInput(ejemplo.decimales);

    limpiarResultados();
  };

  const cambiarDimension = (value) => {
    const n = parseInt(value, 10);

    if (!ejemplosPuntoFijo[n]) {
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

    limpiarResultados();
  };

  const analizarConvergencia = (errores) => {
    if (errores.length < 3) {
      return "Se necesitan más iteraciones para analizar el comportamiento de convergencia.";
    }

    let disminuciones = 0;
    let aumentos = 0;

    for (let i = 1; i < errores.length; i++) {
      if (errores[i] < errores[i - 1]) disminuciones++;
      if (errores[i] > errores[i - 1]) aumentos++;
    }

    const ultimo = errores[errores.length - 1];
    const primero = errores[0];

    if (disminuciones >= errores.length - 2 && ultimo < primero) {
      return "El error disminuye de forma estable. El método presenta comportamiento convergente.";
    }

    if (aumentos >= Math.ceil(errores.length / 2)) {
      return "El error aumenta en varias iteraciones. El método puede estar divergiendo o el despeje G(X) no es adecuado.";
    }

    if (ultimo < primero) {
      return "El error general disminuye, aunque no de forma completamente uniforme. El método parece converger lentamente u oscilar.";
    }

    return "El error no muestra una reducción clara. Conviene revisar las funciones G(X), el vector inicial o la tolerancia.";
  };

  const calcularPuntoFijo = (e) => {
    e.preventDefault();

    limpiarResultados();

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
      setErrorMsg(`Debes ingresar exactamente ${n} funciones G.`);
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

    try {
      funcionesCompiladas = funcionesInput.map((funcion) =>
        math.compile(normalizarExpresion(funcion))
      );
    } catch {
      setErrorMsg("No se pudieron interpretar las funciones. Revisa la sintaxis.");
      return;
    }

    let valoresActuales = [...vectorInicial];
    const nuevasFilas = [];
    let encontrado = false;
    let advertenciaLocal = "";

    try {
      for (let k = 1; k <= maxIteraciones; k++) {
        const scope = crearScope(variables, valoresActuales);

        const valoresSiguientes = funcionesCompiladas.map((funcion) => {
          const valor = funcion.evaluate(scope);
          return Number.isFinite(valor) ? valor : NaN;
        });

        if (valoresSiguientes.some((valor) => !Number.isFinite(valor))) {
          setErrorMsg("No se pudo evaluar alguna función. Revisa dominio o sintaxis.");
          return;
        }

        const errores = valoresSiguientes.map((valor, index) =>
          Math.abs(valor - valoresActuales[index])
        );

        const error = maximoAbsoluto(errores);

        nuevasFilas.push({
          iteracion: k,
          valoresActuales,
          valoresSiguientes,
          errores,
          error
        });

        if (k >= 4) {
          const ultimosErrores = nuevasFilas.slice(-4).map((fila) => fila.error);

          const todosSuben = ultimosErrores.every((valor, index, arreglo) => {
            if (index === 0) return true;
            return valor > arreglo[index - 1];
          });

          if (todosSuben) {
            advertenciaLocal =
              "Advertencia: el error aumentó en varias iteraciones consecutivas. Puede existir divergencia.";
          }
        }

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
    const erroresGlobales = nuevasFilas.map((fila) => fila.error);

    setAnalisisMsg(analizarConvergencia(erroresGlobales));

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
    link.download = `punto_fijo_no_lineal_${dimension}x${dimension}.csv`;
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
      link.download = `grafica_error_punto_fijo_${dimension}x${dimension}.png`;
      link.click();

      URL.revokeObjectURL(url);
    };

    image.src = url;
  };

  const limpiar = () => {
    cargarEjemplo(2);
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
        <h3>Método de Punto Fijo No Lineal {dimension}x{dimension}</h3>

        <p className="bisection-hint">
          Resuelve sistemas cuadrados de la forma <strong>X = G(X)</strong>.
          Cada función G calcula una nueva variable del sistema.
        </p>

        <form onSubmit={calcularPuntoFijo}>
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
              onChange={(e) => {
                setVariablesInput(e.target.value);
                limpiarResultados();
              }}
              placeholder="Ej: x,y,z,w,v,u"
            />
          </div>

          <div className="method-section">
            <h4>Funciones del sistema</h4>

            {funcionesInput.map((funcion, index) => (
              <div className="bisection-form-row" key={index}>
                <label>
                  G<sub>{index + 1}</sub>({variables.join(",")}) =
                </label>

                <input
                  type="text"
                  value={funcion}
                  onChange={(e) => cambiarFuncion(index, e.target.value)}
                  placeholder={`Función G${index + 1}`}
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
                onChange={(e) => {
                  setInicialInput(e.target.value);
                  limpiarResultados();
                }}
                placeholder="Ej: 0.1,0.25"
              />
            </div>

            <div className="bisection-form-row">
              <label>Tolerancia =</label>

              <input
                type="number"
                step="any"
                value={toleranciaInput}
                onChange={(e) => {
                  setToleranciaInput(e.target.value);
                  limpiarResultados();
                }}
              />
            </div>

            <div className="bisection-form-row">
              <label>Iteraciones =</label>

              <input
                type="number"
                value={iteracionesInput}
                onChange={(e) => {
                  setIteracionesInput(e.target.value);
                  limpiarResultados();
                }}
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
        {analisisMsg && <p className="bisection-warning">{analisisMsg}</p>}
        {errorMsg && <p className="bisection-error">{errorMsg}</p>}
      </div>

      <div className="bisection-results">
        <div className="graph-card">
          <h4 className="graph-title">Sistema ingresado</h4>

          <div className="system-preview">
            {funcionesInput.map((funcion, index) => (
              <p key={`sistema-${index}`}>
                <strong>
                  {variables[index] || `x${index + 1}`} = G
                  <sub>{index + 1}</sub>({variables.join(",")}) =
                </strong>{" "}
                {funcion || "—"}
              </p>
            ))}
          </div>
        </div>

        <div className="graph-card">
          <h4 className="graph-title">Vector inicial</h4>

          <div className="system-preview">
            {variables.map((variable, index) => {
              const vectorInicial = leerVector(inicialInput);

              return (
                <p key={`x0-${variable}`}>
                  <strong>
                    {variable}
                    <sub>0</sub> =
                  </strong>{" "}
                  {Number.isFinite(vectorInicial[index])
                    ? vectorInicial[index]
                    : "—"}
                </p>
              );
            })}
          </div>
        </div>

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

              <button
                type="button"
                className="btn-export"
                onClick={reiniciarGrafica}
              >
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