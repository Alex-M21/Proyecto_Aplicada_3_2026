import { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { NavDropdown, Nav, Container, Row, Col } from 'react-bootstrap';
import { FaFacebook, FaYoutube, FaEnvelope } from "react-icons/fa";

import usacLogo from "./assets/usac_logo.png";
import depaLogo from "./assets/depa_logo.png";

import Biseccion from "./metodos/Biseccion";
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
import Jacobi from "./metodos/Jacobi";
import GaussSeidel from "./metodos/GaussSeidel";
import PuntoFijoNoLineal from "./metodos/PuntoFijoNoLineal";
import NewtonNoLineal from "./metodos/NewtonNoLineal";
import ManualExpresiones from "./Manual";

import "./App.css";

// =====================
// Métodos aplicados 3 y 4
// =====================
// Diccionario Mejorado y Completo
const METHODS = [
  // Aplicada 3 - Unidad 2
  { 
    id: "biseccion", 
    name: "Bisección", 
    course: "Aplicada 3", 
    unit: "Unidad 2", 
    description: "Método de bisección para encontrar raíces de f(x) en un intervalo [a, b]. Garantiza convergencia si la función es continua y cambia de signo en los extremos. Apropiado para obtener aproximaciones seguras de la raíz, aunque converge de manera lineal." 
  },
  { 
    id: "punto-fijo", 
    name: "Punto Fijo", 
    course: "Aplicada 3", 
    unit: "Unidad 2", 
    description: "Iteración de punto fijo para resolver f(x)=0. Se requiere reformular la ecuación como x = g(x) y analizar la convergencia mediante |g'(x)| < 1 en el entorno de la raíz. Útil para soluciones cercanas a un valor inicial estable." 
  },
  { 
    id: "newton", 
    name: "Newton-Raphson", 
    course: "Aplicada 3", 
    unit: "Unidad 2", 
    description: "Método de Newton-Raphson para aproximar raíces utilizando la derivada de f(x). Tiene convergencia cuadrática cerca de la raíz, pero requiere un valor inicial cercano y que f'(x) no sea cero. Muy eficiente para funciones diferenciables." 
  },
  { 
    id: "secante", 
    name: "Secante", 
    course: "Aplicada 3", 
    unit: "Unidad 2", 
    description: "Método de secante para aproximar raíces mediante la línea secante entre dos puntos consecutivos. No requiere derivadas, pero la convergencia es menos robusta que Newton-Raphson. Ideal cuando f'(x) es difícil de calcular." 
  },
  { 
    id: "posicion-falsa-1", 
    name: "Posición Falsa I", 
    course: "Aplicada 3", 
    unit: "Unidad 2", 
    description: "Variante I del método de falsa posición, combinando la seguridad de la bisección con una aproximación lineal. Se aplica a funciones continuas con cambio de signo y proporciona convergencia más rápida que la bisección clásica." 
  },
  { 
    id: "posicion-falsa-2", 
    name: "Posición Falsa II", 
    course: "Aplicada 3", 
    unit: "Unidad 2", 
    description: "Variante II del método de falsa posición, optimizada para mejorar la convergencia en funciones asimétricas o con raíces cercanas. Mantiene la seguridad de la bisección pero corrige la lentitud en casos difíciles." 
  },
  { 
    id: "stefensen", 
    name: "Steffensen", 
    course: "Aplicada 3", 
    unit: "Unidad 2", 
    description: "Método de aceleración de punto fijo mediante extrapolación de Aitken. Mejora la velocidad de convergencia de iteraciones de punto fijo sin usar derivadas, útil cuando el método de punto fijo converge lentamente." 
  },
  { 
    id: "muller-real", 
    name: "Müller (real)", 
    course: "Aplicada 3", 
    unit: "Unidad 2", 
    description: "Método de Müller para encontrar raíces reales de polinomios usando interpolación cuadrática de tres puntos consecutivos. Eficaz para polinomios de grado mayor que dos y permite aproximaciones rápidas de raíces reales." 
  },
  { 
    id: "muller-imaginario", 
    name: "Müller (complejo)", 
    course: "Aplicada 3", 
    unit: "Unidad 2", 
    description: "Método de Müller para encontrar raíces complejas de polinomios. Permite aproximar soluciones en el plano complejo mediante interpolación cuadrática y manejo de raíces con parte imaginaria." 
  },

  // Aplicada 3 - Unidad 3
  { 
    id: "lagrange", 
    name: "Polinomio de Lagrange", 
    course: "Aplicada 3", 
    unit: "Unidad 3", 
    description: "Interpolación polinómica de Lagrange. Construye un polinomio que pasa exactamente por un conjunto de puntos dados. Se usa para estimar valores intermedios y construir curvas de ajuste sin resolver sistemas lineales." 
  },
  { 
    id: "neville", 
    name: "Interpolación de Neville", 
    course: "Aplicada 3", 
    unit: "Unidad 3", 
    description: "Interpolación recursiva de Neville. Permite evaluar polinomios interpolantes de forma eficiente, calculando valores intermedios sin reconstruir el polinomio completo. Útil para datos dinámicos o incrementales." 
  },
  { 
    id: "newton-diferencias-divididas", 
    name: "Diferencias Divididas de Newton", 
    course: "Aplicada 3", 
    unit: "Unidad 3", 
    description: "Polinomio de Newton con diferencias divididas. Facilita agregar nuevos puntos al polinomio interpolante sin recalcular desde cero. Muy útil cuando se tienen datos que se actualizan frecuentemente." 
  },

  // Aplicada 3 - Unidad 4
  { 
    id: "jacobi", 
    name: "Jacobi", 
    course: "Aplicada 3", 
    unit: "Unidad 4", 
    description: "Método iterativo Jacobi para resolver sistemas lineales Ax = b. Requiere que la matriz A tenga diagonales dominantes para garantizar convergencia. Ideal para sistemas grandes y dispersos donde métodos directos son costosos." 
  },
  { 
    id: "gauss-seidel", 
    name: "Gauss-Seidel", 
    course: "Aplicada 3", 
    unit: "Unidad 4", 
    description: "Método iterativo Gauss-Seidel para sistemas lineales. Mejora la convergencia usando los valores más recientes de x durante la iteración. Más rápido que Jacobi en muchos casos y ampliamente usado en problemas de ingeniería." 
  },

  // Aplicada 3 - Unidad 5
  { 
    id: "punto-fijo-no-lineal", 
    name: "Punto Fijo No Lineal", 
    course: "Aplicada 3", 
    unit: "Unidad 5", 
    description: "Iteración de punto fijo para sistemas no lineales de varias ecuaciones. Se aplica para resolver ecuaciones simultáneas usando aproximaciones sucesivas, requiere análisis de convergencia y buen valor inicial." 
  },
  { 
    id: "newton-no-lineal", 
    name: "Newton No Lineal", 
    course: "Aplicada 3", 
    unit: "Unidad 5", 
    description: "Newton generalizado para sistemas no lineales. Utiliza la matriz Jacobiana para actualizar aproximaciones y converge rápidamente si el vector inicial está cerca de la solución. Es sensible a singularidades y malos puntos iniciales." 
  },

  // Aplicada 4 - Plantilla lista para 10 métodos
  { id: "ap4-metodo1", name: "Método 1", course: "Aplicada 4", unit: "Unidad 2", description: "Método 1 de Aplicada 4. Descripción detallada pendiente: indique su objetivo, tipo de problema y condiciones de uso." },
  { id: "ap4-metodo2", name: "Método 2", course: "Aplicada 4", unit: "Unidad 2", description: "Método 2 de Aplicada 4. Descripción detallada pendiente: indique su objetivo, tipo de problema y condiciones de uso." },
  { id: "ap4-metodo3", name: "Método 3", course: "Aplicada 4", unit: "Unidad 3", description: "Método 3 de Aplicada 4. Descripción detallada pendiente: indique su objetivo, tipo de problema y condiciones de uso." },
  { id: "ap4-metodo4", name: "Método 4", course: "Aplicada 4", unit: "Unidad 3", description: "Método 4 de Aplicada 4. Descripción detallada pendiente: indique su objetivo, tipo de problema y condiciones de uso." },
  { id: "ap4-metodo5", name: "Método 5", course: "Aplicada 4", unit: "Unidad 4", description: "Método 5 de Aplicada 4. Descripción detallada pendiente: indique su objetivo, tipo de problema y condiciones de uso." },
  { id: "ap4-metodo6", name: "Método 6", course: "Aplicada 4", unit: "Unidad 4", description: "Método 6 de Aplicada 4. Descripción detallada pendiente: indique su objetivo, tipo de problema y condiciones de uso." },
  { id: "ap4-metodo7", name: "Método 7", course: "Aplicada 4", unit: "Unidad 5", description: "Método 7 de Aplicada 4. Descripción detallada pendiente: indique su objetivo, tipo de problema y condiciones de uso." },
  { id: "ap4-metodo8", name: "Método 8", course: "Aplicada 4", unit: "Unidad 5", description: "Método 8 de Aplicada 4. Descripción detallada pendiente: indique su objetivo, tipo de problema y condiciones de uso." },
  { id: "ap4-metodo9", name: "Método 9", course: "Aplicada 4", unit: "Unidad 5", description: "Método 9 de Aplicada 4. Descripción detallada pendiente: indique su objetivo, tipo de problema y condiciones de uso." },
  { id: "ap4-metodo10", name: "Método 10", course: "Aplicada 4", unit: "Unidad 5", description: "Método 10 de Aplicada 4. Descripción detallada pendiente: indique su objetivo, tipo de problema y condiciones de uso." },

  // Ayuda
  { 
    id: "manual-expresiones", 
    name: "Manual de Expresiones", 
    course: "Ayuda", 
    unit: "", 
    description: "Guía rápida de expresiones matemáticas: operadores, funciones, notación y ejemplos de uso, para referencia rápida durante cálculos y programación de métodos." 
  }
];

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
  jacobi: Jacobi,
  "gauss-seidel": GaussSeidel,
  "punto-fijo-no-lineal": PuntoFijoNoLineal,
  "newton-no-lineal": NewtonNoLineal,
  "ap4-metodo1": () => <div>Método Aplicada 4 - 1</div>,
  "ap4-metodo2": () => <div>Método Aplicada 4 - 2</div>,
  "ap4-metodo3": () => <div>Método Aplicada 4 - 3</div>,
  "ap4-metodo4": () => <div>Método Aplicada 4 - 4</div>,
  "ap4-metodo5": () => <div>Método Aplicada 4 - 5</div>,
  "ap4-metodo6": () => <div>Método Aplicada 4 - 6</div>,
  "ap4-metodo7": () => <div>Método Aplicada 4 - 7</div>,
  "ap4-metodo8": () => <div>Método Aplicada 4 - 8</div>,
  "ap4-metodo9": () => <div>Método Aplicada 4 - 9</div>,
  "ap4-metodo10": () => <div>Método Aplicada 4 - 10</div>,
  "manual-expresiones": ManualExpresiones
};

export default function App() {
  const [selectedMethodId, setSelectedMethodId] = useState(METHODS[0].id);
  const selectedMethod = METHODS.find(m => m.id === selectedMethodId);
  const SelectedComponent = METHOD_COMPONENTS[selectedMethodId];

  // Cursos excluyendo Ayuda
  const courses = [...new Set(METHODS.filter(m => m.course !== "Ayuda").map(m => m.course))];

  return (
    <div className="d-flex flex-column min-vh-100">
      <div className="d-flex flex-grow-1">

        {/* Sidebar */}
<aside className="sidebar">
  <h5>Menú Métodos</h5>
  <Nav className="flex-column">
    {courses.map(course => (
      <NavDropdown title={course} key={course} id={`dropdown-${course}`} className="mb-2 navbar">
        {[...new Set(METHODS.filter(m => m.course === course).map(m => m.unit))].map(unit => (
          <NavDropdown key={unit} title={unit} drop="end" className="px-2 navbar">
            {METHODS.filter(m => m.course === course && m.unit === unit).map(method => (
              <NavDropdown.Item
                key={method.id}
                active={method.id === selectedMethodId}
                onClick={() => setSelectedMethodId(method.id)}
              >
                {method.name}
              </NavDropdown.Item>
            ))}
          </NavDropdown>
        ))}
      </NavDropdown>
    ))}
  </Nav>

  <div className="mt-3">
    <button
      className={`btn w-100 ${selectedMethod?.id === "manual-expresiones" ? "active" : ""}`}
      onClick={() => setSelectedMethodId("manual-expresiones")}
    >
      Manual de Expresiones
    </button>
  </div>
</aside>

        {/* Contenido principal */}
        <main className="flex-grow-1 p-4">
          <h3>{selectedMethod?.name}</h3>
          <p>{selectedMethod?.description}</p>
          {SelectedComponent && <SelectedComponent />}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-light text-secondary py-5 mt-auto border-top">
        <Container>
          <Row className="gy-4 align-items-center">
            <Col lg={3} md={6} className="text-center text-lg-start">
              <img src={usacLogo} alt="USAC Logo" width="220" height="220" style={{ objectFit: 'contain' }} />
            </Col>
            <Col lg={3} md={6} className="text-center text-lg-start">
              <img src={depaLogo} alt="Departamento de Matemática Logo" width="220" height="220" style={{ objectFit: 'contain' }} />
            </Col>
            <Col lg={3} md={6} className="text-center text-lg-start">
              <p className="text-muted mb-0">Departamento de Matemática</p>
              <p className="text-muted mb-0">Facultad de Ingeniería</p>
              <p className="text-muted mb-0">Escuela de Ciencias y Sistemas</p>
              <p className="text-muted mb-0">Desarrollado por Alexander Mejia - Revisado por MSc. Renaldo Girón</p>
            </Col>
            <Col lg={3} md={6} className="text-center text-lg-start">
              <ul className="list-unstyled d-flex flex-column gap-2">
                <li><a href="https://matematica.fi.usac.edu.gt" target="_blank" className="text-decoration-none text-secondary">🌐 Página Departamento</a></li>
                <li><a href="https://www.facebook.com/DepartamentoMatematicaUSAC" target="_blank" className="text-decoration-none text-secondary"><FaFacebook className="me-1"/> Facebook</a></li>
                <li><a href="https://www.youtube.com/@Math4Ingenieria" target="_blank" className="text-decoration-none text-secondary"><FaYoutube className="me-1"/> YouTube</a></li>
                <li><a href="mailto:b.alex.mejia@gmail.com" className="text-decoration-none text-secondary"><FaEnvelope className="me-1"/> Soporte</a></li>
              </ul>
            </Col>
          </Row>
          <hr className="my-4 text-muted opacity-25" />
          <Row className="align-items-center text-muted">
            <Col sm={6} className="text-center text-sm-start">
              &copy; {new Date().getFullYear()} Universidad de San Carlos de Guatemala
            </Col>
            <Col sm={6} className="text-center text-sm-end mt-2 mt-sm-0">
              <a href="#privacidad" className="text-secondary text-decoration-none me-3">Privacidad</a>
              <a href="#soporte" className="text-secondary text-decoration-none">Soporte</a>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
}