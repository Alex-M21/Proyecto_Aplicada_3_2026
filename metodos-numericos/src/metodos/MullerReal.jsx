// src/metodos/MullerReal.jsx
import { useState } from "react";
import { create, all } from "mathjs";
import "./Biseccion.css"; // reutilizamos estilos

const math = create(all, {});

export default function MullerReal() {
  const [fxInput, setFxInput] = useState("x^3+3*x^2+4*x-12");
  const [x0Input, setX0Input] = useState("0");
  const [x1Input, setX1Input] = useState("1");
  const [x2Input, setX2Input] = useState("2");
  const [tolInput, setTolInput] = useState("0.01");
  const [maxIterInput, setMaxIterInput] = useState("25");
  const [decimalsInput, setDecimalsInput] = useState("4");

  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // -------------------------
  // Utilidades
  // -------------------------
  const normalizeExpr = (expr) =>
    expr
      .trim()
      .replace(/LN/gi, "log")
      .replace(/ln/gi, "log")
      .replace(/sen/gi, "sin");

  const buildCompiled = (expr) => {
    const t = expr.trim();
    if (!t) return null;
    try {
      return math.compile(normalizeExpr(t));
    } catch {
      return null;
    }
  };

  const getDecimals = () => {
    const d = parseInt(decimalsInput, 10);
    return Number.isNaN(d) || d < 0 ? 6 : d;
  };

  const roundTo = (v) => {
    const d = getDecimals();
    const f = 10 ** d;
    return Math.round(v * f) / f;
  };

  const formatNumber = (v) => {
    const d = getDecimals();
    return Number.isFinite(v) ? v.toFixed(d) : "NaN";
  };

  // -------------------------
  // Cálculo: Muller (raíz real)
  // Tabla como imagen: n, x0, x1, x2, p, Error
  // Error = |p - x2|
  // -------------------------
  const handleCalculate = (e) => {
    e.preventDefault();
    setMessage("");
    setErrorMsg("");
    setRows([]);

    if (!fxInput.trim()) {
      setErrorMsg("Debes ingresar una expresión para el polinomio / f(x).");
      return;
    }

    let x0 = parseFloat(x0Input);
    let x1 = parseFloat(x1Input);
    let x2 = parseFloat(x2Input);
    const tol = parseFloat(tolInput);
    const maxIter = parseInt(maxIterInput, 10);

    if (
      !Number.isFinite(x0) ||
      !Number.isFinite(x1) ||
      !Number.isFinite(x2) ||
      !Number.isFinite(tol) ||
      !Number.isFinite(maxIter)
    ) {
      setErrorMsg("Por favor ingresa valores numéricos válidos.");
      return;
    }
    if (tol <= 0) {
      setErrorMsg("La tolerancia debe ser un número positivo.");
      return;
    }
    if (maxIter <= 0) {
      setErrorMsg("El número de iteraciones debe ser mayor que cero.");
      return;
    }

    const compiledF = buildCompiled(fxInput);
    if (!compiledF) {
      setErrorMsg(
        "No se pudo interpretar f(x). Revisa la sintaxis. Ejemplos: x^3+3*x^2+4*x-12, exp(-x)-x, sin(x)-x/2."
      );
      return;
    }

    const evalF = (x) => {
      try {
        const r = compiledF.evaluate({ x });
        return Number.isFinite(r) ? r : NaN;
      } catch {
        return NaN;
      }
    };

    // redondeo inicial (para que se parezca al programa de la imagen)
    x0 = roundTo(x0);
    x1 = roundTo(x1);
    x2 = roundTo(x2);

    const newRows = [];
    let found = false;
    let hadError = false;

    const EPS = 1e-14;

    try {
      for (let n = 1; n <= maxIter; n++) {
        // congelar x0,x1,x2 de esta iteración (como tabla)
        const x0_i = x0;
        const x1_i = x1;
        const x2_i = x2;

        const f0 = evalF(x0_i);
        const f1 = evalF(x1_i);
        const f2 = evalF(x2_i);

        if (!Number.isFinite(f0) || !Number.isFinite(f1) || !Number.isFinite(f2)) {
          setErrorMsg("No se pudo evaluar f(x) en alguna iteración. Revisa el dominio y la función.");
          hadError = true;
          break;
        }

        const h1 = x1_i - x0_i;
        const h2 = x2_i - x1_i;

        if (Math.abs(h1) < EPS || Math.abs(h2) < EPS) {
          setErrorMsg("Hay dos puntos iguales o muy cercanos (x0, x1, x2). Cambia los valores iniciales.");
          hadError = true;
          break;
        }

        const d1 = (f1 - f0) / h1;
        const d2 = (f2 - f1) / h2;
        const d = (d2 - d1) / (h2 + h1);

        let p;

        // Si d ~ 0, cae a secante (lineal) para evitar división entre 0
        if (Math.abs(d) < EPS) {
          const denomSec = (f2 - f1);
          if (Math.abs(denomSec) < EPS) {
            setErrorMsg("No se puede avanzar (pendiente ~ 0). Cambia los valores iniciales.");
            hadError = true;
            break;
          }
          p = x2_i - (f2 * (x2_i - x1_i)) / denomSec;
        } else {
          const b = d2 + h2 * d;
          const disc = b * b - 4 * f2 * d;

          // Muller REAL: discriminante debe ser >= 0
          if (disc < 0) {
            setErrorMsg(
              "El discriminante salió negativo (raíz compleja en esta iteración). Para 'Muller raíz real', cambia x0, x1, x2."
            );
            hadError = true;
            break;
          }

          const D = Math.sqrt(disc);

          // Elegir denominador con mayor magnitud para evitar cancelación
          const denom1 = b + D;
          const denom2 = b - D;
          const denom = Math.abs(denom1) >= Math.abs(denom2) ? denom1 : denom2;

          if (Math.abs(denom) < EPS) {
            setErrorMsg("División entre cero numérica en el denominador. Cambia los valores iniciales.");
            hadError = true;
            break;
          }

          p = x2_i + (-2 * f2) / denom;
        }

        p = roundTo(p);

        // Error como en tu imagen: |p - x2|
        const error = roundTo(Math.abs(p - x2_i));

        newRows.push({
          n,
          x0: x0_i,
          x1: x1_i,
          x2: x2_i,
          p,
          error
        });

        if (error < tol) {
          found = true;
          break;
        }

        // Desplazar puntos: (x0,x1,x2) <- (x1,x2,p) como tu tabla
        x0 = x1_i;
        x1 = x2_i;
        x2 = p;
      }
    } catch {
      setErrorMsg("Ocurrió un error inesperado durante el cálculo.");
      hadError = true;
    }

    setRows(newRows);

    if (!newRows.length || hadError) return;

    const last = newRows[newRows.length - 1];
    setMessage(
      found
        ? `Se encontró una aproximación a la solución: p ≈ ${formatNumber(last.p)}`
        : "Se alcanzó el número máximo de iteraciones sin cumplir la tolerancia."
    );
  };

  const handleClear = () => {
    setFxInput("");
    setX0Input("");
    setX1Input("");
    setX2Input("");
    setTolInput("");
    setMaxIterInput("");
    setDecimalsInput("4");
    setRows([]);
    setMessage("");
    setErrorMsg("");
  };

  return (
    <div className="bisection-grid">
      {/* Columna: formulario */}
      <div className="bisection-form">
        <h3>Método de Muller (Raíz Real)</h3>
        <p className="bisection-hint">
          Ingresa f(x) y tres valores iniciales x₀, x₁, x₂. Ejemplo:
          <code> x^3+3*x^2+4*x-12 </code>. Acepta <code>ln(x)</code> y <code>sen(x)</code>.
        </p>

        <form onSubmit={handleCalculate}>
          <div className="bisection-form-row">
            <label>Ingrese el Polinomio / f(x) =</label>
            <input
              type="text"
              value={fxInput}
              onChange={(e) => setFxInput(e.target.value)}
              placeholder="Ej: x^3+3*x^2+4*x-12"
            />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese el valor x₀ =</label>
            <input
              type="number"
              step="any"
              value={x0Input}
              onChange={(e) => setX0Input(e.target.value)}
            />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese el valor x₁ =</label>
            <input
              type="number"
              step="any"
              value={x1Input}
              onChange={(e) => setX1Input(e.target.value)}
            />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese el valor x₂ =</label>
            <input
              type="number"
              step="any"
              value={x2Input}
              onChange={(e) => setX2Input(e.target.value)}
            />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese tolerancia o exactitud =</label>
            <input
              type="number"
              step="any"
              value={tolInput}
              onChange={(e) => setTolInput(e.target.value)}
            />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese número de iteraciones =</label>
            <input
              type="number"
              value={maxIterInput}
              onChange={(e) => setMaxIterInput(e.target.value)}
            />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese número de decimales =</label>
            <input
              type="number"
              value={decimalsInput}
              onChange={(e) => setDecimalsInput(e.target.value)}
            />
          </div>

          <div className="bisection-buttons">
            <button type="submit" className="btn-primary">CALCULAR</button>
            <button type="button" className="btn-secondary" onClick={handleClear}>
              BORRAR CELDAS
            </button>
          </div>
        </form>

        {message && <p className="bisection-message">{message}</p>}
        {errorMsg && <p className="bisection-error">{errorMsg}</p>}
      </div>

      {/* Columna: tabla */}
      <div className="bisection-results">
        <div className="bisection-table-wrapper">
          <h4>Tabla de iteraciones</h4>

          {rows.length === 0 ? (
            <p className="bisection-hint">
              Ingresa los datos y presiona <strong>CALCULAR</strong> para ver las iteraciones.
            </p>
          ) : (
            <table className="bisection-table">
              <thead>
                <tr>
                  <th>n</th>
                  <th>x₀</th>
                  <th>x₁</th>
                  <th>x₂</th>
                  <th>p</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.n}>
                    <td>{r.n}</td>
                    <td>{formatNumber(r.x0)}</td>
                    <td>{formatNumber(r.x1)}</td>
                    <td>{formatNumber(r.x2)}</td>
                    <td>{formatNumber(r.p)}</td>
                    <td>{formatNumber(r.error)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
