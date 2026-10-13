# Verificación contra las capturas definitivas

El tipo de error se determina por los valores de cada captura, no por una regla
general que obligue a todos los métodos a usar el mismo tipo. Para una aproximación
escalar, el error absoluto de cambio es `abs(nuevo - anterior)`; el relativo
habitual es `abs(nuevo - anterior) / abs(nuevo)`. El relativo porcentual multiplica
esa razón por 100. La tolerancia debe utilizar el mismo criterio que la tabla.

## Evidencia por captura

Los nombres corresponden a `WhatsApp Image 2026-10-12 at [hora] PM.jpeg`.

| Captura | Método | Comprobación de la primera fila | Tipo observado |
| --- | --- | --- | --- |
| 7.45.42 | Newton-Raphson | `abs(0.04991 - 0.1) = 0.05009` | Absoluto, con redondeo intermedio |
| 7.46.17 | Secante | `abs(1.83787 - 2) ≈ 0.16213` | Absoluto |
| 7.52.37 | Posición Falsa I | `abs(1.7 - 1) = 0.7` | Absoluto; primera comparación con el extremo izquierdo |
| 7.52.49 | Posición Falsa II | `abs(1.7 - 2) = 0.3` | Absoluto; primera comparación con el extremo derecho |
| 7.53.01 | Steffensen | `abs(0.66667 - 0.5) = 0.16667` | Absoluto |
| 7.53.16 | Muller real | `abs(1.2573 - 2) = 0.7427` | Absoluto |
| 7.53.27 | Muller imaginario | `abs(abs(p) - 2.5) ≈ 1.922649731` | Primera fila compatible con diferencia absoluta de módulos; ver discrepancia |
| 7.54.53 | Jacobi 3×3 | `max(11.58333, 0.5, 1.8) = 11.58333` | Diferencias absolutas por componente y máximo global |
| 7.55.02 | Jacobi 4×4 | `max(3.75, 4.2, 5.6667, 4.5714) = 5.6667` | Diferencias absolutas por componente y máximo global |
| 7.55.43 | Gauss-Seidel 3×3 | `max(0.08333, 2.17361, 2.52639) = 2.52639` | Diferencias absolutas por componente y máximo global |
| 7.55.58 | Punto fijo no lineal 2×2 | `abs(0.50941 - 0.25) = 0.25941` | Diferencias absolutas por variable y máximo global |
| 7.56.16 | Newton no lineal 2×2 | `abs(0.26365 - 0.5) = 0.23635` | Diferencias absolutas por variable y máximo global |
| 7.53.50 | Lagrange | Interpolación, sin columna de error | No hay criterio iterativo de error |
| 7.54.14 | Neville | Interpolación, sin columna de error | No hay criterio iterativo de error |
| 7.54.28 | Diferencias divididas de Newton | Interpolación, sin columna de error | No hay criterio iterativo de error |

No se identificó un cociente de error relativo en las filas escalares o de
sistemas de estas capturas. Por ejemplo, el relativo de Secante sería
aproximadamente `0.08822`, frente al `0.16213` mostrado; el de Steffensen sería
aproximadamente `0.25`, frente a `0.16667`. Esto describe estas referencias,
no una exigencia universal para cualquier implementación de esos métodos.

## Discrepancias y ajustes

### Newton-Raphson

Se restableció el redondeo intermedio de la referencia definitiva: valor inicial,
función, derivada, nueva aproximación y error. La prueba verifica las seis filas
completas de la captura, incluyendo el error cero final. El cambio anterior que
conservaba precisión completa daba siete iteraciones y no reproducía la referencia.

### Posición Falsa

Ambas variantes mantienen las primeras comparaciones distintas de sus capturas:
`0.7` y `0.3`. Las filas posteriores comparan aproximaciones consecutivas.
El cálculo y el color de convergencia comparan la tolerancia con el error sin
redondear; una raíz exacta también permite detenerse. Se conservan las cinco
iteraciones del ejemplo de las imágenes.

### Muller imaginario: raíz verificada con CAS real

Con el polinomio visible `3*x^2-x+1` y los puntos iniciales `1.5, 2.1, 2.5`,
la primera aproximación es `p = 0.1666666667 + 0.5527707984i`. Por tanto:

- Módulo de la diferencia compleja, usado actualmente por el componente:
  `abs(p - 2.5) = 2.3979157617`.
- Diferencia absoluta de módulos:
  `abs(abs(p) - 2.5) = 1.9226497308`, que reproduce el `1.922649731` de la captura.
- Error relativo complejo habitual:
  `abs(p - 2.5) / abs(p) ≈ 4.15331`, que tampoco coincide con la captura.

La primera fila permite identificar esa coincidencia de módulos, pero el texto
complejo superpuesto de las siguientes filas no permite reconstruir toda la
fórmula de la hoja. No se cambió el criterio de parada complejo basándose solo
en esta coincidencia: dos complejos diferentes pueden tener el mismo módulo.
Las pruebas registran la discrepancia; no afirman que esta tabla esté reproducida.
Posteriormente el usuario aclaró que se compara la raíz final, sin exigir las
filas extra de la hoja. La aplicación obtiene `1/6-sqrt(11)/6*i` y se verificó
con CSolve y su residuo en GeoGebra CAS real. En empates de módulo entre los
denominadores se eligió el segundo para fijar esa rama conjugada.

### Newton no lineal: diferencia de precisión

El tipo de error coincide: máximo de diferencias absolutas por variable.
Sin embargo, el primer error del componente es `0.2363615362` y se muestra
`0.23636`, mientras que la captura muestra `0.23635`. La pequeña diferencia
numérica es compatible con distinto redondeo intermedio del Jacobiano o de las
funciones, y no con la fórmula relativa, que daría aproximadamente `0.89645`.
No se afirma una reproducción exacta de todas las cifras de este sistema.

### Métodos sin captura

Bisección conserva su cota absoluta `abs(b-a)/2`, documentada en el repositorio.
Punto fijo escalar conserva `abs(g(x)-x)`. No se infiere de las imágenes un
criterio nuevo para estos dos métodos. La unidad 6 ahora utiliza exclusivamente
GeoGebra CAS para los eigenvalores y eigenvectores, conservando sus resultados
originales. No muestra residuos numéricos adicionales ni aparece en las capturas.

## Comprobación reproducible

Desde `metodos-numericos`, ejecutar `npm test` y `npm run build`.
`tests/errores-capturas.test.js` ejecuta los manejadores reales: comprueba tablas
de referencia, tipos de error, diferencias por componente, tolerancias, el redondeo
de Newton y la discrepancia compleja. Son pruebas sin navegador; los efectos
interactivos de las gráficas no se ejecutan.
