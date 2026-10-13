# Contexto de la aplicación para futuras sesiones de IA

Última actualización: 13 de octubre de 2026, America/Guatemala.

## Proyecto y archivos importantes

Aplicación educativa de Matemática Aplicada 3, desarrollada con React 19,
mathjs y Vite. Los componentes de métodos están en
`metodos-numericos/src/metodos/`; el menú de unidades está en `src/App.jsx`.

La carpeta de trabajo para los comandos npm es `metodos-numericos/`.
La raíz tiene un `package.json` vacío y una copia estática `index.html` + `assets/`.
La compilación actual se genera en `metodos-numericos/dist/`, que está ignorada
por Git. La copia estática local se actualizó con los cambios descritos aquí.
Esto no implica que el sitio remoto esté actualizado.

## Referencias y criterio solicitado por el usuario

El usuario reportó diferencias entre errores absolutos y relativos y confirmó
que sus capturas son las referencias definitivas. La comparación debe hacerse
por método y por fila, usando las funciones, puntos iniciales, tolerancia y
decimales de cada imagen. No asumir que todos los métodos tienen que usar el
mismo criterio ni confundir diferencia de redondeo con error relativo.

Las capturas de métodos escalares reales y sistemas muestran diferencias
absolutas; en sistemas, el error global es el máximo de los errores por componente.
Bisección conserva la cota `(b-a)/2`. Lagrange, Neville y diferencias divididas
son interpolaciones y no presentan un error de convergencia iterativa.

Detalle y clasificación: [VERIFICACION_ERRORES.md](metodos-numericos/VERIFICACION_ERRORES.md).

## Cambios en raíces e interpolación

### Márgenes y ancho compartidos de los 17 métodos (13 de octubre)

La captura posterior del usuario aclaró un problema común de márgenes:
`App.css` aplicaba borde y sombra a `main form`, pero los formularios interiores
tenían padding cero. Sus controles quedaban pegados a ese borde adicional.
También se reprodujo en Bisección que mostrar la tabla reducía la tarjeta
de entrada de 466px a 395px a un ancho de ventana de 1440px.

- Se retiró el estilo de tarjeta de `main form` y del contenedor exterior
  `.bisection-grid`; cada tarjeta conserva sus propios bordes y espacio interior.
- `Biseccion.css` adapta las columnas al espacio disponible con mínimos de
  28rem y permite encoger los hijos. Los resultados tienen contención del ancho,
  por lo que tablas y gráficas ya no imponen un mínimo a la columna de entrada.
- Las tarjetas de entrada dejan 24px a izquierda y derecha en escritorio y
  16px en móvil. La barra de desplazamiento de la página reserva su espacio.
- Los parámetros y vectores compartidos se adaptan al ancho de su tarjeta,
  con las etiquetas encima de esos campos. Se eliminaron tres definiciones
  repetidas de los estilos de vectores. Las tablas conservan desplazamiento interno.
- Se verificaron los 17 métodos en Chromium, a 320, 390, 768, 1100, 1440 y
  1920px: 102 escenarios en desarrollo y otros 102 en la copia estática local.
  Cada caso comienza sin resultados y pulsa CALCULAR. Comprueba márgenes
  simétricos, ausencia del borde interior adicional y de desbordamiento de página,
  y que la tarjeta y sus campos no se estrechen o desplacen al calcular.
- Suite completa: 77 pruebas aprobadas; compilación y ESLint de los scripts y
  pruebas afectados aprobados. Se actualizó una prueba que aún exigía la guía
  extensa de unidad 6 retirada anteriormente por solicitud del usuario.
- Los 42 casos con CAS real pasaron sobre la compilación final:
  [PRUEBAS_CAS_MARGENES_2026-10-13.json](metodos-numericos/PRUEBAS_CAS_MARGENES_2026-10-13.json).

Informe y reproducción:
[PRUEBAS_MARGENES_METODOS.md](metodos-numericos/PRUEBAS_MARGENES_METODOS.md).
La copia estática se actualizó desde `dist/`; no hubo publicación remota.

- Newton-Raphson escalar conserva el redondeo intermedio de la referencia de
  Excel. Su ejemplo `1-cos(x)` / `sin(x)` reproduce las seis filas, incluyendo
  error cero final. No confundir este componente con Newton No Lineal.
- Posición Falsa I compara con la última aproximación desde la segunda fila;
  la primera comparación usa el extremo izquierdo. Posición Falsa II usa el
  extremo derecho en la primera fila. Por eso sus primeros errores son `0.7`
  y `0.3` en el ejemplo `x^5-7*x^2-1`, intervalo `[1,2]`.
- Posición Falsa I y II comparan la tolerancia con el cambio absoluto o permiten
  parada por una raíz exacta. Posición Falsa II guarda `errorRaw` y `fcRaw` para
  decidir la convergencia sin falsos positivos por valores mostrados redondeados.
- Las tablas y CSV pertinentes identifican el error absoluto; se agregó la
  explicación de las fórmulas.
- Diferencias divididas de Newton tiene variantes progresiva/regresiva y pruebas
  de coeficientes, ordenamiento de pares, tabla, reinicio y CSV.

Müller imaginario mantiene el módulo de la diferencia compleja `abs(p-x2)`.
El usuario aclaró que las filas extra de las capturas no importan: se compara la
raíz final. Se eligió el segundo denominador cuando ambos tienen igual módulo,
fijando la rama conjugada que coincide con la referencia. Para `3*x^2-x+1`,
inicio `1.5,2.1,2.5`, obtiene `1/6 - sqrt(11)/6*i`, verificada con CAS real.
Müller real obtiene `1.271998322935` para `x^3+3*x^2+4*x-12`, también verificado.
La diferencia entre módulo de la diferencia y diferencia de módulos de la
primera columna de error se conserva documentada; no se reemplazó el error por
un criterio que pueda dar cero para dos complejos distintos de igual módulo.
Las pruebas de referencia de Müller no exigen igual cantidad de iteraciones.

## Punto Fijo No Lineal y Newton No Lineal

Archivos: `PuntoFijoNoLineal.jsx` y `NewtonNoLineal.jsx`.

Corrección responsive del 13 de octubre de 2026:

- Ambos componentes usan `SistemasNoLineales.css` y la clase
  `sistemas-no-lineales`. Las columnas se adaptan al espacio real disponible
  junto al menú, con un mínimo de 28rem por tarjeta; se apilan si no caben.
- Las etiquetas van encima de los campos. Valores iniciales y parámetros usan
  columnas automáticas de al menos 10rem, con una sola columna en espacios menores.
  Los controles tienen altura mínima de 3rem y texto de 1rem.
- `main-content` permite encogerse con `min-width: 0`. Tablas y Jacobiano
  conservan su desplazamiento interno, sin ampliar toda la página.
- Las gráficas mantienen su proporción; sus títulos están centrados y sus
  etiquetas del eje Y ya no se superponen a los valores. En móvil sus botones
  ocupan dos columnas del mismo ancho.
- Se reprodujo el defecto a 1100px: los campos de parámetros tenían alrededor
  de 39–44px. Tras la corrección tienen al menos 219px en ese ancho.
- 40 casos de navegador aprobados en la copia estática local: ambos métodos,
  tamaños 2×2 y 6×6 y anchos 320, 390, 640, 768, 900, 1024, 1100, 1280,
  1440 y 1920px. Clics y teclado reales verifican edición y cálculo;
  los campos quedan dentro de pantalla y no hay desbordamiento de página.
- Script: `scripts/probar-no-lineales-responsive.mjs`; registro:
  [PRUEBAS_RESPONSIVE_NO_LINEALES.json](metodos-numericos/PRUEBAS_RESPONSIVE_NO_LINEALES.json).
  Se inspeccionaron capturas reales de escritorio y móvil; se guardan en TEMP.
- 46 pruebas de regresión pertinentes, compilación y ESLint aprobados.
  Los 42 casos de CAS real pasaron nuevamente sobre la compilación final:
  [PRUEBAS_CAS_RESPONSIVE_2026-10-13.json](metodos-numericos/PRUEBAS_CAS_RESPONSIVE_2026-10-13.json).
  Copia estática actualizada; no hubo publicación remota.

Aclaración posterior del usuario: el defecto aparece **al pulsar CALCULAR**.
Se amplió el script responsive para comparar el ancho y la posición horizontal
de cada campo antes y después de calcular, y para volver a escribir el primer
valor inicial con resultados presentes y recalcular sin cambiar de método.
Pasaron los mismos 40 escenarios (80 cálculos) en desarrollo, puerto 5173, y
en la copia estática, puerto 4173. En estas versiones locales no se reprodujo
el defecto después de calcular. Se pidió identificar si el usuario está usando
localhost o la página publicada; no asumir que está viendo la compilación local.
El usuario confirmó que usa `http://localhost:5173/Proyecto_Aplicada_3_2026/`.

Se encontró y corrigió una dependencia del orden de carga de CSS: al agregar la
hoja compartida después de calcular, el formulario a 1100px pasaba de 729px a
315px. Esta simulación reproduce el estrechamiento, pero no confirma por sí sola
el orden de estilos en la pestaña habitual del usuario. El selector principal
ahora combina `.bisection-grid.sistemas-no-lineales`; las filas del vector
tienen una regla específica y los resultados usan `contain: inline-size`.
Así los estilos compartidos no pueden restablecer las columnas antiguas y el
contenido de resultados no impone el ancho mínimo del formulario.

El script responsive ahora agrega la hoja compartida con resultados presentes
y comprueba que todos los campos mantengan su ancho y posición, antes de editar
y recalcular. Sus 40 escenarios (80 cálculos) pasaron en la dirección local
confirmada y en la copia estática actualizada. Compilación y ESLint aprobados.
Se repitieron los 42 casos de CAS real; registro:
[PRUEBAS_CAS_ORDEN_ESTILOS_2026-10-13.json](metodos-numericos/PRUEBAS_CAS_ORDEN_ESTILOS_2026-10-13.json).
No se ha publicado ningún cambio remoto durante estas tareas.

- Los valores iniciales se almacenan como un arreglo de campos independientes,
  con un input por variable. Los identificadores son `punto-fijo-inicial-N` y
  `newton-inicial-N`, con índices desde cero.
- El cálculo parte de una copia de los valores ingresados. Punto fijo actualiza
  todas las componentes simultáneamente; Newton resuelve `J·ΔX = −F` con `lusolve`.
- Las filas conservan copias de `valoresActuales` y `valoresSiguientes`, errores
  por componente y el máximo global. Las funciones y los puntos se vuelven a
  leer al calcular; no se sustituyen por los valores de un ejemplo.
- Los valores vacíos o no finitos se rechazan; cero es un valor inicial válido,
  aunque Newton puede fallar si el Jacobiano correspondiente es singular.
- Se corrigió un caso real: variables repetidas como `x,x` sobrescribían un valor
  al construir el scope. Ahora ambos métodos rechazan variables repetidas.
- Newton ahora limpia tabla, mensajes y gráfica al modificar tolerancia o
  máximo de iteraciones. Las funciones, variables y puntos iniciales también
  reinician los resultados. Los decimales controlan la presentación.
- Ambos muestran **Vector inicial utilizado**, tomado de la primera fila del
  cálculo guardado, no de una constante. Sus atributos de prueba son
  `punto-fijo-vector-utilizado` y `newton-vector-utilizado`.
- Se retiraron las explicaciones sobre errores, convergencia y comparación
  de puntos iniciales de la interfaz por solicitud del usuario el 13 de octubre.
- Se conservó precisión completa y se mejoró el redondeo de presentación: un
  valor no nulo que quedaría como cero se muestra en notación científica; se
  evita `-0`. Cambiar decimales no altera las iteraciones ni la solución.
- Se retiraron las notas sobre tolerancia, CAS, decimales e iteraciones.
  Los campos de tolerancia, iteraciones y decimales siguen disponibles.
  No reintroducir estas explicaciones: el usuario quiere una calculadora concisa.

Verificación: 60 vectores distintos en tamaños de 2×2 a 6×6, más 40 cambios de
una sola coordenada; 16 ejemplos y dos validaciones de variables repetidas en
Edge real. Los ejemplos de navegador pasaron tanto en desarrollo como en la
copia estática de producción local.

Informe con funciones, puntos y resultados: [PRUEBAS_NO_LINEALES.md](metodos-numericos/PRUEBAS_NO_LINEALES.md).
Automatización sin Playwright: `metodos-numericos/scripts/probar-no-lineales-navegador.mjs`.
Necesita Node 24, la app servida y un navegador de pruebas con depuración remota
(por defecto puerto 9223). Abre/cierra su pestaña, modifica el DOM real y verifica
los resultados. No usar un perfil habitual del usuario para estas pruebas.

### Redondeo y comparación de las capturas 2×2

La aplicación actual conserva precisión completa durante ambos cálculos.
Las dos capturas coinciden con la aplicación en cinco iteraciones y solución
final a cinco decimales, pero no en todas las cifras intermedias:

| Método y datos | Solución final | Diferencia relevante |
| --- | --- | --- |
| Punto fijo: `G1=y/sqrt(5)`, `G2=(sin(x)+2*cos(y))/4`, inicio `(0.1,0.25)`, tolerancia `0.01` | `(0.21891,0.49710)` | Error final: captura `0.00760`, app `0.00761` |
| Newton: `F1=5*x^2-y^2`, `F2=y-0.25*(sin(x)+cos(y))`, inicio `(0.1,0.5)`, tolerancia `0.0001` | `(0.12124,0.27111)` | Primer error: captura `0.23635`, app `0.23636`; final `0.00006` en ambos |

Redondear las nuevas componentes de Punto Fijo a cinco decimales en cada paso
reproduce toda su captura. Para Newton se encontró un esquema compatible:
Jacobiano redondeado a cuatro decimales e inversa a cinco. Esto no confirma
de forma única el algoritmo de la hoja original. Estos esquemas se analizaron
pero **no se incorporaron** al código de los métodos no lineales.

Comparación completa por fila:
[COMPARACION_CAPTURAS_2X2.md](metodos-numericos/COMPARACION_CAPTURAS_2X2.md).
No informar que ambas tablas ya son idénticas.
La corrección matemática se contrastó después con CAS real: se conserva precisión
completa y se redondea al presentar. A tolerancia `1e-10` coinciden con NSolve;
con tolerancias más grandes se muestran aproximaciones de menor exactitud.

## Unidad 6: únicamente GeoGebra

El usuario pidió dejar los eigenvalores/eigenvectores como los calcula GeoGebra.
El 13 de octubre pidió reducir el texto y eliminar la guía para repetir el
ejercicio en GeoGebra, porque este módulo debe sustituir ese flujo externo.
Implementación activa:

Actualización según el PDF del usuario (13 de octubre):

- Referencia leída: `C:/Users/gogob/Downloads/Valores y vetores propios Repetidos.pdf`,
  de 17 páginas. El usuario solicita únicamente polinomio, eigenvalores y
  eigenvectores; la parametrización y la solución del sistema diferencial
  no son parte del alcance.
- Se muestra `p(λ) = det(A − λI)`, desarrollado y factorizado, y la ecuación
  para sus raíces. «Matriz A − λI» permite consultar la matriz mediante un
  desplegable. Se conserva el signo del determinante del PDF, sin forzar
  el polinomio mónico de `det(λI − A)`.
- Se agrupan los valores repetidos con su multiplicidad y los eigenvectores
  independientes asociados. Por solicitud posterior del usuario, la interfaz
  conserva solo **Ejemplo caso 1**, **Ejemplo caso 2** y **Ejemplo imaginario**.
  Los dos primeros reproducen las matrices del PDF; el último muestra
  eigenvalores imaginarios de una matriz real. El formulario inicia con el
  primer caso del PDF, en tamaño 3×3.
- Si `Eigenvectors` no devuelve una matriz completa, se resuelve el núcleo de
  cada `A − λI` usando `ReducedRowEchelonForm` y operaciones de GeoGebra CAS.
  CAS comprueba el residuo de cada vector antes de aceptarlo. Se muestran las
  bases disponibles, sin fabricar vectores adicionales o generalizados.
  Cuando `Eigenvectors` sí devuelve una matriz, se conserva su escala y orden.
- Se corrigió la entrada imaginaria: la letra latina `i` era una variable para
  CAS, mientras que `ί` es su unidad imaginaria. La entrada habitual `i` se
  traduce a `ί` después de validarla, conservando correctamente `i² = −1`.
  También se aceptan `ί` y `ⅈ`. La indicación menciona entradas reales,
  imaginarias y complejas, con ejemplos breves.
- El CSV incluye polinomio, factorización, multiplicidades y bases. Los cambios
  de entrada reinician todos esos resultados. Si Factor falla, se conserva
  el polinomio desarrollado y los eigenresultados disponibles.
- Se fijó el ancho de las celdas de entrada a 6rem: la matriz 3×3 del PDF cabe
  en su tarjeta de escritorio. Matrices mayores conservan desplazamiento interno.
- Verificación: 80 pruebas de regresión, build y ESLint aprobados; siete casos
  específicos con CAS real en desarrollo y en la copia estática, más los 42
  casos generales en ambas versiones. Se compararon también los polinomios de
  las 18 matrices generales (1×1 a 10×10) y su factorización con CAS real.
- Registros específicos: `PRUEBAS_PROPIOS_DOCUMENTO.json` y
  `PRUEBAS_PROPIOS_DOCUMENTO_PRODUCCION.json`. Registros generales:
  `PRUEBAS_CAS_POLINOMIO_2026-10-13.json` y
  `PRUEBAS_CAS_POLINOMIO_PRODUCCION_2026-10-13.json`.
  Detalle: [REFERENCIA_PROPIOS_PDF.md](metodos-numericos/REFERENCIA_PROPIOS_PDF.md).
  Copia estática actualizada; no hubo publicación remota.

Durante la verificación se detectó una entrega desactualizada de Vite: una petición
HTTP nueva al componente seguía mostrando la frase anterior, aunque el archivo
en disco y la compilación ya contenían el cambio. Se reinició únicamente el Vite
de este proyecto en el mismo puerto 5173, verificando su línea de comando antes
de detenerlo. `vite.config.js` habilita polling cada 300ms en Windows. Una prueba
temporal de comentario detectó el cambio en 486ms y comprobó la restauración
byte por byte, además de su entrega actualizada por HTTP. El archivo quedó intacto.
El servidor de desarrollo queda activo en la dirección confirmada del usuario.

- Componente: `src/metodos/ValoresVectoresPropios.jsx` y su CSS.
- Motor: `src/utils/propiosCAS.js`, apoyado por `loadGeogebra.js`.
- Se ejecutan `Eigenvalues(matriz)` y `Eigenvectors(matriz)` en GeoGebra CAS.
  Se conserva la escala, el orden y las expresiones originales de los resultados.
- Se eliminaron del flujo el modo numérico, la parametrización con 1, la
  normalización adicional, el selector de decimales y la comprobación numérica.
- Acepta matrices NxN desde 1×1, con números reales o complejos, fracciones y
  raíces. N es configurable mediante un input y CREAR MATRIZ. Se valida que N
  sea entero positivo y que el tamaño esté aplicado antes de calcular.
  Se validan todas las celdas antes de cargar el motor. Necesita internet.
- Los únicos ejemplos visibles son los dos casos del PDF y el imaginario.
  Se conservan el tamaño NxN y la entrada manual de cualquier matriz admitida.
  La tabla permite desplazamiento
  horizontal para conservar legibilidad en matrices grandes.
- El motor se comparte mediante `Symbol.for("aplicada3.motorGeoGebraCAS")` en
  window. Se corrigió un problema real en que dos cargas del módulo/app CAS
  podían invalidar la primera API. La carga fallida se puede volver a intentar.
- La interfaz conserva una indicación breve para completar las celdas, incluidos
  los ceros, con ejemplos de decimales, fracciones, raíces y complejos.
  Se eliminaron las guías extensas, los enlaces y «Repetir un ejemplo en GeoGebra».
  Los títulos y el estado de carga muestran los resultados sin exponer comandos CAS.
- Si no se pueden obtener vectores ni mediante el comando directo ni resolviendo
  el núcleo con CAS, conserva los valores y muestra un aviso. No usa otro motor.
- Descarta respuestas antiguas del CAS cuando se edita la matriz durante la carga.
- `src/utils/valoresVectoresPropios.js` y sus pruebas numéricas aún existen,
  pero la unidad 6 no importa ni ejecuta ese motor. No volver a activarlo por
  error al encontrar pruebas de esa utilidad.

Verificación del recorte de ejemplos: 31 pruebas pertinentes aprobadas,
compilación y ESLint aprobados. Los siete casos del script específico pasaron
con CAS real en desarrollo y en la copia estática; los tres ejemplos se cargan
mediante sus botones y se comprueba que no haya otros. Los registros específicos
se actualizaron. La copia estática está actualizada, sin publicación remota.

Se ejecutaron pruebas con el motor real GeoGebra CAS 5.4.920.0 en Chromium,
tanto en desarrollo como en la copia compilada de producción local:
18 matrices (1×1 a 10×10), 22 sistemas no lineales (2×2 a 6×6 con distintos
puntos iniciales) y dos casos de Müller. Todos pasaron.
Las matrices incluyen casos densos, fracciones, radicales, valores complejos,
repetidos, nulos y una matriz defectiva. Se comprobaron las expresiones y escala
originales y `A·V − V·D`; los casos numéricos admiten residuo menor que `1e-8`.
Los sistemas usan tolerancia `1e-10`, hasta 100 iteraciones, y comparación con
NSolve real a 16 cifras y evaluación de residuos con Substitute/Numeric.
No se exige el mismo recorrido ni número de iteraciones entre los algoritmos.

Script reproducible: `metodos-numericos/scripts/probar-cas-real.mjs`.
Registros reales: `PRUEBAS_CAS_REALES.json` y
`PRUEBAS_CAS_REALES_PRODUCCION.json` dentro de `metodos-numericos/`.
Informe: [PRUEBAS_CAS_REALES.md](metodos-numericos/PRUEBAS_CAS_REALES.md).
Las pruebas con respuestas simuladas se conservan para validación, errores,
exportaciones y respuestas antiguas; ahora complementan las pruebas reales.

## Estado de validación y comandos

Actualización de interfaz del 13 de octubre de 2026:

- 58 pruebas de regresión pertinentes aprobadas, ejecutadas en serie
  (`sistemas-no-lineales`, `errores-capturas` y `propios-cas`).
- Compilación aprobada y ESLint sin errores en los tres componentes afectados.
- Copia estática de la raíz actualizada desde `dist/`, con rutas de recursos
  verificadas. No se publicó una nueva versión remota.
- Verificación del DOM real en Chromium: textos retirados ausentes, campos de
  tolerancia/iteraciones/decimales y valores iniciales presentes; unidad 6 con
  indicación breve y sin guía externa.
- 42 casos con CAS real aprobados sobre esa copia estática (18 matrices,
  22 sistemas no lineales y dos ejercicios de Müller). Registro independiente:
  [PRUEBAS_CAS_INTERFAZ_2026-10-13.json](metodos-numericos/PRUEBAS_CAS_INTERFAZ_2026-10-13.json).
- Esta tarea modifica presentación y elimina el comentario de análisis de
  convergencia de Punto Fijo; conserva los algoritmos de cálculo existentes.

Última suite completa (13 de octubre, polinomio y referencia PDF): **80 pruebas aprobadas** en serie. Compilación aprobada
con `npm run build`. ESLint de los archivos modificados no tiene errores;
Müller imaginario conserva advertencias sobre funciones locales usadas como
dependencias de useMemo. Se corrigieron sus dependencias incompletas de gráficos.
La copia estática se actualizó y pasó los mismos 42 casos con CAS real.

```powershell
cd metodos-numericos
npm run dev
npm test
npm run build
```

Si hay poca memoria, cerrar los navegadores de pruebas y evitar simultanear
compilación y suite completa; alternativamente:

```powershell
node --test --test-concurrency=1 tests/*.test.js
```

`tests/componente.js` ejecuta los manejadores reales con estados y JSX simulados;
no tiene DOM y omite efectos de las gráficas. Los informes distinguen esas
pruebas de los casos verificados en navegador real.

## Subida al repositorio del 13 de octubre de 2026

A petición del usuario se creó el commit `b70e7fa` y se subió correctamente a
`origin/main` en `Alex-M21/Proyecto_Aplicada_3_2026`. Incluye el código fuente,
las pruebas, los informes y la copia estática actualizada desde `dist/`.
Antes de subir se repitieron las 80 pruebas en serie y la compilación;
ambas verificaciones pasaron. La rama local y `origin/main` estaban alineadas
antes del commit. Las menciones anteriores a ausencia de publicación describen
el estado durante aquellas verificaciones. No se ejecutó un despliegue manual
de `gh-pages` en esta tarea.

Se conservan sin seguimiento los recursos locales de compilaciones intermedias
en `assets/`; sólo se incorporaron los recursos de la compilación actual.
No borrarlos ni añadirlos todos por defecto en tareas futuras.

El servidor local activo de esta sesión sirve
`http://localhost:5173/Proyecto_Aplicada_3_2026/`. Los puertos son un dato de
esta sesión; en futuras ejecuciones consultar la URL que imprima Vite.
