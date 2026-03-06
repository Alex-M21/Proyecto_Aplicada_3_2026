// src/metodos/GaussSeidel.jsx
import { useEffect, useMemo, useState } from "react";
import "./Biseccion.css";

export default function GaussSeidel() {
  const [sizeInput, setSizeInput] = useState("4");
  const [decimalsInput, setDecimalsInput] = useState("4");
  const [tolInput, setTolInput] = useState("0.01");
  const [iterInput, setIterInput] = useState("6");

  const [matrix, setMatrix] = useState([
    ["4", "1", "1", "-1", "-1"],
    ["-1", "5", "1", "1", "2"],
    ["2", "2", "6", "1", "3"],
    ["2", "1", "1", "7", "4"],
  ]);

  const [x0, setX0] = useState(["1", "2", "3", "4"]);

  const [rows, setRows] = useState([]);
  const [solution, setSolution] = useState(null);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [warningMsg, setWarningMsg] = useState("");

  const clampInt = (v, min, max) => Math.max(min, Math.min(max, v));

  const parseNum = (value) => {
    const v = parseFloat(String(value ?? "").replace(",", ".").trim());
    return Number.isFinite(v) ? v : NaN;
  };

  const getDecimals = () => {
    const d = parseInt(decimalsInput, 10);
    return Number.isNaN(d) || d < 0 ? 6 : d;
  };

  const fmt = (v) => {
    const d = getDecimals();
    return Number.isFinite(v) ? Number(v).toFixed(d) : "";
  };

  const n = useMemo(() => {
    return clampInt(parseInt(sizeInput, 10) || 2, 2, 10);
  }, [sizeInput]);

  useEffect(() => {
    setMatrix((prev) => {
      const next = Array.from({ length: n }, (_, i) =>
        Array.from({ length: n + 1 }, (_, j) => prev[i]?.[j] ?? "")
      );
      return next;
    });

    setX0((prev) => {
      return Array.from({ length: n }, (_, i) => prev[i] ?? "");
    });
  }, [n]);

  const setCell = (i, j, value) => {
    setMatrix((prev) => {
      const next = prev.map((row) => [...row]);
      next[i][j] = value;
      return next;
    });
  };

  const setX0Cell = (i, value) => {
    setX0((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
  };

  const clearAll = () => {
    setMatrix(Array.from({ length: n }, () => Array.from({ length: n + 1 }, () => "")));
    setX0(Array.from({ length: n }, () => ""));
    setRows([]);
    setSolution(null);
    setMessage("");
    setErrorMsg("");
    setWarningMsg("");
  };

  const buildSystem = () => {
    const A = [];
    const b = [];

    for (let i = 0; i < n; i++) {
      const row = [];
      for (let j = 0; j < n; j++) {
        const val = parseNum(matrix[i][j]);
        if (!Number.isFinite(val)) {
          return { ok: false, error: `Valor inválido en A[${i + 1}, ${j + 1}]` };
        }
        row.push(val);
      }

      const rhs = parseNum(matrix[i][n]);
      if (!Number.isFinite(rhs)) {
        return { ok: false, error: `Valor inválido en b[${i + 1}]` };
      }

      A.push(row);
      b.push(rhs);
    }

    const xInit = [];
    for (let i = 0; i < n; i++) {
      const val = parseNum(x0[i]);
      if (!Number.isFinite(val)) {
        return { ok: false, error: `Valor inválido en el vector inicial x${i + 1}` };
      }
      xInit.push(val);
    }

    for (let i = 0; i < n; i++) {
      if (A[i][i] === 0) {
        return { ok: false, error: `La diagonal principal no puede contener ceros. Revisa a[${i + 1}, ${i + 1}]` };
      }
    }

    return { ok: true, A, b, xInit };
  };

  const isDiagonallyDominant = (A) => {
    let strict = false;

    for (let i = 0; i < A.length; i++) {
      const diag = Math.abs(A[i][i]);
      let sum = 0;
      for (let j = 0; j < A.length; j++) {
        if (i !== j) sum += Math.abs(A[i][j]);
      }
      if (diag < sum) return false;
      if (diag > sum) strict = true;
    }

    return strict || true;
  };

  const gaussSeidel = (A, b, xInit, maxIter, tol) => {
    const x = [...xInit];
    const history = [];

    for (let iter = 1; iter <= maxIter; iter++) {
      const prev = [...x];
      const errs = [];

      for (let i = 0; i < n; i++) {
        let sum = b[i];

        for (let j = 0; j < n; j++) {
          if (j !== i) {
            sum -= A[i][j] * x[j];
          }
        }

        x[i] = sum / A[i][i];
      }

      let maxErr = 0;

      for (let i = 0; i < n; i++) {
        const err = Math.abs(x[i] - prev[i]);
        errs.push(err);
        if (err > maxErr) maxErr = err;
      }

      history.push({
        iter,
        xs: [...x],
        errs,
        maxErr,
      });

      if (maxErr < tol) {
        return { rows: history, solution: [...x], converged: true };
      }
    }

    return { rows: history, solution: [...x], converged: false };
  };

  const handleCalculate = (e) => {
    e.preventDefault();
    setRows([]);
    setSolution(null);
    setMessage("");
    setErrorMsg("");
    setWarningMsg("");

    const tol = parseNum(tolInput);
    const maxIter = clampInt(parseInt(iterInput, 10) || 1, 1, 200);

    if (!Number.isFinite(tol) || tol <= 0) {
      setErrorMsg("La tolerancia debe ser un número positivo.");
      return;
    }

    const built = buildSystem();
    if (!built.ok) {
      setErrorMsg(built.error);
      return;
    }

    const { A, b, xInit } = built;

    if (!isDiagonallyDominant(A)) {
      setWarningMsg("Advertencia: la matriz no parece diagonalmente dominante. El método puede no converger.");
    }

    const result = gaussSeidel(A, b, xInit, maxIter, tol);

    setRows(result.rows);
    setSolution(result.solution);

    if (result.converged) {
      setMessage("Se encontró la solución dentro de la tolerancia indicada.");
    } else {
      setMessage("Se alcanzó el número máximo de iteraciones.");
    }
  };

  const headerXs = Array.from({ length: n }, (_, i) => `x${i + 1}`);
  const headerEs = Array.from({ length: n }, (_, i) => `Ex${i + 1}`);

  return (
    <div
      className="bisection-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "1.05fr 1.3fr",
        gap: 20,
        alignItems: "start",
      }}
    >
      <div className="bisection-form" style={{ display: "grid", gap: 16 }}>
        <Card>
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>Método de Gauss-Seidel</h3>
          <p className="bisection-hint" style={{ margin: 0 }}>
            Ingresa los coeficientes de la <strong>matriz aumentada</strong>, el{" "}
            <strong>vector inicial</strong>, la <strong>tolerancia</strong> y el{" "}
            <strong>número máximo de iteraciones</strong>. La matriz debe ser cuadrada de tamaño{" "}
            <strong>n×n</strong>.
          </p>
        </Card>

        <form onSubmit={handleCalculate} style={{ display: "grid", gap: 16 }}>
          <Card>
            <h4 style={{ marginTop: 0 }}>1. Configuración</h4>

            <FormRow label="Tamaño de la matriz (n)">
              <input
                type="number"
                min={2}
                max={10}
                value={sizeInput}
                onChange={(e) => setSizeInput(String(clampInt(parseInt(e.target.value || "2", 10), 2, 10)))}
              />
            </FormRow>

            <FormRow label="Número máximo de iteraciones">
              <input
                type="number"
                min={1}
                max={200}
                value={iterInput}
                onChange={(e) => setIterInput(e.target.value)}
              />
            </FormRow>

            <FormRow label="Tolerancia">
              <input
                type="number"
                step="any"
                min={0}
                value={tolInput}
                onChange={(e) => setTolInput(e.target.value)}
              />
            </FormRow>

            <FormRow label="Número de decimales">
              <input
                type="number"
                min={0}
                value={decimalsInput}
                onChange={(e) => setDecimalsInput(e.target.value)}
              />
            </FormRow>
          </Card>

          <Card>
            <h4 style={{ marginTop: 0, marginBottom: 12 }}>2. Matriz aumentada</h4>

            <div style={{ overflowX: "auto" }}>
              <table className="bisection-table">
                <thead>
                  <tr>
                    {Array.from({ length: n }, (_, j) => (
                      <th key={j}>{`a${j + 1}`}</th>
                    ))}
                    <th>b</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: n }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: n + 1 }).map((_, j) => (
                        <td key={j}>
                          <input
                            type="number"
                            step="any"
                            value={matrix[i]?.[j] ?? ""}
                            onChange={(e) => setCell(i, j, e.target.value)}
                            style={{ width: "90px" }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <h4 style={{ marginTop: 0, marginBottom: 12 }}>3. Vector inicial</h4>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "90px 1fr",
                gap: 10,
                alignItems: "center",
              }}
            >
              {Array.from({ length: n }).map((_, i) => (
                <RowPair
                  key={i}
                  left={`x${i + 1}`}
                  right={
                    <input
                      type="number"
                      step="any"
                      value={x0[i] ?? ""}
                      onChange={(e) => setX0Cell(i, e.target.value)}
                    />
                  }
                />
              ))}
            </div>
          </Card>

          <div className="bisection-buttons" style={{ display: "flex", gap: 10 }}>
            <button type="submit" className="btn-primary">CALCULAR</button>
            <button type="button" className="btn-secondary" onClick={clearAll}>
              BORRAR CELDAS
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="bisection-error" style={msgErrorStyle}>
            <strong>Error:</strong> {errorMsg}
          </div>
        )}

        {warningMsg && !errorMsg && (
          <div style={msgWarningStyle}>
            <strong>Advertencia:</strong> {warningMsg.replace(/^Advertencia:\s*/, "")}
          </div>
        )}

        {message && !errorMsg && (
          <div className="bisection-message" style={msgSuccessStyle}>
            {message}
          </div>
        )}
      </div>

      <div className="bisection-results" style={{ display: "grid", gap: 16 }}>
        <div
          style={{
            background: "linear-gradient(135deg, #eff6ff 0%, #f8fbff 100%)",
            border: "1px solid #bfdbfe",
            borderRadius: 16,
            padding: 18,
            boxShadow: "0 4px 14px rgba(37,99,235,0.08)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.7,
              color: "#1d4ed8",
              marginBottom: 8,
            }}
          >
            RESPUESTA FINAL
          </div>

          {!solution ? (
            <div style={{ color: "#6b7280" }}>
              Aún no hay resultado. Completa los datos y presiona <strong>CALCULAR</strong>.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: 12,
              }}
            >
              {solution.map((v, i) => (
                <MiniInfoCard key={i} title={`x${i + 1}`} value={fmt(v)} />
              ))}
            </div>
          )}
        </div>

        <Card>
          <h4 style={{ marginTop: 0 }}>Tabla de iteraciones</h4>

          {!rows.length ? (
            <p className="bisection-hint" style={{ margin: 0 }}>
              Aquí aparecerán las iteraciones del método.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="bisection-table">
                <thead>
                  <tr>
                    <th>n</th>
                    {headerXs.map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                    {headerEs.map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.iter}>
                      <td>{row.iter}</td>

                      {row.xs.map((v, i) => (
                        <td key={`x-${row.iter}-${i}`}>{fmt(v)}</td>
                      ))}

                      {row.errs.map((v, i) => (
                        <td key={`e-${row.iter}-${i}`}>{fmt(v)}</td>
                      ))}

                      <td
                        style={
                          row.iter === rows.length
                            ? {
                                background: "#fecaca",
                                color: "#991b1b",
                                fontWeight: 800,
                              }
                            : undefined
                        }
                      >
                        {fmt(row.maxErr)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Card({ children }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 16,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      {children}
    </div>
  );
}

function FormRow({ label, children }) {
  return (
    <div className="bisection-form-row" style={{ marginBottom: 12 }}>
      <label
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#374151",
          marginBottom: 6,
          display: "block",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function RowPair({ left, right }) {
  return (
    <>
      <div
        style={{
          padding: "10px 12px",
          background: "#f3f4f6",
          borderRadius: 10,
          fontWeight: 700,
          textAlign: "center",
          color: "#374151",
        }}
      >
        {left}
      </div>
      {right}
    </>
  );
}

function MiniInfoCard({ title, value }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 12,
        background: "#f9fafb",
      }}
    >
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>{value}</div>
    </div>
  );
}

const msgErrorStyle = {
  border: "1px solid #fecaca",
  background: "#fef2f2",
  color: "#b91c1c",
  borderRadius: 14,
  padding: 16,
};

const msgSuccessStyle = {
  border: "1px solid #bbf7d0",
  background: "#f0fdf4",
  color: "#166534",
  borderRadius: 14,
  padding: 16,
};

const msgWarningStyle = {
  border: "1px solid #fde68a",
  background: "#fffbeb",
  color: "#92400e",
  borderRadius: 14,
  padding: 16,
};