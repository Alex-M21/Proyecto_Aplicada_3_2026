import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { abrirPagina } from './navegador-cdp.mjs';

const url = process.argv[2] ?? 'http://localhost:5173/Proyecto_Aplicada_3_2026/';
const pagina = await abrirPagina(url, process.argv[3]);
const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
const metodos = Array.from(app.matchAll(/name: "([^"]+)",\s+course: "[^"]+",\s+unit: "(Unidad [^"]+)"/g),
  m => ({ nombre: m[1], unidad: m[2] }));
const informe = { fecha: '2026-10-13', url, aprobado: false, casos: [], capturas: [] };

async function medir() {
  return pagina.evaluar(`(() => {
    const tarjeta = document.querySelector('.bisection-form');
    const formulario = tarjeta.querySelector('form');
    const r = tarjeta.getBoundingClientRect();
    const estilo = getComputedStyle(tarjeta), estiloForm = getComputedStyle(formulario);
    return { viewport: innerWidth, pagina: document.documentElement.scrollWidth,
      tarjeta: { ancho: r.width, izquierda: r.left, derecha: r.right },
      padding: [parseFloat(estilo.paddingLeft), parseFloat(estilo.paddingRight)],
      bordeInterior: parseFloat(estiloForm.borderLeftWidth),
      campos: Array.from(formulario.querySelectorAll('input, select')).filter(n => !n.closest('table')).map(n => {
        const campo = n.getBoundingClientRect();
        return { ancho: campo.width, margenIzquierdo: campo.left - r.left,
          margenDerecho: r.right - campo.right };
      }),
      filas: document.querySelectorAll('.bisection-results tbody tr').length,
      error: tarjeta.querySelector('.bisection-error')?.textContent ?? null };
  })()`);
}

function comprobar(medidas, nombre, ancho) {
  assert.ok(medidas.pagina <= medidas.viewport, `${nombre} ${ancho}: desbordamiento de página`);
  assert.ok(medidas.padding.every(p => p >= 16), `${nombre} ${ancho}: falta espacio interior`);
  assert.equal(medidas.padding[0], medidas.padding[1], `${nombre} ${ancho}: márgenes asimétricos`);
  assert.equal(medidas.bordeInterior, 0, `${nombre} ${ancho}: borde sin padding en el formulario interior`);
  for (const campo of medidas.campos) {
    assert.ok(campo.margenIzquierdo >= 16 && campo.margenDerecho >= 16, `${nombre} ${ancho}: campo pegado al borde`);
    assert.ok(campo.ancho >= 100, `${nombre} ${ancho}: campo comprimido`);
  }
}

try {
  await pagina.esperar('document.querySelector("#root h1")');
  assert.equal(metodos.length, 17);
  for (const { nombre, unidad } of metodos) {
    for (const ancho of [320, 390, 768, 1100, 1440, 1920]) {
      await pagina.llamar('Emulation.setDeviceMetricsOverride', { width: ancho, height: 900, deviceScaleFactor: 1, mobile: false });
      // Montar una instancia nueva: cada caso comienza sin tabla de resultados.
      await pagina.seleccionar('Unidad 5', nombre === 'Newton No Lineal' ? 'Punto Fijo No Lineal' : 'Newton No Lineal');
      await pagina.seleccionar(unidad, nombre);
      const antes = await medir();
      assert.equal(antes.filas, 0, `${nombre} ${ancho}: la prueba debe comenzar sin resultados`);
      comprobar(antes, nombre, ancho);
      await pagina.evaluar(`document.querySelector('.bisection-form button[type="submit"]').click()`);
      await pagina.esperar(`document.querySelector('.bisection-results tbody tr') ||
        document.querySelector('.bisection-results .propios-cas-fila') ||
        document.querySelector('.bisection-form .bisection-error')`, 60000);
      const despues = await medir();
      comprobar(despues, nombre, ancho);
      assert.equal(despues.error, null, `${nombre} ${ancho}: ${despues.error}`);
      assert.ok(Math.abs(antes.tarjeta.ancho - despues.tarjeta.ancho) <= 1, `${nombre} ${ancho}: CALCULAR estrecha la tarjeta`);
      assert.ok(Math.abs(antes.tarjeta.izquierda - despues.tarjeta.izquierda) <= 1, `${nombre} ${ancho}: CALCULAR desplaza la tarjeta`);
      antes.campos.forEach((campo, i) => assert.ok(Math.abs(campo.ancho - despues.campos[i].ancho) <= 1,
        `${nombre} ${ancho}: CALCULAR estrecha el campo ${i}`));
      informe.casos.push({ nombre, unidad, ancho, antes, despues });
      if (['Bisección', 'Punto Fijo No Lineal'].includes(nombre) && [390, 1440].includes(ancho)) {
        const clip = await pagina.evaluar(`(() => {
          const r = document.querySelector('.bisection-form').getBoundingClientRect();
          return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: Math.min(r.height, 1200), scale: 1 };
        })()`);
        const captura = await pagina.llamar('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip });
        const ruta = join(tmpdir(), `aplicada3-margenes-${unidad.replaceAll(' ', '-')}-${ancho}.png`);
        await writeFile(ruta, Buffer.from(captura.data, 'base64'));
        informe.capturas.push(ruta);
      }
    }
    console.log(`${nombre}: márgenes estables en seis anchos antes y después de calcular`);
  }
  informe.aprobado = true;
  console.log(JSON.stringify({ metodos: metodos.length, casos: informe.casos.length, capturas: informe.capturas }));
} finally {
  await writeFile(new URL(process.argv[4] ?? '../PRUEBAS_MARGENES_METODOS.json', import.meta.url), JSON.stringify(informe, null, 2) + '\n');
  await pagina.cerrar();
}
