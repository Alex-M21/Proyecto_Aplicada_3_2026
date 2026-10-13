import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { prepararMatrizCAS, separarListaCAS } from '../src/utils/propiosCAS.js';
import { abrirPagina } from './navegador-cdp.mjs';

const url = process.argv[2] ?? 'http://localhost:5173/Proyecto_Aplicada_3_2026/';
const pagina = await abrirPagina(url, process.argv[3]);
const informe = { fecha: '2026-10-13', url, aprobado: false, casos: [] };
const casos = [
  { nombre: 'PDF caso 1', ejemplo: 'Ejemplo caso 1', matriz: [[5,-4,0],[1,0,2],[0,2,5]], polinomio: '-x^3+10*x^2-25*x', grupos: [['0',1,1],['5',2,1]] },
  { nombre: 'PDF caso 2', ejemplo: 'Ejemplo caso 2', matriz: [[3,-1,-1],[1,1,-1],[1,-1,1]], polinomio: '-x^3+5*x^2-8*x+4', grupos: [['1',1,1],['2',2,2]] },
  { nombre: 'Matriz real con eigenvalores imaginarios', ejemplo: 'Ejemplo imaginario', matriz: [[0,-1],[1,0]], polinomio: 'x^2+1', grupos: [['-ί',1,1],['ί',1,1]] },
  { nombre: 'Entradas puramente imaginarias', matriz: [['i',1],[0,'2i']], polinomio: 'x^2-3*ί*x-2', grupos: [['ί',1,1],['2*ί',1,1]] },
  { nombre: 'Entradas complejas y fracciones', matriz: [['1+2i','1/2'],[0,3]], polinomio: 'x^2-(4+2*ί)*x+3+6*ί', grupos: [['1+2*ί',1,1],['3',1,1]] },
  { nombre: 'i² es menos uno', matriz: [['i^2']], polinomio: '-1-x', grupos: [['-1',1,1]] },
  { nombre: 'Raíz repetida con entradas complejas', matriz: [['i',1],[1,'-i']], polinomio: 'x^2', grupos: [['0',2,1]] },
];
const cas = comando => pagina.evaluar(`(async () => {
  const api = await window[Symbol.for('aplicada3.motorGeoGebraCAS')];
  return api.evalCommandCAS(${JSON.stringify(comando)});
})()`, 60000);
const literalMatriz = filas => `{${filas.map(f => `{${f.join(',')}}`).join(',')}}`;

try {
  await pagina.esperar('document.querySelector("#root h1")');
  await pagina.seleccionar('Unidad 6', 'Valores y Vectores Propios');
  assert.match(await pagina.evaluar(`document.querySelector('.bisection-form').textContent`), /Entradas reales, imaginarias o complejas/);
  assert.deepEqual(await pagina.evaluar(`Array.from(document.querySelectorAll('.bisection-form button')).map(b=>b.textContent).filter(t=>t.startsWith('Ejemplo'))`),
    ['Ejemplo caso 1','Ejemplo caso 2','Ejemplo imaginario']);
  for (const caso of casos) {
    if (caso.ejemplo) {
      await pagina.evaluar(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent===${JSON.stringify(caso.ejemplo)}).click()`);
    } else {
      await pagina.cambiar('#propios-dimension', caso.matriz.length);
      await pagina.evaluar(`document.querySelector('#propios-crear-matriz').click()`);
      for (let i=0;i<caso.matriz.length;i++) for (let j=0;j<caso.matriz.length;j++) {
        await pagina.cambiar(`input[aria-label="A(${i+1}, ${j+1})"]`, caso.matriz[i][j]);
      }
    }
    await pagina.evaluar(`document.querySelector('button[type="submit"]').click()`);
    await pagina.esperar(`!document.querySelector('button[type="submit"]').disabled &&
      (document.querySelector('#propios-polinomio') || document.querySelector('.bisection-error'))`, 60000);
    const ui = await pagina.evaluar(`(() => {
      const tabla = Array.from(document.querySelectorAll('.bisection-results table')).find(t =>
        t.caption?.textContent === 'Correspondencia entre eigenvalores y eigenvectores');
      return { error: document.querySelector('.bisection-error')?.textContent ?? null,
        polinomio: document.querySelector('#propios-polinomio')?.textContent.replace('p(λ) = det(A − λI) = ', '').replaceAll('λ','x'),
        factorizado: document.querySelector('#propios-polinomio-factorizado')?.textContent.replace(' = 0','').replaceAll('λ','x'),
        grupos: Array.from(tabla?.querySelectorAll('tbody tr') ?? []).map(f => ({
          valor: f.cells[0].textContent.split(' = ').at(-1), multiplicidad: Number(f.cells[1].textContent),
          vectores: Array.from(f.cells[2].querySelectorAll('div')).map(v => v.textContent.slice(v.textContent.indexOf('{'))) })),
        avisos: Array.from(document.querySelectorAll('.bisection-warning')).map(n=>n.textContent) };
    })()`);
    assert.equal(ui.error, null, `${caso.nombre}: ${ui.error}`);
    assert.equal(await cas(`Simplify((${ui.polinomio})-(${caso.polinomio}))`), '0', caso.nombre);
    assert.equal(await cas(`Simplify(Expand(${ui.factorizado})-(${caso.polinomio}))`), '0', caso.nombre);
    assert.equal(ui.grupos.length, caso.grupos.length);
    const comprobaciones = [];
    for (const grupo of ui.grupos) {
      const coincidencias = await Promise.all(caso.grupos.map(async g =>
        [g, await cas(`Simplify((${grupo.valor})-(${g[0]}))`)]));
      const esperado = coincidencias.find(([,d])=>d==='0')?.[0];
      assert.ok(esperado, `Eigenvalor inesperado: ${grupo.valor}`);
      assert.equal(grupo.multiplicidad, esperado[1]);
      assert.equal(grupo.vectores.length, esperado[2]);
      assert.equal(await cas(`Simplify(Substitute(${caso.polinomio},{x=(${grupo.valor})}))`), '0');
      const desplazada = prepararMatrizCAS(caso.matriz).expresiones.map((fila,i) => fila.map((v,j) => i===j ? `(${v})-(${grupo.valor})` : v));
      for (const vector of grupo.vectores) {
        const lista = separarListaCAS(vector);
        assert.equal(lista?.length, caso.matriz.length);
        const residuo = await cas(`Simplify((${literalMatriz(desplazada)})*(${literalMatriz(lista.map(v=>[v]))}))`);
        const componentes = separarListaCAS(residuo)?.map(separarListaCAS);
        assert.ok(componentes?.every(f => f?.length===1 && f[0]==='0'), `${caso.nombre}: residuo ${residuo}`);
        assert.ok(lista.some(v=>v!=='0'));
        comprobaciones.push({ lambda: grupo.valor, vector, residuo });
      }
    }
    // Revisar el CSV producido por el botón sin crear archivos de descarga.
    const csv = await pagina.evaluar(`(async () => {
      const crear = URL.createObjectURL, click = HTMLAnchorElement.prototype.click;
      let contenido;
      URL.createObjectURL = blob => { contenido = blob.text(); return 'blob:prueba'; };
      HTMLAnchorElement.prototype.click = function () {};
      try {
        Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Descargar CSV').click();
        return await contenido;
      } finally { URL.createObjectURL=crear; HTMLAnchorElement.prototype.click=click; }
    })()`);
    assert.match(csv, /p\(λ\) = det\(A − λI\)/);
    assert.match(csv, /eigenvector 1/);
    informe.casos.push({ nombre: caso.nombre, matriz: caso.matriz, ui, comprobaciones, csv });
    await pagina.cambiar('input[aria-label="A(1, 1)"]', '7');
    assert.equal(await pagina.evaluar(`document.querySelector('#propios-polinomio') === null`), true);
    console.log(`${caso.nombre}: polinomio, multiplicidad, eigenvectores y CSV aprobados`);
  }
  // Comprobar la presentación con el último resultado, en móvil y escritorio.
  await pagina.evaluar(`document.querySelector('button[type="submit"]').click()`);
  await pagina.esperar(`document.querySelector('#propios-polinomio')`,60000);
  for (const ancho of [320,390,1100,1440]) {
    await pagina.llamar('Emulation.setDeviceMetricsOverride', { width: ancho, height: 900, deviceScaleFactor: 1, mobile: false });
    assert.equal(await pagina.evaluar(`document.documentElement.scrollWidth <= innerWidth`),true);
  }
  informe.aprobado = true;
} finally {
  await writeFile(new URL(process.argv[4] ?? '../PRUEBAS_PROPIOS_DOCUMENTO.json', import.meta.url), JSON.stringify(informe,null,2)+'\n');
  await pagina.cerrar();
}
