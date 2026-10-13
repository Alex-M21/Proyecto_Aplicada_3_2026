import test from 'node:test';
import assert from 'node:assert/strict';
import { abs, subtract } from 'mathjs';
import { cargarComponente, texto } from './componente.js';

const cerca = (actual, esperado, tolerancia = 1e-12) =>
  assert.ok(Math.abs(actual - esperado) <= tolerancia, `${actual} ≈ ${esperado}`);
const entradas = (c) => c.buscar((n) => n.tipo === 'input' && n.props.type !== 'range');
const configurar = (c, valores) => valores.forEach((valor, i) => c.cambiar(entradas(c)[i], valor));
const filas = (c) => c.estados().find((e) => Array.isArray(e) && (e[0]?.n || e[0]?.iter || e[0]?.iteracion));

// Casos de las capturas: valores mayores y menores que uno separan el error
// absoluto del relativo. Se ejercitan los manejadores reales de los componentes.
for (const [nombre, datos, diferencia, primerError, cantidad] of [
  ['Newton', ['1-cos(x)', 'sin(x)', 0.1, 0.001, 15, 5], r => r.xNext - r.xn,
    0.05009, 6],
  ['Secante', ['3*ln(x-1)+2*cos(x-1)', 1.1, 2, 0.001, 23, 5], r => r.xNext - r.xCurr,
    0.1621352367910105, 7],
  ['Stefensen', ['(-1)*(ln(x)/ln(2))', 0.5, 0.001, 15, 5], r => r.pNextRaw - r.p0Raw,
    1 / 6, 3],
  ['MullerReal', ['x^3+3*x^2+4*x-12', 0, 1, 2, 0.01, 25, 4], r => r.p - r.x2,
    0.7426660424470781, undefined],
  ['PuntoFijo', ['cos(x)', 0.6, 0.001, 100, 5], r => r.gxn - r.xn,
    Math.cos(0.6) - 0.6, undefined],
]) {
  test(`${nombre}: error absoluto en todas las filas y parada por tolerancia`, async () => {
    const c = await cargarComponente(nombre);
    configurar(c, datos);
    c.calcular();
    const historia = filas(c);
    assert.ok(historia?.length);
    if (cantidad) assert.equal(historia.length, cantidad);
    cerca(historia[0].errorRaw ?? historia[0].error, primerError);
    const indiceTol = nombre === 'MullerReal' ? 4 : nombre === 'Newton' ? 3 : nombre === 'Secante' ? 3 : 2;
    const tol = datos[indiceTol];
    historia.forEach((r, i) => {
      const error = r.errorRaw ?? r.error;
      const diferenciaAbsoluta = Math.abs(diferencia(r));
      cerca(error, nombre === 'Newton' ? Math.round(diferenciaAbsoluta * 1e5) / 1e5 : diferenciaAbsoluta);
      if (i < historia.length - 1) assert.ok(error >= tol);
    });
    assert.ok((historia.at(-1).errorRaw ?? historia.at(-1).error) < tol);
    assert.ok(c.buscar(n => n.tipo === 'th' && texto(n).startsWith('Error absoluto')).length);
  });
}

test('Newton: reproduce las seis filas y el redondeo intermedio de la referencia definitiva', async () => {
  const c = await cargarComponente('Newton');
  configurar(c, ['1-cos(x)', 'sin(x)', 0.1, 0.001, 15, 5]);
  c.calcular();
  assert.deepEqual(filas(c).map(({ xn, fxn, dfxn, xNext, error }) => [xn, fxn, dfxn, xNext, error]), [
    [0.1, 0.005, 0.09983, 0.04991, 0.05009],
    [0.04991, 0.00125, 0.04989, 0.02485, 0.02506],
    [0.02485, 0.00031, 0.02485, 0.01238, 0.01247],
    [0.01238, 0.00008, 0.01238, 0.00592, 0.00646],
    [0.00592, 0.00002, 0.00592, 0.00254, 0.00338],
    [0.00254, 0, 0.00254, 0.00254, 0],
  ]);
});

for (const nombre of ['PosicionFalsa1', 'PosicionFalsa2']) {
  test(`${nombre}: errores de la captura y comparaciones consecutivas`, async () => {
    const c = await cargarComponente(nombre);
    configurar(c, ['x^5-7*x^2-1', 1, 2, 0.001, 30, 5]);
    c.calcular();
    const historia = filas(c);
    assert.equal(historia.length, 5);
    cerca(historia[0].errorRaw ?? historia[0].error, nombre === 'PosicionFalsa1' ? 0.7 : 0.3);
    historia.slice(1).forEach((r, i) => cerca(r.errorRaw ?? r.error,
      Math.abs((r.cRaw ?? r.xNext) - (historia[i].cRaw ?? historia[i].xNext))));
    cerca(historia.at(-1).cRaw ?? historia.at(-1).xNext, 1.93689, 5e-6);
  });

  test(`${nombre}: un residuo pequeño o redondeado a cero no satisface la tolerancia del error`, async () => {
    const c = await cargarComponente(nombre);
    configurar(c, ['1e-8*(x^2-2)', 1, 2, 0.001, 30, 0]);
    c.calcular();
    let historia = filas(c);
    assert.ok(historia.length > 1);
    assert.ok((historia[0].errorRaw ?? historia[0].error) > 0.001);
    assert.ok((historia.at(-1).errorRaw ?? historia.at(-1).error) < 0.001);
    configurar(c, ['x^2-2', 1, 2, 0.001, 4, 0]);
    c.calcular();
    historia = filas(c);
    assert.equal(historia.length, 4);
    assert.ok((historia.at(-1).errorRaw ?? historia.at(-1).error) > 0.001);
    assert.match(texto(c.renderizar()), /máximo de iteraciones/);
    assert.equal(c.buscar(n => n.props.className === 'cell-red').length, 0);
  });

  test(`${nombre}: una raíz exacta permite detenerse aunque el primer cambio sea grande`, async () => {
    const c = await cargarComponente(nombre);
    configurar(c, ['x-1.5', 1, 2, 0.001, 10, 5]);
    c.calcular();
    assert.equal(filas(c).length, 1);
    cerca(filas(c)[0].xNext, 1.5);
    assert.ok(c.buscar(n => n.props.className === 'cell-red').length);
  });
}

test('Posición Falsa I: cuando cambia el extremo derecho, compara con la última aproximación', async () => {
  const c = await cargarComponente('PosicionFalsa1');
  configurar(c, ['sqrt(x)-1', 0, 4, 0.001, 30, 8]);
  c.calcular();
  const historia = filas(c);
  cerca(historia[0].xNext, 2);
  assert.equal(historia[1].xPrev, 0);
  cerca(historia[1].error, 2 - Math.sqrt(2));
  assert.ok(historia.at(-1).error < 0.001);
});

test('Muller imaginario: el error es el módulo absoluto de la diferencia compleja', async () => {
  const c = await cargarComponente('MullerImaginario');
  configurar(c, ['x^2-8*x+25', 3, 4, 5, 0.001, 50, 4]);
  c.calcular();
  const historia = filas(c);
  assert.ok(historia?.length);
  cerca(historia[0].errRaw, Math.sqrt(10));
  historia.forEach(r => cerca(r.errRaw, abs(subtract(r.p, r.x2))));
  assert.ok(historia.at(-1).errRaw < 0.001);
});

test('Muller imaginario: registra la discrepancia de la referencia, sin confundirla con relativo', async () => {
  const c = await cargarComponente('MullerImaginario');
  configurar(c, ['3*x^2-x+1', 1.5, 2.1, 2.5, 0.001, 50, 4]);
  c.calcular();
  const primera = filas(c)[0];
  cerca(primera.p.re, 1 / 6);
  assert.ok(primera.p.im < 0, 'En el empate entre conjugadas se elige la rama de la raíz final de la referencia');
  cerca(Math.abs(primera.p.im), Math.sqrt(11) / 6);
  const diferenciaModulos = Math.abs(abs(primera.p) - abs(primera.x2));
  cerca(diferenciaModulos, 1.922649731, 5e-10);
  cerca(primera.errRaw, Math.sqrt(23 / 4));
  assert.ok(Math.abs(primera.errRaw - diferenciaModulos) > 0.4);
  const relativo = primera.errRaw / abs(primera.p);
  assert.ok(Math.abs(relativo - diferenciaModulos) > 2);
});

test('Muller imaginario: la raíz final coincide con la referencia sin exigir sus cuatro filas', async () => {
  const c = await cargarComponente('MullerImaginario');
  configurar(c, ['3*x^2-x+1', 1.5, 2.1, 2.5, 1e-10, 50, 12]);
  c.calcular();
  const ultima = filas(c).at(-1);
  cerca(ultima.p.re, 1 / 6);
  cerca(ultima.p.im, -Math.sqrt(11) / 6);
  assert.ok(ultima.errRaw < 1e-10);
});

test('Las primeras filas legibles distinguen el absoluto del relativo por sus valores', () => {
  for (const [anterior, nuevo, errorCaptura] of [
    [0.1, 0.04991, 0.05009], // Newton
    [2, 1.83787, 0.16213], // Secante
    [1, 1.7, 0.7], // Posición Falsa I
    [2, 1.7, 0.3], // Posición Falsa II
    [0.5, 0.66667, 0.16667], // Steffensen
    [2, 1.2573, 0.7427], // Muller real
    [0.25, 0.50941, 0.25941], // Punto fijo no lineal
    [0.5, 0.26365, 0.23635], // Newton no lineal
  ]) {
    const absoluto = Math.abs(nuevo - anterior);
    cerca(errorCaptura, absoluto);
    assert.ok(Math.abs(errorCaptura - absoluto / Math.abs(nuevo)) > 0.01);
    assert.ok(Math.abs(errorCaptura - 100 * absoluto / Math.abs(nuevo)) > 1);
  }
});

test('Jacobi 4×4: reproduce el máximo absoluto 5.6667 de la captura', async () => {
  const c = await cargarComponente('Jacobi');
  c.cambiar(entradas(c)[0], 4);
  configurar(c, [4, 23, 0.001, 4,
    4, 1, 1, 1, 1,
    -1, 5, 1, 1, 2,
    2, 2, 6, 1, 3,
    2, 1, -1, 7, 4,
    1, 3, 4, 5,
  ]);
  c.calcular();
  const primera = filas(c)[0];
  primera.xs.forEach((x, i) => cerca(x, [-11 / 4, -6 / 5, -5 / 3, 3 / 7][i]));
  primera.errs.forEach((e, i) => cerca(e, [3.75, 4.2, 17 / 3, 32 / 7][i]));
  cerca(primera.maxErr, 17 / 3);
});

for (const [nombre, matriz, inicial, tol, esperados, cantidad] of [
  ['Jacobi', [[12, -1, 0, 2], [-1, 10, -2, 7], [0, -2, 10, 6]], [12, 3, 3], 0.1,
    [12 - 5 / 12, 0.5, 1.8], 4],
  ['GaussSeidel', [[12, -1, 0, 9], [-1, 12, 2, 3], [1, -2, 10, 6]], [1, 2, 3], 0.01,
    [1 / 12, 2 + 25 / 144, 3 - 341 / 720], 4],
]) {
  test(`${nombre}: error absoluto por componente y máximo global como en las capturas`, async () => {
    const c = await cargarComponente(nombre);
    configurar(c, [3, 25, tol, 5, ...matriz.flat(), ...inicial]);
    c.calcular();
    const historia = filas(c);
    assert.equal(historia.length, cantidad);
    historia[0].errs.forEach((e, i) => cerca(e, esperados[i]));
    historia.forEach((r, k) => {
      const previo = k ? historia[k - 1].xs : inicial;
      r.errs.forEach((e, i) => cerca(e, Math.abs(r.xs[i] - previo[i])));
      cerca(r.maxErr, Math.max(...r.errs));
      if (k < historia.length - 1) assert.ok(r.maxErr >= tol);
    });
    assert.ok(historia.at(-1).maxErr < tol);
  });
}

for (const [nombre, primerError, tol, cantidad] of [
  ['NewtonNoLineal', 0.236361536154, 0.0001, 5],
  ['PuntoFijoNoLineal', 0.259414565017, 0.01, 5],
]) {
  test(`${nombre}: error absoluto por variable y máximo global en el ejemplo 2×2`, async () => {
    const c = await cargarComponente(nombre);
    c.calcular();
    const historia = filas(c);
    assert.equal(historia.length, cantidad);
    cerca(historia[0].error, primerError, 1e-10);
    historia.forEach((r, k) => {
      r.errores.forEach((e, i) => cerca(e, Math.abs(r.valoresSiguientes[i] - r.valoresActuales[i])));
      cerca(r.error, Math.max(...r.errores));
      if (k < historia.length - 1) assert.ok(r.error >= tol);
    });
    assert.ok(historia.at(-1).error < tol);
  });
}

test('Bisección conserva la cota absoluta de la mitad del intervalo', async () => {
  const c = await cargarComponente('Biseccion');
  configurar(c, ['x^2-2', 1, 2, 0.001, 30, 5]);
  c.calcular();
  const historia = filas(c);
  historia.forEach(r => {
    cerca(r.error, Math.abs(r.b - r.a) / 2);
    assert.ok(Math.abs(r.p - Math.sqrt(2)) <= r.error);
  });
  assert.ok(historia.at(-1).error < 0.001);
});
