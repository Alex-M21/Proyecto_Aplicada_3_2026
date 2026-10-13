import { abrirPagina } from './navegador-cdp.mjs';
const pagina = await abrirPagina(process.argv[2] ?? 'http://localhost:5174/Proyecto_Aplicada_3_2026/');
try {
  await pagina.llamar('Network.enable');
  pagina.escuchar('Network.loadingFailed', e => console.error('Carga fallida:', e.errorText));
  await pagina.esperar('document.querySelector("#root h1")');
  console.log('Cargando el motor real de GeoGebra…');
  await pagina.evaluar(`(async () => {
    window.casModulo = await import('/Proyecto_Aplicada_3_2026/src/utils/propiosCAS.js');
    window.motorCAS = await window.casModulo.obtenerMotorCAS();
    return true;
  })()`, 60000);
  console.log('Motor listo');
  for (const comando of process.argv.slice(3).length ? process.argv.slice(3) : [
    'Eigenvalues({{2,-1},{-1,2}})', 'Eigenvectors({{2,-1},{-1,2}})',
    'Eigenvalues({{7}})', 'Eigenvectors({{7}})',
    'Eigenvalues({{2,1},{0,2}})', 'Eigenvectors({{2,1},{0,2}})',
  ]) {
    const salida = await pagina.evaluar(`window.motorCAS.evalCommandCAS(${JSON.stringify(comando)})`, 60000);
    console.log(JSON.stringify({ comando, salida }));
  }
} finally { await pagina.cerrar(); }
