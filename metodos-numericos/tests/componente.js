import { readFile } from 'node:fs/promises';
import { transformWithOxc } from 'vite';
import { create, all } from 'mathjs';

// Ejecuta los manejadores reales del componente sin un DOM ni dependencias nuevas.
// Esta prueba complementa la compilación; no sustituye una prueba en navegador.
export async function cargarComponente(nombre, dependencias = {}) {
  const fuente = await readFile(new URL(`../src/metodos/${nombre}.jsx`, import.meta.url), 'utf8');
  const { code } = await transformWithOxc(fuente, `${nombre}.jsx`, {
    jsx: { runtime: 'classic', pragma: 'elemento', pragmaFrag: 'fragmento' },
  });
  const funcion = code.match(/export default function (\w+)/)[1];
  const codigo = code.replace(/^import[\s\S]*?;\r?\n/gm, '')
    .replace('export default function', 'function');
  const estados = [];
  const referencias = [];
  let indiceReferencia = 0;
  let indice = 0;
  let arbol;
  let descarga;
  const entorno = {
    create, all,
    ...dependencias,
    useState(inicial) {
      const posicion = indice++;
      if (!(posicion in estados)) estados[posicion] = typeof inicial === 'function' ? inicial() : inicial;
      return [estados[posicion], (valor) => {
        estados[posicion] = typeof valor === 'function' ? valor(estados[posicion]) : valor;
      }];
    },
    useMemo: (calcular) => calcular(),
    // Las pruebas ejecutan el cálculo y su renderizado, sin los efectos de las gráficas.
    useEffect() {},
    useRef: (inicial) => {
      const posicion = indiceReferencia++;
      if (!(posicion in referencias)) referencias[posicion] = { current: inicial };
      return referencias[posicion];
    },
    elemento(tipo, props, ...hijos) {
      if (typeof tipo === 'function') return tipo({ ...props, children: hijos });
      return { tipo, props: props ?? {}, hijos: hijos.flat(Infinity) };
    },
    fragmento: 'fragmento',
    URL: { createObjectURL(blob) { descarga = blob; return 'blob:prueba'; }, revokeObjectURL() {} },
    document: { createElement: () => ({ click() {} }) },
  };
  const componente = new Function(...Object.keys(entorno), `${codigo}\nreturn ${funcion};`)(...Object.values(entorno));
  const renderizar = () => { indice = 0; indiceReferencia = 0; arbol = componente(); return arbol; };
  const buscar = (predicado) => {
    const encontrados = [];
    const visitar = (nodo) => {
      if (!nodo || typeof nodo !== 'object') return;
      if (predicado(nodo)) encontrados.push(nodo);
      nodo.hijos?.forEach(visitar);
    };
    visitar(arbol);
    return encontrados;
  };
  renderizar();
  return {
    renderizar, buscar,
    estados: () => estados,
    descarga: () => descarga?.text(),
    cambiar(nodo, valor) { nodo.props.onChange({ target: { value: String(valor) } }); renderizar(); },
    calcular() {
      const pendiente = buscar((nodo) => nodo.tipo === 'form')[0].props.onSubmit({ preventDefault() {} });
      renderizar();
      return pendiente?.then(() => renderizar());
    },
  };
}

export const texto = (nodo) => typeof nodo === 'object' && nodo !== null
  ? (nodo.hijos ?? []).map(texto).join('') : String(nodo ?? '');
