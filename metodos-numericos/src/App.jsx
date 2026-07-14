import { useMemo, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { NavDropdown, Nav, Container, Row, Col } from "react-bootstrap";
import {
  FaFacebook,
  FaYoutube,
  FaEnvelope,
  FaGraduationCap,
  FaBookOpen,
  FaCalculator,
  FaLayerGroup,
  FaUniversity,
} from "react-icons/fa";

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
// Métodos de Matemática Aplicada 3
// =====================
const METHODS = [
  // Aplicada 3 - Unidad 2
  {
    id: "biseccion",
    name: "Bisección",
    course: "Aplicada 3",
    unit: "Unidad 2",
    description:
      "Método de bisección para encontrar raíces de f(x) en un intervalo [a, b]. Garantiza convergencia si la función es continua y cambia de signo en los extremos. Apropiado para obtener aproximaciones seguras de la raíz, aunque converge de manera lineal.",
    type: "Método cerrado",
  },
  {
    id: "punto-fijo",
    name: "Punto Fijo",
    course: "Aplicada 3",
    unit: "Unidad 2",
    description:
      "Iteración de punto fijo para resolver f(x)=0. Se requiere reformular la ecuación como x = g(x) y analizar la convergencia mediante |g'(x)| < 1 en el entorno de la raíz. Útil para soluciones cercanas a un valor inicial estable.",
    type: "Método abierto",
  },
  {
    id: "newton",
    name: "Newton-Raphson",
    course: "Aplicada 3",
    unit: "Unidad 2",
    description:
      "Método de Newton-Raphson para aproximar raíces utilizando la derivada de f(x). Tiene convergencia cuadrática cerca de la raíz, pero requiere un valor inicial cercano y que f'(x) no sea cero. Muy eficiente para funciones diferenciables.",
    type: "Método abierto",
  },
  {
    id: "secante",
    name: "Secante",
    course: "Aplicada 3",
    unit: "Unidad 2",
    description:
      "Método de secante para aproximar raíces mediante la línea secante entre dos puntos consecutivos. No requiere derivadas, pero la convergencia es menos robusta que Newton-Raphson. Ideal cuando f'(x) es difícil de calcular.",
    type: "Método abierto",
  },
  {
    id: "posicion-falsa-1",
    name: "Posición Falsa I",
    course: "Aplicada 3",
    unit: "Unidad 2",
    description:
      "Variante I del método de falsa posición, combinando la seguridad de la bisección con una aproximación lineal. Se aplica a funciones continuas con cambio de signo y proporciona convergencia más rápida que la bisección clásica.",
    type: "Método cerrado",
  },
  {
    id: "posicion-falsa-2",
    name: "Posición Falsa II",
    course: "Aplicada 3",
    unit: "Unidad 2",
    description:
      "Variante II del método de falsa posición, optimizada para mejorar la convergencia en funciones asimétricas o con raíces cercanas. Mantiene la seguridad de la bisección pero corrige la lentitud en casos difíciles.",
    type: "Método cerrado",
  },
  {
    id: "stefensen",
    name: "Steffensen",
    course: "Aplicada 3",
    unit: "Unidad 2",
    description:
      "Método de aceleración de punto fijo mediante extrapolación de Aitken. Mejora la velocidad de convergencia de iteraciones de punto fijo sin usar derivadas, útil cuando el método de punto fijo converge lentamente.",
    type: "Aceleración",
  },
  {
    id: "muller-real",
    name: "Müller (real)",
    course: "Aplicada 3",
    unit: "Unidad 2",
    description:
      "Método de Müller para encontrar raíces reales de polinomios usando interpolación cuadrática de tres puntos consecutivos. Eficaz para polinomios de grado mayor que dos y permite aproximaciones rápidas de raíces reales.",
    type: "Raíces polinomiales",
  },
  {
    id: "muller-imaginario",
    name: "Müller (complejo)",
    course: "Aplicada 3",
    unit: "Unidad 2",
    description:
      "Método de Müller para encontrar raíces complejas de polinomios. Permite aproximar soluciones en el plano complejo mediante interpolación cuadrática y manejo de raíces con parte imaginaria.",
    type: "Raíces complejas",
  },

  // Aplicada 3 - Unidad 3
  {
    id: "lagrange",
    name: "Polinomio de Lagrange",
    course: "Aplicada 3",
    unit: "Unidad 3",
    description:
      "Interpolación polinómica de Lagrange. Construye un polinomio que pasa exactamente por un conjunto de puntos dados. Se usa para estimar valores intermedios y construir curvas de ajuste sin resolver sistemas lineales.",
    type: "Interpolación",
  },
  {
    id: "neville",
    name: "Interpolación de Neville",
    course: "Aplicada 3",
    unit: "Unidad 3",
    description:
      "Interpolación recursiva de Neville. Permite evaluar polinomios interpolantes de forma eficiente, calculando valores intermedios sin reconstruir el polinomio completo. Útil para datos dinámicos o incrementales.",
    type: "Interpolación",
  },
  {
    id: "newton-diferencias-divididas",
    name: "Diferencias Divididas de Newton",
    course: "Aplicada 3",
    unit: "Unidad 3",
    description:
      "Polinomio de Newton con diferencias divididas. Facilita agregar nuevos puntos al polinomio interpolante sin recalcular desde cero. Muy útil cuando se tienen datos que se actualizan frecuentemente.",
    type: "Interpolación",
  },

  // Aplicada 3 - Unidad 4
  {
    id: "jacobi",
    name: "Jacobi",
    course: "Aplicada 3",
    unit: "Unidad 4",
    description:
      "Método iterativo Jacobi para resolver sistemas lineales Ax = b. Requiere que la matriz A tenga diagonales dominantes para garantizar convergencia. Ideal para sistemas grandes y dispersos donde métodos directos son costosos.",
    type: "Sistema lineal",
  },
  {
    id: "gauss-seidel",
    name: "Gauss-Seidel",
    course: "Aplicada 3",
    unit: "Unidad 4",
    description:
      "Método iterativo Gauss-Seidel para sistemas lineales. Mejora la convergencia usando los valores más recientes de x durante la iteración. Más rápido que Jacobi en muchos casos y ampliamente usado en problemas de ingeniería.",
    type: "Sistema lineal",
  },

  // Aplicada 3 - Unidad 5
  {
    id: "punto-fijo-no-lineal",
    name: "Punto Fijo No Lineal",
    course: "Aplicada 3",
    unit: "Unidad 5",
    description:
      "Iteración de punto fijo para sistemas no lineales de varias ecuaciones. Se aplica para resolver ecuaciones simultáneas usando aproximaciones sucesivas, requiere análisis de convergencia y buen valor inicial.",
    type: "Sistema no lineal",
  },
  {
    id: "newton-no-lineal",
    name: "Newton No Lineal",
    course: "Aplicada 3",
    unit: "Unidad 5",
    description:
      "Newton generalizado para sistemas no lineales. Utiliza la matriz Jacobiana para actualizar aproximaciones y converge rápidamente si el vector inicial está cerca de la solución. Es sensible a singularidades y malos puntos iniciales.",
    type: "Sistema no lineal",
  },

  // Ayuda
  {
    id: "manual-expresiones",
    name: "Manual de Expresiones",
    course: "Ayuda",
    unit: "",
    description:
      "Guía rápida de expresiones matemáticas: operadores, funciones, notación y ejemplos de uso, para referencia rápida durante cálculos y programación de métodos.",
    type: "Guía de uso",
  },
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
  "manual-expresiones": ManualExpresiones,
};

export default function App() {
  const [selectedMethodId, setSelectedMethodId] = useState(METHODS[0].id);

  const selectedMethod = METHODS.find((method) => method.id === selectedMethodId);
  const SelectedComponent = METHOD_COMPONENTS[selectedMethodId];

  const academicMethods = METHODS.filter((method) => method.course !== "Ayuda");

  const groupedCourses = useMemo(() => {
    return academicMethods.reduce((acc, method) => {
      if (!acc[method.course]) {
        acc[method.course] = {};
      }

      if (!acc[method.course][method.unit]) {
        acc[method.course][method.unit] = [];
      }

      acc[method.course][method.unit].push(method);
      return acc;
    }, {});
  }, []);

  const totalUnits = useMemo(() => {
    return new Set(academicMethods.map((method) => method.unit)).size;
  }, [academicMethods]);

  const handleSelectMethod = (methodId) => {
    setSelectedMethodId(methodId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app-shell d-flex flex-column min-vh-100">
      <div className="app-body d-flex flex-grow-1">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">
              <FaCalculator />
            </div>

            <div>
              <h5>Métodos Numéricos</h5>
              <span>Matemática Aplicada 3</span>
            </div>
          </div>

          <div className="sidebar-summary">
            <div>
              <strong>{academicMethods.length}</strong>
              <span>Métodos</span>
            </div>

            <div>
              <strong>{totalUnits}</strong>
              <span>Unidades</span>
            </div>
          </div>

          <Nav className="flex-column sidebar-nav">
            {Object.entries(groupedCourses).map(([course, units]) => (
              <NavDropdown
                title={course}
                key={course}
                id={`dropdown-${course}`}
                className="mb-2 navbar"
              >
                {Object.entries(units).map(([unit, methods]) => (
                  <NavDropdown
                    key={unit}
                    title={unit}
                    drop="end"
                    className="px-2 navbar"
                  >
                    {methods.map((method) => (
                      <NavDropdown.Item
                        key={method.id}
                        active={method.id === selectedMethodId}
                        onClick={() => handleSelectMethod(method.id)}
                      >
                        {method.name}
                      </NavDropdown.Item>
                    ))}
                  </NavDropdown>
                ))}
              </NavDropdown>
            ))}
          </Nav>

          <div className="sidebar-help">
            <span className="sidebar-section-label">Ayuda</span>

            <button
              className={`btn w-100 ${
                selectedMethod?.id === "manual-expresiones" ? "active" : ""
              }`}
              onClick={() => handleSelectMethod("manual-expresiones")}
            >
              <FaBookOpen className="me-2" />
              Manual de Expresiones
            </button>
          </div>
        </aside>

        {/* Contenido principal */}
        <main className="main-content flex-grow-1">
          <section className="method-hero">
            <div className="method-hero-content">
              <span className="method-badge">
                <FaGraduationCap className="me-2" />
                {selectedMethod?.course}
                {selectedMethod?.unit ? ` - ${selectedMethod.unit}` : ""}
              </span>

              <h1>{selectedMethod?.name}</h1>
              <p>{selectedMethod?.description}</p>
            </div>

            <div className="method-info-panel">
              <div className="method-info-item">
                <span>Tipo</span>
                <strong>{selectedMethod?.type}</strong>
              </div>

              <div className="method-info-item">
                <span>Curso</span>
                <strong>{selectedMethod?.course}</strong>
              </div>

              <div className="method-info-item">
                <span>Unidad</span>
                <strong>{selectedMethod?.unit || "Ayuda"}</strong>
              </div>
            </div>
          </section>

          <section className="overview-grid">
            <article className="overview-card">
              <FaLayerGroup />
              <div>
                <span>Contenido activo</span>
                <strong>{selectedMethod?.name}</strong>
              </div>
            </article>

            <article className="overview-card">
              <FaCalculator />
              <div>
                <span>Módulo</span>
                <strong>{selectedMethod?.type}</strong>
              </div>
            </article>

            <article className="overview-card">
              <FaUniversity />
              <div>
                <span>Institución</span>
                <strong>USAC  FIUSAC</strong>
              </div>
            </article>
          </section>

          <section className="method-content">
            {SelectedComponent ? (
              <SelectedComponent />
            ) : (
              <div className="alert alert-warning">
                No se encontró el componente asociado a este método.
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Footer */}
      <footer className="app-footer mt-auto">
        <Container>
          <Row className="gy-4 align-items-center">
            <Col lg={3} md={6} className="text-center text-lg-start">
              <img
                src={usacLogo}
                alt="USAC Logo"
                width="180"
                height="180"
                style={{ objectFit: "contain" }}
              />
            </Col>

            <Col lg={3} md={6} className="text-center text-lg-start">
              <img
                src={depaLogo}
                alt="Departamento de Matemática Logo"
                width="180"
                height="180"
                style={{ objectFit: "contain" }}
              />
            </Col>

            <Col lg={3} md={6} className="text-center text-lg-start">
              <h6 className="footer-title">Proyecto Académico</h6>
              <p className="text-muted mb-0">Departamento de Matemática</p>
              <p className="text-muted mb-0">Facultad de Ingeniería</p>
              <p className="text-muted mb-0">Universidad de San Carlos de Guatemala</p>
              <p className="text-muted mb-0">
                Desarrollado por Alexander Mejia
              </p>
              <p className="text-muted mb-0">
                Revisado por MSc. Renaldo Girón
              </p>
            </Col>

            <Col lg={3} md={6} className="text-center text-lg-start">
              <h6 className="footer-title">Enlaces</h6>

              <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                <li>
                  <a
                    href="https://mate.ingenieria.usac.edu.gt"
                    target="_blank"
                    rel="noreferrer"
                    className="text-decoration-none text-secondary"
                  >
                    🌐 Página Departamento
                  </a>
                </li>

                <li>
                  <a
                    href="https://www.facebook.com/p/Departamento-de-Matemática-Fiusac-100085499082819/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-decoration-none text-secondary"
                  >
                    <FaFacebook className="me-1" /> Facebook
                  </a>
                </li>

                <li>
                  <a
                    href="https://www.youtube.com/@Math4Ingenieria"
                    target="_blank"
                    rel="noreferrer"
                    className="text-decoration-none text-secondary"
                  >
                    <FaYoutube className="me-1" /> YouTube
                  </a>
                </li>

                <li>
                  <a
                    href="mailto:b.alex.mejia@gmail.com"
                    className="text-decoration-none text-secondary"
                  >
                    <FaEnvelope className="me-1" /> Soporte
                  </a>
                </li>
              </ul>
            </Col>
          </Row>

          <hr className="my-4 text-muted opacity-25" />

          <Row className="align-items-center text-muted">
            <Col sm={6} className="text-center text-sm-start">
              &copy; {new Date().getFullYear()} Universidad de San Carlos de
              Guatemala
            </Col>

            <Col sm={6} className="text-center text-sm-end mt-2 mt-sm-0">
              <a
                href="#privacidad"
                className="text-secondary text-decoration-none me-3"
              >
                Privacidad
              </a>
              <a
                href="#soporte"
                className="text-secondary text-decoration-none"
              >
                Soporte
              </a>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
}