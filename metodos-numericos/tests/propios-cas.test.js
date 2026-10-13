import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularConCAS, prepararMatrizCAS, separarListaCAS, generarCSVCAS } from '../src/utils/propiosCAS.js';
import { cargarComponente, texto } from './componente.js';

const motorEjemplo = async () => ({ evalCommandCAS(comando) {
  if (comando.startsWith('Eigenvalues(')) return '{4, -1}';
  if (comando.startsWith('Eigenvectors(')) return '{{4, -1}, {1, 1}}';
  if (comando.startsWith('Expand(')) return 'x² - 3x - 4';
  if (comando.startsWith('Factor(')) return '(x - 4) (x + 1)';
  throw new Error('Comando inesperado');
} });

function ingresarMatriz(c, matriz) {
  c.cambiar(c.buscar(n => n.props.id === 'propios-dimension')[0], matriz.length);
  c.buscar(n => n.props.id === 'propios-crear-matriz')[0].props.onClick();
  c.renderizar();
  matriz.forEach((fila,i) => fila.forEach((valor,j) =>
    c.cambiar(c.buscar(n => n.props['aria-label'] === `A(${i+1}, ${j+1})`)[0], valor)));
}

test('La unidad 6 conserva la escala de GeoGebra en la tabla y en el CSV', async () => {
  const comandos = [];
  const c = await cargarComponente('ValoresVectoresPropios', {
    generarCSVCAS,
    calcularConCAS: (matriz) => calcularConCAS(matriz, async () => ({ evalCommandCAS(comando) {
      comandos.push(comando);
      if (comando.startsWith('Eigenvalues(')) return '{4, -1}';
      if (comando.startsWith('Eigenvectors(')) return '{{8, -2}, {2, 2}}';
      if (comando.startsWith('Expand(')) return 'x² - 3x - 4';
      if (comando.startsWith('Factor(')) return '(x - 4) (x + 1)';
      throw new Error('No debe reescalar los vectores');
    } })),
  });
  ingresarMatriz(c, [[3,4],[1,0]]);
  c.renderizar();
  assert.equal(c.buscar((n) => n.tipo === 'select').length, 0);
  assert.equal(c.buscar((n) => n.props.id === 'propios-dimension')[0].props.min, '1');
  assert.equal(c.buscar((n) => ['propios-modo', 'propios-escala', 'propios-decimales'].includes(n.props.id)).length, 0);
  await c.calcular();
  assert.deepEqual(comandos.filter(c => c.startsWith('Eigen')), ['Eigenvalues({{3,4},{1,0}})', 'Eigenvectors({{3,4},{1,0}})']);
  assert.match(texto(c.renderizar()), /p\(λ\) = det\(A − λI\) = λ² - 3λ - 4/);
  assert.match(texto(c.renderizar()), /v1 = \{8, 2\}/);
  assert.match(texto(c.renderizar()), /v2 = \{-2, 2\}/);
  c.buscar((n) => n.tipo === 'button' && texto(n) === 'Descargar CSV')[0].props.onClick();
  assert.match(await c.descarga(), /\{\{8, -2\}, \{2, 2\}\}/);
  assert.doesNotMatch(await c.descarga(), /parametriz|Error relativo|aproximad/);
});

test('La entrada CAS conserva fracciones, raíces y todos los dígitos decimales', () => {
  const preparado = prepararMatrizCAS([['1/2', 'sqrt(2)'], ['1.234567890123456789', '1e-20']]);
  assert.equal(preparado.texto, '{{1/2,sqrt(2)},{(1234567890123456789/10^18),(1/10^20)}}');
  assert.equal(preparado.numeros[0][0], 0.5);
  assert.equal(preparado.numeros[0][1], Math.sqrt(2));
  assert.equal(prepararMatrizCAS([['.25', '1.5e2'], ['0', '-3']]).texto, '{{(25/10^2),(15*10^1)},{0,-3}}');
  assert.equal(prepararMatrizCAS([['√(2)', 'pi'], ['0', '1']]).numeros[0][1], Math.PI);
});

test('La entrada CAS rechaza celdas inválidas, órdenes ajenas y matrices no cuadradas', () => {
  for (const valor of ['x', 'a=1', '1/0', '1;2', 'random()', 'Eigenvalues({{1,0},{0,1}})', '[1,2]', 'true']) {
    assert.throws(() => prepararMatrizCAS([[valor, 0], [0, 1]]), /número real o complejo, una fracción o una raíz/);
  }
  assert.throws(() => prepararMatrizCAS([['', 0], [0, 1]]), /vacía/);
  assert.throws(() => prepararMatrizCAS([[1, 2, 3], [4, 5, 6]]), /cuadrada/);
});

test('CAS admite NxN desde 1×1 y conserva entradas complejas', () => {
  for (const n of [1, 5, 6, 8, 10]) {
    const matriz = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? i + 1 : 0));
    assert.deepEqual(prepararMatrizCAS(matriz).numeros, matriz);
  }
  const complejo = prepararMatrizCAS([['1+2i', 'sqrt(-1)'], [0, '3/2']]);
  assert.equal(complejo.numeros[0][0].re, 1);
  assert.equal(complejo.numeros[0][0].im, 2);
  assert.equal(complejo.numeros[0][1].im, 1);
  assert.equal(complejo.texto, '{{1+2ί,sqrt(-1)},{0,3/2}}');
  assert.equal(prepararMatrizCAS([['i^2', 'ί'], ['ⅈ', 'pi']]).texto, '{{ί^2,ί},{ί,pi}}');
});

test('Crear NxN aplica el tamaño y rechaza valores inválidos sin cambiar la matriz', async () => {
  const c = await cargarComponente('ValoresVectoresPropios', { generarCSVCAS, calcularConCAS: () => assert.fail('No debe calcular un tamaño sin aplicar') });
  ingresarMatriz(c, [[1,0],[0,1]]);
  const crear = () => { c.buscar(n => n.props.id === 'propios-crear-matriz')[0].props.onClick(); c.renderizar(); };
  const celdas = () => c.buscar(n => n.tipo === 'input' && n.props['aria-label']?.startsWith('A('));
  c.cambiar(c.buscar(n => n.props.id === 'propios-dimension')[0], 7);
  assert.equal(celdas().length, 4);
  await c.calcular();
  assert.match(texto(c.renderizar()), /Presiona CREAR MATRIZ/);
  crear();
  assert.equal(celdas().length, 49);
  for (const valor of ['', 0, -1, 1.5]) {
    c.cambiar(c.buscar(n => n.props.id === 'propios-dimension')[0], valor);
    crear();
    assert.match(texto(c.renderizar()), /entero mayor o igual a 1/);
    assert.equal(celdas().length, 49);
  }
  c.cambiar(c.buscar(n => n.props.id === 'propios-dimension')[0], 1);
  crear();
  assert.equal(celdas().length, 1);
});

test('Separa listas CAS sin romper expresiones o listas anidadas', () => {
  assert.deepEqual(separarListaCAS('{(sqrt(33)+5)/2, (-sqrt(33)+5)/2}'), ['(sqrt(33)+5)/2', '(-sqrt(33)+5)/2']);
  assert.deepEqual(separarListaCAS('{{4,-1}, {1,1}}'), ['{4,-1}', '{1,1}']);
  assert.deepEqual(separarListaCAS('{f(1,2), {3,4}}'), ['f(1,2)', '{3,4}']);
  assert.equal(separarListaCAS('?'), null);
  assert.equal(separarListaCAS('{(1,2}'), null);
});

test('Ejecuta los comandos originales del CAS y conserva el orden de valores y columnas', async () => {
  const llamadas = [];
  const resultado = await calcularConCAS([[3, 4], [1, 0]], async () => {
    const api = await motorEjemplo();
    return { evalCommandCAS(comando) { llamadas.push(comando); return api.evalCommandCAS(comando); } };
  });
  assert.deepEqual(llamadas.filter(c => c.startsWith('Eigen')), ['Eigenvalues({{3,4},{1,0}})', 'Eigenvectors({{3,4},{1,0}})']);
  assert.deepEqual(resultado.listaValores, ['4', '-1']);
  assert.deepEqual(resultado.filasVectores, [['4', '-1'], ['1', '1']]);
  assert.deepEqual(resultado.avisos, []);
  const csv = generarCSVCAS(resultado);
  assert.match(csv, /"ValoresPropios\(A\)","\{4, -1\}"/);
  assert.match(csv, /"VectoresPropios\(A\)","\{\{4, -1\}, \{1, 1\}\}"/);
});

test('Un resultado CAS con raíces o complejos se conserva como expresión exacta', async () => {
  const resultado = await calcularConCAS([[1, 2], [3, 4]], async () => ({
    evalCommandCAS: (comando) => comando.startsWith('Eigenvalues(')
      ? '{(sqrt(33)+5)/2,(-sqrt(33)+5)/2}' : '{{sqrt(33)-3,-sqrt(33)-3},{6,6}}',
  }));
  assert.equal(resultado.filasVectores[1][0], '6');
  assert.equal(resultado.listaValores[0], '(sqrt(33)+5)/2');
  const complejo = await calcularConCAS([[0, -1], [1, 0]], async () => ({
    evalCommandCAS: (comando) => comando.startsWith('Eigenvalues(') ? '{-ί,ί}' : '{{-ί,ί},{1,1}}',
  }));
  assert.deepEqual(complejo.listaValores, ['-ί', 'ί']);
});

test('Matriz defectiva resuelve el espacio propio con CAS y distingue su multiplicidad', async () => {
  const resultado = await calcularConCAS([[2, 1], [0, 2]], async () => ({
    evalCommandCAS(comando) {
      if (comando.startsWith('Eigenvalues(')) return '{2,2}';
      if (comando.startsWith('Eigenvectors(')) return '?';
      if (comando.startsWith('ReducedRowEchelonForm(')) return '{{0,1},{0,0}}';
      if (comando.startsWith('Simplify(-(')) return '0';
      if (comando.startsWith('Simplify(')) return '{{0},{0}}';
      if (comando.startsWith('Expand(')) return 'x² - 4x + 4';
      if (comando.startsWith('Factor(')) return '(x - 2)²';
      throw new Error('Comando inesperado');
    },
  }));
  assert.deepEqual(resultado.listaValores, ['2', '2']);
  assert.equal(resultado.filasVectores, null);
  assert.equal(resultado.espaciosPropios[0].multiplicidad, 2);
  assert.deepEqual(resultado.espaciosPropios[0].bases, [['1', '0']]);
  assert.match(resultado.avisos[0], /No hay una base completa/);
});

test('PDF caso 1: polinomio con signo de det(A − λI), raíz repetida y dos espacios propios', async () => {
  const c = await cargarComponente('ValoresVectoresPropios', { generarCSVCAS,
    calcularConCAS: (matriz) => calcularConCAS(matriz, async () => ({ evalCommandCAS(comando) {
      if (comando.startsWith('Eigenvalues(')) return '{0,5,5}';
      if (comando.startsWith('Eigenvectors(')) return '?';
      if (comando.startsWith('Expand(')) return '-x³ + 10x² - 25x';
      if (comando.startsWith('Factor(')) return '-x (x - 5)²';
      if (comando.startsWith('ReducedRowEchelonForm(')) return comando.includes('(5)-(0)')
        ? '{{1,0,2},{0,1,5/2},{0,0,0}}' : '{{1,0,2},{0,1,0},{0,0,0}}';
      if (comando === 'Simplify(-(2))') return '-2';
      if (comando === 'Simplify(-(5/2))') return '-5/2';
      if (comando === 'Simplify(-(0))') return '0';
      if (comando.startsWith('Simplify(')) return '{{0},{0},{0}}';
      throw new Error('Comando inesperado');
    } })),
  });
  c.buscar(n => n.tipo === 'button' && texto(n) === 'Ejemplo caso 1')[0].props.onClick();
  c.renderizar(); await c.calcular();
  const resultado = c.estados().find(e => e?.espaciosPropios);
  assert.deepEqual(resultado.espaciosPropios.map(g => [g.valor,g.multiplicidad,g.bases.length]), [['0',1,1],['5',2,1]]);
  assert.deepEqual(resultado.espaciosPropios[0].bases, [['-2','-5/2','1']]);
  assert.deepEqual(resultado.espaciosPropios[1].bases, [['-2','0','1']]);
  assert.match(texto(c.renderizar()), /-λ³ \+ 10λ² - 25λ/);
  c.buscar(n => n.tipo === 'button' && texto(n) === 'Descargar CSV')[0].props.onClick();
  assert.match(await c.descarga(), /-λ³ \+ 10λ² - 25λ/);
  assert.match(await c.descarga(), /λ = 5: eigenvector 1/);
  c.cambiar(c.buscar(n => n.props['aria-label'] === 'A(1, 1)')[0], '6');
  assert.doesNotMatch(texto(c.renderizar()), /-λ³ \+ 10λ² - 25λ/);
});

test('Un vector que CAS no confirma se descarta sin inventar una solución', async () => {
  const resultado = await calcularConCAS([[2,1],[0,2]], async () => ({ evalCommandCAS(comando) {
    if (comando.startsWith('Eigenvalues(')) return '{2,2}';
    if (comando.startsWith('Eigenvectors(')) return '?';
    if (comando.startsWith('ReducedRowEchelonForm(')) return '{{0,1},{0,0}}';
    if (comando.startsWith('Simplify(-(')) return '0';
    if (comando.startsWith('Simplify(')) return '{{1},{0}}';
    if (comando.startsWith('Expand(')) return 'x² - 4x + 4';
    if (comando.startsWith('Factor(')) return '(x - 2)²';
    return '?';
  } }));
  assert.equal(resultado.espaciosPropios[0].bases.length, 0);
  assert.match(resultado.avisos[0], /No se pudieron obtener eigenvectores/);
});

test('Una factorización no disponible conserva el polinomio desarrollado y los eigenresultados', async () => {
  const api = await motorEjemplo();
  const resultado = await calcularConCAS([[3,4],[1,0]], async () => ({ evalCommandCAS(comando) {
    return comando.startsWith('Factor(') ? '?' : api.evalCommandCAS(comando);
  } }));
  assert.equal(resultado.polinomio.desarrollado, 'x² - 3x - 4');
  assert.equal(resultado.polinomio.factorizado, null);
  assert.deepEqual(resultado.listaValores, ['4','-1']);
  assert.match(generarCSVCAS(resultado), /λ² - 3λ - 4/);
  assert.match(resultado.avisos[0], /No se pudo factorizar/);
});

test('Errores del motor y salidas no resueltas se muestran sin inventar resultados exactos', async () => {
  await assert.rejects(calcularConCAS([[1, 0], [0, 1]], async () => { throw new Error('Sin conexión'); }), /Sin conexión/);
  await assert.rejects(calcularConCAS([[1, 0], [0, 1]], async () => ({ evalCommandCAS: () => '?' })), /no pudo resolver/);
});

test('Interfaz CAS exporta un único CSV y borra resultados al editar', async () => {
  const c = await cargarComponente('ValoresVectoresPropios', {
    generarCSVCAS,
    calcularConCAS: (matriz) => calcularConCAS(matriz, motorEjemplo),
  });
  ingresarMatriz(c, [[3,4],[1,0]]);
  c.renderizar();
  await c.calcular();
  assert.match(texto(c.renderizar()), /\{4, -1\}/);
  const botonExacto = () => c.buscar((n) => n.tipo === 'button' && texto(n) === 'Descargar CSV')[0];
  assert.equal(botonExacto().props.disabled, false);
  botonExacto().props.onClick();
  assert.match(await c.descarga(), /VectoresPropios\(A\)/);
  assert.equal(c.buscar((n) => n.tipo === 'button' && texto(n).startsWith('Descargar CSV')).length, 1);
  c.cambiar(c.buscar((n) => n.props['aria-label'] === 'A(1, 1)')[0], '1/2');
  assert.equal(botonExacto().props.disabled, true);
});

test('La interfaz descarta respuestas CAS antiguas cuando cambia la matriz', async () => {
  let resolver;
  const pendiente = new Promise((resolve) => { resolver = resolve; });
  const c = await cargarComponente('ValoresVectoresPropios', {
    generarCSVCAS, calcularConCAS: () => pendiente,
  });
  const calculo = c.calcular();
  assert.match(texto(c.renderizar()), /Calculando eigenvalores y eigenvectores/);
  c.cambiar(c.buscar((n) => n.props['aria-label'] === 'A(1, 1)')[0], '5');
  resolver(await calcularConCAS([[3, 4], [1, 0]], motorEjemplo));
  await calculo;
  assert.doesNotMatch(texto(c.renderizar()), /\{4, -1\}/);
  assert.equal(c.buscar((n) => n.tipo === 'button' && texto(n) === 'Descargar CSV')[0].props.disabled, true);
});
