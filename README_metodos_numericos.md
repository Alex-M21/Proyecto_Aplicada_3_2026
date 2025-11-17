# 📐 Aplicación de Métodos Numéricos (React)

Proyecto en React para apoyar la enseñanza de métodos numéricos.  
Incluye un menú por unidades, cada método como componente independiente y (hasta ahora) una implementación completa del **método de Bisección**, con:

- Ingreso de funciones en formato **mathjs**.
- Validación de datos y manejo de errores.
- Tabla de iteraciones (similar a una hoja de cálculo).
- Gráfica de `f(x)` sobre el intervalo con sombreado del tramo actual.
- Descarga de resultados:
  - Tabla en **CSV** y **PDF**.
  - Gráfica en **PNG** y **JPG**.
- Un componente de **Manual de Expresiones** para guiar a los usuarios sobre cómo escribir las funciones.

---

## 🧱 Stack tecnológico

- **React** (SPA, componentes funcionales, hooks).
- **mathjs** → Evaluación de expresiones matemáticas (`f(x)`).
- **jsPDF** → Generación de PDF (tabla de iteraciones).
- **html2canvas** → Renderizado de la tabla a imagen para PDF.
- **SVG + JavaScript nativo** → Gráfica de `f(x)` y exportación a imagen (PNG / JPG).
- **CSS modular** → Estilos por componente (`Biseccion.css`, `ManualExpresiones.css`).

---

## 📂 Estructura principal del proyecto

```text
src/
  App.jsx                 # App principal: layout + menú + carga dinámica de métodos
  App.css                 # Estilos generales (layout, sidebar, etc.)

  metodos/
    Biseccion.jsx         # Implementación del método de Bisección
    Biseccion.css         # Estilos específicos para Bisección

    ManualExpresiones.jsx # Manual de cómo escribir las expresiones matemáticas
    ManualExpresiones.css # Estilos del manual

    PuntoFijo.jsx                 # (placeholder, por implementar)
    Newton.jsx                    # (placeholder, por implementar)
    Secante.jsx
    PosicionFalsa1.jsx
    PosicionFalsa2.jsx
    Stefensen.jsx
    MullerReal.jsx
    MullerImaginario.jsx
    Lagrange.jsx
    Neville.jsx
    NewtonDiferenciasDivididas.jsx
    Jacobi.jsx
    GaussSeidel.jsx
    PuntoFijoNoLineal.jsx
    NewtonNoLineal.jsx
```

> La mayoría de los métodos están todavía como placeholders.  
> Actualmente el método más completo es **Bisección**, junto con el componente de **Manual de Expresiones**.

---

## 🚀 Instalación y ejecución

### 1. Requisitos previos

- **Node.js** (>= 18 recomendado).
- **npm** habilitado.

### 2. Instalación de dependencias

En la carpeta raíz del proyecto:

```bash
npm install
npm install mathjs jspdf html2canvas
```

### 3. Ejecutar en modo desarrollo

Según el tipo de proyecto:

- Si se creó con **Vite**:

  ```bash
  npm run dev
  ```

- Si se creó con **Create React App**:

  ```bash
  npm start
  ```

---

## 🧭 App principal (`App.jsx`)

La app se basa en:

- Un **menú lateral** con los métodos agrupados por unidad.
- Un área principal donde se carga el componente del método seleccionado.

### 1. Definición de métodos

En `App.jsx` se define un arreglo `METHODS` con la información de cada método:

- `id` → identificador interno.
- `name` → nombre visible en el menú.
- `unit` → a qué unidad pertenece (Unidad 2, Unidad 3, etc.).
- `description` → descripción corta mostrada en el encabezado.

Incluye métodos como:

- Unidad 2: Bisección, Punto Fijo, Newton, Secante, Posición Falsa I, Posición Falsa II, Steffensen, Müller real, Müller imaginario.
- Unidad 3: Lagrange, Neville, Diferencias divididas de Newton.
- Unidad 4: Jacobi, Gauss-Seidel.
- Unidad 5: Punto fijo no lineal, Newton no lineal.
- Ayuda: Manual de expresiones.

Las unidades se generan con:

```js
const UNITS = [...new Set(METHODS.map((m) => m.unit))];
```

### 2. Mapeo `id → componente`

`App.jsx` usa un objeto `METHOD_COMPONENTS` para asociar cada `id` con el componente que debe renderizarse:

```js
const METHOD_COMPONENTS = {
  biseccion: Biseccion,
  "punto-fijo": PuntoFijo,
  newton: Newton,
  secante: Secante,
  "posicion-falsa-1": PosicionFalsa1,
  "posicion-falsa-2": PosicionFalsa2,
  stefensen: Stefensen,
  "muller-real": MullerReal,
  "muller-imaginario": MullerImaginario,
  lagrange: Lagrange,
  neville: Neville,
  "newton-diferencias-divididas": NewtonDiferenciasDivididas,
  jacobi: JacobiComponent,
  "gauss-seidel": GaussSeidelComponent,
  "punto-fijo-no-lineal": PuntoFijoNoLineal,
  "newton-no-lineal": NewtonNoLineal,
  "manual-expresiones": ManualExpresiones
};
```

### 3. Selección de método

Se maneja con estado y se renderiza dinámicamente:

```jsx
const [selectedMethodId, setSelectedMethodId] = useState(METHODS[0].id);
const selectedMethod = METHODS.find((m) => m.id === selectedMethodId);
const SelectedComponent = METHOD_COMPONENTS[selectedMethodId];
```

El layout general:

- `aside.sidebar` → menú lateral con unidades y botones.
- `main.content` → muestra el nombre, descripción y componente del método.

---

## 🧮 Componente `Biseccion.jsx`

### 1. Resumen funcional

El componente permite:

- Ingresar la función `f(x)` en sintaxis mathjs/JavaScript.
- Definir intervalo `[a, b]`, tolerancia, máximo de iteraciones y número de decimales.
- Validación de datos de entrada (numéricos, dominio de la función, signo opuesto en `f(a)` y `f(b)`).
- Ejecutar el método de Bisección, almacenando cada iteración en un arreglo de filas.
- Mostrar la tabla de iteraciones y la gráfica de `f(x)` con:
  - Ejes y ticks.
  - Sombreado del último intervalo `[a, b]`.
  - Línea vertical en la última aproximación `p`.
- Descargar:
  - Tabla en **CSV**.
  - Tabla en **PDF** (usando `html2canvas` + `jsPDF`).
  - Gráfica en **PNG** o **JPG** (exportando el SVG a `canvas`).

### 2. Dependencias

```js
import { useState, useMemo, useRef } from "react";
import { create, all } from "mathjs";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./Biseccion.css";

const math = create(all, {});
```

### 3. Estado y referencias

Principales hooks:

- `fxInput`, `aInput`, `bInput`, `tolInput`, `maxIterInput`, `decimalsInput`
- `rows` → lista de iteraciones.
- `message` → mensaje de éxito (solución aproximada).
- `errorMsg` → mensaje de error.
- `tableRef` → referencia al contenedor de la tabla para exportar PDF.
- `svgRef` → referencia al `<svg>` para exportar imagen.

### 4. Compilación y evaluación de `f(x)`

```js
const buildCompiled = (expr) => {
  const trimmed = expr.trim();
  if (!trimmed) return null;

  const normalized = trimmed
    .replace(/ln/gi, "log")
    .replace(/sen/gi, "sin");

  try {
    return math.compile(normalized);
  } catch {
    return null;
  }
};
```

- Se normalizan `ln(x)` → `log(x)` y `sen(x)` → `sin(x)` para comodidad del usuario.
- Se usa `math.compile` para crear una función evaluable `f(x)`.

### 5. Validación de datos

En `handleCalculate` se hace:

- Comprobación de que `f(x)` no esté vacía.
- Conversión y validación de `a`, `b`, `tol`, `maxIter`:
  - `a < b`
  - `tol > 0`
  - `maxIter > 0`
- Evaluación de `f(a)` y `f(b)`:
  - Ambos deben ser finitos.
  - Deben cumplir `f(a) * f(b) < 0` (cambio de signo).

Si algo falla, se asigna un mensaje a `errorMsg` y se detiene el proceso.

### 6. Algoritmo de Bisección

Cada iteración calcula:

- `p = (a + b)/2`
- `f(a)`, `f(b)`, `f(p)`
- `fa_fp = f(a)*f(p)`
- `error = (b - a)/2`

Y luego actualiza el intervalo según el signo de `f(a)*f(p)`:

```js
if (fa_fp < 0) {
  b = p;
  fb = fp;
} else {
  a = p;
  fa = fp;
}
```

Criterios de parada:

- `Math.abs(fp) === 0` (aproximación exacta numéricamente), o
- `error < tol`, o
- se alcanzan `maxIter` iteraciones.

Cada iteración se almacena en `rows` para poder renderizar la tabla y exportar.

### 7. Formato de la tabla

La tabla muestra:

- Iteración `n`.
- Intervalo `[a, b]`.
- Punto medio `p`.
- Valores `f(a)`, `f(b)`, `f(p)`.
- Producto `f(a)*f(p)`.
- Error `(b - a)/2`.

Los números se formatean usando `decimalsInput`:

```js
const formatNumber = (value) => {
  const d = parseInt(decimalsInput, 10);
  const decimals = Number.isNaN(d) ? 6 : d;
  return Number.isFinite(value) ? value.toFixed(decimals) : "NaN";
};
```

### 8. Exportar tabla a CSV

Se recorre `rows` y se genera un archivo CSV usando un `Blob` y un enlace temporal:

- Nombre sugerido: `biseccion_iteraciones.csv`.

### 9. Exportar tabla a PDF

Flujo:

1. `html2canvas(tableRef.current)` genera un `canvas` de la tabla completa.
2. Se transforma a imagen PNG con `canvas.toDataURL("image/png")`.
3. Se inserta en un documento `jsPDF` tamaño A4.
4. Se guarda el archivo como `biseccion_iteraciones.pdf`.

### 10. Gráfica de `f(x)`

Se calcula `graphData` con `useMemo`:

- Determina `xMin` y `xMax` a partir de `a`, `b` con un margen adicional.
- Evalúa `f(x)` en varios puntos (por defecto 120).
- Obtiene `yMin`, `yMax` con margen vertical.
- Genera ticks en ejes X y Y.

En el render:

- Ejes X e Y dibujados con `<line>`.
- Curva de `f(x)` con `<path>` (comando `M` + `L`).
- Sombreado del último intervalo `[a, b]` con `<rect>`.
- Línea roja punteada en la última aproximación `p`.

### 11. Exportar gráfica a PNG / JPG

Se serializa el `<svg>` a string, luego:

1. Se crea un `Blob` tipo `image/svg+xml`.
2. Se carga en un objeto `Image`.
3. Se dibuja la imagen en un `canvas` HTML.
4. Se obtiene `dataURL` con `canvas.toDataURL("image/png")` o `"image/jpeg"`.
5. Se dispara la descarga con un `<a>` temporal.

Se generan archivos:

- `biseccion_grafica.png`
- `biseccion_grafica.jpg`

---

## 📘 Componente `ManualExpresiones.jsx`

Este componente documenta cómo escribir funciones `f(x)` para que `mathjs` y la app las entiendan correctamente.

### Contenido documentado

Incluye ejemplos de:

- **Potencias y polinomios**  
  `x^2`, `x^3 - x - 1`, etc.

- **Exponenciales**  
  `exp(x)`, `e^x`, `exp(-x)`.

- **Raíces**  
  `sqrt(x)`, `cbrt(x)`, `nthRoot(x, 3)`, etc.

- **Trigonométricas directas**  
  `sin(x)`, `cos(x)`, `tan(x)` y aclaración sobre uso de `sen(x)` (convertido internamente a `sin(x)`).

- **Trigonométricas inversas**  
  `asin(x)`, `acos(x)`, `atan(x)`.

- **Trigonométricas hiperbólicas**  
  `sinh(x)`, `cosh(x)`, `tanh(x)`, `asinh(x)`, `acosh(x)`, `atanh(x)`.

- **Logaritmos**  
  - `ln(x)` o `log(x)` → log natural.  
  - `log10(x)` → base 10.  
  - `log(x, b)` → log base `b`.

- **Constantes**  
  - `pi` → π.  
  - `e` → Euler.

- **Valor absoluto y redondeos**  
  `abs(x)`, `sign(x)`, `floor(x)`, `ceil(x)`, `round(x)`, etc.

- **Factorial y combinatoria**  
  `x!`, `factorial(x)`, `combinations(n, k)`, `permutations(n, k)`.

- **Módulo**  
  `mod(a, b)` o `a % b`.

- **Reglas de multiplicación**  
  - Siempre usar `*`: `2*x`, nunca `2x`.  
  - `(x+1)*(x-2)`, no `(x+1)(x-2)` sin `*`.  
  - Combinaciones como `exp(-x)*cos(x)`.

El manual también recuerda que:

- Las funciones trigonométricas trabajan en **radianes**.
- Si la función se sale del dominio (por ejemplo, `log(x)` con `x <= 0`), la app mostrará un mensaje de error en el método de Bisección.

---

## 🧪 Próximos pasos

- Implementar la lógica de los demás métodos numéricos (Punto Fijo, Newton, Secante, etc.) siguiendo la misma estructura:
  - Entrada de datos.
  - Validaciones.
  - Tabla de iteraciones.
  - Opcionalmente, gráfica y opciones de descarga.
- Unificar componentes visuales (botones, tarjetas, tablas) para tener un diseño consistente.
- Publicar la app en GitHub Pages o un servicio similar para tener un prototipo funcional accesible para los estudiantes.

---

## 📄 Licencia

Este proyecto puede utilizarse como herramienta educativa para cursos de métodos numéricos.  
Ajusta esta sección con la licencia que prefieras (MIT, GPL, uso interno, etc.).
