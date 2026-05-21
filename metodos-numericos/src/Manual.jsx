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
import "./Manual.css";

// Datos dinámicos con categorías para filtros
const manualData = [
  { expr: "(x²)", code: "x^2", comment: "El operador ^ es potencia.", category: "Polinomios" },
  { expr: "(x³ − x − 1)", code: "x^3 - x - 1", comment: "Polinomios normales.", category: "Polinomios" },
  { expr: "(eˣ)", code: "exp(x) o e^x", comment: "exp(x) es más claro; e es la constante de Euler.", category: "Exponenciales" },
  { expr: "(e⁻ˣ)", code: "exp(-x) o e^(-x)", comment: "Usa paréntesis para el exponente.", category: "Exponenciales" },
  { expr: "(10ˣ)", code: "10^x", comment: "Potencia de 10.", category: "Exponenciales" },
  { expr: "(√x)", code: "sqrt(x)", comment: "Raíz cuadrada.", category: "Raíces" },
  { expr: "(³√x)", code: "cbrt(x) o nthRoot(x, 3)", comment: "Raíz cúbica.", category: "Raíces" },
  { expr: "(x^(1/n))", code: "nthRoot(x, n)", comment: "Raíz n-ésima de x.", category: "Raíces" },
  { expr: "(sin(x))", code: "sin(x) o sen(x)", comment: "Funciones trig. en radianes.", category: "Trigonométricas" },
  { expr: "(cos(x))", code: "cos(x)", comment: "Coseno de x.", category: "Trigonométricas" },
  { expr: "(tan(x))", code: "tan(x)", comment: "Tangente de x.", category: "Trigonométricas" },
  { expr: "(sin⁻¹(x))", code: "asin(x)", comment: "Seno inverso (arcsin) en radianes.", category: "Trigonométricas Inversas" },
  { expr: "(cos⁻¹(x))", code: "acos(x)", comment: "Coseno inverso (arccos) en radianes.", category: "Trigonométricas Inversas" },
  { expr: "(tan⁻¹(x))", code: "atan(x)", comment: "Tangente inversa (arctan) en radianes.", category: "Trigonométricas Inversas" },
  { expr: "(sinh(x))", code: "sinh(x)", comment: "Seno hiperbólico.", category: "Hiperbólicas" },
  { expr: "(cosh(x))", code: "cosh(x)", comment: "Coseno hiperbólico.", category: "Hiperbólicas" },
  { expr: "(tanh(x))", code: "tanh(x)", comment: "Tangente hiperbólica.", category: "Hiperbólicas" },
  { expr: "(sinh⁻¹(x))", code: "asinh(x)", comment: "Seno hiperbólico inverso.", category: "Hiperbólicas Inversas" },
  { expr: "(cosh⁻¹(x))", code: "acosh(x)", comment: "Coseno hiperbólico inverso.", category: "Hiperbólicas Inversas" },
  { expr: "(tanh⁻¹(x))", code: "atanh(x)", comment: "Tangente hiperbólica inversa.", category: "Hiperbólicas Inversas" },
  { expr: "(ln(x))", code: "ln(x) o log(x)", comment: "Logaritmo natural.", category: "Logaritmos" },
  { expr: "(log₁₀(x))", code: "log10(x)", comment: "Logaritmo base 10.", category: "Logaritmos" },
  { expr: "(log_b(x))", code: "log(x, b)", comment: "Ej: log(x,2) es log₂(x).", category: "Logaritmos" },
  { expr: "(π)", code: "pi", comment: "Constante π.", category: "Constantes" },
  { expr: "(2π)", code: "2*pi", comment: "Multiplicación siempre con *.", category: "Constantes" },
  { expr: "(e)", code: "e", comment: "Constante de Euler (~2.71828).", category: "Constantes" },
  { expr: "(|x|)", code: "abs(x)", comment: "Valor absoluto.", category: "Redondeo/Valor Absoluto" },
  { expr: "signo(x)", code: "sign(x)", comment: "Devuelve -1,0 o 1 según signo.", category: "Redondeo/Valor Absoluto" },
  { expr: "⌊x⌋", code: "floor(x)", comment: "Redondea hacia abajo.", category: "Redondeo/Valor Absoluto" },
  { expr: "⌈x⌉", code: "ceil(x)", comment: "Redondea hacia arriba.", category: "Redondeo/Valor Absoluto" },
  { expr: "redondeo(x)", code: "round(x) o round(x,n)", comment: "Redondeo normal.", category: "Redondeo/Valor Absoluto" },
  { expr: "(x!)", code: "factorial(x) o x!", comment: "Factorial de x.", category: "Factorial/Combinatoria" },
  { expr: "n C k", code: "combinations(n, k)", comment: "Número de combinaciones.", category: "Factorial/Combinatoria" },
  { expr: "n P k", code: "permutations(n, k)", comment: "Número de permutaciones.", category: "Factorial/Combinatoria" },
  { expr: "(a mod b)", code: "mod(a,b) o a % b", comment: "Resto de división.", category: "Factorial/Combinatoria" },
  { expr: "(2x)", code: "2*x", comment: "Siempre usar * para multiplicar.", category: "Multiplicaciones" },
  { expr: "((x+1)(x−2))", code: "(x+1)*(x-2)", comment: "Multiplicaciones entre paréntesis con *.", category: "Multiplicaciones" },
  { expr: "(e⁻ˣ·cos(x))", code: "exp(-x)*cos(x)", comment: "Combina funciones con +,-,*,/,^.", category: "Multiplicaciones" }
];

export default function ManualExpresiones() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");

  const categories = ["Todas", ...Array.from(new Set(manualData.map(d => d.category)))];

  const filteredData = manualData.filter(row => {
    const matchesCategory = category === "Todas" || row.category === category;
    const matchesSearch =
      row.expr.toLowerCase().includes(search.toLowerCase()) ||
      row.code.toLowerCase().includes(search.toLowerCase()) ||
      row.comment.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="manual-card">
      <h3>Manual de expresiones</h3>
      <p className="manual-intro">
        Busca expresiones por <code>nombre</code>, <code>código</code> o <code>comentario</code>. La variable independiente es <code>x</code> y las funciones trigonométricas usan radianes.
      </p>

      {/* Filtros */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: "0.5rem", fontSize: "1rem" }}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: "0.5rem", fontSize: "1rem" }}>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="manual-table-wrapper">
        <table className="manual-table">
          <thead>
            <tr>
              <th>Expresión matemática</th>
              <th>Cómo escribirla en la app</th>
              <th>Comentario</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? filteredData.map((row, idx) => (
              <tr key={idx}>
                <td>{row.expr}</td>
                <td><code>{row.code}</code></td>
                <td>{row.comment}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", color: "#888" }}>No se encontraron resultados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="manual-note">
        💡 Si la función está mal escrita o se sale del dominio, la app mostrará un mensaje de error.
      </p>
    </div>
  );
}
