// src/metodos/MullerNoReal.jsx
import { useState } from "react";
import { create, all } from "mathjs";
import "./Biseccion.css"; // reutilizamos estilos

const math = create(all, {});

export default function MullerNoReal() {
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
      .replace(/sen/gi, "sin")
      .replace(/j/gi, "i"); // por si el usuario usa j (ingeniería)

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

  const isComplex = (v) => v && typeof v === "object" && v.re != null && v.im != null;

  const toComplex = (v) => (isComplex(v) ? v : math.complex(v, 0));

  const roundNum = (x, d) => {
    const f = 10 ** d;
    return Math.round(x * f) / f;
  };

  const roundTo = (v) => {
    const d = getDecimals();
    if (!Number.isFinite(v) && !isComplex(v)) return v;
    if (!isComplex(v)) return roundNum(v, d);
    return math.complex(roundNum(v.re, d), roundNum(v.im, d));
  };

  const formatValue = (v) => {
    const d = getDecimals();
    const eps = 10 ** (-(d + 2));

    if (typeof v === "number") return Number.isFinite(v) ? v.toFixed(d) : "NaN";
    if (!isComplex(v)) return "NaN";

    const re = Math.abs(v.re) < eps ? 0 : v.re;
    const im = Math.abs(v.im) < eps ? 0 : v.im;

    if (im === 0) return re.toFixed(d);
    if (re === 0) return `${im.toFixed(d)}i`;

    const sign = im >= 0 ? "+" : "-";
    return `${re.toFixed(d)} ${sign} ${Math.abs(im).toFixed(d)}i`;
  };

  const absVal = (v) => {
    try {
      return math.abs(v); // funciona para number y Complex
    } catch {
      return NaN;
    }
  };

  // parse de entradas x0,x1,x2 permitiendo complejos (ej: 1+2i, -0.5i)
  const parseX = (s) => {
    const t = normalizeExpr(String(s ?? "")).trim();
    if (!t) return null;
    try {
      const val = math.evaluate(t); // number o Complex
      if (typeof val === "number") return math.complex(val, 0);
      if (isComplex(val)) return val;
      return null;
    } catch {
      return null;
    }
  };

  // -------------------------
  // Cálculo: Muller COMPLEJO
  // Tabla: n, x0, x1, x2, p, Error
  // Error = |p - x2| (módulo si es complejo)
  // -------------------------
  const handleCalculate = (e) => {
    e.preventDefault();
    setMessage("");
    setErrorMsg("");
    setRows([]);

    if (!fxInput.trim()) {
      setErrorMsg("Debes ingresar una expresión para f(x).");
      return;
    }

    const x0p = parseX(x0Input);
    const x1p = parseX(x1Input);
    const x2p = parseX(x2Input);
    const tol = parseFloat(tolInput);
    const maxIter = parseInt(maxIterInput, 10);

    if (!x0p || !x1p || !x2p || !Number.isFinite(tol) || !Number.isFinite(maxIter)) {
      setErrorMsg(
        'Valores inválidos. Para complejos usa formato tipo "1+2i" o "-0.5i".'
      );
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
        "No se pudo interpretar f(x). Ejemplos: x^3+3*x^2+4*x-12, exp(-x)-x, sin(x)-x/2."
      );
      return;
    }

    const evalF = (x) => {
      try {
        const r = compiledF.evaluate({ x });
        // mathjs devuelve number o Complex
        if (typeof r === "number") return math.complex(r, 0);
        if (isComplex(r)) return r;
        return math.complex(NaN, NaN);
      } catch {
        return math.complex(NaN, NaN);
      }
    };

    let x0 = roundTo(x0p);
    let x1 = roundTo(x1p);
    let x2 = roundTo(x2p);

    const newRows = [];
    let found = false;
    let hadError = false;

    const EPS = 1e-14;

    try {
      for (let n = 1; n <= maxIter; n++) {
        const x0_i = x0;
        const x1_i = x1;
        const x2_i = x2;

        const f0 = evalF(x0_i);
        const f1 = evalF(x1_i);
        const f2 = evalF(x2_i);

        if (!Number.isFinite(f0.re) || !Number.isFinite(f1.re) || !Number.isFinite(f2.re)) {
          setErrorMsg("No se pudo evaluar f(x) en alguna iteración.");
          hadError = true;
          break;
        }

        const h1 = math.subtract(x1_i, x0_i);
        const h2 = math.subtract(x2_i, x1_i);

        if (absVal(h1) < EPS || absVal(h2) < EPS) {
          setErrorMsg("Hay puntos iguales o muy cercanos (x0, x1, x2). Cambia valores iniciales.");
          hadError = true;
          break;
        }

        const d1 = math.divide(math.subtract(f1, f0), h1);
        const d2 = math.divide(math.subtract(f2, f1), h2);
        const d = math.divide(math.subtract(d2, d1), math.add(h2, h1));

        let p;

        // Si d ~ 0 => secante (compleja)
        if (absVal(d) < EPS) {
          const denomSec = math.subtract(f2, f1);
          if (absVal(denomSec) < EPS) {
            setErrorMsg("No se puede avanzar (denominador ~ 0). Cambia valores iniciales.");
            hadError = true;
            break;
          }
          p = math.subtract(x2_i, math.divide(math.multiply(f2, math.subtract(x2_i, x1_i)), denomSec));
        } else {
          const b = math.add(d2, math.multiply(h2, d));
          const disc = math.subtract(math.multiply(b, b), math.multiply(4, math.multiply(f2, d)));
          const D = math.sqrt(disc); // COMPLEJO permitido

          const denom1 = math.add(b, D);
          const denom2 = math.subtract(b, D);

          const denom = absVal(denom1) >= absVal(denom2) ? denom1 : denom2;

          if (absVal(denom) < EPS) {
            setErrorMsg("Denominador ~ 0 (inestabilidad numérica). Cambia valores iniciales.");
            hadError = true;
            break;
          }

          p = math.add(x2_i, math.divide(math.multiply(-2, f2), denom));
        }

        p = roundTo(toComplex(p));

        const error = roundTo(absVal(math.subtract(p, x2_i)));

        newRows.push({
          n,
          x0: x0_i,
          x1: x1_i,
          x2: x2_i,
          p,
          error
        });

        if (typeof error === "number" ? error < tol : error < tol) {
          found = true;
          break;
        }

        // (x0,x1,x2) <- (x1,x2,p)
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
        ? `Se encontró una aproximación: p ≈ ${formatValue(last.p)}`
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
      {/* Formulario */}
      <div className="bisection-form">
        <h3>Método de Muller (Complejo / No real)</h3>
        <p className="bisection-hint">
          Permite raíces complejas. Puedes ingresar x₀, x₁, x₂ como números reales o complejos:
          <code> 1+2i </code>, <code>-0.5i</code>. Acepta <code>ln(x)</code> y <code>sen(x)</code>.
        </p>

        <form onSubmit={handleCalculate}>
          <div className="bisection-form-row">
            <label>Ingrese f(x) =</label>
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
              type="text"
              value={x0Input}
              onChange={(e) => setX0Input(e.target.value)}
              placeholder='Ej: 0  ó  1+0.2i'
            />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese el valor x₁ =</label>
            <input
              type="text"
              value={x1Input}
              onChange={(e) => setX1Input(e.target.value)}
              placeholder='Ej: 1  ó  1.2-0.1i'
            />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese el valor x₂ =</label>
            <input
              type="text"
              value={x2Input}
              onChange={(e) => setX2Input(e.target.value)}
              placeholder='Ej: 2  ó  1.4+0.05i'
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

      {/* Tabla */}
      <div className="bisection-results">
        <div className="bisection-table-wrapper">
          <h4>Tabla de iteraciones</h4>
          {rows.length === 0 ? (
            <p className="bisection-hint">
              Ingresa los datos y presiona <strong>CALCULAR</strong>.
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
                    <td>{formatValue(r.x0)}</td>
                    <td>{formatValue(r.x1)}</td>
                    <td>{formatValue(r.x2)}</td>
                    <td>{formatValue(r.p)}</td>
                    <td>{typeof r.error === "number" ? r.error.toFixed(getDecimals()) : String(r.error)}</td>
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
