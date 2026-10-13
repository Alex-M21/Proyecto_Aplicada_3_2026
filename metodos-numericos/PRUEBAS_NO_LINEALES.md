# Pruebas con diferentes puntos iniciales

## Márgenes compartidos: 13 de octubre de 2026

Se corrigió el estilo global que dibujaba un borde alrededor del formulario
interior sin padding. Las tarjetas de entrada conservan 24px a ambos lados en
escritorio y 16px en móvil. La distribución compartida impide que los resultados
estrechen la tarjeta al calcular. Los dos métodos no lineales pasaron los seis
anchos de la revisión de los 17 métodos, tanto en desarrollo como en la copia
estática compilada. También pasaron los 40 escenarios específicos en desarrollo.
Detalle y registros: [PRUEBAS_MARGENES_METODOS.md](PRUEBAS_MARGENES_METODOS.md).

## Corrección responsive: 13 de octubre de 2026

Se reprodujo el problema de la captura a 1100px: el formulario continuaba en
dos columnas junto al menú lateral y los campos de parámetros medían 39–44px.
El diseño ahora distribuye las tarjetas según el ancho real disponible, coloca
las etiquetas encima de sus controles y adapta valores iniciales y parámetros
a columnas con espacio suficiente. A 1100px, los parámetros miden al menos 219px.
También se centraron los títulos de las gráficas y se separaron las etiquetas
del eje Y; sus botones usan dos columnas iguales en móvil.

Pasaron **40 casos en Chromium** sobre la copia estática actualizada: ambos
métodos, tamaños 2×2 y 6×6 y diez anchos entre 320 y 1920px. Se comprobaron
campos de al menos 150px de ancho y 44px de alto, contenidos en pantalla y
ausencia de desbordamiento de página antes y después de calcular. Cada caso
incluye clic y teclado reales para editar el primer valor inicial, tolerancia,
iteraciones y decimales, y verifica convergencia y el vector inicial utilizado.
Se inspeccionaron capturas de móvil y escritorio. El navegador real no representa
una comprobación en todos los dispositivos físicos o navegadores existentes.

Script reproducible (requiere navegador de pruebas en el puerto 9223):

```powershell
node scripts/probar-no-lineales-responsive.mjs http://127.0.0.1:4173/Proyecto_Aplicada_3_2026/
```

Registro: [PRUEBAS_RESPONSIVE_NO_LINEALES.json](PRUEBAS_RESPONSIVE_NO_LINEALES.json).
Pasaron además 46 pruebas de regresión pertinentes, compilación y ESLint.
Se repitieron los 42 casos de CAS real sobre la compilación final, incluyendo
los 22 sistemas no lineales:
[PRUEBAS_CAS_RESPONSIVE_2026-10-13.json](PRUEBAS_CAS_RESPONSIVE_2026-10-13.json).
La copia estática local está actualizada; no hubo publicación remota.

Tras la aclaración de que ocurre al pulsar CALCULAR, se reforzó el mismo script:
compara cada campo antes y después de mostrar la tabla y la gráfica, con un
margen de 1px en ancho y posición horizontal. También vuelve a escribir `0.3`
en el primer valor inicial con resultados presentes y recalcula, comprobando
que se usa el nuevo vector. Pasaron los 40 escenarios (80 cálculos) tanto en
desarrollo (`localhost:5173`) como en la copia estática (`127.0.0.1:4173`).
El registro enlazado incluye ahora `camposDespues` y `vectorRecalculado`.
El defecto posterior a CALCULAR no se reprodujo en esas versiones locales;
el usuario confirmó posteriormente que utiliza la dirección de desarrollo
`http://localhost:5173/Proyecto_Aplicada_3_2026/`.

### Orden de carga de estilos en una pestaña abierta

Se reprodujo un estrechamiento al agregar los estilos compartidos después de
mostrar los resultados: a 1100px, el formulario pasaba de 729px a 315px porque
el selector de dos columnas podía prevalecer sobre el del módulo. No se
inspeccionó la pestaña habitual del usuario, por lo que esta simulación no prueba
por sí sola que ese fuera su orden de estilos.

Se aumentó la especificidad del contenedor y de las filas del vector inicial.
Los resultados tienen contención del ancho para que la tabla y la gráfica no
impongan un mínimo al formulario. El script ahora inserta al final la hoja
compartida con resultados visibles y compara el ancho y la posición horizontal
de todos los controles. El registro incluye `camposEstilosRecargados`.
Pasaron los 40 escenarios (80 cálculos) en desarrollo y en la copia estática
actualizada. Compilación y ESLint del script aprobados. Los 42 casos de CAS real
también pasaron sobre la compilación final:
[PRUEBAS_CAS_ORDEN_ESTILOS_2026-10-13.json](PRUEBAS_CAS_ORDEN_ESTILOS_2026-10-13.json).

## Actualización de interfaz: 13 de octubre de 2026

Se retiraron las explicaciones de errores, tolerancia, decimales, comparación
con CAS y recorrido desde distintos puntos iniciales. Punto Fijo tampoco muestra
el comentario automático de análisis de convergencia. Los parámetros, tablas,
gráficas, validaciones y cálculo de las iteraciones se conservan.

Pasaron 58 pruebas de regresión pertinentes en serie. En Chromium se comprobó
que las notas ya no aparecen y que los campos iniciales y los tres parámetros
siguen disponibles. Los 22 casos no lineales del script CAS real pasaron sobre
la copia estática actualizada. Registro:
[PRUEBAS_CAS_INTERFAZ_2026-10-13.json](PRUEBAS_CAS_INTERFAZ_2026-10-13.json).
La compilación y ESLint de los componentes afectados pasaron; no hubo publicación remota.

## Verificación anterior de los puntos iniciales

Se comprobaron los formularios reales de Punto Fijo No Lineal y Newton No Lineal
en Microsoft Edge, con 16 ejemplos y dos validaciones de variables repetidas.
Las mismas pruebas pasaron en desarrollo y en la copia estática actualizada de
la raíz del repositorio. No se publicó una nueva versión remota.

En todos los ejemplos siguientes se usaron tamaño 2×2, variables `x,y`, tolerancia
`1e-8`, máximo de 100 iteraciones y cinco decimales. Las tablas muestran las
cifras visibles en el navegador; el cálculo conserva precisión completa.

## Punto fijo: sistema trigonométrico

Ingresar `G1 = y/sqrt(5)` y `G2 = (sin(x)+2*cos(y))/4`.

| Punto inicial | Primera iteración | Solución aproximada | Iteraciones |
| --- | --- | --- | --- |
| `(0.1, 0.25)` | `(0.11180, 0.50941)` | `(0.22132, 0.49489)` | 23 |
| `(1, 2)` | `(0.89443, 0.00229)` | `(0.22132, 0.49489)` | 26 |
| `(-1.5, 0.25)` | `(0.11180, 0.23508)` | `(0.22132, 0.49489)` | 25 |
| `(0, 3)` | `(1.34164, -0.49500)` | `(0.22132, 0.49489)` | 27 |

Estos puntos sí se usan: cambian las primeras iteraciones y la cantidad de pasos,
aunque todos llegan a la misma solución. Una solución final igual no demuestra
que el punto inicial haya sido ignorado.

## Punto fijo: distintas soluciones

Ingresar `G1 = 1.5*x-0.5*x^3` y `G2 = 1.5*y-0.5*y^3`.

| Punto inicial | Primera iteración | Solución aproximada | Iteraciones |
| --- | --- | --- | --- |
| `(0.2, 0.4)` | `(0.29600, 0.56800)` | `(1, 1)` | 9 |
| `(-0.2, -0.4)` | `(-0.29600, -0.56800)` | `(-1, -1)` | 9 |
| `(0.6, -0.7)` | `(0.79200, -0.87850)` | `(1, -1)` | 6 |
| `(-1.1, 1.1)` | `(-0.98450, 0.98450)` | `(-1, 1)` | 5 |

## Newton: sistema trigonométrico

Ingresar `F1 = 5*x^2-y^2` y `F2 = y-0.25*(sin(x)+cos(y))`.
Las funciones se interpretan como `F1 = 0` y `F2 = 0`.

| Punto inicial | Primera iteración | Solución aproximada | Iteraciones |
| --- | --- | --- | --- |
| `(0.1, 0.5)` | `(0.06364, 0.26364)` | `(0.12124, 0.27111)` | 7 |
| `(0.2, 0.4)` | `(0.12998, 0.27495)` | `(0.12124, 0.27111)` | 5 |
| `(-0.1, 0.5)` | `(-0.04038, 0.24038)` | `(-0.09816, 0.21950)` | 7 |
| `(0.4, 0.2)` | `(0.21961, 0.29606)` | `(0.12124, 0.27111)` | 6 |

## Newton: distintas raíces

Ingresar `F1 = x^2-4` y `F2 = y^2-9`.

| Punto inicial | Primera iteración | Solución aproximada | Iteraciones |
| --- | --- | --- | --- |
| `(1, 2)` | `(2.50000, 3.25000)` | `(2, 3)` | 6 |
| `(-1.5, 0.25)` | `(-2.08333, 18.12500)` | `(-2, 3)` | 8 |
| `(3, -4)` | `(2.16667, -3.12500)` | `(2, -3)` | 5 |
| `(-0.5, -2)` | `(-4.25000, -3.25000)` | `(-2, -3)` | 7 |

## Errores encontrados y cambios

- Se permitían variables repetidas. Con `x,x`, la construcción del sistema
  sobrescribía el primer punto inicial con el segundo. En Punto Fijo, por ejemplo,
  `G1 = cos(x)` y `G2 = cos(x)` producían la misma primera iteración al pasar de
  `(1,3)` a `(8,3)`. Ambos métodos ahora rechazan variables repetidas y dejan los
  resultados vacíos hasta corregir la entrada.
- Newton conservaba la tabla anterior al cambiar tolerancia o número de
  iteraciones. Ahora limpia la tabla y desactiva la descarga hasta recalcular.
- Ambos métodos muestran **Vector inicial utilizado**, obtenido de la primera
  iteración guardada. Al modificar los datos, este indicador también se reinicia.
- La raíz del repositorio tenía una compilación antigua con pantallas de
  configuración pendientes. Se actualizaron `index.html` y los recursos que usa
  con la compilación actual, y se comprobaron los formularios de esa copia.

## Pruebas automáticas y reproducción

`tests/sistemas-no-lineales.test.js` cubre 60 vectores: seis puntos iniciales por
método para cada tamaño entre 2×2 y 6×6. Comprueba el vector utilizado, la primera
iteración contra fórmulas independientes, raíces de distintos signos, convergencia
y que calcular no cambie los valores de los campos. También hace 40 cambios de
una sola coordenada, para detectar errores de índice en los campos iniciales.

La suite completa incluye validación de valores vacíos, cero, valores negativos,
Jacobiano singular y exportación CSV. Todas las 72 pruebas pasaron. La primera
ejecución de la suite en paralelo, junto con el navegador y la compilación, agotó
la memoria disponible; la ejecución en serie completó todas las pruebas.
Después de cerrar el navegador de prueba, `npm test` también completó las 72
pruebas con la configuración paralela habitual.

Desde `metodos-numericos`:

```powershell
node --test --test-concurrency=1 tests/*.test.js
npm run build
```

La prueba de navegador está en `scripts/probar-no-lineales-navegador.mjs`. Usa
Node 24 y un navegador de pruebas con depuración remota en el puerto 9223; no
requiere Playwright ni modifica un perfil habitual. Con Vite en el puerto 5173:

```powershell
node scripts/probar-no-lineales-navegador.mjs
```

También acepta la URL de una copia estática y la URL de depuración del navegador:

```powershell
node scripts/probar-no-lineales-navegador.mjs http://127.0.0.1:4173/Proyecto_Aplicada_3_2026/ http://127.0.0.1:9223
```

El script abre y cierra su pestaña de prueba, modifica los campos reales,
presiona CALCULAR y comprueba el vector utilizado, la tabla, la primera iteración,
las raíces finales y el rechazo de variables repetidas. Imprime los resultados
de los 16 casos como JSON.
