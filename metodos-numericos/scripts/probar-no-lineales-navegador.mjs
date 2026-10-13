import assert from 'node:assert/strict';

// Usa un navegador de pruebas con depuración remota, no el perfil del usuario.
// node scripts/probar-no-lineales-navegador.mjs [URL de la app] [URL de depuración]
const appURL = process.argv[2] ?? 'http://127.0.0.1:5173/Proyecto_Aplicada_3_2026/';
const debugURL = process.argv[3] ?? 'http://127.0.0.1:9223';
const pausa = ms => new Promise(resolve => setTimeout(resolve, ms));

async function conectar(url) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let secuencia = 0;
  const pendientes = new Map();
  socket.addEventListener('message', evento => {
    const mensaje = JSON.parse(evento.data);
    const pendiente = pendientes.get(mensaje.id);
    if (!pendiente) return;
    pendientes.delete(mensaje.id);
    clearTimeout(pendiente.limite);
    mensaje.error ? pendiente.reject(new Error(mensaje.error.message)) : pendiente.resolve(mensaje.result);
  });
  return {
    llamar(metodo, parametros = {}) {
      return new Promise((resolve, reject) => {
        const id = ++secuencia;
        const limite = setTimeout(() => {
          pendientes.delete(id);
          reject(new Error(`Tiempo de espera agotado: ${metodo}`));
        }, 10000);
        pendientes.set(id, { resolve, reject, limite });
        socket.send(JSON.stringify({ id, method: metodo, params: parametros }));
      });
    },
    cerrar: () => socket.close(),
  };
}

const version = await (await fetch(`${debugURL}/json/version`)).json();
const navegador = await conectar(version.webSocketDebuggerUrl);
const { targetId } = await navegador.llamar('Target.createTarget', { url: appURL });
let pagina;
const resultados = [];
try {
  const objetivos = await (await fetch(`${debugURL}/json/list`)).json();
  pagina = await conectar(objetivos.find(t => t.id === targetId).webSocketDebuggerUrl);
  const evaluar = async expresion => {
    const salida = await pagina.llamar('Runtime.evaluate', {
      expression: expresion, returnByValue: true, awaitPromise: true,
    });
    if (salida.exceptionDetails) throw new Error(salida.exceptionDetails.exception?.description ?? salida.exceptionDetails.text);
    return salida.result.value;
  };
  const esperar = async expresion => {
    for (let i = 0; i < 100; i++) {
      if (await evaluar(`Boolean(${expresion})`)) return;
      await pausa(50);
    }
    throw new Error(`No se encontró: ${expresion}`);
  };
  const cambiar = async (selector, valor) => {
    await evaluar(`(() => {
      const campo = document.querySelector(${JSON.stringify(selector)});
      if (!campo) throw new Error('Campo no encontrado');
      const prototipo = campo instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototipo, 'value').set.call(campo, ${JSON.stringify(String(valor))});
      campo.dispatchEvent(new Event('input', { bubbles: true }));
      campo.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await pausa(30);
  };
  const seleccionar = async nombre => {
    for (const menu of ['Aplicada 3', 'Unidad 5']) {
      await evaluar(`(() => {
        const enlace = Array.from(document.querySelectorAll('a')).find(a => a.textContent.trim() === ${JSON.stringify(menu)});
        if (!enlace) throw new Error('Menú no encontrado');
        if (enlace.getAttribute('aria-expanded') !== 'true') enlace.click();
      })()`);
      await pausa(50);
    }
    await evaluar(`Array.from(document.querySelectorAll('a')).find(a => a.textContent.trim() === ${JSON.stringify(nombre)}).click()`);
    await pausa(100);
  };
  const calcular = async () => {
    await evaluar(`document.querySelector('.bisection-form button[type="submit"]').click()`);
    await esperar(`document.querySelector('.bisection-table-wrapper tbody') || document.querySelector('.bisection-error')`);
  };
  const leer = () => evaluar(`(() => {
    const filas = Array.from(document.querySelectorAll('.bisection-table-wrapper tbody tr'));
    return {
      utilizado: document.querySelector('[data-testid$="-vector-utilizado"]').textContent.trim(),
      primera: filas[0] ? Array.from(filas[0].cells).map(c => Number(c.textContent)) : null,
      ultima: filas.at(-1) ? Array.from(filas.at(-1).cells).map(c => Number(c.textContent)) : null,
      iteraciones: filas.length,
      error: document.querySelector('.bisection-error')?.textContent ?? null,
      csvDeshabilitado: Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Descargar CSV').disabled,
    };
  })()`);
  const cerca = (actual, esperado) => assert.ok(Math.abs(actual - esperado) < 6e-6, `${actual} ≈ ${esperado}`);
  await esperar(`Array.from(document.querySelectorAll('a')).some(a => a.textContent.trim() === 'Aplicada 3')`);
  for (const [nombre, prefijo, letra, vectores] of [
    ['Punto Fijo No Lineal', 'punto-fijo', 'G', [[0.1, 0.25], [1, 2], [-1.5, 0.25], [0, 3]]],
    ['Newton No Lineal', 'newton', 'F', [[0.1, 0.5], [0.2, 0.4], [-0.1, 0.5], [0.4, 0.2]]],
  ]) {
    await seleccionar(nombre);
    for (const [sistema, puntos] of [
      ['trigonométrico', vectores],
      ['varias raíces', letra === 'G'
        ? [[0.2, 0.4], [-0.2, -0.4], [0.6, -0.7], [-1.1, 1.1]]
        : [[1, 2], [-1.5, 0.25], [3, -4], [-0.5, -2]]],
    ]) {
      if (sistema === 'varias raíces') {
        for (const [i, variable] of ['x', 'y'].entries()) {
          await cambiar(`input[placeholder="Función ${letra}${i + 1}"]`, letra === 'G'
            ? `1.5*${variable}-0.5*${variable}^3` : `${variable}^2-${i ? 9 : 4}`);
        }
      }
      await cambiar('form input[type="number"][step="any"]:not([id])', '1e-8');
      await cambiar('form input[type="number"]:not([step]):not([id])', 100);
      for (const inicial of puntos) {
        for (let i = 0; i < inicial.length; i++) await cambiar(`#${prefijo}-inicial-${i}`, inicial[i]);
        assert.equal((await leer()).csvDeshabilitado, true, 'Cambiar puntos debe limpiar los resultados');
        await calcular();
        const salida = await leer();
        assert.equal(salida.error, null);
        assert.equal(salida.utilizado, `X₀ = (${inicial.join(', ')})`);
        assert.equal(salida.csvDeshabilitado, false);
        const [x, y] = inicial;
        let primera;
        if (sistema === 'varias raíces') {
          primera = letra === 'G'
            ? inicial.map(v => 1.5 * v - 0.5 * v ** 3)
            : [(x + 4 / x) / 2, (y + 9 / y) / 2];
          salida.ultima.slice(1, 3).forEach((v, i) => cerca(v, Math.sign(inicial[i]) * (letra === 'G' ? 1 : i ? 3 : 2)));
        } else if (letra === 'G') {
          primera = [y / Math.sqrt(5), (Math.sin(x) + 2 * Math.cos(y)) / 4];
        } else {
          const f1 = 5 * x * x - y * y, f2 = y - 0.25 * (Math.sin(x) + Math.cos(y));
          const a = 10 * x, b = -2 * y, c = -0.25 * Math.cos(x), d = 1 + 0.25 * Math.sin(y);
          const det = a * d - b * c;
          primera = [x + (-f1 * d + b * f2) / det, y + (c * f1 - a * f2) / det];
        }
        primera.forEach((v, i) => cerca(salida.primera[i + 1], v));
        resultados.push({ metodo: nombre, sistema, inicial, primera: salida.primera.slice(1, 3),
          solucion: salida.ultima.slice(1, 3), iteraciones: salida.iteraciones });
      }
    }
    // Verificar en el DOM que una entrada inválida no reutiliza la última tabla.
    await cambiar('input[placeholder="Ej: x,y,z,w,v,u"]', 'x,x');
    await calcular();
    const salida = await leer();
    assert.match(salida.error, /variables deben ser distintas/);
    assert.equal(salida.csvDeshabilitado, true);
    assert.equal(salida.primera, null);
  }
  console.log(JSON.stringify({ url: appURL, casosAprobados: resultados.length,
    validacionesDuplicadas: 2, resultados }, null, 2));
} finally {
  pagina?.cerrar();
  await navegador.llamar('Target.closeTarget', { targetId });
  navegador.cerrar();
}
