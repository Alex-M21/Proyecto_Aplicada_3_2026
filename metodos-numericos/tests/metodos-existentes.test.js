import test from 'node:test';
import assert from 'node:assert/strict';
import { cargarComponente, texto } from './componente.js';

const cerca = (actual, esperado) => assert.ok(Math.abs(actual - esperado) < 1e-10, `${actual} ≈ ${esperado}`);

test('Punto fijo usa el vector ingresado, actualiza simultáneamente y conserva las iteraciones', async () => {
  const c = await cargarComponente('PuntoFijoNoLineal');
  const primeras = [];
  for (const inicial of [[1, 2], [-1.5, 0.25], [0, 3]]) {
    inicial.forEach((valor, i) => c.cambiar(c.buscar((n) => n.props.id === `punto-fijo-inicial-${i}`)[0], valor));
    c.calcular();
    const filas = c.estados().find((e) => Array.isArray(e) && e[0]?.iteracion);
    assert.ok(filas?.length > 1);
    const [x, y] = inicial;
    assert.deepEqual(filas[0].valoresActuales, [x, y]);
    cerca(filas[0].valoresSiguientes[0], y / Math.sqrt(5));
    cerca(filas[0].valoresSiguientes[1], (Math.sin(x) + 2 * Math.cos(y)) / 4);
    assert.deepEqual(filas[1].valoresActuales, filas[0].valoresSiguientes);
    assert.notStrictEqual(filas[0].valoresSiguientes, filas[1].valoresActuales);
    primeras.push(filas[0].valoresSiguientes);
  }
  assert.notDeepEqual(primeras[0], primeras[1]);
  assert.notDeepEqual(primeras[1], primeras[2]);
});

test('Punto fijo rechaza campos iniciales vacíos y valores inválidos sin descartarlos', async () => {
  const c = await cargarComponente('PuntoFijoNoLineal');
  for (const inicial of ['', ' ', '1,2', 'abc', '2abc', 'Infinity']) {
    c.cambiar(c.buscar((n) => n.props.id === 'punto-fijo-inicial-1')[0], inicial);
    c.calcular();
    assert.match(texto(c.buscar((n) => n.props.className === 'bisection-error')[0]), /inicial de y.*(vacío|numérico y finito)/);
    assert.equal(c.buscar((n) => n.tipo === 'button' && texto(n) === 'Descargar CSV')[0].props.disabled, true);
  }
});

test('Newton progresivo y regresivo: coeficientes, ordenamiento, tabla, reinicio y CSV', async () => {
  const c = await cargarComponente('NewtonDiferenciasDivididas');
  // Entrada desordenada para comprobar que los pares x,y se mantienen juntos.
  const puntos = [[9, 30], [3, 8], [6, 23], [5, 16]];
  for (let i = 0; i < puntos.length; i++) {
    for (let j = 0; j < 2; j++) {
      c.cambiar(c.buscar((n) => n.props.placeholder === (j ? `f(x${i + 1})` : `x${i + 1}`))[0], puntos[i][j]);
    }
  }
  c.cambiar(c.buscar((n) => n.props.placeholder === 'Ejemplo: 5')[0], 6.5);
  c.cambiar(c.buscar((n) => n.tipo === 'input' && n.props.value === '4' && n.props.min === '0')[0], 8);
  for (const [metodo, esperados] of [
    ['progresiva', [8, 4, 1, -13 / 36]],
    ['regresiva', [30, 7 / 3, -7 / 6, -13 / 36]],
  ]) {
    c.cambiar(c.buscar((n) => n.tipo === 'select')[0], metodo);
    assert.equal(c.buscar((n) => n.tipo === 'button' && texto(n) === 'Descargar CSV')[0].props.disabled, true);
    c.calcular();
    const tarjetas = c.buscar((n) => n.props.className === 'mini-info-card');
    const valores = tarjetas.slice(-4).map((n) => Number(texto(n.hijos[1])));
    valores.forEach((v, i) => assert.ok(Math.abs(v - esperados[i]) < 1e-8));
    assert.match(texto(tarjetas[1]), /26\.30208333/);
    const verdes = c.buscar((n) => n.props.className === 'cell-green');
    assert.equal(verdes.length, 4);
    verdes.map((n) => Number(texto(n))).sort((a, b) => a - b).forEach((v, i) => {
      assert.ok(Math.abs(v - [...esperados].sort((a, b) => a - b)[i]) < 1e-8);
    });
    const boton = c.buscar((n) => n.tipo === 'button' && texto(n) === 'Descargar CSV')[0];
    boton.props.onClick();
    const csv = await c.descarga();
    assert.match(csv.split('\n')[0], /"Orden 1: f\[x_i,x_i\+1\] \/ primera diferencia"/);
    assert.equal(csv.split('\n').length, 5);
    assert.equal(csv.split('\n')[1].split(',')[1], '3.00000000');
  }
});
