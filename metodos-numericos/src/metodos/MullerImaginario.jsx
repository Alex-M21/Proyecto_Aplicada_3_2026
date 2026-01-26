// src/metodos/MullerNoReal.jsx
import { useMemo, useState } from "react";
import { create, all } from "mathjs";
import "./Biseccion.css";

const math = create(all, {});

export default function MullerNoReal() {
  const [fxInput, setFxInput] = useState("3*x^2 - 1*x + 1");

  const [x0Input, setX0Input] = useState("1.5");
  const [x1Input, setX1Input] = useState("2.1");
  const [x2Input, setX2Input] = useState("2.5");
  const [tolInput, setTolInput] = useState("0.001");
  const [maxIterInput, setMaxIterInput] = useState("50");
  const [decimalsInput, setDecimalsInput] = useState("4");

  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // -------------------------
  // Normalización / filtro
  // -------------------------
  const normalizeExpr = (expr) =>
    String(expr ?? "")
      .trim()
      .replace(/LN/gi, "log")
      .replace(/ln/gi, "log")
      .replace(/sen/gi, "sin")
      .replace(/j/gi, "i");

  const isExprSafe = (expr) => /^[0-9a-zA-Z+\-*/^().,_\s]*$/.test(expr);

  const buildCompiled = (expr) => {
    const t = normalizeExpr(expr);
    if (!t) return null;
    if (!isExprSafe(t)) return null;
    try {
      return math.compile(t);
    } catch {
      return null;
    }
  };

  const getDecimals = () => {
    const d = parseInt(decimalsInput, 10);
    return Number.isNaN(d) || d < 0 ? 6 : d;
  };

  // -------------------------
  // Complejos helpers
  // -------------------------
  const isComplexLike = (v) =>
    v != null && typeof v === "object" && typeof v.re === "number" && typeof v.im === "number";

  const toComplex = (v) => {
    if (isComplexLike(v)) return v;
    if (typeof v === "number") return math.complex(v, 0);
    try {
      const n = math.number(v);
      return math.complex(n, 0);
    } catch {
      return math.complex(NaN, NaN);
    }
  };

  const parseX = (s) => {
    const t = normalizeExpr(s);
    if (!t) return null;
    if (!isExprSafe(t)) return null;
    try {
      const v = math.evaluate(t);
      return toComplex(v);
    } catch {
      return null;
    }
  };

  const absVal = (v) => {
    try {
      const a = math.abs(v); // Complex -> number
      const n = typeof a === "number" ? a : math.number(a);
      return Number.isFinite(n) ? n : NaN;
    } catch {
      return NaN;
    }
  };

  const roundNum = (x, d) => {
    const f = 10 ** d;
    return Math.round(x * f) / f;
  };

  // ✅ Formato Excel con EXACTAMENTE d decimales (usa decimalsInput)
  const formatComplexExcelFixed = (v) => {
    const d = getDecimals();
    const c = toComplex(v);

    if (!Number.isFinite(c.re) || !Number.isFinite(c.im)) return "NaN";

    // “limpiar” -0.0000
    const fixNegZero = (n) => {
      const s = n.toFixed(d);
      return s === (-0).toFixed(d) ? (0).toFixed(d) : s;
    };

    const re0 = Math.abs(c.re) < 0.5 * 10 ** (-d) ? 0 : c.re;
    const im0 = Math.abs(c.im) < 0.5 * 10 ** (-d) ? 0 : c.im;

    // Solo real
    if (im0 === 0) return fixNegZero(re0);

    // Solo imaginaria
    if (re0 === 0) return `${fixNegZero(im0)}i`;

    const sign = im0 >= 0 ? "+" : "-";
    return `${fixNegZero(re0)}${sign}${fixNegZero(Math.abs(im0))}i`;
  };

  const formatError = (x) => {
    const d = getDecimals();
    return Number.isFinite(x) ? x.toFixed(d) : "NaN";
  };

  // -------------------------
  // Compilación memoizada
  // -------------------------
  const compiledF = useMemo(() => buildCompiled(fxInput), [fxInput]);

  const evalF = (x) => {
    if (!compiledF) return math.complex(NaN, NaN);
    try {
      const r = compiledF.evaluate({ x: toComplex(x) });
      return toComplex(r);
    } catch {
      return math.complex(NaN, NaN);
    }
  };

  // -------------------------
  // Muller COMPLEJO (paro con errRaw)
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
    if (!compiledF) {
      setErrorMsg('f(x) inválida. Ej: 3*x^2-1*x+1, x^3+3*x^2+4*x-12, ln(x)-1, sen(x)-x.');
      return;
    }

    let x0 = parseX(x0Input);
    let x1 = parseX(x1Input);
    let x2 = parseX(x2Input);

    const tol = parseFloat(tolInput);
    const maxIter = parseInt(maxIterInput, 10);

    if (!x0 || !x1 || !x2 || !Number.isFinite(tol) || !Number.isFinite(maxIter)) {
      setErrorMsg('Valores inválidos. Para complejos usa: "1+2i", "-0.5i", "2i".');
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

    const newRows = [];
    let found = false;
    const EPS = 1e-14;

    for (let n = 1; n <= maxIter; n++) {
      const x0_i = x0;
      const x1_i = x1;
      const x2_i = x2;

      const f0 = evalF(x0_i);
      const f1 = evalF(x1_i);
      const f2 = evalF(x2_i);

      const okF =
        Number.isFinite(f0.re) && Number.isFinite(f0.im) &&
        Number.isFinite(f1.re) && Number.isFinite(f1.im) &&
        Number.isFinite(f2.re) && Number.isFinite(f2.im);

      if (!okF) {
        setErrorMsg("No se pudo evaluar f(x) en alguna iteración. Revisa el dominio.");
        break;
      }

      const h1 = math.subtract(x1_i, x0_i);
      const h2 = math.subtract(x2_i, x1_i);

      if (absVal(h1) < EPS || absVal(h2) < EPS) {
        setErrorMsg("Hay puntos iguales o muy cercanos (x0, x1, x2). Cambia los valores iniciales.");
        break;
      }

      const d1 = math.divide(math.subtract(f1, f0), h1);
      const d2 = math.divide(math.subtract(f2, f1), h2);

      const denomD = math.add(h2, h1);
      if (absVal(denomD) < EPS) {
        setErrorMsg("No se puede avanzar: (h2 + h1) ~ 0. Cambia los valores iniciales.");
        break;
      }

      const d = math.divide(math.subtract(d2, d1), denomD);

      let p;

      if (absVal(d) < EPS) {
        const denomSec = math.subtract(f2, f1);
        if (absVal(denomSec) < EPS) {
          setErrorMsg("No se puede avanzar (denominador ~ 0). Cambia valores iniciales.");
          break;
        }
        p = math.subtract(
          x2_i,
          math.divide(math.multiply(f2, math.subtract(x2_i, x1_i)), denomSec)
        );
      } else {
        const b = math.add(d2, math.multiply(h2, d));
        const disc = math.subtract(math.multiply(b, b), math.multiply(4, math.multiply(f2, d)));
        const D = math.sqrt(disc);

        const denom1 = math.add(b, D);
        const denom2 = math.subtract(b, D);
        const denom = absVal(denom1) >= absVal(denom2) ? denom1 : denom2;

        if (absVal(denom) < EPS) {
          setErrorMsg("Denominador ~ 0 (inestabilidad). Cambia valores iniciales.");
          break;
        }

        p = math.add(x2_i, math.divide(math.multiply(-2, f2), denom));
      }

      p = toComplex(p);

      const errRaw = absVal(math.subtract(p, x2_i));            // ✅ paro REAL
      const errorDisp = roundNum(errRaw, getDecimals());        // ✅ mostrar con decimales

      newRows.push({ n, x0: x0_i, x1: x1_i, x2: x2_i, p, errRaw, errorDisp });

      if (Number.isFinite(errRaw) && errRaw < tol) {
        found = true;
        break;
      }

      x0 = x1_i;
      x1 = x2_i;
      x2 = p;
    }

    setRows(newRows);
    if (!newRows.length) return;

    setMessage(found ? "SE ENCONTRÓ LA SOLUCIÓN" : "Se alcanzó el máximo de iteraciones.");
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

  const tol = parseFloat(tolInput);
  const lastIndex = rows.length - 1;
  const foundFinal =
    rows.length > 0 &&
    Number.isFinite(tol) &&
    Number.isFinite(rows[lastIndex]?.errRaw) &&
    rows[lastIndex].errRaw < tol;

  return (
    <div className="bisection-grid">
      <div className="bisection-form">
        <h3>Método de Muller (No real / Complejo)</h3>

        <p className="bisection-hint">
          Se aceptan: <code>ln</code>, <code>sen</code>, <code>j</code>. Ej: <code>3*x^2-1*x+1</code>.
        </p>

        <form onSubmit={handleCalculate}>
          <div className="bisection-form-row">
            <label>Ingrese f(x) =</label>
            <input type="text" value={fxInput} onChange={(e) => setFxInput(e.target.value)} />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese el valor x₀ =</label>
            <input type="text" value={x0Input} onChange={(e) => setX0Input(e.target.value)} />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese el valor x₁ =</label>
            <input type="text" value={x1Input} onChange={(e) => setX1Input(e.target.value)} />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese el valor x₂ =</label>
            <input type="text" value={x2Input} onChange={(e) => setX2Input(e.target.value)} />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese tolerancia o exactitud =</label>
            <input type="number" step="any" value={tolInput} onChange={(e) => setTolInput(e.target.value)} />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese número de iteraciones =</label>
            <input type="number" value={maxIterInput} onChange={(e) => setMaxIterInput(e.target.value)} />
          </div>

          <div className="bisection-form-row">
            <label>Ingrese número de decimales =</label>
            <input type="number" value={decimalsInput} onChange={(e) => setDecimalsInput(e.target.value)} />
          </div>

          <div className="bisection-buttons">
            <button type="submit" className="btn-primary">CALCULAR</button>
            <button type="button" className="btn-secondary" onClick={handleClear}>BORRAR CELDAS</button>
          </div>
        </form>

        {message && <p className="bisection-message">{message}</p>}
        {errorMsg && <p className="bisection-error">{errorMsg}</p>}
      </div>

      <div className="bisection-results">
        <div className="bisection-table-wrapper">
          <h4>Tabla de iteraciones</h4>

          {rows.length === 0 ? (
            <p className="bisection-hint">Ingresa los datos y presiona <strong>CALCULAR</strong>.</p>
          ) : (
            <>
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
                  {rows.map((r, idx) => {
                    const isLast = idx === lastIndex && foundFinal;
                    return (
                      <tr key={r.n}>
                        <td>{r.n}</td>
                        <td>{formatComplexExcelFixed(r.x0)}</td>
                        <td>{formatComplexExcelFixed(r.x1)}</td>
                        <td>{formatComplexExcelFixed(r.x2)}</td>
                        <td className={isLast ? "cell-green" : ""}>{formatComplexExcelFixed(r.p)}</td>
                        <td className={isLast ? "cell-red" : ""}>{formatError(r.errorDisp)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {foundFinal && (
                <div style={{ marginTop: 10, textAlign: "center", fontWeight: 700 }}>
                  SE ENCONTRÓ LA SOLUCIÓN
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
