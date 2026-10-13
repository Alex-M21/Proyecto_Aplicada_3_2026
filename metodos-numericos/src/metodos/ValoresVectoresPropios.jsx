import { useRef, useState } from "react";
import { calcularConCAS, generarCSVCAS } from "../utils/propiosCAS";
import "./Biseccion.css";
import "./ValoresVectoresPropios.css";

const ejemplos = [
  { nombre: "Ejemplo caso 1", matriz: [[5, -4, 0], [1, 0, 2], [0, 2, 5]] },
  { nombre: "Ejemplo caso 2", matriz: [[3, -1, -1], [1, 1, -1], [1, -1, 1]] },
  { nombre: "Ejemplo imaginario", matriz: [[0, -1], [1, 0]] },
];
const matrizVacia = (n) => Array.from({ length: n }, () => Array(n).fill(""));

function TablaMatriz({ matriz, titulo = "Matriz V: cada columna es un eigenvector", columnas = true }) {
  return (
    <div className="table-scroll">
      <table className="bisection-table matriz-propia">
        <caption>{titulo}</caption>
        {columnas && <thead><tr>{matriz[0].map((_, j) => <th key={j}>v{j + 1}</th>)}</tr></thead>}
        <tbody>{matriz.map((fila, i) => <tr key={i}>
          {fila.map((valor, j) => <td key={j}>{valor}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
  );
}

export default function ValoresVectoresPropios() {
  const [dimension, setDimension] = useState(String(ejemplos[0].matriz.length));
  const [matriz, setMatriz] = useState(ejemplos[0].matriz.map((fila) => fila.map(String)));
  const [resultadoCAS, setResultadoCAS] = useState(null);
  const [error, setError] = useState("");
  const [cargandoCAS, setCargandoCAS] = useState(false);
  const solicitud = useRef(0);
  const ordenActual = matriz.length;

  const limpiarResultados = () => {
    solicitud.current++;
    setResultadoCAS(null);
    setError("");
    setCargandoCAS(false);
  };
  const cambiarCelda = (i, j, valor) => {
    setMatriz((anterior) => anterior.map((fila, f) => fila.map((celda, c) =>
      f === i && c === j ? valor : celda)));
    limpiarResultados();
  };
  const cargarEjemplo = (ejemplo) => {
    setDimension(String(ejemplo.matriz.length));
    setMatriz(ejemplo.matriz.map((fila) => fila.map(String)));
    limpiarResultados();
  };
  const crearMatriz = () => {
    limpiarResultados();
    const n = Number(dimension);
    if (dimension.trim() === "" || !Number.isSafeInteger(n) || n < 1) {
      setError("El tamaño N debe ser un número entero mayor o igual a 1.");
      return;
    }
    try { setMatriz(matrizVacia(n)); } catch {
      setError("No se pudo crear la matriz con ese tamaño. Revisa N y la memoria disponible.");
    }
  };
  const calcular = async (evento) => {
    evento.preventDefault();
    limpiarResultados();
    if (dimension.trim() === "" || Number(dimension) !== ordenActual) {
      setError("Presiona CREAR MATRIZ para aplicar el tamaño N antes de calcular.");
      return;
    }
    const numeroSolicitud = solicitud.current;
    setCargandoCAS(true);
    try {
      const resultado = await calcularConCAS(matriz);
      if (numeroSolicitud === solicitud.current) setResultadoCAS(resultado);
    } catch (problema) {
      if (numeroSolicitud === solicitud.current) {
        setError(problema.message || "No se pudieron calcular los eigenvalores y eigenvectores con GeoGebra.");
      }
    } finally {
      if (numeroSolicitud === solicitud.current) setCargandoCAS(false);
    }
  };
  const descargarCSV = () => {
    if (!resultadoCAS) return;
    const blob = new Blob([generarCSVCAS(resultadoCAS)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `valores_vectores_propios_geogebra_${ordenActual}x${ordenActual}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bisection-grid valores-propios-grid">
      <div className="bisection-form">
        <h3>Eigenvalores y eigenvectores</h3>
        <form onSubmit={calcular} noValidate>
          <div className="bisection-form-row">
            <label htmlFor="propios-dimension">Tamaño de la matriz =</label>
            <input id="propios-dimension" type="number" min="1" step="1" value={dimension} onChange={(e) => {
              setDimension(e.target.value);
              limpiarResultados();
            }} />
            <button type="button" className="btn-export" id="propios-crear-matriz" onClick={crearMatriz}>CREAR MATRIZ</button>
          </div>
          <div className="method-section">
            <h4>Matriz A</h4>
            <p className="bisection-hint">Completa todas las celdas, incluidos los ceros, y presiona CALCULAR.
              Entradas reales, imaginarias o complejas: <code>0.5</code>, <code>1/2</code>, <code>sqrt(2)</code>,
              <code> i</code> o <code>1+2i</code>.</p>
            <div className="table-scroll">
              <table className="bisection-table matriz-propia">
                <caption>Matriz cuadrada de {ordenActual}×{ordenActual}</caption>
                <tbody>{matriz.map((fila, i) => <tr key={i}>{fila.map((valor, j) => <td key={j}>
                  <input type="text" value={valor} aria-label={`A(${i + 1}, ${j + 1})`}
                    placeholder="0" autoComplete="off" onChange={(e) => cambiarCelda(i, j, e.target.value)} />
                </td>)}</tr>)}</tbody>
              </table>
            </div>
          </div>
          <div className="bisection-buttons">
            <button type="submit" className="btn-primary" disabled={cargandoCAS}>
              {cargandoCAS ? "CALCULANDO…" : "CALCULAR"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => {
              setMatriz(matrizVacia(ordenActual));
              limpiarResultados();
            }}>BORRAR CELDAS</button>
          </div>
        </form>
        <div className="method-section">
          <h4>Ejemplos</h4>
          <div className="chart-actions">
            {ejemplos.map((ejemplo) => <button type="button" className="btn-export"
              key={ejemplo.nombre} onClick={() => cargarEjemplo(ejemplo)}>{ejemplo.nombre}</button>)}
          </div>
        </div>
        {error && <p className="bisection-error" role="alert">{error}</p>}
      </div>
      <div className="bisection-results" aria-live="polite">
        <div className="graph-card">
          <div className="table-header-actions">
            <h4 className="graph-title">Resultados</h4>
            <button type="button" className="btn-export" disabled={!resultadoCAS}
              onClick={descargarCSV}>Descargar CSV</button>
          </div>
          {cargandoCAS ? <p className="bisection-hint" role="status">Calculando eigenvalores y eigenvectores…</p>
            : !resultadoCAS ? <p className="bisection-hint">Completa la matriz o carga un ejemplo y presiona <strong>CALCULAR</strong>.</p>
              : <>
                <div className="propios-cas-fila"><strong>Matriz ingresada A</strong><code>{resultadoCAS.matriz}</code></div>
                {resultadoCAS.polinomio && <div className="propios-cas-fila">
                  <strong>Polinomio característico</strong>
                  <code id="propios-polinomio">p(λ) = det(A − λI) = {resultadoCAS.polinomio.desarrollado.replaceAll("x", "λ")}</code>
                  <code id="propios-polinomio-factorizado">{(resultadoCAS.polinomio.factorizado ?? resultadoCAS.polinomio.desarrollado).replaceAll("x", "λ")} = 0</code>
                  <details>
                    <summary>Matriz A − λI</summary>
                    <TablaMatriz matriz={resultadoCAS.polinomio.matriz.map((fila) => fila.map((celda) => celda.replaceAll("x", "λ")))}
                      titulo="A − λI" columnas={false} />
                  </details>
                </div>}
                <div className="propios-cas-fila"><strong>Eigenvalores</strong><code>{resultadoCAS.valores}</code></div>
                <div className="propios-cas-fila"><strong>Eigenvectores</strong>
                  {resultadoCAS.filasVectores ? <TablaMatriz matriz={resultadoCAS.filasVectores} />
                    : resultadoCAS.espaciosPropios.map((grupo) => <div key={grupo.valor}>
                      <span>λ = {grupo.valor}: </span>
                      <code>{grupo.bases.length ? grupo.bases.map((v) => `{${v.join(", ")}}`).join("; ") : "No se obtuvo un eigenvector."}</code>
                    </div>)}
                </div>
                <div className="table-scroll">
                  <table className="bisection-table matriz-propia">
                    <caption>Correspondencia entre eigenvalores y eigenvectores</caption>
                    <thead><tr><th>Eigenvalor λ</th><th>Multiplicidad</th><th>Eigenvectores independientes</th></tr></thead>
                    <tbody>{resultadoCAS.espaciosPropios.map((grupo) => <tr key={grupo.valor}>
                      <td>{grupo.indices.map((i) => `λ${i + 1}`).join(", ")} = {grupo.valor}</td>
                      <td>{grupo.multiplicidad}</td>
                      <td>{grupo.bases.length ? grupo.bases.map((vector, i) => <div key={i}>
                        v{grupo.indices[i] + 1} = {`{${vector.join(", ")}}`}
                      </div>) : "No se obtuvo un vector asociado."}</td>
                    </tr>)}</tbody>
                  </table>
                </div>
                {resultadoCAS.avisos.map((aviso) => <p className="bisection-warning" key={aviso}>{aviso}</p>)}
              </>}
        </div>
      </div>
    </div>
  );
}
