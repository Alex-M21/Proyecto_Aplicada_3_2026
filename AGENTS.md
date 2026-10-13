# Contexto para agentes de IA

Antes de modificar este proyecto, leer [CONTEXTO_IA.md](CONTEXTO_IA.md).
Ese archivo registra las decisiones del usuario, cambios realizados, verificaciones
y diferencias pendientes frente a las referencias.

## Estructura y ejecución

- La aplicación React/Vite está en `metodos-numericos/`.
- Ejecutar `npm run dev`, `npm test` y `npm run build` desde esa carpeta.
- `index.html` y `assets/` en la raíz son una copia estática de producción;
  `metodos-numericos/dist/` es la salida de compilación, no el código fuente.
- Conservar los cambios locales y archivos sin seguimiento existentes. Revisar
  `git status` antes de editar; no asumir que todo archivo pendiente pertenece
  a la tarea nueva.

## Decisiones que deben conservarse

- Las capturas aportadas por el usuario son referencias definitivas. Verificar
  cada método por separado: no imponer error absoluto o relativo a todos.
- Para Müller, el usuario aclaró que se compara la raíz final, sin exigir el
  mismo número de filas que la captura. Contrastar las raíces con GeoGebra CAS.
- Los dos métodos no lineales deben utilizar cada valor inicial ingresado,
  rechazar variables repetidas y reiniciar resultados cuando cambian sus datos.
- La unidad 6 calcula eigenvalores y eigenvectores únicamente mediante GeoGebra
  CAS y muestra su escala original. Ahora admite tamaño NxN y entradas complejas;
  no restaurar el límite 2×2–4×4. Mantener las instrucciones de uso visibles.
- Las verificaciones de unidades 5 y 6 deben incluir CAS real en navegador.
  Conservar las pruebas simuladas como complemento, no como única evidencia.
- Las diferencias de redondeo pendientes están documentadas. Una regla que
  reproduce una captura no prueba por sí sola cómo funciona su hoja original.

## Verificación y mantenimiento

- Usar pruebas de regresión pertinentes al cambio. El ejecutor de componentes
  de `tests/componente.js` no sustituye las pruebas en un navegador.
- Si la máquina tiene poca memoria, usar
  `node --test --test-concurrency=1 tests/*.test.js` desde `metodos-numericos/`.
- Cuando se actualice la copia estática, compilar primero y copiar su `index.html`
  y los recursos necesarios desde `dist/` a la raíz. Comprobar las rutas de los
  recursos y distinguir esta actualización local de una publicación remota.
- Al completar cambios relevantes, actualizar `CONTEXTO_IA.md` y los informes
  afectados con el estado real, incluyendo limitaciones y verificaciones hechas.
