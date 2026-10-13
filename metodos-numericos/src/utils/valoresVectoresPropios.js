import { abs, add, divide, eigs, inv, multiply, subtract } from "mathjs";

const TOLERANCIA_AGRUPACION = 1e-8;
const TOLERANCIA_NUCLEO = 1e-9;

const partes = (valor) => typeof valor === "number"
  ? { re: valor, im: 0 } : valor;

const esFinito = (valor) => {
  const { re, im } = partes(valor);
  return Number.isFinite(re) && Number.isFinite(im);
};

export function leerMatriz(entrada) {
  const n = entrada?.length;
  if (!Array.isArray(entrada) || n < 2 || n > 4 ||
      entrada.some((fila) => !Array.isArray(fila) || fila.length !== n)) {
    throw new Error("La matriz debe ser cuadrada, de tamaño 2×2, 3×3 o 4×4.");
  }
  return entrada.map((fila, i) => fila.map((valor, j) => {
    if (valor === null || valor === undefined || String(valor).trim() === "") {
      throw new Error(`La celda A(${i + 1}, ${j + 1}) está vacía. Completa todos los campos.`);
    }
    const numero = Number(valor);
    if (!["string", "number"].includes(typeof valor) || !Number.isFinite(numero)) {
      throw new Error(`La celda A(${i + 1}, ${j + 1}) debe contener un valor numérico real y finito.`);
    }
    return numero;
  }));
}

// RREF con pivoteo parcial por módulo. También opera con escalares complejos.
// Cada variable libre genera un vector independiente del núcleo aproximado.
function obtenerNucleo(matriz, toleranciaRelativa, escalaVectores = "unitario") {
  const reducida = matriz.map((fila) => [...fila]);
  const n = reducida.length;
  const escala = Math.max(...reducida.flat().map((valor) => abs(valor)));
  const tolerancia = toleranciaRelativa * escala;
  const pivotes = [];
  let filaPivote = 0;

  for (let columna = 0; columna < n && filaPivote < n; columna++) {
    let elegida = filaPivote;
    for (let i = filaPivote + 1; i < n; i++) {
      if (abs(reducida[i][columna]) > abs(reducida[elegida][columna])) elegida = i;
    }
    if (abs(reducida[elegida][columna]) <= tolerancia) continue;
    [reducida[filaPivote], reducida[elegida]] = [reducida[elegida], reducida[filaPivote]];
    const pivote = reducida[filaPivote][columna];
    reducida[filaPivote] = reducida[filaPivote].map((valor) => divide(valor, pivote));
    reducida[filaPivote][columna] = 1;
    for (let i = 0; i < n; i++) {
      if (i === filaPivote) continue;
      const factor = reducida[i][columna];
      reducida[i] = reducida[i].map((valor, j) =>
        subtract(valor, multiply(factor, reducida[filaPivote][j])));
      reducida[i][columna] = 0;
    }
    pivotes.push(columna);
    filaPivote++;
  }

  const base = [];
  const componentesFijas = [];
  for (let libre = 0; libre < n; libre++) {
    if (pivotes.includes(libre)) continue;
    const vector = Array(n).fill(0);
    vector[libre] = 1;
    pivotes.forEach((columna, fila) => { vector[columna] = multiply(-1, reducida[fila][libre]); });
    // Escalar antes de normalizar evita desbordamientos en la norma.
    const maximo = Math.max(...vector.map((valor) => abs(valor)));
    if (!Number.isFinite(maximo) || maximo === 0) {
      throw new Error("Se obtuvo un vector propio nulo o no finito; no se puede normalizar.");
    }
    const escalado = vector.map((valor) => divide(valor, maximo));
    const norma = Math.hypot(...escalado.map((valor) => abs(valor)));
    base.push(escalaVectores === "parametro" ? vector : escalado.map((valor) => divide(valor, norma)));
    componentesFijas.push(libre);
  }
  return { base, componentesFijas, rango: pivotes.length };
}

const normaInfinito = (matriz) => Math.max(...matriz.map((fila) =>
  fila.reduce((suma, valor) => suma + abs(valor), 0)));

const matrizDesplazada = (matriz, lambda) => matriz.map((fila, i) =>
  fila.map((valor, j) => i === j ? subtract(valor, lambda) : valor));

function verificarVector(matriz, matrizEscalada, lambda, lambdaEscalado, vector) {
  const producto = (a) => a.map((fila) => fila.reduce((suma, valor, j) =>
    add(suma, multiply(valor, vector[j])), 0));
  const av = producto(matriz);
  const lambdaV = vector.map((valor) => multiply(lambda, valor));
  if (![...vector, ...av, ...lambdaV].every(esFinito)) {
    throw new Error("El cálculo excedió el rango numérico. Reduce la magnitud de los valores de la matriz.");
  }
  const error = Math.hypot(...av.map((valor, i) => abs(subtract(valor, lambdaV[i]))));
  if (!Number.isFinite(error)) {
    throw new Error("El error numérico excedió el rango de representación. Reduce la magnitud de los valores de la matriz.");
  }
  const avEscalado = producto(matrizEscalada);
  const lambdaVEscalado = vector.map((valor) => multiply(lambdaEscalado, valor));
  const residuoEscalado = Math.hypot(...avEscalado.map((valor, i) =>
    abs(subtract(valor, lambdaVEscalado[i]))));
  const denominador = normaInfinito(matrizEscalada) + abs(lambdaEscalado);
  const escalaVector = Math.max(...vector.map((valor) => abs(valor)));
  const normaVectorEscalado = Math.hypot(...vector.map((valor) => abs(valor) / escalaVector));
  const errorRelativo = denominador === 0 ? residuoEscalado
    : (residuoEscalado / escalaVector) / normaVectorEscalado / denominador;
  return { vector, av, lambdaV, error, errorRelativo };
}

export function calcularEspectro(entrada, { escalaVectores = "unitario" } = {}) {
  if (!["parametro", "unitario"].includes(escalaVectores)) {
    throw new Error("Selecciona parametrización con 1 o norma unitaria para los vectores numéricos.");
  }
  const matriz = leerMatriz(entrada);
  const n = matriz.length;
  const escala = Math.max(...matriz.flat().map(Math.abs)) || 1;
  // La precisión de eigs es absoluta: trabajar a escala unitaria evita que
  // matrices pequeñas se interpreten como cero y reduce desbordamientos.
  const matrizEscalada = matriz.map((fila) => fila.map((valor) => valor / escala));
  let valores;
  try {
    ({ values: valores } = eigs(matrizEscalada, { precision: 1e-12, eigenvectors: false }));
  } catch {
    throw new Error("No se pudo completar el cálculo de valores propios. El algoritmo no convergió; revisa la matriz o prueba con valores de menor magnitud.");
  }
  if (!Array.isArray(valores) || valores.length !== n || !valores.every(esFinito)) {
    throw new Error("No se obtuvieron todos los valores propios finitos de la matriz.");
  }

  const grupos = [];
  // La tolerancia es relativa a cada valor, con un piso pequeño a escala
  // unitaria para agrupar ceros aproximados sin fusionar raíces pequeñas distintas.
  const sonIguales = (a, b) => abs(subtract(a, b)) <=
    TOLERANCIA_AGRUPACION * Math.max(1e-6, abs(a), abs(b));
  for (const valor of valores) {
    const grupo = grupos.find((actual) => sonIguales(actual.lambdaEscalado, valor));
    if (grupo) grupo.multiplicidad++;
    else grupos.push({ lambdaEscalado: valor, multiplicidad: 1 });
  }
  grupos.sort((a, b) => partes(a.lambdaEscalado).re - partes(b.lambdaEscalado).re ||
    partes(a.lambdaEscalado).im - partes(b.lambdaEscalado).im);

  const advertencias = [];
  const rango = obtenerNucleo(matrizEscalada, 1e-14).rango;
  let condicion = null;
  if (rango < n) {
    advertencias.push("La matriz es singular o numéricamente singular. Puede tener valores propios cero; esto no impide calcular sus espacios propios.");
  } else {
    try {
      condicion = normaInfinito(matrizEscalada) * normaInfinito(inv(matrizEscalada));
      if (!Number.isFinite(condicion) || condicion >= 1e8) {
        advertencias.push("La matriz está mal condicionada: pequeñas variaciones en las celdas pueden afectar las aproximaciones numéricas.");
      }
    } catch {
      advertencias.push("No se pudo estimar el condicionamiento de la matriz; puede ser numéricamente singular.");
    }
  }

  const resultados = grupos.map(({ lambdaEscalado, multiplicidad }) => {
    const lambda = multiply(lambdaEscalado, escala);
    const desplazada = matrizDesplazada(matriz, lambda);
    if (!esFinito(lambda) || !desplazada.flat().every(esFinito)) {
      throw new Error("Los valores propios exceden el rango numérico. Reduce la magnitud de los valores de la matriz.");
    }
    const { base, componentesFijas } = obtenerNucleo(
      matrizDesplazada(matrizEscalada, lambdaEscalado), TOLERANCIA_NUCLEO, escalaVectores);
    const verificaciones = base.map((vector, i) => ({
      ...verificarVector(matriz, matrizEscalada, lambda, lambdaEscalado, vector),
      componenteFijada: escalaVectores === "parametro" ? componentesFijas[i] : null,
    }));
    const avisos = [];
    if (!base.length) {
      avisos.push("No se encontró un vector propio no nulo con la tolerancia numérica. El valor propio es aproximado; no se presenta un vector nulo como solución.");
    } else if (base.length < multiplicidad) {
      avisos.push(base.length === 1
        ? `Solo se obtuvo un vector propio independiente para una multiplicidad aproximada de ${multiplicidad}. La matriz puede no ser diagonalizable.`
        : `Solo se obtuvieron ${base.length} vectores propios independientes para una multiplicidad aproximada de ${multiplicidad}. La matriz puede no ser diagonalizable.`);
    } else if (base.length > multiplicidad) {
      avisos.push("La tolerancia del núcleo no permite distinguir todos los espacios propios cercanos; revisa los errores de los vectores obtenidos.");
    }
    if (verificaciones.some(({ errorRelativo }) => errorRelativo > 1e-8)) {
      avisos.push("La verificación tiene un error relativo elevado. Los vectores obtenidos deben interpretarse con precaución.");
    }
    return { lambda, multiplicidad, desplazada, verificaciones, avisos };
  });

  if (resultados.some(({ lambda }) => partes(lambda).im !== 0)) {
    advertencias.push("Se obtuvieron valores propios complejos aproximados. Se muestran las partes real e imaginaria y una base sobre los números complejos; i² = −1.");
  }
  return { matriz, resultados, advertencias, condicion, escalaVectores };
}

export function formatearEscalar(valor, decimales = 6) {
  const formatearReal = (numero) => {
    if (!Number.isFinite(numero)) return "Fuera de rango";
    if (numero !== 0 && (Math.abs(numero) < 0.5 * 10 ** (-decimales) || Math.abs(numero) >= 1e21)) {
      return numero.toExponential(Math.min(decimales, 6));
    }
    return (Object.is(numero, -0) ? 0 : numero).toFixed(decimales);
  };
  const { re, im } = partes(valor);
  return im === 0 ? formatearReal(re)
    : `${formatearReal(re)} ${im < 0 ? "−" : "+"} ${formatearReal(Math.abs(im))}i`;
}

export function generarCSV(espectro, decimales) {
  const filas = [["Sección", "Grupo", "Valor propio", "Multiplicidad aproximada", "Fila o vector",
    "Columna o componente", "Valor", "A·v", "λ·v", "Error ||A·v − λ·v||₂", "Error relativo"]];
  const fmt = (valor) => formatearEscalar(valor, decimales);
  filas.push(["Presentación de los vectores", "", "", "", "", "",
    espectro.escalaVectores === "parametro" ? "Parametrizar con 1" : "Norma unitaria"]);
  espectro.matriz.forEach((fila, i) => fila.forEach((valor, j) =>
    filas.push(["Matriz A", "", "", "", i + 1, j + 1, fmt(valor)])));
  espectro.resultados.forEach((grupo, g) => {
    const inicio = [g + 1, fmt(grupo.lambda), grupo.multiplicidad];
    filas.push(["Valor propio", ...inicio]);
    grupo.desplazada.forEach((fila, i) => fila.forEach((valor, j) =>
      filas.push(["A − λI", ...inicio, i + 1, j + 1, fmt(valor)])));
    grupo.verificaciones.forEach((verificacion, k) => verificacion.vector.forEach((valor, i) =>
      filas.push(["Vector propio", ...inicio, k + 1, i + 1, fmt(valor), fmt(verificacion.av[i]),
        fmt(verificacion.lambdaV[i]), fmt(verificacion.error), fmt(verificacion.errorRelativo)])));
    grupo.avisos.forEach((aviso) => filas.push(["Advertencia", ...inicio, "", "", aviso]));
  });
  espectro.advertencias.forEach((aviso) => filas.push(["Advertencia", "", "", "", "", "", aviso]));
  return '\uFEFF' + filas.map((fila) => Array.from({ length: 11 }, (_, i) =>
    `"${String(fila[i] ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
}
