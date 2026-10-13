# Comparación de los dos ejemplos 2×2

Se ejecutaron los manejadores actuales de los dos componentes con los datos
de las capturas. No se cambió el cálculo durante esta comprobación.

Ambos ejemplos terminan en cinco iteraciones y coinciden en la solución final
mostrada a cinco decimales. Las tablas completas todavía no son idénticas.
En ambos, Ex y Ey son diferencias absolutas y Error es su máximo.

## Punto Fijo No Lineal

- `G1 = y/sqrt(5)`; `G2 = (sin(x)+2*cos(y))/4`.
- Inicio `(0.1, 0.25)`, tolerancia `0.01`, máximo de 25 iteraciones, cinco decimales.

Orden de cada tupla: `(x, y, Ex, Ey, Error)`.

| n | Captura | Aplicación actual |
| --- | --- | --- |
| 1 | `(0.11180, 0.50941, 0.01180, 0.25941, 0.25941)` | `(0.11180, 0.50941, 0.01180, 0.25941, 0.25941)` |
| 2 | `(0.22782, 0.46441, 0.11602, 0.04500, 0.11602)` | `(0.22782, 0.46441, 0.11601, 0.04501, 0.11601)` |
| 3 | `(0.20769, 0.50351, 0.02013, 0.03910, 0.03910)` | `(0.20769, 0.50351, 0.02013, 0.03910, 0.03910)` |
| 4 | `(0.22518, 0.48950, 0.01749, 0.01401, 0.01749)` | `(0.22517, 0.48950, 0.01749, 0.01401, 0.01749)` |
| 5 | `(0.21891, 0.49710, 0.00627, 0.00760, 0.00760)` | `(0.21891, 0.49710, 0.00626, 0.00761, 0.00761)` |

Redondear cada nueva componente a cinco decimales antes de calcular los errores
y usarla en la siguiente iteración reproduce todas las cifras de esta captura.
La aplicación actual conserva precisión completa durante las iteraciones.

## Newton No Lineal

- `F1 = 5*x^2-y^2`; `F2 = y-0.25*(sin(x)+cos(y))`, ambas igualadas a cero.
- Inicio `(0.1, 0.5)`, tolerancia `0.0001`, máximo de 25 iteraciones, cinco decimales.

Orden de cada tupla: `(x, y, Ex, Ey, Error)`.

| n | Captura | Aplicación actual |
| --- | --- | --- |
| 1 | `(0.06365, 0.26365, 0.03635, 0.23635, 0.23635)` | `(0.06364, 0.26364, 0.03636, 0.23636, 0.23636)` |
| 2 | `(0.15350, 0.27870, 0.08985, 0.01505, 0.08985)` | `(0.15352, 0.27870, 0.08988, 0.01507, 0.08988)` |
| 3 | `(0.12491, 0.27198, 0.02859, 0.00672, 0.02859)` | `(0.12491, 0.27198, 0.02861, 0.00673, 0.02861)` |
| 4 | `(0.12130, 0.27112, 0.00361, 0.00086, 0.00361)` | `(0.12130, 0.27112, 0.00361, 0.00086, 0.00361)` |
| 5 | `(0.12124, 0.27111, 0.00006, 0.00001, 0.00006)` | `(0.12124, 0.27111, 0.00006, 0.00001, 0.00006)` |

Un esquema compatible con todas las cifras visibles consiste en redondear el
Jacobiano a cuatro decimales y su inversa a cinco, manteniendo precisión en las
funciones y actualizaciones. Esto demuestra que las diferencias pueden proceder
de valores intermedios redondeados, pero no identifica de forma única el algoritmo
de la hoja. La aplicación actual deriva las funciones y resuelve `J·ΔX = −F`
con precisión completa. No se introdujo una regla de redondeo arbitraria en Newton.
