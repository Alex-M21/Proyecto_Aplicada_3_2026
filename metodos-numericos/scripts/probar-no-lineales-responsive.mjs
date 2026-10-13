import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { abrirPagina } from './navegador-cdp.mjs';

const url = process.argv[2] ?? 'http://127.0.0.1:4173/Proyecto_Aplicada_3_2026/';
const pagina = await abrirPagina(url, process.argv[3]);
const estilosCompartidos = await readFile(new URL('../src/metodos/Biseccion.css', import.meta.url), 'utf8');
const informe = { fecha: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guatemala' }).format(new Date()),
  url, aprobado: false, casos: [], capturas: [] };

// Clic y teclado reales: comprobar que el campo es accesible, además de su valor.
async function escribir(selector, valor) {
  const punto = await pagina.evaluar(`(() => {
    const campo = document.querySelector(${JSON.stringify(selector)});
    campo.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
    const r = campo.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  })()`);
  await pagina.llamar('Input.dispatchMouseEvent', { type: 'mousePressed', ...punto, button: 'left', clickCount: 1 });
  await pagina.llamar('Input.dispatchMouseEvent', { type: 'mouseReleased', ...punto, button: 'left', clickCount: 1 });
  assert.equal(await pagina.evaluar(`document.activeElement === document.querySelector(${JSON.stringify(selector)})`), true);
  await pagina.llamar('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, modifiers: 2 });
  await pagina.llamar('Input.dispatchKeyEvent', { type: 'keyUp', key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, modifiers: 2 });
  await pagina.llamar('Input.insertText', { text: valor });
  assert.equal(await pagina.evaluar(`document.querySelector(${JSON.stringify(selector)}).value`), valor);
}

try {
  await pagina.esperar('document.querySelector("#root h1")');
  for (const [nombre, prefijo] of [['Punto Fijo No Lineal', 'punto-fijo'], ['Newton No Lineal', 'newton']]) {
    await pagina.seleccionar('Unidad 5', nombre);
    for (const dimension of [2, 6]) {
      for (const ancho of [320, 390, 640, 768, 900, 1024, 1100, 1280, 1440, 1920]) {
        await pagina.llamar('Emulation.setDeviceMetricsOverride', { width: ancho, height: 900, deviceScaleFactor: 1, mobile: ancho <= 640 });
        await pagina.cambiar('.sistemas-no-lineales select', dimension);
        const medidas = await pagina.evaluar(`(() => {
          const grid = document.querySelector('.sistemas-no-lineales');
          const campos = Array.from(grid.querySelectorAll('.bisection-form input, .bisection-form select'));
          return { viewport: innerWidth, pagina: document.documentElement.scrollWidth,
            columnas: getComputedStyle(grid).gridTemplateColumns,
            campos: campos.map(n => { const r = n.getBoundingClientRect();
              return { ancho: r.width, alto: r.height, izquierda: r.left, derecha: r.right }; }) };
        })()`);
        assert.ok(medidas.pagina <= medidas.viewport, `${nombre} ${ancho}: desbordamiento de página`);
        for (const campo of medidas.campos) {
          assert.ok(campo.ancho >= 150 && campo.alto >= 44, `${nombre} ${ancho}: campo demasiado pequeño`);
          assert.ok(campo.izquierda >= 0 && campo.derecha <= medidas.viewport, `${nombre} ${ancho}: campo fuera de pantalla`);
        }
        await escribir(`#${prefijo}-inicial-0`, '0.2');
        await escribir('.method-two-columns > :nth-child(1) input', '0.000001');
        await escribir('.method-two-columns > :nth-child(2) input', '100');
        await escribir('.method-two-columns > :nth-child(3) input', '7');
        await pagina.evaluar(`document.querySelector('.sistemas-no-lineales button[type="submit"]').click()`);
        await pagina.esperar('document.querySelector(".sistemas-no-lineales .bisection-message")');
        const salida = await pagina.evaluar(`(() => {
          const grid = document.querySelector('.sistemas-no-lineales');
          return { error: grid.querySelector('.bisection-error')?.textContent ?? null,
            mensaje: grid.querySelector('.bisection-message').textContent,
            vector: grid.querySelector('[data-testid="${prefijo}-vector-utilizado"]').textContent,
            filas: grid.querySelectorAll('.bisection-table tbody tr').length,
            pagina: document.documentElement.scrollWidth };
        })()`);
        assert.equal(salida.error, null);
        assert.match(salida.mensaje, /Se encontró la solución/);
        assert.match(salida.vector, /X₀ = \(0\.2,/);
        assert.ok(salida.filas > 0);
        assert.ok(salida.pagina <= medidas.viewport, `${nombre} ${ancho}: los resultados desbordan la página`);
        const camposDespues = await pagina.evaluar(`Array.from(document.querySelectorAll('.sistemas-no-lineales .bisection-form input, .sistemas-no-lineales .bisection-form select')).map(n => {
          const r = n.getBoundingClientRect();
          return { ancho: r.width, alto: r.height, izquierda: r.left, derecha: r.right };
        })`);
        assert.equal(camposDespues.length, medidas.campos.length);
        camposDespues.forEach((campo, i) => {
          assert.ok(campo.ancho >= 150 && campo.alto >= 44, `${nombre} ${ancho}: CALCULAR comprime un campo`);
          assert.ok(Math.abs(campo.ancho - medidas.campos[i].ancho) <= 1, `${nombre} ${ancho}: CALCULAR cambia el ancho del campo ${i}`);
          assert.ok(Math.abs(campo.izquierda - medidas.campos[i].izquierda) <= 1, `${nombre} ${ancho}: CALCULAR desplaza el campo ${i}`);
        });
        // Simular una recarga de la hoja compartida en una pestaña ya abierta.
        await pagina.evaluar(`(() => {
          const estilo = document.createElement('style');
          estilo.dataset.pruebaResponsive = 'orden-estilos';
          estilo.textContent = ${JSON.stringify(estilosCompartidos)};
          document.head.append(estilo);
        })()`);
        const camposEstilosRecargados = await pagina.evaluar(`Array.from(document.querySelectorAll('.sistemas-no-lineales .bisection-form input, .sistemas-no-lineales .bisection-form select')).map(n => {
          const r = n.getBoundingClientRect();
          return { ancho: r.width, izquierda: r.left };
        })`);
        camposEstilosRecargados.forEach((campo, i) => {
          assert.ok(Math.abs(campo.ancho - camposDespues[i].ancho) <= 1, `${nombre} ${ancho}: la recarga de estilos comprime el campo ${i}`);
          assert.ok(Math.abs(campo.izquierda - camposDespues[i].izquierda) <= 1, `${nombre} ${ancho}: la recarga de estilos desplaza el campo ${i}`);
        });
        const caso = { nombre, dimension, ancho, medidas, camposDespues, camposEstilosRecargados, salida };
        informe.casos.push(caso);
        if (dimension === 2 && [390, 1100].includes(ancho)) {
          const clip = await pagina.evaluar(`(() => {
            const r = document.querySelector('.sistemas-no-lineales').getBoundingClientRect();
            return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: Math.min(r.height, 1800), scale: 1 };
          })()`);
          const captura = await pagina.llamar('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip });
          const ruta = join(tmpdir(), `aplicada3-responsive-${prefijo}-${ancho}.png`);
          await writeFile(ruta, Buffer.from(captura.data, 'base64'));
          informe.capturas.push(ruta);
        }
        // Volver a escribir con resultados presentes y recalcular sin cambiar de método.
        await escribir(`#${prefijo}-inicial-0`, '0.3');
        await pagina.esperar('!document.querySelector(".sistemas-no-lineales .bisection-table tbody tr")');
        await pagina.evaluar(`document.querySelector('.sistemas-no-lineales button[type="submit"]').click()`);
        await pagina.esperar('document.querySelector(".sistemas-no-lineales .bisection-message")');
        caso.vectorRecalculado = await pagina.evaluar(`document.querySelector('[data-testid="${prefijo}-vector-utilizado"]').textContent`);
        assert.match(caso.vectorRecalculado, /X₀ = \(0\.3,/);
        await pagina.evaluar(`document.querySelector('style[data-prueba-responsive="orden-estilos"]').remove()`);
      }
    }
    console.log(`${nombre}: 20 combinaciones de ancho y tamaño aprobadas`);
  }
  informe.aprobado = true;
  console.log(JSON.stringify({ casos: informe.casos.length, capturas: informe.capturas }));
} finally {
  await writeFile(new URL(process.argv[4] ?? '../PRUEBAS_RESPONSIVE_NO_LINEALES.json', import.meta.url), JSON.stringify(informe, null, 2) + '\n');
  await pagina.cerrar();
}
