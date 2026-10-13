import { parse } from "mathjs";
import { loadGeoGebra } from "./loadGeogebra.js";

// Compartir también entre módulos recargados por Vite evita inyectar dos applets
// con el mismo id e invalidar la API de la primera instancia.
const claveMotorCAS = Symbol.for("aplicada3.motorGeoGebraCAS");

// Los comandos se evalúan en una instancia independiente de las gráficas.
// Se conserva durante la sesión y se carga al solicitar el cálculo.
export function obtenerMotorCAS() {
  if (window[claveMotorCAS]) return window[claveMotorCAS];
  const carga = new Promise((resolve, reject) => {
    let terminado = false;
    let contenedor;
    let comprobacion;
    const finalizar = (error, api) => {
      if (terminado) return;
      terminado = true;
      clearTimeout(limite);
      clearInterval(comprobacion);
      if (error) { contenedor?.remove(); reject(error); } else resolve(api);
    };
    const limite = setTimeout(() => finalizar(new Error(
      "GeoGebra tardó demasiado en cargar. Comprueba tu conexión a internet y vuelve a presionar CALCULAR."
    )), 45000);
    loadGeoGebra().then(() => {
      if (terminado) return;
      contenedor = document.createElement("div");
      contenedor.setAttribute("aria-hidden", "true");
      contenedor.inert = true;
      Object.assign(contenedor.style, {
        position: "fixed", left: "-10000px", top: "0", width: "640px", height: "480px",
        pointerEvents: "none",
      });
      document.body.appendChild(contenedor);
      const applet = new window.GGBApplet({
        id: "propiosCAS", appName: "classic", perspective: "C", language: "es",
        width: 640, height: 480, enableCAS: true, showToolBar: false,
        showMenuBar: false, showAlgebraInput: false, showKeyboardOnFocus: false,
        preventFocus: true, appletOnLoad: (api) => {
          if (terminado) return;
          api.setErrorDialogsActive(false);
          const comprobar = () => {
            try {
              if (String(api.evalCommandCAS("1+1")).trim() === "2") finalizar(null, api);
            } catch { /* El motor CAS puede continuar cargando después del applet. */ }
          };
          comprobacion = setInterval(comprobar, 250);
          comprobar();
        },
      }, true);
      applet.inject(contenedor);
    }).catch(() => finalizar(new Error(
      "No se pudo cargar GeoGebra. Comprueba tu conexión a internet y vuelve a presionar CALCULAR."
    )));
  });
  const compartida = carga.catch((error) => {
    if (window[claveMotorCAS] === compartida) delete window[claveMotorCAS];
    throw error;
  });
  window[claveMotorCAS] = compartida;
  return compartida;
}

export function prepararMatrizCAS(entrada) {
  const n = entrada?.length;
  if (!Array.isArray(entrada) || n < 1 ||
    entrada.some((fila) => !Array.isArray(fila) || fila.length !== n)) {
    throw new Error("La matriz debe ser cuadrada NxN, con N mayor o igual a 1.");
  }
  const expresiones = entrada.map((fila, i) => fila.map((valor, j) => {
    const celda = `A(${i + 1}, ${j + 1})`;
    const expresion = String(valor ?? "").trim().replace(/√\s*\(/g, "sqrt(")
      .replaceAll("ί", "i").replaceAll("ⅈ", "i");
    if (!expresion) throw new Error(`La celda ${celda} está vacía. Completa todos los campos.`);
    if (expresion.length > 120) throw new Error(`La expresión de ${celda} es demasiado larga.`);
    let nodo;
    try {
      nodo = parse(expresion);
      nodo.traverse((actual, ruta, padre) => {
        const permitida = actual.isConstantNode || actual.isParenthesisNode ||
          (actual.isOperatorNode && ["+", "-", "*", "/", "^"].includes(actual.op)) ||
          (actual.isFunctionNode && actual.fn.name === "sqrt" && actual.args.length === 1) ||
          (actual.isSymbolNode && (["pi", "e", "i"].includes(actual.name) ||
            (actual.name === "sqrt" && padre?.isFunctionNode && ruta === "fn")));
        if (!permitida) throw new Error("Expresión no admitida");
      });
      const valor = nodo.evaluate();
      if (!Number.isFinite(valor) && !(valor?.isComplex && Number.isFinite(valor.re) && Number.isFinite(valor.im))) {
        throw new Error("Valor no finito");
      }
    } catch {
      throw new Error(`La celda ${celda} debe contener un número real o complejo, una fracción o una raíz como sqrt(2).`);
    }
    // Conservar los dígitos ingresados y convertir decimales/científica a
    // racionales antes de enviarlos al CAS, sin redondearlos a un Number.
    const racional = expresion.replace(/(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/g, (literal) => {
      const [mantisa, exponente = "0"] = literal.toLowerCase().split("e");
      if (Math.abs(Number(exponente)) > 1000) throw new Error(`El exponente de ${celda} es demasiado grande.`);
      const [entera, decimal = ""] = mantisa.split(".");
      const digitos = BigInt(`${entera || "0"}${decimal}`).toString();
      const potencia = Number(exponente) - decimal.length;
      if (digitos === "0" || potencia === 0) return digitos;
      return potencia < 0 ? `(${digitos}/10^${-potencia})` : `(${digitos}*10^${potencia})`;
    });
    // En CAS la unidad imaginaria es ί; la letra latina i es una variable.
    return racional.replace(/(?<![A-Za-z_])i(?![A-Za-z_])/g, "ί");
  }));
  return {
    texto: `{${expresiones.map((fila) => `{${fila.join(",")}}`).join(",")}}`,
    expresiones,
    numeros: expresiones.map((fila) => fila.map((expr) => parse(expr.replaceAll("ί", "i")).evaluate())),
  };
}

// GeoGebra devuelve listas con llaves y expresiones que pueden contener comas.
// Separar solo el nivel exterior conserva fracciones, raíces y listas anidadas.
export function separarListaCAS(texto) {
  const fuente = String(texto).trim();
  if (!fuente.startsWith("{") || !fuente.endsWith("}")) return null;
  const elementos = [];
  const contenido = fuente.slice(1, -1);
  let inicio = 0;
  let profundidad = 0;
  for (let i = 0; i < contenido.length; i++) {
    if ("{([".includes(contenido[i])) profundidad++;
    if ("})]".includes(contenido[i])) profundidad--;
    if (contenido[i] === "," && profundidad === 0) {
      elementos.push(contenido.slice(inicio, i).trim()); inicio = i + 1;
    }
    if (profundidad < 0) return null;
  }
  if (profundidad !== 0) return null;
  if (contenido.trim()) elementos.push(contenido.slice(inicio).trim());
  return elementos;
}

const textoMatriz = (filas) => `{${filas.map((fila) => `{${fila.join(",")}}`).join(",")}}`;
const matrizDesplazada = (filas, valor) => filas.map((fila, i) => fila.map((celda, j) =>
  i === j ? `(${celda})-(${valor})` : celda));

// Leer los pivotes del resultado exacto de CAS y construir su base del núcleo.
// Las reducciones, los signos y la comprobación de cada vector se evalúan en CAS.
function baseDelNucleoCAS(matriz, lambda, evaluar) {
  const desplazada = textoMatriz(matrizDesplazada(matriz, lambda));
  const reducida = separarListaCAS(evaluar(`ReducedRowEchelonForm(${desplazada})`))?.map(separarListaCAS);
  const n = matriz.length;
  if (!reducida || reducida.length !== n || reducida.some((fila) => fila?.length !== n)) {
    throw new Error("La reducción no devolvió una matriz interpretable.");
  }
  const pivotes = reducida.map((fila) => fila.findIndex((valor) => valor !== "0"));
  if (pivotes.some((columna, i) => columna >= 0 && reducida[i][columna] !== "1")) {
    throw new Error("No se pudo identificar una base exacta.");
  }
  const libres = Array.from({ length: n }, (_, i) => i).filter((i) => !pivotes.includes(i));
  if (!libres.length) throw new Error("No se obtuvo un núcleo no trivial.");
  return libres.map((columna) => {
    const vector = Array(n).fill("0");
    vector[columna] = "1";
    pivotes.forEach((pivote, fila) => {
      if (pivote >= 0) vector[pivote] = evaluar(`Simplify(-(${reducida[fila][columna]}))`);
    });
    const residuo = separarListaCAS(evaluar(`Simplify((${desplazada})*(${textoMatriz(vector.map((v) => [v]))}))`))?.map(separarListaCAS);
    if (!residuo || residuo.length !== n || residuo.some((fila) => fila?.length !== 1 || fila[0] !== "0")) {
      throw new Error("CAS no confirmó que el vector pertenezca al núcleo.");
    }
    return vector;
  });
}

export async function calcularConCAS(entrada, motor = obtenerMotorCAS) {
  const matriz = prepararMatrizCAS(entrada);
  const api = await motor();
  const evaluar = (comando) => {
    const salida = String(api.evalCommandCAS(comando) ?? "").trim();
    if (!salida || salida === "?" || /undefined|undef|NaN/i.test(salida) || salida.includes(comando)) {
      throw new Error("GeoGebra no pudo resolver esta matriz. Revisa sus entradas o prueba uno de los ejemplos.");
    }
    return salida;
  };
  const valores = evaluar(`Eigenvalues(${matriz.texto})`);
  const avisos = [];
  let vectores = "?";
  try { vectores = evaluar(`Eigenvectors(${matriz.texto})`); } catch { /* Resolver cada espacio propio con CAS más abajo. */ }
  const listaValores = separarListaCAS(valores);
  const filasVectores = separarListaCAS(vectores)?.map(separarListaCAS);
  if (!listaValores?.length || listaValores.length !== entrada.length) {
    throw new Error("GeoGebra devolvió una lista de eigenvalores que no se puede interpretar. Revisa la matriz o prueba uno de los ejemplos.");
  }
  const matrizVectores = filasVectores && filasVectores.length === entrada.length &&
    filasVectores.every((fila) => fila?.length === listaValores.length) ? filasVectores : null;
  const grupos = new Map();
  listaValores.forEach((valor, indice) => {
    if (!grupos.has(valor)) grupos.set(valor, { valor, indices: [], multiplicidad: 0, bases: [] });
    const grupo = grupos.get(valor);
    grupo.indices.push(indice);
    grupo.multiplicidad++;
    if (matrizVectores) grupo.bases.push(matrizVectores.map((fila) => fila[indice]));
  });
  const espaciosPropios = [...grupos.values()];
  if (!matrizVectores) {
    espaciosPropios.forEach((grupo) => {
      try { grupo.bases = baseDelNucleoCAS(matriz.expresiones, grupo.valor, evaluar); } catch {
        avisos.push(`No se pudieron obtener eigenvectores para λ = ${grupo.valor}.`);
      }
      if (grupo.bases.length && grupo.bases.length < grupo.multiplicidad) {
        const cantidad = grupo.bases.length === 1 ? "un eigenvector independiente" : `${grupo.bases.length} eigenvectores independientes`;
        avisos.push(`λ = ${grupo.valor} se repite ${grupo.multiplicidad} veces y tiene ${cantidad}. No hay una base completa de eigenvectores.`);
      }
    });
  }
  const caracteristica = matrizDesplazada(matriz.expresiones, "x");
  let polinomio = null;
  try {
    const determinante = `Determinant(${textoMatriz(caracteristica)})`;
    const desarrollado = evaluar(`Expand(${determinante})`);
    if (desarrollado.includes("{")) throw new Error("Polinomio no interpretable");
    polinomio = { desarrollado, factorizado: null, matriz: caracteristica };
    try {
      const factorizado = evaluar(`Factor(${determinante})`);
      if (factorizado.includes("{")) throw new Error("Factorización no interpretable");
      polinomio.factorizado = factorizado;
    } catch { avisos.push("No se pudo factorizar el polinomio característico."); }
  } catch {
    avisos.push("No se pudo obtener el polinomio característico. Se conservan los eigenvalores y eigenvectores disponibles.");
  }
  return { matriz: matriz.texto, valores, vectores,
    listaValores, filasVectores: matrizVectores, espaciosPropios, polinomio, avisos };
}

export function generarCSVCAS(resultado) {
  const filas = [["Concepto", "Resultado"], ["A", resultado.matriz],
    ["ValoresPropios(A)", resultado.valores], ["VectoresPropios(A)", resultado.vectores]];
  if (resultado.polinomio) {
    filas.push(["p(λ) = det(A − λI)", resultado.polinomio.desarrollado.replaceAll("x", "λ")]);
    if (resultado.polinomio.factorizado) filas.push(["Polinomio factorizado", resultado.polinomio.factorizado.replaceAll("x", "λ")]);
  }
  resultado.espaciosPropios?.forEach((grupo) => {
    filas.push([`λ = ${grupo.valor}: multiplicidad`, String(grupo.multiplicidad)]);
    grupo.bases.forEach((vector, i) => filas.push([`λ = ${grupo.valor}: eigenvector ${i + 1}`, `{${vector.join(", ")}}`]));
  });
  return "\uFEFF" + filas.map((fila) => fila.map((valor) =>
    `"${String(valor).replace(/"/g, '""')}"`).join(",")).join("\r\n");
}
