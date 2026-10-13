const pausa = ms => new Promise(resolve => setTimeout(resolve, ms));

async function conectar(url) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let id = 0;
  const pendientes = new Map();
  const eventos = new Map();
  socket.addEventListener('message', evento => {
    const mensaje = JSON.parse(evento.data);
    if (mensaje.method) eventos.get(mensaje.method)?.forEach(fn => fn(mensaje.params));
    const pendiente = pendientes.get(mensaje.id);
    if (!pendiente) return;
    pendientes.delete(mensaje.id);
    clearTimeout(pendiente.limite);
    mensaje.error ? pendiente.reject(new Error(mensaje.error.message)) : pendiente.resolve(mensaje.result);
  });
  return {
    llamar(method, params = {}, timeout = 10000) {
      return new Promise((resolve, reject) => {
        const numero = ++id;
        const limite = setTimeout(() => {
          pendientes.delete(numero);
          reject(new Error(`Tiempo de espera agotado: ${method}`));
        }, timeout);
        pendientes.set(numero, { resolve, reject, limite });
        socket.send(JSON.stringify({ id: numero, method, params }));
      });
    },
    escuchar(method, fn) { eventos.set(method, [...(eventos.get(method) ?? []), fn]); },
    cerrar() { socket.close(); },
  };
}

export async function abrirPagina(appURL, debugURL = 'http://127.0.0.1:9223') {
  const version = await (await fetch(`${debugURL}/json/version`)).json();
  const navegador = await conectar(version.webSocketDebuggerUrl);
  const { targetId } = await navegador.llamar('Target.createTarget', { url: appURL });
  const objetivos = await (await fetch(`${debugURL}/json/list`)).json();
  const pagina = await conectar(objetivos.find(t => t.id === targetId).webSocketDebuggerUrl);
  const evaluar = async (expression, timeout = 10000) => {
    const salida = await pagina.llamar('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, timeout);
    if (salida.exceptionDetails) throw new Error(salida.exceptionDetails.exception?.description ?? salida.exceptionDetails.text);
    return salida.result.value;
  };
  return {
    evaluar,
    escuchar: pagina.escuchar,
    llamar: pagina.llamar,
    async esperar(expression, timeout = 10000) {
      const inicio = Date.now();
      while (Date.now() - inicio < timeout) {
        if (await evaluar(`Boolean(${expression})`)) return;
        await pausa(100);
      }
      throw new Error(`No se encontró: ${expression}`);
    },
    async cambiar(selector, valor) {
      await evaluar(`(() => {
        const campo = document.querySelector(${JSON.stringify(selector)});
        if (!campo) throw new Error('Campo no encontrado: ' + ${JSON.stringify(selector)});
        const prototipo = campo instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(prototipo, 'value').set.call(campo, ${JSON.stringify(String(valor))});
        campo.dispatchEvent(new Event('input', { bubbles: true }));
        campo.dispatchEvent(new Event('change', { bubbles: true }));
      })()`);
      await pausa(30);
    },
    async seleccionar(unidad, nombre) {
      for (const texto of ['Aplicada 3', unidad]) {
        await evaluar(`(() => {
          const enlace = Array.from(document.querySelectorAll('a')).find(a => a.textContent.trim() === ${JSON.stringify(texto)});
          if (!enlace) throw new Error('Menú no encontrado');
          if (enlace.getAttribute('aria-expanded') !== 'true') enlace.click();
        })()`);
        await pausa(50);
      }
      await evaluar(`Array.from(document.querySelectorAll('a')).find(a => a.textContent.trim() === ${JSON.stringify(nombre)}).click()`);
      await pausa(100);
    },
    async cerrar() {
      pagina.cerrar();
      await navegador.llamar('Target.closeTarget', { targetId });
      navegador.cerrar();
    },
  };
}
