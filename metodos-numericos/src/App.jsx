/**
 *  Desarrollador : Alexander Mejia
 *  GitHub        : Alex-M21
 *  Email         : b.alex.mejia@gmail.com
 *
 *  ADVERTENCIA:
 *  Estás modificando código protegido. DO NOT COPY AND PASTE.
 *  Para cualquier cambio comunícate con: b.alex.mejia@gmail.com
 *
 *  
."-,.__
                 `.     `.  ,
              .--'  .._,'"-' `.
             .    .'         `'
             `.   /          ,'
               `  '--.   ,-"'
                `"`   |  \
                   -. \, |
                    `--Y.'      ___.
                         \     L._, \
               _.,        `.   <  <\                _
             ,' '           `, `.   | \            ( `
          ../, `.            `  |    .\`.           \ \_
         ,' ,..  .           _.,'    ||\l            )  '".
        , ,'   \           ,'.-.`-._,'  |           .  _._`.
      ,' /      \ \        `' ' `--/   | \          / /   ..\
    .'  /        \ .         |\__ - _ ,'` `        / /     `.`.
    |  '          ..         `-...-"  |  `-'      / /        . `.
    | /           |L__           |    |          / /          `. `.
   , /            .   .          |    |         / /             ` `
  / /          ,. ,`._ `-_       |    |  _   ,-' /               ` \
 / .           \"`_/. `-_ \_,.  ,'    +-' `-'  _,        ..,-.    \`.
.  '         .-f    ,'   `    '.       \__.---'     _   .'   '     \ \
' /          `.'    l     .' /          \..      ,_|/   `.  ,'`     L`
|'      _.-""` `.    \ _,'  `            \ `.___`.'"`-.  , |   |    | \
||    ,'      `. `.   '       _,...._        `  |    `/ '  |   '     .|
||  ,'          `. ;.,.---' ,'       `.   `.. `-'  .-' /_ .'    ;_   ||
|| '              V      / /           `   | `   ,'   ,' '.    !  `. ||
||/            _,-------7 '              . |  `-'    l         /    `||
. |          ,' .-   ,' ||               | .-.        `.      .'     ||
 `'        ,'    `".'    |               |    `.        '. -.'       `'
          /      ,'      |               |,'    \-.._,.'/'
          .     /        .               .       \    .''
        .`.    |         `.             /         :_,'.'
          \ `...\   _     ,'-.        .'         /_.-'
           `-.__ `,  `'   .  _.>----''.  _  __  /
                .'        /"'          |  "'   '_
               /_|.-'\ ,".             '.'`__'-( \
                 / ,"'"\,'               `/  `-.|"
 */


import { useState } from "react";
import logoImage from "./assets/escudo-color-USAC-2022.png"
import Biseccion from "./metodos/Biseccion";
import ManualExpresiones from "./Manual";

import PuntoFijo from "./metodos/PuntoFijo";

import Newton from "./metodos/Newton";
import Secante from "./metodos/Secante";
import PosicionFalsa1 from "./metodos/PosicionFalsa1";
import PosicionFalsa2 from "./metodos/PosicionFalsa2";
import Stefensen from "./metodos/Stefensen";
import MullerReal from "./metodos/MullerReal";
import MullerImaginario from "./metodos/MullerImaginario";
import Lagrange from "./metodos/Lagrange";
import Neville from "./metodos/Neville";
import NewtonDiferenciasDivididas from "./metodos/NewtonDiferenciasDivididas";
//import Jacobi from "./metodos/Jacobi";
//import GaussSeidel from "./metodos/GaussSeidel";
//import PuntoFijoNoLineal from "./metodos/PuntoFijoNoLineal";
//import NewtonNoLineal from "./metodos/NewtonNoLineal";

// =====================
// Definición del menú
// =====================

const METHODS = [
  // 🔹 Unidad 2
  {
    id: "biseccion",
    name: "Bisección",
    unit: "Unidad 2",
    description:
      "Para encontrar una solución a f(x) = 0 dada la función continua determinada f en el interval [a, b], donde f(a) y f(b) tienen signos opuestos"
  },
  {
    id: "punto-fijo",
    name: "Punto fijo",
    unit: "Unidad 2",
    description:
      "Transforma f(x)=0 en x=g(x) y busca el punto fijo por iteración sucesiva."
  },
  {
    id: "newton",
    name: "Newton",
    unit: "Unidad 2",
    description:
      "Método de raíces que utiliza la derivada f'(x) para lograr convergencia rápida."
  },
  {
    id: "secante",
    name: "Secante",
    unit: "Unidad 2",
    description:
      "Aproxima la derivada con diferencias finitas, evitando calcular f'(x) de forma analítica."
  },
  {
    id: "posicion-falsa-1",
    name: "Posición falsa I",
    unit: "Unidad 2",
    description:
      "Variante del método de falsa posición para aproximar raíces en un intervalo."
  },
  {
    id: "posicion-falsa-2",
    name: "Posición falsa II",
    unit: "Unidad 2",
    description:
      "Segunda variante del método de falsa posición, con ajustes en la actualización del intervalo."
  },
  {
    id: "stefensen",
    name: "Steffensen",
    unit: "Unidad 2",
    description:
      "Acelera la convergencia de un método de punto fijo usando la idea de Aitken."
  },
  {
    id: "muller-real",
    name: "Müller (real)",
    unit: "Unidad 2",
    description:
      "Método que aproxima raíces reales usando interpolación cuadrática."
  },
  {
    id: "muller-imaginario",
    name: "Müller (imaginario)",
    unit: "Unidad 2",
    description:
      "Extensión del método de Müller que permite obtener raíces complejas."
  },

  // 🔹 Unidad 3
  {
    id: "lagrange",
    name: "Polinomio de Lagrange",
    unit: "Unidad 3",
    description:
      "Construye un polinomio que interpola exactamente los puntos dados."
  },
  {
    id: "neville",
    name: "Aproximación de Neville",
    unit: "Unidad 3",
    description:
      "Algoritmo recursivo para interpolar en un punto a partir de datos tabulados."
  },
  {
    id: "newton-diferencias-divididas",
    name: "Diferencias divididas de Newton",
    unit: "Unidad 3",
    description:
      "Usa una tabla de diferencias divididas para obtener el polinomio interpolante de Newton."
  },

  // 🔹 Unidad 4
  {
    id: "jacobi",
    name: "Jacobi",
    unit: "Unidad 4",
    description:
      "Método iterativo para sistemas lineales, actualiza todas las incógnitas con valores de la iteración anterior."
  },
  {
    id: "gauss-seidel",
    name: "Gauss-Seidel",
    unit: "Unidad 4",
    description:
      "Método iterativo que usa los valores más recientes disponibles dentro de la misma iteración."
  },

  // 🔹 Unidad 5
  {
    id: "punto-fijo-no-lineal",
    name: "Punto fijo no lineal",
    unit: "Unidad 5",
    description:
      "Extiende la idea de punto fijo a sistemas no lineales usando funciones vectoriales."
  },
  {
    id: "newton-no-lineal",
    name: "Newton no lineal",
    unit: "Unidad 5",
    description:
      "Generalización de Newton para sistemas no lineales usando la matriz Jacobiana."
  },
    {
    id: "manual-expresiones",
    name: "Manual de expresiones",
    unit: "Ayuda",
    description:
      "Guía rápida para escribir funciones f(x) con la sintaxis de la calculadora."
  }

];

const UNITS = [...new Set(METHODS.map((m) => m.unit))];

// =====================
// Componentes por método
// (por ahora solo Bisección viene de otro archivo;
// los demás son placeholders internos)
// =====================







function JacobiComponent() {
  return (
    <div>
      <h3>Configuración: Jacobi</h3>
      <p>
        Permitirá ingresar la matriz A, el vector b, vector inicial y mostrar la
        tabla de iteraciones.
      </p>
    </div>
  );
}

function GaussSeidelComponent() {
  return (
    <div>
      <h3>Configuración: Gauss-Seidel</h3>
      <p>
        Similar a Jacobi, pero usando actualización inmediata de las incógnitas.
      </p>
    </div>
  );
}

function PuntoFijoNoLineal() {
  return (
    <div>
      <h3>Configuración: Punto fijo no lineal</h3>
      <p>
        Aquí configuraremos el sistema g(x) para problemas no lineales en varias
        variables.
      </p>
    </div>
  );
}

function NewtonNoLineal() {
  return (
    <div>
      <h3>Configuración: Newton no lineal</h3>
      <p>
        Se definirá el sistema f(x) y la Jacobiana para resolver sistemas no
        lineales.
      </p>
    </div>
  );
}

// =====================
// Mapeo id → componente
// =====================

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
  "manual-expresiones": ManualExpresiones   // 👈 nueva línea
};

// =====================
// App principal
// =====================

function App() {
  const [selectedMethodId, setSelectedMethodId] = useState(METHODS[0].id);
  const selectedMethod = METHODS.find((m) => m.id === selectedMethodId);
  const SelectedComponent = METHOD_COMPONENTS[selectedMethodId];

  return (
    <div className="app-layout">
      {/* Menú lateral */}
      <aside className="sidebar">
        <h1 className="app-title">Métodos numéricos</h1>
        <h5>Universidad de San Carlos de Guatemala</h5>
        <h5>Fascultad de Ingenieria</h5>
        <h5>Escuela de Ciencias</h5>
        <h5>Departamento de matematicas</h5>
        <h5>Desarrollador: Alexander Mejia</h5>

        {UNITS.map((unit) => (
          <div key={unit} className="method-category">
            <h2 className="method-category-title">{unit}</h2>
            <ul className="method-list">
              {METHODS.filter((m) => m.unit === unit).map((method) => (
                <li key={method.id}>
                  <button
                    className={
                      "method-button" +
                      (method.id === selectedMethodId ? " active" : "")
                    }
                    onClick={() => setSelectedMethodId(method.id)}
                  >
                    {method.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>

      {/* Contenido principal */}
      <main className="content">
        <header className="content-header">
          <h2>{selectedMethod.name}</h2>
          <p className="method-description">{selectedMethod.description}</p>
        </header>

        <section className="placeholder">
          {SelectedComponent ? (
            <SelectedComponent />
          ) : (
            <p>Selecciona un método del menú.</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
