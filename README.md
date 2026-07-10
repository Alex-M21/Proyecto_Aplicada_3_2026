# 📐 Aplicación Web de Métodos Numéricos

![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-Build%20Tool-646CFF?logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)
![Math.js](https://img.shields.io/badge/Math.js-Cálculo%20numérico-red)
![Estado](https://img.shields.io/badge/Estado-Finalizado-success)
![Uso](https://img.shields.io/badge/Uso-Académico-blue)

## Descripción

La **Aplicación Web de Métodos Numéricos** es una herramienta educativa desarrollada con **React y Vite** para apoyar el aprendizaje, la práctica y la verificación de procedimientos numéricos utilizados en cursos universitarios.

La plataforma reúne diferentes métodos para la solución de ecuaciones no lineales, interpolación, sistemas de ecuaciones lineales y sistemas de ecuaciones no lineales.

Cada módulo permite ingresar los datos requeridos, ejecutar el procedimiento, consultar los resultados y analizar las iteraciones generadas.

El proyecto fue diseñado con una interfaz clara, navegación por unidades y componentes independientes para cada método.

> El sistema tiene fines académicos y educativos. Los resultados deben interpretarse de acuerdo con las condiciones, hipótesis y criterios de convergencia de cada método.

---

## ✅ Estado del proyecto

**Proyecto finalizado.**

La versión final integra los métodos numéricos contemplados en el curso, el manual de expresiones matemáticas, validaciones de entrada y herramientas para visualizar o exportar resultados según el método seleccionado.

---

## 🎯 Objetivos

- Facilitar la aplicación de métodos numéricos mediante una interfaz web.
- Mostrar ordenadamente las iteraciones realizadas por cada algoritmo.
- Reducir errores de cálculo durante la práctica académica.
- Permitir la comparación entre diferentes métodos.
- Apoyar la enseñanza mediante tablas, mensajes de convergencia y gráficas.
- Proporcionar una herramienta accesible desde un navegador web.

---

## 🧮 Métodos incluidos

### Unidad 2 — Solución de ecuaciones no lineales

- Método de Bisección.
- Método de Punto Fijo.
- Método de Newton-Raphson.
- Método de la Secante.
- Método de Posición Falsa I.
- Método de Posición Falsa II.
- Método de Steffensen.
- Método de Müller para raíces reales.
- Método de Müller para raíces complejas.

### Unidad 3 — Interpolación

- Interpolación de Lagrange.
- Interpolación de Neville.
- Diferencias divididas de Newton.

### Unidad 4 — Sistemas de ecuaciones lineales

- Método de Jacobi.
- Método de Gauss-Seidel.

### Unidad 5 — Sistemas de ecuaciones no lineales

- Método de Punto Fijo no lineal.
- Método de Newton no lineal.

### Ayuda

- Manual de expresiones matemáticas.
- Ejemplos de sintaxis compatibles con `mathjs`.
- Recomendaciones para ingresar correctamente las funciones.

---

## 🚀 Funcionalidades principales

La aplicación incluye:

- Menú lateral organizado por unidades.
- Selección dinámica de métodos.
- Formularios específicos para cada algoritmo.
- Validación de datos de entrada.
- Evaluación de funciones mediante `mathjs`.
- Control de tolerancia.
- Control del número máximo de iteraciones.
- Selección de la cantidad de decimales.
- Tablas detalladas de iteraciones.
- Mensajes de convergencia, resultado o error.
- Gráficas de funciones en los métodos que lo requieren.
- Visualización de intervalos y aproximaciones.
- Exportación de resultados.
- Diseño adaptable a diferentes tamaños de pantalla.
- Manual integrado para escribir expresiones matemáticas.

---

## 📊 Resultados y exportaciones

Dependiendo del método seleccionado, la aplicación permite:

- Consultar el resultado aproximado.
- Visualizar el número de iteraciones.
- Revisar errores absolutos o relativos.
- Analizar valores intermedios.
- Descargar tablas en formato CSV.
- Descargar tablas en formato PDF.
- Exportar gráficas en formato PNG.
- Exportar gráficas en formato JPG.

---

## 🧱 Tecnologías utilizadas

- **React** — Construcción de la interfaz mediante componentes.
- **Vite** — Entorno de desarrollo y compilación.
- **JavaScript** — Implementación de los algoritmos numéricos.
- **CSS** — Diseño visual y adaptación responsive.
- **mathjs** — Interpretación y evaluación de expresiones matemáticas.
- **jsPDF** — Generación de documentos PDF.
- **html2canvas** — Conversión de tablas o elementos HTML a imágenes.
- **SVG** — Representación gráfica de funciones.
- **Git y GitHub** — Control de versiones y publicación del proyecto.

---

## 📂 Estructura general

```text
src/
├── App.jsx
├── App.css
├── assets/
├── components/
└── metodos/
    ├── Biseccion.jsx
    ├── PuntoFijo.jsx
    ├── Newton.jsx
    ├── Secante.jsx
    ├── PosicionFalsa1.jsx
    ├── PosicionFalsa2.jsx
    ├── Steffensen.jsx
    ├── MullerReal.jsx
    ├── MullerImaginario.jsx
    ├── Lagrange.jsx
    ├── Neville.jsx
    ├── NewtonDiferenciasDivididas.jsx
    ├── Jacobi.jsx
    ├── GaussSeidel.jsx
    ├── PuntoFijoNoLineal.jsx
    ├── NewtonNoLineal.jsx
    ├── ManualExpresiones.jsx
    └── archivos CSS de cada componente
```

La estructura puede variar ligeramente según la organización final del repositorio.

---

## ⚙️ Requisitos

Antes de ejecutar el proyecto, se debe contar con:

- Node.js 18 o superior.
- npm.
- Git, en caso de clonar el repositorio.

---

## 💻 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU-USUARIO/TU-REPOSITORIO.git
```

### 2. Ingresar a la carpeta del proyecto

```bash
cd TU-REPOSITORIO
```

### 3. Instalar las dependencias

```bash
npm install
```

### 4. Ejecutar el proyecto

```bash
npm run dev
```

Vite mostrará una dirección local similar a:

```text
http://localhost:5173
```

---

## 📦 Dependencias principales

En caso de necesitar instalar las dependencias manualmente:

```bash
npm install mathjs jspdf html2canvas
```

---

## 🏗️ Compilación

Para generar la versión optimizada de producción:

```bash
npm run build
```

Los archivos compilados se almacenarán en la carpeta:

```text
dist/
```

Para revisar la compilación localmente:

```bash
npm run preview
```

---

## 🧭 Uso de la aplicación

1. Seleccionar una unidad en el menú lateral.
2. Elegir el método numérico que se desea utilizar.
3. Ingresar la función, intervalo, valores iniciales, matriz o datos requeridos.
4. Definir la tolerancia y el máximo de iteraciones cuando corresponda.
5. Presionar el botón de cálculo.
6. Revisar el resultado y la tabla de iteraciones.
7. Analizar la gráfica cuando el método la incluya.
8. Descargar los resultados disponibles.

---

## ✍️ Sintaxis de expresiones matemáticas

Las funciones deben escribirse utilizando una sintaxis compatible con `mathjs`.

### Ejemplos

| Expresión matemática | Entrada en la aplicación |
|---|---|
| \(x^2-4\) | `x^2 - 4` |
| \(x^3-x-1\) | `x^3 - x - 1` |
| \(e^x\) | `exp(x)` o `e^x` |
| \(\sqrt{x}\) | `sqrt(x)` |
| \(\sin(x)\) | `sin(x)` o `sen(x)` |
| \(\cos(x)\) | `cos(x)` |
| \(\ln(x)\) | `log(x)` o `ln(x)` |
| \(|x|\) | `abs(x)` |
| \(\pi\) | `pi` |

### Reglas importantes

- Utilizar `*` para multiplicar: `2*x`.
- No escribir `2x`.
- Utilizar correctamente los paréntesis.
- Las funciones trigonométricas trabajan en radianes.
- Verificar el dominio de logaritmos, raíces y divisiones.
- Separar los argumentos con coma cuando una función lo requiera.

Ejemplo:

```text
exp(-x)*cos(x) - 0.5
```

---

## 🛡️ Validaciones

La aplicación verifica, según el método:

- Campos obligatorios.
- Valores numéricos válidos.
- Intervalos correctamente definidos.
- Tolerancias mayores que cero.
- Cantidades de iteraciones válidas.
- Compatibilidad de dimensiones en matrices.
- Valores iniciales requeridos.
- Dominio de las funciones.
- Cambios de signo cuando el algoritmo lo requiere.
- División entre valores cercanos a cero.
- Condiciones básicas de convergencia.

Cuando los datos no cumplen las condiciones requeridas, el sistema muestra un mensaje informativo y evita ejecutar el procedimiento con entradas inválidas.

---

## 📘 Manual de expresiones

La aplicación incorpora una sección de ayuda con ejemplos de:

- Potencias.
- Polinomios.
- Exponenciales.
- Raíces.
- Funciones trigonométricas.
- Funciones trigonométricas inversas.
- Funciones hiperbólicas.
- Logaritmos.
- Constantes matemáticas.
- Valor absoluto.
- Redondeos.
- Factoriales.
- Combinaciones.
- Permutaciones.
- Operaciones de módulo.

Este manual ayuda al usuario a escribir las funciones correctamente antes de ejecutar un método.

---

## 🖼️ Capturas de pantalla

Se recomienda guardar las imágenes dentro de una carpeta llamada `screenshots`.

```text
screenshots/
├── inicio.png
├── biseccion.png
├── interpolacion.png
├── sistemas-lineales.png
└── manual-expresiones.png
```

Para mostrarlas dentro del README:

```markdown
![Pantalla principal](./screenshots/inicio.png)

![Método de Bisección](./screenshots/biseccion.png)

![Manual de expresiones](./screenshots/manual-expresiones.png)
```

---

## 🌐 Publicación

El proyecto puede publicarse en:

- GitHub Pages.
- Netlify.
- Vercel.
- Firebase Hosting.
- Cualquier servidor compatible con aplicaciones estáticas.

Para GitHub Pages, se debe configurar correctamente la propiedad `base` de Vite con el nombre del repositorio.

Ejemplo:

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/NOMBRE_DEL_REPOSITORIO/",
});
```

### Scripts para GitHub Pages

Se puede instalar `gh-pages` con:

```bash
npm install gh-pages --save-dev
```

En el archivo `package.json` se pueden agregar los siguientes scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

Para publicar la aplicación:

```bash
npm run deploy
```

---

## 🎓 Alcance académico

La aplicación fue desarrollada como proyecto universitario para apoyar el curso de Métodos Numéricos.

Permite estudiar:

- Comportamiento de los algoritmos.
- Velocidad de convergencia.
- Influencia de los valores iniciales.
- Efecto de la tolerancia.
- Comparación de aproximaciones.
- Análisis de errores.
- Interpretación de tablas de iteración.
- Solución aproximada de problemas matemáticos.

---

## ⚠️ Consideraciones

- Los resultados dependen de los datos ingresados.
- Algunos métodos no convergen para cualquier valor inicial.
- Una tolerancia demasiado pequeña puede aumentar el número de iteraciones.
- Las funciones deben respetar su dominio matemático.
- Los errores de redondeo pueden afectar las últimas cifras.
- La aplicación no sustituye el análisis matemático del problema.
- Se recomienda verificar los resultados obtenidos.

---

## 🤝 Contribuciones

El proyecto se encuentra concluido. Sin embargo, se pueden realizar mejoras mediante el siguiente procedimiento:

1. Crear una rama independiente.
2. Implementar los cambios.
3. Realizar pruebas de funcionamiento.
4. Enviar un `pull request`.

---

## 📄 Licencia

Este proyecto fue desarrollado con fines académicos y educativos.

Antes de reutilizar, distribuir o modificar el código, se recomienda revisar el archivo `LICENSE` del repositorio o definir una licencia de uso, como MIT, GPL u otra que corresponda a las condiciones del proyecto.

---

## 🏁 Conclusión

La Aplicación Web de Métodos Numéricos centraliza diferentes algoritmos en una sola plataforma interactiva.

Su diseño por componentes facilita la navegación, la práctica de procedimientos y la interpretación de resultados.

El proyecto representa una herramienta de apoyo para estudiantes y docentes interesados en comprender el funcionamiento de los métodos numéricos mediante cálculos, iteraciones, tablas y representaciones gráficas.

---

## 👨‍💻 Autor

Desarrollado como proyecto universitario para el curso de Métodos Numéricos.
