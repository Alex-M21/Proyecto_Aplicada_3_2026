import test from 'node:test';
import assert from 'node:assert/strict';
import { compile } from 'mathjs';
import { cargarComponente, texto } from './componente.js';

const cerca = (actual, esperado, tolerancia = 1e-10) =>
  assert.ok(Math.abs(actual - esperado) <= tolerancia, `${actual} ≈ ${esperado}`);
const filas = (c) => c.estados().find((estado) => Array.isArray(estado) && estado[0]?.iteracion);
const entradas = (c, prefijo) => c.buscar((n) => n.tipo === 'input' && n.props.id?.startsWith(`${prefijo}-inicial-`));
const cambiarInicial = (c, prefijo, valores) => valores.forEach((valor, i) =>
  c.cambiar(c.buscar((n) => n.props.id === `${prefijo}-inicial-${i}`)[0], valor));
const botonCSV = (c) => c.buscar((n) => n.tipo === 'button' && texto(n) === 'Descargar CSV')[0];

test('Newton usa cada campo inicial, calcula J·ΔX = −F y conserva las iteraciones', async () => {
  const c = await cargarComponente('NewtonNoLineal');
  c.cambiar(c.buscar((n) => n.props.placeholder === 'Función F1')[0], 'x^2-4');
  c.cambiar(c.buscar((n) => n.props.placeholder === 'Función F2')[0], 'y^2-9');
  const primeras = [];
  for (const inicial of [[1, 2], [-1.5, 0.25], [3, 4]]) {
    cambiarInicial(c, 'newton', inicial);
    c.calcular();
    const iteraciones = filas(c);
    assert.ok(iteraciones?.length > 1);
    assert.deepEqual(iteraciones[0].valoresActuales, inicial);
    cerca(iteraciones[0].valoresSiguientes[0], (inicial[0] + 4 / inicial[0]) / 2);
    cerca(iteraciones[0].valoresSiguientes[1], (inicial[1] + 9 / inicial[1]) / 2);
    for (let k = 0; k < iteraciones.length; k++) {
      const fila = iteraciones[k];
      fila.valoresSiguientes.forEach((valor, i) => cerca(valor, fila.valoresActuales[i] + fila.delta[i]));
      fila.fValores.forEach((valor, i) => cerca(2 * fila.valoresActuales[i] * fila.delta[i], -valor));
      if (k > 0) {
        assert.deepEqual(fila.valoresActuales, iteraciones[k - 1].valoresSiguientes);
        assert.notStrictEqual(fila.valoresActuales, iteraciones[k - 1].valoresSiguientes);
      }
    }
    const solucion = iteraciones.at(-1).valoresSiguientes;
    cerca(solucion[0], Math.sign(inicial[0]) * 2, 1e-8);
    cerca(solucion[1], 3, 1e-8);
    primeras.push(iteraciones[0].valoresSiguientes);
  }
  assert.notDeepEqual(primeras[0], primeras[1]);
  assert.notDeepEqual(primeras[1], primeras[2]);
});

test('Newton admite valores iniciales cero cuando el Jacobiano es invertible y resuelve con pivoteo', async () => {
  const c = await cargarComponente('NewtonNoLineal');
  c.cambiar(c.buscar((n) => n.props.placeholder === 'Función F1')[0], 'y-2');
  c.cambiar(c.buscar((n) => n.props.placeholder === 'Función F2')[0], 'x-1');
  cambiarInicial(c, 'newton', [0, 3]);
  c.calcular();
  assert.deepEqual(filas(c)[0].valoresActuales, [0, 3]);
  assert.deepEqual(filas(c)[0].valoresSiguientes, [1, 2]);
  assert.match(texto(c.renderizar()), /Se encontró la solución/);
});

test('Newton informa un Jacobiano singular sin presentar una solución', async () => {
  const c = await cargarComponente('NewtonNoLineal');
  c.cambiar(c.buscar((n) => n.props.placeholder === 'Función F1')[0], 'x^2-4');
  c.cambiar(c.buscar((n) => n.props.placeholder === 'Función F2')[0], 'y^2-9');
  cambiarInicial(c, 'newton', [0, 0]);
  c.calcular();
  assert.match(texto(c.buscar((n) => n.props.className === 'bisection-error')[0]), /Jacobiano puede ser singular/);
  assert.equal(botonCSV(c).props.disabled, true);
});

for (const [nombre, prefijo, letra] of [
  ['PuntoFijoNoLineal', 'punto-fijo', 'G'], ['NewtonNoLineal', 'newton', 'F'],
]) {
  test(`${nombre}: redondeo de presentación conserva el cálculo y muestra errores pequeños`, async () => {
    const c = await cargarComponente(nombre);
    const funciones = letra === 'G' ? ['0.5*cos(x)', '0.5*cos(y)'] : ['x^2-2', 'y^2-3'];
    funciones.forEach((f, i) => c.cambiar(c.buscar(n => n.props.placeholder === `Función ${letra}${i + 1}`)[0], f));
    cambiarInicial(c, prefijo, [0.4, 0.7]);
    c.cambiar(c.buscar(n => n.tipo === 'input' && n.props.step === 'any' && !n.props.id)[0], '1e-10');
    c.cambiar(c.buscar(n => n.tipo === 'input' && n.props.type === 'number' && !n.props.step && !n.props.id)[0], 100);
    const historias = [];
    for (const d of [0, 2, 12]) {
      c.cambiar(c.buscar(n => n.tipo === 'input' && n.props.type === 'number' && !n.props.step && !n.props.id)[1], d);
      c.calcular();
      historias.push(filas(c));
      assert.ok(filas(c).at(-1).error < 1e-10);
      if (d === 2 && filas(c).at(-1).error !== 0) {
        const ultima = c.buscar(n => n.tipo === 'tr' && n.hijos.some(h => h?.props?.className === 'cell-red')).at(-1);
        assert.match(texto(ultima.hijos.at(-1)), /e-/);
      }
    }
    assert.deepEqual(historias[0], historias[1]);
    assert.deepEqual(historias[1], historias[2]);
  });

  test(`${nombre}: variables repetidas no deben sobrescribir un valor inicial`, async () => {
    const c = await cargarComponente(nombre);
    c.cambiar(c.buscar((n) => n.props.placeholder === 'Ej: x,y,z,w,v,u')[0], 'x,x');
    cambiarInicial(c, prefijo, [1, 8]);
    c.calcular();
    assert.match(texto(c.buscar((n) => n.props.className === 'bisection-error')[0]), /variables deben ser distintas/);
    assert.equal(filas(c), undefined);
    assert.equal(botonCSV(c).props.disabled, true);
  });

  test(`${nombre}: cambios de parámetros descartan resultados y el vector anterior`, async () => {
    const c = await cargarComponente(nombre);
    for (const [criterio, nuevoValor] of [
      [(n) => n.tipo === 'input' && n.props.step === 'any' && !n.props.id, '0.00001'],
      [(n) => n.tipo === 'input' && n.props.type === 'number' && !n.props.step && !n.props.id, '80'],
    ]) {
      c.calcular();
      assert.equal(botonCSV(c).props.disabled, false);
      c.cambiar(c.buscar(criterio)[0], nuevoValor);
      assert.equal(botonCSV(c).props.disabled, true);
      assert.match(texto(c.buscar(n => n.props['data-testid'] === `${prefijo}-vector-utilizado`)[0]), /Presiona CALCULAR/);
    }
  });

  for (let dimension = 2; dimension <= 6; dimension++) {
    test(`${nombre} ${dimension}×${dimension}: seis vectores distintos y cambios de una sola coordenada`, async () => {
      const c = await cargarComponente(nombre);
      c.cambiar(c.buscar(n => n.tipo === 'select')[0], dimension);
      const variables = ['x', 'y', 'z', 'w', 'v', 'u'].slice(0, dimension);
      const puntoFijo = letra === 'G';
      const funciones = variables.map((v, i) => puntoFijo
        ? `1.5*${v}-0.5*${v}^3` : `${v}^2-${(i + 2) ** 2}`);
      funciones.forEach((f, i) => c.cambiar(c.buscar(n => n.props.placeholder === `Función ${letra}${i + 1}`)[0], f));
      c.cambiar(c.buscar(n => n.tipo === 'input' && n.props.step === 'any' && !n.props.id)[0], '1e-10');
      c.cambiar(c.buscar(n => n.tipo === 'input' && n.props.type === 'number' && !n.props.step && !n.props.id)[0], 100);
      const vectores = [
        variables.map((_, i) => (puntoFijo ? 0.1 : 0.5) * (i + 1)),
        variables.map((_, i) => -(puntoFijo ? 0.1 : 0.5) * (i + 1)),
        variables.map((_, i) => (i % 2 ? -1 : 1) * (puntoFijo ? 0.2 : 0.8) * (i + 1)),
        variables.map(() => puntoFijo ? 0.7 : 1),
        variables.map(() => puntoFijo ? -1.1 : -1.5),
        variables.map((_, i) => puntoFijo ? (i % 2 ? 0.4 : -0.4) : i + 2.1),
      ];
      const primeras = [];
      for (const inicial of vectores) {
        cambiarInicial(c, prefijo, inicial);
        assert.equal(botonCSV(c).props.disabled, true);
        c.calcular();
        const historia = filas(c);
        assert.ok(historia?.length > 1);
        assert.deepEqual(historia[0].valoresActuales, inicial);
        assert.deepEqual(entradas(c, prefijo).map(n => Number(n.props.value)), inicial);
        assert.equal(texto(c.buscar(n => n.props['data-testid'] === `${prefijo}-vector-utilizado`)[0]), `X₀ = (${inicial.join(', ')})`);
        historia[0].valoresSiguientes.forEach((valor, i) => cerca(valor, puntoFijo
          ? 1.5 * inicial[i] - 0.5 * inicial[i] ** 3
          : (inicial[i] + (i + 2) ** 2 / inicial[i]) / 2));
        historia.at(-1).valoresSiguientes.forEach((valor, i) => cerca(valor,
          Math.sign(inicial[i]) * (puntoFijo ? 1 : i + 2), 1e-8));
        assert.match(texto(c.renderizar()), /Se encontró la solución/);
        assert.ok(historia.at(-1).error < 1e-10);
        primeras.push(historia[0].valoresSiguientes);
      }
      assert.equal(new Set(primeras.map(JSON.stringify)).size, vectores.length);
      // Cambiar cada coordenada por separado detecta setters que actualizan siempre el mismo índice.
      const base = Array(dimension).fill(puntoFijo ? 0.4 : 1.5);
      cambiarInicial(c, prefijo, base);
      for (let i = 0; i < dimension; i++) {
        const inicial = [...base];
        inicial[i] = puntoFijo ? 0.6 : 2.5;
        c.cambiar(c.buscar(n => n.props.id === `${prefijo}-inicial-${i}`)[0], inicial[i]);
        c.calcular();
        assert.deepEqual(filas(c)[0].valoresActuales, inicial);
        c.cambiar(c.buscar(n => n.props.id === `${prefijo}-inicial-${i}`)[0], base[i]);
      }
    });
  }

  test(`${nombre}: campos separados, etiquetas, errores y reinicio de resultados`, async () => {
    const c = await cargarComponente(nombre);
    assert.equal(entradas(c, prefijo).length, 2);
    assert.ok(entradas(c, prefijo).every((n) => n.props.type === 'number' && n.props.step === 'any'));
    c.calcular();
    assert.equal(botonCSV(c).props.disabled, false);
    cambiarInicial(c, prefijo, [1, 2]);
    assert.equal(botonCSV(c).props.disabled, true);
    for (const valor of ['', ' ', 'abc', '2abc', '1,2', 'Infinity']) {
      cambiarInicial(c, prefijo, [valor, 2]);
      c.calcular();
      assert.match(texto(c.buscar((n) => n.props.className === 'bisection-error')[0]), /inicial de x.*(vacío|numérico y finito)/);
      assert.equal(botonCSV(c).props.disabled, true);
    }
    c.cambiar(c.buscar((n) => n.props.placeholder === 'Ej: x,y,z,w,v,u')[0], 'a,b');
    assert.match(texto(c.buscar((n) => n.tipo === 'label' && n.props.htmlFor === `${prefijo}-inicial-0`)[0]), /a0/);
    assert.equal(entradas(c, prefijo).length, 2);
    c.cambiar(c.buscar((n) => n.tipo === 'select')[0], 3);
    assert.equal(entradas(c, prefijo).length, 3);
    assert.equal(c.buscar((n) => n.props.placeholder?.startsWith(`Función ${letra}`)).length, 3);
    c.buscar((n) => n.tipo === 'button' && texto(n) === 'BORRAR CELDAS')[0].props.onClick();
    c.renderizar();
    assert.equal(entradas(c, prefijo).length, 2);
    assert.equal(botonCSV(c).props.disabled, true);
  });

  test(`${nombre}: convergencia y CSV en los ejemplos de 2×2 hasta 6×6`, async () => {
    const c = await cargarComponente(nombre);
    for (let dimension = 2; dimension <= 6; dimension++) {
      c.cambiar(c.buscar((n) => n.tipo === 'select')[0], dimension);
      assert.equal(entradas(c, prefijo).length, dimension);
      // Una tolerancia más estricta permite comprobar también el residuo.
      c.cambiar(c.buscar((n) => n.tipo === 'input' && n.props.step === 'any' && !n.props.id)[0], '1e-10');
      c.cambiar(c.buscar((n) => n.tipo === 'input' && n.props.type === 'number' && !n.props.step && !n.props.id)[0], 100);
      c.calcular();
      const iteraciones = filas(c);
      assert.ok(iteraciones?.length, `Ejemplo ${dimension}×${dimension} debe producir iteraciones`);
      assert.match(texto(c.renderizar()), /Se encontró la solución/);
      const solucion = iteraciones.at(-1).valoresSiguientes;
      assert.ok(solucion.every(Number.isFinite));
      const variables = c.buscar((n) => n.props.placeholder === 'Ej: x,y,z,w,v,u')[0].props.value.split(',');
      const scope = Object.fromEntries(variables.map((v, i) => [v, solucion[i]]));
      const funciones = c.buscar((n) => n.props.placeholder?.startsWith(`Función ${letra}`));
      funciones.forEach((f, i) => {
        const valor = compile(f.props.value).evaluate(scope);
        const residuo = letra === 'G' ? valor - solucion[i] : valor;
        cerca(residuo, 0, 1e-8);
      });
      botonCSV(c).props.onClick();
      const csv = await c.descarga();
      const filasCSV = csv.split('\n');
      assert.equal(filasCSV[0].split(',').length, 2 * dimension + 2);
      assert.equal(filasCSV.length, iteraciones.length + 1);
      assert.ok(filasCSV.every((fila) => fila.split(',').length === 2 * dimension + 2));
    }
  });
}
