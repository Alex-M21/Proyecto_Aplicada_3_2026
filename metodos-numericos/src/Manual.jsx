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
import "./Manual.css";

export default function ManualExpresiones() {
  return (
    <div className="manual-card">
      <h3>Manual de expresiones</h3>
      <p className="manual-intro">
        En todos los métodos, la función se escribe como <code>f(x)</code> usando
        la sintaxis de <code>mathjs</code>/<code>JavaScript</code>. La variable
        independiente es siempre <code>x</code> y las funciones trigonométricas
        trabajan en <strong>radianes</strong>.
      </p>

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
            {/* Potencias y polinomios */}
            <tr>
              <td>(x²)</td>
              <td><code>x^2</code></td>
              <td>El operador <code>^</code> es potencia.</td>
            </tr>
            <tr>
              <td>(x³ − x − 1)</td>
              <td><code>x^3 - x - 1</code></td>
              <td>Polinomios normales.</td>
            </tr>

            {/* Exponenciales */}
            <tr>
              <td>(eˣ)</td>
              <td><code>exp(x)</code> o <code>e^x</code></td>
              <td><code>exp(x)</code> es más claro; <code>e</code> es la constante de Euler.</td>
            </tr>
            <tr>
              <td>(e⁻ˣ)</td>
              <td><code>exp(-x)</code> o <code>e^(-x)</code></td>
              <td>Usa paréntesis para el exponente.</td>
            </tr>
            <tr>
              <td>(10ˣ)</td>
              <td><code>10^x</code></td>
              <td>Potencia de 10.</td>
            </tr>

            {/* Raíces */}
            <tr>
              <td>(√x)</td>
              <td><code>sqrt(x)</code></td>
              <td>Raíz cuadrada.</td>
            </tr>
            <tr>
              <td>(³√x)</td>
              <td><code>cbrt(x)</code> o <code>nthRoot(x, 3)</code></td>
              <td>Raíz cúbica.</td>
            </tr>
            <tr>
              <td>(x^(1/n))</td>
              <td><code>nthRoot(x, n)</code></td>
              <td>Raíz n-ésima de x.</td>
            </tr>

            {/* Trigonométricas directas */}
            <tr>
              <td>(sin(x))</td>
              <td><code>sin(x)</code> o <code>sen(x)</code></td>
              <td>Puedes escribir <code>sen(x)</code>, la app lo convierte internamente a <code>sin(x)</code>.</td>
            </tr>
            <tr>
              <td>(cos(x))</td>
              <td><code>cos(x)</code></td>
              <td>Coseno de x (en radianes).</td>
            </tr>
            <tr>
              <td>(tan(x))</td>
              <td><code>tan(x)</code></td>
              <td>Tangente de x (en radianes).</td>
            </tr>

            {/* Trigonométricas inversas */}
            <tr>
              <td>(sin⁻¹(x))</td>
              <td><code>asin(x)</code></td>
              <td>Seno inverso (arcsin). Devuelve el ángulo en radianes.</td>
            </tr>
            <tr>
              <td>(cos⁻¹(x))</td>
              <td><code>acos(x)</code></td>
              <td>Coseno inverso (arccos). Devuelve el ángulo en radianes.</td>
            </tr>
            <tr>
              <td>(tan⁻¹(x))</td>
              <td><code>atan(x)</code></td>
              <td>Tangente inversa (arctan). Devuelve el ángulo en radianes.</td>
            </tr>

            {/* Trigonométricas hiperbólicas */}
            <tr>
              <td>(sinh(x))</td>
              <td><code>sinh(x)</code></td>
              <td>Seno hiperbólico.</td>
            </tr>
            <tr>
              <td>(cosh(x))</td>
              <td><code>cosh(x)</code></td>
              <td>Coseno hiperbólico.</td>
            </tr>
            <tr>
              <td>(tanh(x))</td>
              <td><code>tanh(x)</code></td>
              <td>Tangente hiperbólica.</td>
            </tr>
            <tr>
              <td>(sinh⁻¹(x))</td>
              <td><code>asinh(x)</code></td>
              <td>Seno hiperbólico inverso.</td>
            </tr>
            <tr>
              <td>(cosh⁻¹(x))</td>
              <td><code>acosh(x)</code></td>
              <td>Coseno hiperbólico inverso.</td>
            </tr>
            <tr>
              <td>(tanh⁻¹(x))</td>
              <td><code>atanh(x)</code></td>
              <td>Tangente hiperbólica inversa.</td>
            </tr>

            {/* Logaritmos */}
            <tr>
              <td>(ln(x))</td>
              <td><code>ln(x)</code> o <code>log(x)</code></td>
              <td>Logaritmo natural. En el código <code>ln</code> se trata como <code>log</code>.</td>
            </tr>
            <tr>
              <td>(log₁₀(x))</td>
              <td><code>log10(x)</code></td>
              <td>Logaritmo base 10.</td>
            </tr>
            <tr>
              <td>(log_b(x))</td>
              <td><code>log(x, b)</code></td>
              <td>Ejemplo: <code>log(x, 2)</code> es <code>log₂(x)</code>.</td>
            </tr>

            {/* Constantes */}
            <tr>
              <td>(π)</td>
              <td><code>pi</code></td>
              <td><code>pi</code> es la constante &pi;. Ej: <code>sin(pi/2)</code> = 1.</td>
            </tr>
            <tr>
              <td>(2π)</td>
              <td><code>2*pi</code></td>
              <td>Siempre usa <code>*</code> para multiplicar.</td>
            </tr>
            <tr>
              <td>(e)</td>
              <td><code>e</code></td>
              <td>Constante de Euler (~2.71828).</td>
            </tr>

            {/* Funciones de redondeo / valor absoluto */}
            <tr>
              <td>(|x|)</td>
              <td><code>abs(x)</code></td>
              <td>Valor absoluto.</td>
            </tr>
            <tr>
              <td>signo(x)</td>
              <td><code>sign(x)</code></td>
              <td>Devuelve -1, 0 o 1 según el signo de x.</td>
            </tr>
            <tr>
              <td>⌊x⌋</td>
              <td><code>floor(x)</code></td>
              <td>Redondea hacia abajo (entero más pequeño).</td>
            </tr>
            <tr>
              <td>⌈x⌉</td>
              <td><code>ceil(x)</code></td>
              <td>Redondea hacia arriba (entero más grande).</td>
            </tr>
            <tr>
              <td>redondeo(x)</td>
              <td><code>round(x)</code> o <code>round(x, n)</code></td>
              <td>Redondeo normal, opcionalmente a n decimales.</td>
            </tr>

            {/* Factorial, combinatoria y módulo */}
            <tr>
              <td>(x!)</td>
              <td><code>factorial(x)</code> o <code>x!</code></td>
              <td>Factorial de x (x entero ≥ 0).</td>
            </tr>
            <tr>
              <td>n C k</td>
              <td><code>combinations(n, k)</code></td>
              <td>Número de combinaciones (n sobre k).</td>
            </tr>
            <tr>
              <td>n P k</td>
              <td><code>permutations(n, k)</code></td>
              <td>Número de permutaciones.</td>
            </tr>
            <tr>
              <td>(a mod b)</td>
              <td><code>mod(a, b)</code> o <code>a % b</code></td>
              <td>Resto de la división de a entre b.</td>
            </tr>

            {/* Multiplicación y combinaciones */}
            <tr>
              <td>(2x)</td>
              <td><code>2*x</code></td>
              <td><strong>Siempre</strong> usar <code>*</code> para multiplicar (no escribir <code>2x</code>).</td>
            </tr>
            <tr>
              <td>((x+1)(x−2))</td>
              <td><code>(x+1)*(x-2)</code></td>
              <td>Multiplicaciones entre paréntesis siempre con <code>*</code>.</td>
            </tr>
            <tr>
              <td>Combinación, p.ej. (e⁻ˣ·cos(x))</td>
              <td><code>exp(-x)*cos(x)</code></td>
              <td>Combina funciones con <code>*</code>, <code>+</code>, <code>-</code>, <code>/</code>, <code>^</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="manual-note">
        💡 Si la función está mal escrita o se sale del dominio en el intervalo
        elegido (por ejemplo, <code>log(x)</code> con <code>x ≤ 0</code>), la app
        mostrará un mensaje de error en el método de Bisección.
      </p>
    </div>
  );
}
