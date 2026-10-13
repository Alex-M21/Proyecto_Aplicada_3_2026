import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { evaluate as numero } from 'mathjs';
import { separarListaCAS } from '../src/utils/propiosCAS.js';
import { abrirPagina } from './navegador-cdp.mjs';

const appURL = process.argv[2] ?? 'http://localhost:5173/Proyecto_Aplicada_3_2026/';
const pagina = await abrirPagina(appURL, process.argv[3]);
const informe = { motor: 'GeoGebra CAS real en Chromium', fecha: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guatemala' }).format(new Date()), url: appURL,
  matrices: [], sistemas: [], muller: [] };
const listaMatriz = texto => separarListaCAS(texto)?.map(separarListaCAS);
const literalCAS = valor => {
  const texto = String(valor).replace(/(?<![A-Za-z_])i(?![A-Za-z_])/g, 'ί');
  const cientifica = texto.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))[eE]([+-]?\d+)$/);
  return cientifica ? `(${cientifica[1]}*10^(${cientifica[2]}))` : texto;
};
const textoMatriz = matriz => `{${matriz.map(f => `{${f.map(literalCAS).join(',')}}`).join(',')}}`;
const normalizarNumero = texto => texto.replaceAll('−', '-').replaceAll('ί', 'i').replaceAll('×', '*')
  .replaceAll('ℯ', 'e').replaceAll('π', 'pi').replaceAll('√', 'sqrt')
  .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+/g, potencia => '^(' + [...potencia].map(c => ({
    '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6',
    '⁷': '7', '⁸': '8', '⁹': '9', '⁺': '+', '⁻': '-',
  })[c]).join('') + ')');
const numeroCAS = texto => Number(numero(normalizarNumero(texto)));
const extraerSolucion = (texto, variables) => {
  const lista = separarListaCAS(texto);
  if (!lista) return [];
  if (lista[0]?.startsWith('{')) return lista.flatMap(t => extraerSolucion(t, variables));
  const valores = new Map(lista.map(t => { const i = t.indexOf('='); return [t.slice(0, i).trim(), t.slice(i + 1).trim()]; }));
  return variables.every(v => valores.has(v)) ? [variables.map(v => numeroCAS(valores.get(v)))] : [];
};
const click = selector => pagina.evaluar(`document.querySelector(${JSON.stringify(selector)}).click()`);
const cas = comando => pagina.evaluar(`window.motorCAS.evalCommandCAS(${JSON.stringify(comando)})`, 60000);

try {
  await pagina.esperar('document.querySelector("#root h1")');
  console.log('Cargando GeoGebra CAS real…');
  // Arrancar el motor mediante el formulario, también en la versión compilada.
  await pagina.seleccionar('Unidad 6', 'Valores y Vectores Propios');
  await click('.bisection-form button[type="submit"]');
  await pagina.esperar(`!document.querySelector('.bisection-form button[type="submit"]').disabled &&
    (document.querySelector('.bisection-results .propios-cas-fila') || document.querySelector('.bisection-form .bisection-error'))`, 60000);
  await pagina.evaluar(`(async () => {
    window.motorCAS = await window[Symbol.for('aplicada3.motorGeoGebraCAS')];
    if (!window.motorCAS) throw new Error('El formulario no cargó el motor CAS real');
    return true;
  })()`, 60000);
  informe.version = await pagina.evaluar(`typeof window.motorCAS.getVersion === 'function' ? window.motorCAS.getVersion() : 'API CAS cargada'`);
  informe.instanciaCompartida = await pagina.evaluar(`(async () => {
    let otroMotor = await window[Symbol.for('aplicada3.motorGeoGebraCAS')];
    const fuente = await fetch('/Proyecto_Aplicada_3_2026/src/utils/propiosCAS.js');
    if (fuente.ok && fuente.headers.get('content-type')?.includes('javascript') &&
      (await fuente.text()).includes('export function obtenerMotorCAS')) {
      const otroModulo = await import('/Proyecto_Aplicada_3_2026/src/utils/propiosCAS.js?verificacion_instancia=1');
      otroMotor = await otroModulo.obtenerMotorCAS();
    }
    return otroMotor === window.motorCAS && window.motorCAS.evalCommandCAS('1+1') === '2';
  })()`);
  assert.equal(informe.instanciaCompartida, true);
  console.log('Motor real listo');

  const diagonal = valores => valores.map((v, i) => valores.map((_, j) => i === j ? v : 0));
  const matrices = [
    ['Escalar 1×1', [[7]]],
    ['Simétrica 2×2', [[2, -1], [-1, 2]]],
    ['General 2×2', [[3, 4], [1, 0]]],
    ['Radicales 2×2', [[1, 2], [3, 4]]],
    ['Fracciones 2×2', [['1/2', '1/3'], [0, '3/2']]],
    ['Entradas complejas 2×2', [['1+2i', 0], [0, 3]]],
    ['Eigenvalores complejos 2×2', [[0, -1], [1, 0]]],
    ['Defectiva 2×2', [[2, 1], [0, 2]]],
    ['General 3×3', [[3, 2, -1], [1, -2, 3], [2, 0, 4]]],
    ['Nula 3×3', diagonal([0, 0, 0])],
    ['General 4×4', [[0, 1, 0, 0], [1, 0, 0, 0], [0, 0, 3, 2], [0, 0, 0, 4]]],
    ['Diagonal 5×5', diagonal([1, 2, 3, 4, 5])],
    ['Densa simétrica 5×5', Array.from({ length: 5 }, (_, i) => Array.from({ length: 5 }, (_, j) => i === j ? 2 : 1))],
    ['General densa 5×5', [[5, 1, -1, 2, 0], [1, 4, 2, 0, 1], [-1, 2, 6, 1, -2], [2, 0, 1, 7, 1], [0, 1, -2, 1, 8]]],
    ['Mixta 6×6', [[0, -1, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0], [0, 0, 2, 1, 0, 0], [0, 0, 0, 3, 0, 0], [0, 0, 0, 0, 4, 1], [0, 0, 0, 0, 0, 5]]],
    ['Tridiagonal 6×6', Array.from({ length: 6 }, (_, i) => Array.from({ length: 6 }, (_, j) => i === j ? 2 : Math.abs(i - j) === 1 ? -1 : 0))],
    ['Repetidos 8×8', diagonal([1, 1, 2, 2, 3, 3, 4, 4])],
    ['Diagonal 10×10', diagonal(Array.from({ length: 10 }, (_, i) => i + 1))],
  ];
  await pagina.seleccionar('Unidad 6', 'Valores y Vectores Propios');
  for (const [nombre, matriz] of matrices) {
    await pagina.cambiar('#propios-dimension', matriz.length);
    await click('#propios-crear-matriz');
    await pagina.esperar(`document.querySelectorAll('input[aria-label^="A("]').length === ${matriz.length ** 2}`);
    await pagina.evaluar(`(() => {
      const matriz = ${JSON.stringify(matriz)};
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      matriz.forEach((fila, i) => fila.forEach((v, j) => {
        const campo = document.querySelector('input[aria-label="A(' + (i+1) + ', ' + (j+1) + ')"]');
        setter.call(campo, String(v)); campo.dispatchEvent(new Event('input', { bubbles: true }));
      }));
    })()`);
    await click('.bisection-form button[type="submit"]');
    await pagina.esperar(`!document.querySelector('.bisection-form button[type="submit"]').disabled &&
      (document.querySelector('.bisection-results .propios-cas-fila') || document.querySelector('.bisection-form .bisection-error'))`, 60000);
    const ui = await pagina.evaluar(`(() => {
      const bloques = Array.from(document.querySelectorAll('.bisection-results .propios-cas-fila'));
      const valores = bloques.find(b => b.querySelector('strong').textContent.startsWith('Eigenvalores'))?.querySelector('code')?.textContent;
      const vector = bloques.find(b => b.querySelector('strong').textContent.startsWith('Eigenvectores'));
      const filas = vector?.querySelector('tbody') ? Array.from(vector.querySelectorAll('tbody tr')).map(f => Array.from(f.cells).map(c => c.textContent)) : null;
      return { valores, filas, error: document.querySelector('.bisection-form .bisection-error')?.textContent ?? null,
        polinomio: document.querySelector('#propios-polinomio')?.textContent.replace('p(λ) = det(A − λI) = ', ''),
        factorizado: document.querySelector('#propios-polinomio-factorizado')?.textContent.replace(' = 0', ''),
        aviso: document.querySelector('.bisection-results .bisection-warning')?.textContent ?? null };
    })()`);
    assert.equal(ui.error, null, `${nombre}: ${ui.error}`);
    const original = textoMatriz(matriz);
    const desplazada = textoMatriz(matriz.map((fila,i) => fila.map((v,j) => i === j ? `(${literalCAS(v)})-(x)` : literalCAS(v))));
    const polinomio = await cas(`Expand(Determinant(${desplazada}))`);
    const factorizado = await cas(`Factor(Determinant(${desplazada}))`);
    assert.equal(ui.polinomio, polinomio.replaceAll('x', 'λ'), `${nombre}: polinomio característico distinto`);
    assert.equal(ui.factorizado, factorizado.replaceAll('x', 'λ'), `${nombre}: factorización distinta`);
    const valores = await cas(`Eigenvalues(${original})`);
    const vectores = await cas(`Eigenvectors(${original})`);
    assert.equal(ui.valores, valores, `${nombre}: eigenvalores distintos del CAS`);
    const filas = listaMatriz(vectores);
    let residuo = null;
    if (filas) {
      assert.deepEqual(ui.filas, filas, `${nombre}: escala o columnas distintas del CAS`);
      const lambdas = separarListaCAS(valores);
      const D = textoMatriz(diagonal(lambdas));
      residuo = await cas(`Simplify((${original})*(${vectores})-(${vectores})*(${D}))`);
      const componentes = listaMatriz(residuo)?.flat();
      assert.ok(componentes?.every(v => {
        const valor = numero(normalizarNumero(v));
        return (typeof valor === 'number' ? Math.abs(valor) : Math.hypot(valor.re, valor.im)) < 1e-8;
      }), `${nombre}: A·V − V·D = ${residuo}`);
    } else {
      assert.equal(ui.filas, null);
      assert.ok(ui.aviso, `${nombre}: falta el aviso de GeoGebra`);
    }
    informe.matrices.push({ nombre, orden: matriz.length, matriz, polinomio, factorizado, valores, vectores, residuo, aviso: ui.aviso });
    console.log(`Matriz aprobada: ${nombre}`);
  }

  for (const [nombre, prefijo, letra] of [
    ['Punto Fijo No Lineal', 'punto-fijo', 'G'], ['Newton No Lineal', 'newton', 'F'],
  ]) {
    await pagina.seleccionar('Unidad 5', nombre);
    for (let n = 2; n <= 6; n++) {
      await pagina.cambiar('.bisection-form select', n);
      const variables = await pagina.evaluar(`document.querySelector('input[placeholder="Ej: x,y,z,w,v,u"]').value.split(',').map(v => v.trim())`);
      const funciones = await pagina.evaluar(`Array.from(document.querySelectorAll('input[placeholder^="Función ${letra}"]')).map(c => c.value)`);
      const original = await pagina.evaluar(`Array.from(document.querySelectorAll('input[id^="${prefijo}-inicial-"]')).map(c => Number(c.value))`);
      const vectores = [original, original.map((v, i) => n >= 4 && letra === 'F' && i % 2 ? -v : v + 0.1)];
      if (n === 2) vectores.push(letra === 'G' ? [-1.5, 0.25] : [-0.1, 0.5]);
      await pagina.cambiar('form input[type="number"][step="any"]:not([id])', '1e-10');
      await pagina.cambiar('form input[type="number"]:not([step]):not([id])', 100);
      // Doce decimales permiten comparar con las respuestas numéricas reales del CAS.
      const decimales = await pagina.evaluar(`Array.from(document.querySelectorAll('form input[type="number"]:not([step]):not([id])')).at(-1).outerHTML`);
      assert.ok(decimales);
      await pagina.evaluar(`(() => { const c=Array.from(document.querySelectorAll('form input[type="number"]:not([step]):not([id])')).at(-1);
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(c,'12'); c.dispatchEvent(new Event('input',{bubbles:true})); })()`);
      for (const inicial of vectores) {
        for (let i = 0; i < n; i++) await pagina.cambiar(`#${prefijo}-inicial-${i}`, inicial[i]);
        await click('.bisection-form button[type="submit"]');
        await pagina.esperar(`document.querySelector('.bisection-table-wrapper tbody') || document.querySelector('.bisection-form .bisection-error')`);
        const ui = await pagina.evaluar(`(() => {
          const filas = document.querySelectorAll('.bisection-table-wrapper tbody tr');
          return { error: document.querySelector('.bisection-form .bisection-error')?.textContent ?? null,
            solucion: filas.length ? Array.from(filas[filas.length-1].cells).slice(1,${n + 1}).map(c=>Number(c.textContent)) : [],
            iteraciones: filas.length,
            utilizado: document.querySelector('[data-testid="${prefijo}-vector-utilizado"]').textContent.trim() };
        })()`);
        assert.equal(ui.error, null, `${nombre} ${n}×${n}: ${ui.error}`);
        assert.equal(ui.utilizado, `X₀ = (${inicial.join(', ')})`);
        const ecuaciones = funciones.map((f, i) => letra === 'G' ? `${variables[i]}=(${f})` : `(${f})=0`);
        const punto = variables.map((v, i) => `${v}=${literalCAS(inicial[i])}`);
        const comando = `Numeric(NSolve({${ecuaciones.join(',')}},{${punto.join(',')}}),16)`;
        const salida = await cas(comando);
        let soluciones = extraerSolucion(salida, variables);
        let comprobacionCercana = null;
        if (!soluciones.some(s => s.every((v, i) => Math.abs(v - ui.solucion[i]) < 2e-8))) {
          // NSolve y Punto Fijo pueden tener cuencas de atracción distintas.
          const cercano = variables.map((v, i) => `${v}=${literalCAS(ui.solucion[i])}`);
          comprobacionCercana = await cas(`Numeric(NSolve({${ecuaciones.join(',')}},{${cercano.join(',')}}),16)`);
          soluciones = extraerSolucion(comprobacionCercana, variables);
        }
        assert.ok(soluciones.some(s => s.every((v, i) => Math.abs(v - ui.solucion[i]) < 2e-8)), `${nombre} ${n}×${n}: ${salida}`);
        const diferencias = funciones.map((f, i) => letra === 'G' ? `(${f})-${variables[i]}` : `(${f})`);
        const sustitucion = variables.map((v, i) => `${v}=${literalCAS(ui.solucion[i])}`);
        const residuo = await cas(`Numeric(Substitute({${diferencias.join(',')}},{${sustitucion.join(',')}}),16)`);
        const residuales = separarListaCAS(residuo)?.map(numeroCAS);
        assert.ok(residuales?.every(v => Math.abs(v) < 1e-8), `${nombre}: residuo CAS ${residuo}`);
        informe.sistemas.push({ metodo: nombre, n, funciones, inicial, solucion: ui.solucion,
          iteraciones: ui.iteraciones, comando, salidaCAS: salida, comprobacionCercana, residuoCAS: residuo });
        console.log(`Sistema aprobado: ${nombre} ${n}×${n}, inicio ${inicial.join(',')}`);
      }
    }
  }

  for (const [nombre, polinomio, inicial] of [
    ['Müller (real)', 'x^3+3*x^2+4*x-12', [0, 1, 2]],
    ['Müller (complejo)', '3*x^2-x+1', [1.5, 2.1, 2.5]],
  ]) {
    await pagina.seleccionar('Unidad 2', nombre);
    await pagina.evaluar(`(() => {
      const campos = Array.from(document.querySelectorAll('.bisection-form input')).filter(c=>c.type!=='range');
      const valores=${JSON.stringify([polinomio, ...inicial, 1e-10, 100, 12])};
      const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
      valores.forEach((v,i)=>{setter.call(campos[i],String(v));campos[i].dispatchEvent(new Event('input',{bubbles:true}));});
    })()`);
    await click('.bisection-form button[type="submit"]');
    await pagina.esperar(`document.querySelector('.bisection-results .bisection-table tbody tr') || document.querySelector('.bisection-form .bisection-error')`);
    const salida = await pagina.evaluar(`(() => {
      const filas=Array.from(document.querySelectorAll('.bisection-results .bisection-table tbody tr'));
      return { p:filas.at(-1)?.cells[4]?.textContent, iteraciones:filas.length,
        error:document.querySelector('.bisection-form .bisection-error')?.textContent ?? null };
    })()`);
    assert.equal(salida.error, null);
    assert.ok(salida.p);
    const valor = numero(normalizarNumero(salida.p));
    const raiz = typeof valor === 'number' ? [valor, 0] : [valor.re, valor.im];
    // Los comandos CAS identifican las raíces válidas sin imponer número de filas.
    const soluciones = await cas(`Numeric(CSolve(${polinomio}=0,x),16)`);
    const residual = await cas(`Numeric(Substitute(${polinomio},{x=(${literalCAS(raiz[0])})+(${literalCAS(raiz[1])})*i}),16)`);
    const residuo = numero(normalizarNumero(residual));
    assert.ok((typeof residuo === 'number' ? Math.abs(residuo) : Math.hypot(residuo.re, residuo.im)) < 1e-8);
    const asignaciones = separarListaCAS(soluciones)?.flatMap(s => s.startsWith('{') ? separarListaCAS(s) : [s]);
    const raicesCAS = asignaciones?.map(s => {
      const v = numero(normalizarNumero(s.slice(s.indexOf('=') + 1).trim()));
      return typeof v === 'number' ? [v, 0] : [v.re, v.im];
    });
    assert.ok(raicesCAS?.some(r => Math.hypot(r[0] - raiz[0], r[1] - raiz[1]) < 2e-8));
    if (nombre.includes('complejo')) {
      assert.ok(Math.abs(raiz[0] - 1 / 6) < 1e-10);
      assert.ok(Math.abs(raiz[1] + Math.sqrt(11) / 6) < 1e-10);
    }
    informe.muller.push({ metodo: nombre, polinomio, inicial, raiz, salidaCAS: soluciones, tabla: salida, residual });
    console.log(`Müller contrastado: ${nombre}`);
  }
  console.log(JSON.stringify({ matricesReales: informe.matrices.length, sistemasReales: informe.sistemas.length, muller: informe.muller.length }));
} finally {
  await writeFile(new URL(process.argv[4] ?? '../PRUEBAS_CAS_REALES.json', import.meta.url), JSON.stringify(informe, null, 2) + '\n');
  await pagina.cerrar();
}
