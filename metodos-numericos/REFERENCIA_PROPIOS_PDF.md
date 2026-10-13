# Unidad 6: referencia del PDF y resultados complejos

Fecha: 13 de octubre de 2026.
Referencia del usuario: [Valores y vetores propios Repetidos.pdf](<C:/Users/gogob/Downloads/Valores y vetores propios Repetidos.pdf>),
17 páginas. Se revisaron el texto y las capturas de calculadora. El alcance
solicitado es el polinomio, los eigenvalores y los eigenvectores, sin desarrollar
la parametrización ni resolver el sistema de ecuaciones diferenciales.

## Polinomio y casos repetidos

La aplicación muestra `p(λ) = det(A − λI)` desarrollado, su factorización igualada
a cero y la matriz `A − λI` en un desplegable. Conserva la convención y signo
del PDF. Los eigenvalores repetidos se agrupan con su multiplicidad algebraica
y los eigenvectores independientes que se pudieron obtener.

**Caso 1**, páginas 1, 9 y 10:

```text
A = {{5,-4,0},{1,0,2},{0,2,5}}
p(λ) = −λ³ + 10λ² − 25λ = −λ(λ − 5)²
```

| Eigenvalor | Multiplicidad | Base del espacio propio mostrada |
| --- | --- | --- |
| 0 | 1 | `{−2, −5/2, 1}` |
| 5 | 2 | `{−2, 0, 1}` |

El valor 5 aparece dos veces en el polinomio, pero tiene un solo eigenvector
independiente. La parte posterior del PDF construye un vector generalizado
para el sistema diferencial; ese paso no se presenta como un eigenvector
adicional en esta calculadora. La captura de TI también muestra pequeñas partes
imaginarias debidas a su aproximación numérica del valor repetido; la salida
simbólica comprobada es exactamente `{0,5,5}`.

**Caso 2**, páginas 15 a 17:

```text
A = {{3,-1,-1},{1,1,-1},{1,-1,1}}
p(λ) = −λ³ + 5λ² − 8λ + 4 = −(λ − 1)(λ − 2)²
```

| Eigenvalor | Multiplicidad | Base de eigenvectores devuelta por CAS |
| --- | --- | --- |
| 1 | 1 | `{−1, −1, −1}` |
| 2 | 2 | `{1, 0, 1}`, `{0, 1, −1}` |

Estas bases generan los mismos espacios que los vectores de las diapositivas.
Se conserva la escala y el orden originales de CAS (`{2,2,1}`), por lo que no
se fuerza la misma presentación de sus componentes. La cabecera de la página
17 dice λ₂ = 5, pero la sustitución realizada y el polinomio corresponden a 2;
se usa la operación matemática comprobada, no esa errata.

La interfaz conserva únicamente **Ejemplo caso 1**, **Ejemplo caso 2** y
**Ejemplo imaginario**. Los primeros cargan las matrices del PDF; el imaginario
carga una matriz real con eigenvalores imaginarios. El formulario inicia con
el caso 1, en tamaño 3×3. La entrada manual sigue admitiendo matrices NxN.

## Motor e imaginarios

Se mantienen `Eigenvalues` y `Eigenvectors` de GeoGebra CAS. Si el segundo
comando no proporciona una matriz completa, como ocurre con el primer caso,
se resuelve cada núcleo mediante
[ReducedRowEchelonForm](https://geogebra.github.io/docs/manual/en/commands/ReducedRowEchelonForm/).
Los coeficientes y signos de la base se evalúan en CAS, y cada vector se acepta
únicamente cuando CAS confirma `(A − λI)v = 0`. No se usa el motor numérico
anterior, ni se inventa un conjunto de N vectores para matrices defectivas.

Se corrigió la traducción de la entrada `i`: en el CAS de GeoGebra, la unidad
imaginaria es `ί`, mientras que la letra latina puede tratarse como una variable.
La [documentación de números complejos](https://geogebra.github.io/docs/manual/en/Complex_Numbers/)
describe esa unidad. Las entradas habituales se traducen antes de los comandos;
`i²` se evalúa como −1. Se aceptan reales, imaginarios puros, complejos, fracciones
y raíces. Los campos permiten escribir `i`, `2i`, `1+2i` o `sqrt(-1)`.

El CSV incluye el polinomio, su factorización, multiplicidades y las bases
obtenidas. Si la factorización falla, se mantiene el polinomio desarrollado;
si algún espacio propio no se puede resolver, se conservan los demás resultados
y se informa. Los tiempos y resultados disponibles siguen dependiendo de CAS.

## Verificación

Pasaron siete casos específicos con **CAS real en Chromium**, tanto en desarrollo
como en la copia estática compilada:

| Caso | Comprobación relevante |
| --- | --- |
| PDF, caso 1 | Polinomio cúbico, 5 repetido y un solo vector independiente para 5 |
| PDF, caso 2 | 2 repetido con dos vectores independientes |
| Matriz real `{{0,-1},{1,0}}` | Eigenvalores `−i`, `i` y eigenvectores complejos |
| Matriz `{{i,1},{0,2i}}` | Entradas puramente imaginarias y polinomio `λ² − 3iλ − 2` |
| Matriz `{{1+2i,1/2},{0,3}}` | Entradas complejas y fracciones |
| Matriz `{{i²}}` | Eigenvalor −1, con polinomio `−1 − λ` |
| Matriz `{{i,1},{1,−i}}` | Polinomio `λ²`, raíz 0 repetida y un vector independiente |

Se comprueba la equivalencia del polinomio y la factorización con expresiones
independientes, que cada eigenvalor sea raíz y que cada vector no nulo satisfaga
`(A − λI)v = 0`. También se comprueban multiplicidad, cantidad de vectores,
exportación mediante el botón CSV y reinicio de los resultados al editar.
En anchos 320, 390, 1100 y 1440px no hubo desbordamiento de la página.
Se inspeccionó una captura real del primer caso en escritorio; las celdas de
entrada se ajustaron para que la matriz 3×3 quepa en su tarjeta a ese ancho.

Registros específicos:

- [Desarrollo](PRUEBAS_PROPIOS_DOCUMENTO.json).
- [Copia estática local](PRUEBAS_PROPIOS_DOCUMENTO_PRODUCCION.json).

Además pasaron los 42 casos generales de CAS real en ambas versiones. Las
18 matrices (1×1 a 10×10) ahora incluyen comparación del polinomio y su
factorización; se conservaron los 22 sistemas no lineales y los dos casos de Müller.

- [Regresión general en desarrollo](PRUEBAS_CAS_POLINOMIO_2026-10-13.json).
- [Regresión general en la copia estática](PRUEBAS_CAS_POLINOMIO_PRODUCCION_2026-10-13.json).

Suite completa: **80 pruebas aprobadas** en serie. Compilación y ESLint de los
archivos JS/JSX afectados aprobados. La copia estática está actualizada;
no hubo publicación remota.

Se detectó que el servidor Vite local todavía entregaba una transformación
anterior de un componente. Se verificó su línea de comando y se reinició
únicamente el servidor de este proyecto, conservando la dirección
`http://localhost:5173/Proyecto_Aplicada_3_2026/`. La configuración habilita
polling de archivos cada 300ms en Windows. Una prueba temporal detectó la
modificación en 486ms y verificó la restauración exacta del archivo y de su
respuesta HTTP. Las siete pruebas específicas y las 42 generales de desarrollo
pasaron después del reinicio. El servidor de desarrollo queda activo.

Desde `metodos-numericos/`, con la app servida y un navegador de pruebas en 9223:

```powershell
node scripts/probar-propios-documento.mjs http://localhost:5173/Proyecto_Aplicada_3_2026/
node scripts/probar-propios-documento.mjs http://127.0.0.1:4173/Proyecto_Aplicada_3_2026/ http://127.0.0.1:9223 ../PRUEBAS_PROPIOS_DOCUMENTO_PRODUCCION.json
```

Los registros específicos solo se consideran completos si `aprobado` es `true`,
contienen siete casos y el script termina con código 0. Las pruebas de navegador
no equivalen a verificar todos los dispositivos físicos o matrices posibles.

Tras recortar los ejemplos según la solicitud del usuario, pasaron 31 pruebas
pertinentes, compilación y ESLint. Se actualizaron los registros específicos
después de repetir los siete casos con CAS real en ambas versiones. El script
comprueba que haya exactamente esos tres botones y utiliza cada botón para
cargar su ejemplo. Los conjuntos numéricos de regresión se conservan como datos
de prueba, aunque ya no aparezcan como ejemplos en la interfaz.
