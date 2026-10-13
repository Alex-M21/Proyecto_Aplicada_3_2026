# Verificación con GeoGebra CAS real

## Polinomio y referencia del PDF: 13 de octubre de 2026

La unidad 6 muestra `det(A − λI)`, su desarrollo y factorización, multiplicidades
y eigenvectores independientes. Se añadieron los dos casos del PDF del usuario
y se corrigió la traducción de `i` a la unidad imaginaria de CAS. Cuando el
comando directo de vectores falla, se resuelve el núcleo con CAS y se comprueba
cada vector, conservando la escala original cuando el comando directo responde.

Pasaron siete casos específicos, con los dos ejemplos del PDF y cinco casos
complejos, tanto en desarrollo como en la copia estática. También pasaron los
42 casos generales en ambas versiones, incluyendo comparación de los polinomios
y factorizaciones de las 18 matrices. La suite completa aprobó 80 pruebas.
Informe y registros: [REFERENCIA_PROPIOS_PDF.md](REFERENCIA_PROPIOS_PDF.md).
La copia estática está actualizada; no hubo publicación remota.

## Verificación tras corregir los márgenes compartidos: 13 de octubre de 2026

Los 42 casos pasaron sobre la copia estática final: 18 matrices, 22 sistemas
no lineales y dos ejercicios de Müller. Registro:
[PRUEBAS_CAS_MARGENES_2026-10-13.json](PRUEBAS_CAS_MARGENES_2026-10-13.json).
Se verificaron además los márgenes antes y después de calcular en los 17 métodos
y seis anchos, con 102 escenarios tanto en desarrollo como en la copia estática.
Detalle: [PRUEBAS_MARGENES_METODOS.md](PRUEBAS_MARGENES_METODOS.md).
La suite completa aprobó 77 pruebas. No hubo publicación remota.

## Verificación tras corregir el orden de estilos: 13 de octubre de 2026

Pasaron los 42 casos con CAS real sobre la compilación final con los estilos
de los métodos no lineales protegidos frente a recargas de la hoja compartida.
Registro: [PRUEBAS_CAS_ORDEN_ESTILOS_2026-10-13.json](PRUEBAS_CAS_ORDEN_ESTILOS_2026-10-13.json).
Los algoritmos no cambiaron. También pasaron 40 escenarios de interacción con
cálculo, recarga de estilos, edición y recálculo, tanto en la dirección de
desarrollo confirmada por el usuario como en la copia estática actualizada.
No hubo publicación remota.

## Verificación tras la corrección responsive: 13 de octubre de 2026

Los **42 casos** pasaron nuevamente en Chromium sobre la copia estática final
con el formulario responsive: 18 matrices, 22 sistemas no lineales y dos
ejercicios de Müller. Registro independiente:
[PRUEBAS_CAS_RESPONSIVE_2026-10-13.json](PRUEBAS_CAS_RESPONSIVE_2026-10-13.json).
Los cambios afectan distribución de controles y gráficas; los motores y los
criterios numéricos se conservan. También pasaron 40 casos de interacción real
en distintos anchos, descritos en [PRUEBAS_NO_LINEALES.md](PRUEBAS_NO_LINEALES.md).
La compilación pasó y la copia estática local está actualizada. No hubo publicación remota.

## Verificación tras reducir el texto: 13 de octubre de 2026

La unidad 6 conserva una indicación breve de entrada y sus resultados. Se
eliminaron las explicaciones extensas, los comandos en títulos y la guía
«Repetir un ejemplo en GeoGebra» con sus enlaces. Los métodos no lineales
también dejaron de mostrar las notas de errores, decimales y comparación con CAS.
Se mantienen los motores y criterios de cálculo existentes.

Pasaron nuevamente los **42 casos con CAS real en Chromium**, ejecutados sobre
la copia estática local actualizada: 18 matrices, 22 sistemas y dos ejercicios
de Müller. Registro independiente:
[PRUEBAS_CAS_INTERFAZ_2026-10-13.json](PRUEBAS_CAS_INTERFAZ_2026-10-13.json).
Se verificó además el DOM real de los tres módulos: las notas retiradas están
ausentes y los campos siguen disponibles. Pasaron 58 pruebas de regresión
pertinentes, compilación y ESLint de los componentes afectados.
No hubo publicación remota.

## Verificación anterior: 12 de octubre de 2026

Fecha: 12 de octubre de 2026. Motor: GeoGebra CAS 5.4.920.0, ejecutado en Chromium
con un perfil de pruebas independiente. Se usaron los formularios reales de la
aplicación y el motor descargado de GeoGebra; no respuestas simuladas.

Pasaron **42 casos** tanto en desarrollo como en la copia estática compilada:
18 matrices, 22 sistemas no lineales y dos ejercicios de Müller.

Los registros incluyen las entradas, comandos, salidas originales de CAS,
resultados de la aplicación y residuos:

- [Desarrollo](PRUEBAS_CAS_REALES.json).
- [Producción local](PRUEBAS_CAS_REALES_PRODUCCION.json).

## Unidad 6: matrices NxN

Se eliminó el límite de tamaños 2×2, 3×3 y 4×4. El usuario ingresa N, presiona
CREAR MATRIZ y completa sus N² celdas. Se admiten reales, complejos, fracciones
y raíces; las instrucciones muestran ejemplos de cada entrada.

| Tipo de prueba | Tamaños verificados |
| --- | --- |
| Escalar | 1×1 |
| Simétricas, generales, radicales y fracciones | 2×2 y 3×3 |
| Entradas complejas y eigenvalores complejos | 2×2 |
| Defectiva: valores disponibles, vectores `?` en CAS | 2×2 |
| Nula | 3×3 |
| General con bloques y valores de distinto signo | 4×4 |
| Diagonal, densa con valores repetidos y densa general | 5×5 |
| Mixta real/compleja y tridiagonal | 6×6 |
| Eigenvalores repetidos | 8×8 |
| Diagonal de orden mayor | 10×10 |

La aplicación devuelve las mismas expresiones, orden de eigenvalores y escala
de eigenvectores que las llamadas directas a los comandos oficiales
[Eigenvalues](https://geogebra.github.io/docs/manual/en/commands/Eigenvalues/) y
[Eigenvectors](https://geogebra.github.io/docs/manual/en/commands/Eigenvectors/).
Se verificó además `A·V − V·D`, con D formada por los eigenvalores en su orden.
Los residuos exactos fueron cero; para salidas numéricas se comprobó residuo
por componente menor que `1e-8`.

Por ejemplo, la matriz densa 5×5

```text
5   1  -1   2   0
1   4   2   0   1
-1  2   6   1  -2
2   0   1   7   1
0   1  -2   1   8
```

dio `{1.134485539071, 4.605279691072, 6.309842589879, 8.435780521027, 9.514611658952}`.
Sus eigenvectores también coincidieron con CAS y sus residuos fueron menores
que `1e-8`.

N es configurable, sin un máximo fijo impuesto por la interfaz. Esto no significa
recursos infinitos: el tiempo, memoria y disponibilidad de resultados dependen
del navegador y del propio CAS. Si GeoGebra no devuelve eigenvectores, se preserva
su salida y se informa; no se inventa una base mediante otro motor.

Se corrigió una falla encontrada durante estas pruebas: una segunda carga del
módulo CAS podía inyectar otro applet con el mismo identificador e invalidar la
primera API. El motor ahora comparte su promesa entre módulos/recargas. Se verificó
esa identidad y que la API anterior siguiera calculando `1+1 = 2`.

## Unidad 5: sistemas no lineales

Se compararon 22 ejecuciones de Punto Fijo No Lineal y Newton No Lineal, en tamaños
de 2×2 hasta 6×6, con varios puntos iniciales positivos, negativos y mixtos.
Se usó tolerancia `1e-10`, hasta 100 iteraciones y 12 decimales de presentación.

La solución se contrastó con
[NSolve](https://geogebra.github.io/docs/manual/en/commands/NSolve/) real, usando
las mismas ecuaciones y punto inicial. La diferencia por componente fue menor
que `2e-8`. También se sustituyó la solución de la aplicación en las ecuaciones
mediante `Substitute` y `Numeric`, comprobando residuos menores que `1e-8`.

| Método | Inicio | Solución de la aplicación | Solución de CAS |
| --- | --- | --- | --- |
| Punto fijo, ejemplo trigonométrico | `(0.1,0.25)` | `(0.221321638501,0.494890228677)` | `(0.2213216385308003,0.4948902286465060)` |
| Punto fijo, ejemplo trigonométrico | `(-1.5,0.25)` | `(0.221321638546,0.494890228630)` | `(0.2213216385308003,0.4948902286465060)` |
| Newton, ejemplo trigonométrico | `(0.1,0.5)` | `(0.121241911481,0.271105155792)` | `(0.1212419114805012,0.2711051557924140)` |
| Newton, ejemplo trigonométrico | `(-0.1,0.5)` | `(-0.098163444944,0.219500135801)` | `(-0.09816344494416995,0.2195001358007218)` |

Los registros completos incluyen los sistemas clásicos 3×3 y sistemas 4×4,
5×5 y 6×6 acoplados o cuadráticos. No fue necesario usar una comprobación CAS
con un punto inicial alternativo en estos 22 casos.

### Redondeo

Se conserva precisión completa durante las iteraciones y la comparación con la
tolerancia. El número de decimales cambia la presentación. Los valores no nulos
que se mostrarían como cero se escriben en notación científica; se evita `-0`.
Las pruebas confirman que usar 0, 2 o 12 decimales no altera el cálculo.

Las capturas con tolerancias `0.01` o `0.0001` muestran aproximaciones menos
estrictas. Para comparar más dígitos con CAS se debe ajustar la tolerancia y
permitir suficientes iteraciones. No se redondeó el Jacobiano para forzar cifras
intermedias de una hoja distinta.

## Müller: comparar la raíz

Conforme a la aclaración del usuario, no se exige igual cantidad de filas que
las capturas. Se verificó pertenencia a las raíces de `CSolve` y el residuo del
polinomio en el CAS real.

| Caso | Raíz obtenida | Comprobación |
| --- | --- | --- |
| `x^3+3*x^2+4*x-12`, inicio `0,1,2` | `1.271998322935` | Coincide con CAS; residuo ≈ `6.08e-12` |
| `3*x^2-x+1`, inicio `1.5,2.1,2.5` | `0.166666666667-0.552770798393i` | Coincide con `1/6-sqrt(11)/6*i` y CAS; residuo menor que `1e-8` |

En el caso complejo, elegir el segundo denominador cuando ambos tienen igual
módulo fija la rama conjugada que aparece como resultado final de la referencia.
Se conserva el criterio de estabilidad de mayor módulo cuando no hay empate.

## Reproducción

El script es `scripts/probar-cas-real.mjs`, con el soporte de
`scripts/navegador-cdp.mjs`. Requiere Node 24, la aplicación servida y un navegador
de pruebas con depuración remota. No requiere instalar Playwright.

Con `npm run dev` en el puerto 5174, crear un perfil temporal independiente:

```powershell
$perfilCasPrueba = Join-Path $env:TEMP ('aplicada3-cas-' + [Guid]::NewGuid().ToString('N'))
Start-Process -FilePath 'C:\Program Files\Google\Chrome\Application\chrome.exe' -WindowStyle Hidden -ArgumentList @('--headless=new','--no-first-run','--no-default-browser-check','--remote-debugging-port=9223',('--user-data-dir=' + $perfilCasPrueba),'about:blank')
node scripts/probar-cas-real.mjs http://localhost:5174/Proyecto_Aplicada_3_2026/
```

Para la copia compilada servida en el puerto 4173:

```powershell
node scripts/probar-cas-real.mjs http://127.0.0.1:4173/Proyecto_Aplicada_3_2026/ http://127.0.0.1:9223 ../PRUEBAS_CAS_REALES_PRODUCCION.json
```

La prueba arranca GeoGebra mediante el formulario, llena las entradas reales y
comprueba sus resultados contra llamadas CAS independientes. Sus registros se
guardan incluso si una prueba falla. Un archivo parcial no debe presentarse como
una suite aprobada: comprobar los conteos y el código de salida del script.

La suite automatizada complementaria tiene 77 pruebas aprobadas, y la compilación
de producción pasó. ESLint no presenta errores en los archivos modificados;
Müller imaginario conserva advertencias de dependencias de funciones locales en
useMemo. El servidor de desarrollo continúa en el puerto 5174.
