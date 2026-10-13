import test from 'node:test';
import assert from 'node:assert/strict';
import { abs, complex, multiply, subtract } from 'mathjs';
import { calcularEspectro, leerMatriz, formatearEscalar, generarCSV } from '../src/utils/valoresVectoresPropios.js';
import { calcularConCAS, generarCSVCAS } from '../src/utils/propiosCAS.js';
import { cargarComponente, texto } from './componente.js';

const cerca = (actual, esperado, tolerancia = 1e-9) =>
  assert.ok(abs(subtract(actual, esperado)) <= tolerancia, `${actual} ≈ ${esperado}`);

function comprobarVectores(espectro) {
  for (const grupo of espectro.resultados) {
    assert.ok(grupo.verificaciones.length > 0, 'Se requiere una base no vacía');
    for (const { vector, av, lambdaV, error, errorRelativo } of grupo.verificaciones) {
      cerca(Math.hypot(...vector.map((v) => abs(v))), 1);
      const calculado = multiply(espectro.matriz, vector);
      const esperado = multiply(grupo.lambda, vector);
      calculado.forEach((v, i) => { cerca(v, esperado[i]); cerca(v, av[i]); cerca(esperado[i], lambdaV[i]); });
      cerca(error, Math.hypot(...calculado.map((v, i) => abs(subtract(v, esperado[i])))), 1e-12);
      assert.ok(errorRelativo < 1e-9);
      assert.deepEqual(grupo.desplazada, espectro.matriz.map((fila, i) =>
        fila.map((v, j) => i === j ? subtract(v, grupo.lambda) : v)));
    }
  }
}

for (const [nombre, matriz, valores] of [
  ['Ejemplo 1 simétrico', [[2, -1], [-1, 2]], [1, 3]],
  ['Ejemplo 2 general', [[3, 4], [1, 0]], [-1, 4]],
  ['Ejemplo 3 verificado', [[3, 2, -1], [1, -2, 3], [2, 0, 4]], [-2, 3, 4]],
  ['4×4 general con pivotes intercambiados', [[0, 1, 0, 0], [1, 0, 0, 0], [0, 0, 3, 2], [0, 0, 0, 4]], [-1, 1, 3, 4]],
]) {
  test(`${nombre}: valores, vectores, A − λI y residuos`, () => {
    const copia = structuredClone(matriz);
    const espectro = calcularEspectro(matriz);
    assert.equal(espectro.resultados.length, valores.length);
    espectro.resultados.forEach((g, i) => cerca(g.lambda, valores[i]));
    comprobarVectores(espectro);
    assert.deepEqual(matriz, copia, 'No debe modificar la matriz original');
  });
}

test('Los vectores de los ejemplos 1 y 2 son proporcionales a las soluciones indicadas', () => {
  for (const [matriz, vectores] of [
    [[[2, -1], [-1, 2]], [[1, 1], [-1, 1]]],
    [[[3, 4], [1, 0]], [[-1, 1], [4, 1]]],
  ]) {
    calcularEspectro(matriz).resultados.forEach((g, i) => {
      const [x, y] = g.verificaciones[0].vector;
      cerca(x * vectores[i][1] - y * vectores[i][0], 0);
    });
  }
});

test('Parametrización numérica fija las variables libres en 1 y verifica los vectores elegidos', () => {
  for (const matriz of [[[2, -1], [-1, 2]], [[3, 4], [1, 0]], [[2, 0], [0, 3]], [[0, -1], [1, 0]], [[4, 0], [0, 4]]]) {
    const resultado = calcularEspectro(matriz, { escalaVectores: 'parametro' });
    for (const grupo of resultado.resultados) {
      for (const verificacion of grupo.verificaciones) {
        cerca(verificacion.vector[verificacion.componenteFijada], 1);
        const av = multiply(matriz, verificacion.vector);
        const lambdaV = multiply(grupo.lambda, verificacion.vector);
        av.forEach((valor, i) => {
          cerca(valor, lambdaV[i]);
          cerca(valor, verificacion.av[i]);
          cerca(lambdaV[i], verificacion.lambdaV[i]);
        });
        assert.ok(verificacion.errorRelativo < 1e-9);
      }
    }
    assert.match(generarCSV(resultado, 6), /Parametrizar con 1/);
  }
  const resultado = calcularEspectro([[3, 4], [1, 0]], { escalaVectores: 'parametro' });
  const vector = resultado.resultados[1].verificaciones[0].vector;
  cerca(vector[0], 4); cerca(vector[1], 1);
});

test('Valores complejos ±i conservan la parte imaginaria y verifican sus vectores', () => {
  const espectro = calcularEspectro([[0, -1], [1, 0]]);
  cerca(espectro.resultados[0].lambda, complex(0, -1));
  cerca(espectro.resultados[1].lambda, complex(0, 1));
  comprobarVectores(espectro);
  assert.match(espectro.advertencias.join(' '), /complejos/);
  assert.match(formatearEscalar(espectro.resultados[0].lambda, 3), /0\.000 − 1\.000i/);
});

test('Valores repetidos agrupan multiplicidad y calculan una base completa', () => {
  const espectro = calcularEspectro([[4, 0, 0], [0, 4, 0], [0, 0, 4]]);
  assert.equal(espectro.resultados.length, 1);
  assert.equal(espectro.resultados[0].multiplicidad, 3);
  assert.deepEqual(espectro.resultados[0].verificaciones.map((v) => v.vector), [[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
  comprobarVectores(espectro);
});

test('Matriz defectiva informa que solo existe un vector independiente', () => {
  const espectro = calcularEspectro([[2, 1], [0, 2]]);
  const grupo = espectro.resultados[0];
  assert.equal(grupo.multiplicidad, 2);
  assert.equal(grupo.verificaciones.length, 1);
  assert.match(grupo.avisos.join(' '), /Solo se obtuvo un vector propio independiente/);
  comprobarVectores(espectro);
});

test('Matriz singular y matriz nula calculan los espacios propios sin fallar', () => {
  for (const matriz of [[[1, 2], [2, 4]], [[0, 0], [0, 0]]]) {
    const espectro = calcularEspectro(matriz);
    assert.match(espectro.advertencias.join(' '), /singular/);
    comprobarVectores(espectro);
  }
  assert.equal(calcularEspectro([[0, 0], [0, 0]]).resultados[0].verificaciones.length, 2);
});

test('Matriz mal condicionada conserva valores pequeños distintos e informa su condición', () => {
  const espectro = calcularEspectro([[1e-10, 0], [0, 1]]);
  assert.equal(espectro.resultados.length, 2);
  cerca(espectro.resultados[0].lambda, 1e-10, 1e-20);
  assert.match(espectro.advertencias.join(' '), /mal condicionada/);
  assert.equal(espectro.condicion, 1e10);
  comprobarVectores(espectro);
});

test('El escalado preserva raíces de matrices muy pequeñas y muy grandes', () => {
  for (const factor of [1e-200, 1e200]) {
    const espectro = calcularEspectro([[2 * factor, -factor], [-factor, 2 * factor]]);
    espectro.resultados.forEach((g, i) => {
      cerca(g.lambda / factor, i ? 3 : 1);
      assert.ok(g.verificaciones[0].errorRelativo < 1e-9);
    });
  }
});

test('Rechaza campos vacíos, valores no numéricos y matrices no cuadradas', () => {
  for (const valor of ['', ' ', null, undefined]) {
    assert.throws(() => leerMatriz([[1, valor], [0, 2]]), /celda A\(1, 2\).*vacía/);
  }
  for (const valor of ['abc', '2abc', NaN, Infinity, true, {}]) {
    assert.throws(() => calcularEspectro([[1, valor], [0, 2]]), /numérico real y finito/);
  }
  for (const matriz of [null, [], [[1]], [[1, 2, 3], [4, 5, 6]], [[1, 2], [3]], [1, 2]]) {
    assert.throws(() => calcularEspectro(matriz), /cuadrada/);
  }
  assert.deepEqual(leerMatriz([['-1.5', '0.25'], ['0', '3']]), [[-1.5, 0.25], [0, 3]]);
});

test('CSV incluye matriz, valores complejos, multiplicidad, vectores y verificaciones', () => {
  const csv = generarCSV(calcularEspectro([[0, -1], [1, 0]]), 5);
  const filas = csv.slice(1).split('\r\n').map((fila) => JSON.parse(`[${fila}]`));
  assert.ok(filas.every((fila) => fila.length === 11));
  assert.equal(filas.filter((f) => f[0] === 'Matriz A').length, 4);
  assert.equal(filas.filter((f) => f[0] === 'A − λI').length, 8);
  assert.equal(filas.filter((f) => f[0] === 'Vector propio').length, 4);
  assert.equal(filas.filter((f) => f[0] === 'Valor propio').length, 2);
  assert.match(csv, /1\.00000i/);
  assert.match(csv, /Error relativo/);
});

test('El formato conserva partes imaginarias pequeñas y los desbordamientos se informan', () => {
  assert.match(formatearEscalar(complex(2, 1e-12), 3), /\+ 1\.000e-12i/);
  assert.match(formatearEscalar(1e-20, 6), /e-20/);
  assert.throws(() => calcularEspectro([[1e308, 1e308], [1e308, 1e308]]), /exceden el rango numérico/);
});

test('Interfaz GeoGebra: ejemplos, validación, tamaño, limpieza y exportación', async () => {
  const c = await cargarComponente('ValoresVectoresPropios', {
    generarCSVCAS,
    calcularConCAS: (matriz) => calcularConCAS(matriz, async () => ({ evalCommandCAS(comando) {
      if (comando.startsWith('Expand(')) return matriz.length === 3 ? '-x³ + 5x² - 8x + 4' : 'x² - 4x + 3';
      if (comando.startsWith('Factor(')) return matriz.length === 3 ? '-(x - 1) (x - 2)²' : '(x - 1) (x - 3)';
      if (matriz.length === 3) return comando.startsWith('Eigenvalues(')
        ? '{2,2,1}' : '{{1,0,-1},{0,1,-1},{1,-1,-1}}';
      return comando.startsWith('Eigenvalues(') ? '{1,3}' : '{{1,-1},{1,1}}';
    } })),
  });
  const botonCSV = () => c.buscar((n) => n.tipo === 'button' && texto(n) === 'Descargar CSV')[0];
  c.cambiar(c.buscar(n => n.props.id === 'propios-dimension')[0], 2);
  c.buscar(n => n.props.id === 'propios-crear-matriz')[0].props.onClick();
  c.renderizar();
  [[2,-1],[-1,2]].forEach((fila,i) => fila.forEach((valor,j) =>
    c.cambiar(c.buscar(n => n.props['aria-label'] === `A(${i+1}, ${j+1})`)[0], valor)));
  assert.equal(botonCSV().props.disabled, true);
  await c.calcular();
  assert.equal(botonCSV().props.disabled, false);
  botonCSV().props.onClick();
  assert.match(await c.descarga(), /VectoresPropios/);
  assert.match(texto(c.renderizar()), /λ1 = 1/);
  c.cambiar(c.buscar((n) => n.props['aria-label'] === 'A(1, 1)')[0], '');
  assert.equal(botonCSV().props.disabled, true);
  await c.calcular();
  assert.match(texto(c.renderizar()), /celda A\(1, 1\).*vacía/);
  c.buscar((n) => n.tipo === 'button' && texto(n) === 'Ejemplo caso 2')[0].props.onClick();
  c.renderizar(); await c.calcular();
  assert.match(texto(c.renderizar()), /λ1, λ2 = 2/);
  assert.equal(c.buscar((n) => n.tipo === 'input' && n.props['aria-label']?.startsWith('A(')).length, 9);
  c.cambiar(c.buscar((n) => n.props.id === 'propios-dimension')[0], 4);
  c.buscar(n => n.props.id === 'propios-crear-matriz')[0].props.onClick();
  c.renderizar();
  assert.equal(c.buscar((n) => n.tipo === 'input' && n.props['aria-label']?.startsWith('A(')).length, 16);
  assert.equal(botonCSV().props.disabled, true);
  c.buscar((n) => n.tipo === 'button' && texto(n) === 'BORRAR CELDAS')[0].props.onClick();
  c.renderizar();
  assert.ok(c.buscar((n) => n.tipo === 'input' && n.props['aria-label']?.startsWith('A(')).every((n) => n.props.value === ''));
  assert.equal(botonCSV().props.disabled, true);
  assert.match(texto(c.renderizar()), /Completa todas las celdas, incluidos los ceros/);
  assert.doesNotMatch(texto(c.renderizar()), /Repetir un ejemplo en GeoGebra/);
});
