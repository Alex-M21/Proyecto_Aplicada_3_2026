// src/metodos/Steffensen.jsx
import { useState } from "react";
import { create, all } from "mathjs";
import "./Biseccion.css"; // reutilizamos estilos

const math = create(all, {});

export default function Steffensen() {
  const [gInput, setGInput] = useState("(-1)*(ln(x)/ln(2))");
  const [p0Input, setP0Input] = useState("0.5");
  const [tolInput, setTolInput] = useState("0.001");
  const [maxIterInput, setMaxIterInput] = useState("15");
  const [decimalsInput, setDecimalsInput] = useState("5");

  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // -------------------------
  // Utilidades
  // -------------------------
  const normalizeExpr = (expr) =>
    expr
      .trim()
      .replace(/LN/gi, "log") // por si alguien escribe LN
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

  // redondeo "tipo Excel" para que la tabla coincida mejor con tu programa
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
  // Cálculo Steffensen
  // p1 = g(p0)
  // p2 = g(p1)
  // p_{n+1} = p0 - (p1 - p0)^2 / (p2 - 2p1 + p0)
  // Error = |p_{n+1} - p0|  (como en tu imagen)
  // -------------------------
  const handleCalculate = (e) => {
    e.preventDefault();
    setMessage("");
    setErrorMsg("");
    setRows([]);

    if (!gInput.trim()) {
      setErrorMsg("Debes ingresar una expresión para g(x).");
      return;
    }

    let p0 = parseFloat(p0Input);
    const tol = parseFloat(tolInput);
    const maxIter = parseInt(maxIterInput, 10);

    if (!Number.isFinite(p0) || !Number.isFinite(tol) || !Number.isFinite(maxIter)) {
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

    const compiledG = buildCompiled(gInput);
    if (!compiledG) {
      setErrorMsg(
        "La función g(x) no se pudo interpretar. Revisa la sintaxis. Ejemplos: (-1)*(ln(x)/ln(2)), (sin(x)+2*cos(x))/2, exp(-x)."
      );
      return;
    }

    const evalG = (x) => {
      try {
        const r = compiledG.evaluate({ x });
        return Number.isFinite(r) ? r : NaN;
      } catch {
        return NaN;
      }
    };

    const newRows = [];
    let found = false;
    let hadError = false;

    try {
      // redondeo inicial como en hoja/programa
      p0 = roundTo(p0);

      for (let n = 1; n <= maxIter; n++) {
        const p0_i = p0;

        let p1 = evalG(p0_i);
        if (!Number.isFinite(p1)) {
          setErrorMsg("No se pudo evaluar g(p0) en alguna iteración. Revisa dominio/función.");
          hadError = true;
          break;
        }

        p1 = roundTo(p1);

        let p2 = evalG(p1);
        if (!Number.isFinite(p2)) {
          setErrorMsg("No se pudo evaluar g(p1) en alguna iteración. Revisa dominio/función.");
          hadError = true;
          break;
        }

        p2 = roundTo(p2);

        const denom = p2 - 2 * p1 + p0_i;
        if (denom === 0) {
          setErrorMsg("Apareció p2 - 2p1 + p0 = 0. Steffensen no puede continuar (división entre cero).");
          hadError = true;
          break;
        }

        // Steffensen (Aitken Δ² aplicado a p_{n+1}=g(p_n))
        let pNext = p0_i - ((p1 - p0_i) ** 2) / denom;
        pNext = roundTo(pNext);

        const error = roundTo(Math.abs(pNext - p0_i));

        newRows.push({
          n,
          p0: p0_i,
          p1,
          p2,
          pNext,
          error
        });

        if (error < tol) {
          found = true;
          break;
        }

        p0 = pNext;
      }
    } catch {
      setErrorMsg("Ocurrió un error inesperado durante las iteraciones.");
      hadError = true;
    }

    setRows(newRows);

    if (!newRows.length || hadError) return;

    const last = newRows[newRows.length - 1];
    setMessage(
      found
        ? `Se encontró una aproximación a la solución: p ≈ ${formatNumber(last.pNext)}`
        : "Se alcanzó el número máximo de iteraciones sin cumplir la tolerancia."
    );
  };

  const handleClear = () => {
    setGInput("");
    setP0Input("");
    setTolInput("");
    setMaxIterInput("");
    setDecimalsInput("5");
    setRows([]);
    setMessage("");
    setErrorMsg("");
  };

  return (
    <div className="bisection-grid">
      {/* Columna: formulario */}
      <div className="bisection-form">
        <h3>Método de Steffensen</h3>
        <p className="bisection-hint">
          Ingresa g(x) y un valor inicial p₀. Ejemplo:
          <code> (-1)*(ln(x)/ln(2)) </code>. También se aceptan <code>ln(x)</code> y <code>sen(x)</code>.
        </p>

        <form onSubmit={handleCalculate}>
          <div className="bisection-form-row">
            <label>Ingrese la función g(x) =</label>
            <input
              type="text"
              value={gInput}
              onChange={(e) => setGInput(e.target.value)}
              placeholder="Ej: (-1)*(ln(x)/ln(2))"
            />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese el valor p₀ =</label>
            <input
              type="number"
              step="any"
              value={p0Input}
              onChange={(e) => setP0Input(e.target.value)}
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
            <button type="button" className="btn-secondary" onClick={handleClear}>BORRAR CELDAS</button>
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
                  <th>p₀</th>
                  <th>p₁</th>
                  <th>p₂</th>
                  <th>pₙ₊₁</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.n}>
                    <td>{r.n}</td>
                    <td>{formatNumber(r.p0)}</td>
                    <td>{formatNumber(r.p1)}</td>
                    <td>{formatNumber(r.p2)}</td>
                    <td>{formatNumber(r.pNext)}</td>
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
