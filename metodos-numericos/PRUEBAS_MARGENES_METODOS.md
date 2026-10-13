# Márgenes antes y después de calcular

Fecha: 13 de octubre de 2026. Verificación en Chromium con perfil independiente.

La captura del usuario mostraba los controles pegados al borde del formulario
interior. Se comprobó que `main form` recibía un borde de 1px y sombra mediante
`App.css`, con padding interior de 0px. También se reprodujo el estrechamiento
de la tarjeta de Bisección de 466px a 395px al calcular, en una ventana de 1440px.

Se retiraron las decoraciones adicionales del formulario y del contenedor de
columnas. Las tarjetas de entrada dejan márgenes interiores de 24px en escritorio
y 16px en móvil. Las columnas compartidas se adaptan al espacio disponible y los
resultados no contribuyen al ancho mínimo del formulario. La página reserva
espacio para su barra de desplazamiento. Los parámetros y vectores compartidos
usan campos con etiquetas encima; se eliminaron las reglas duplicadas de vectores.
Los algoritmos y criterios numéricos se conservan.

## Comprobaciones en navegador

Pasaron **102 escenarios en desarrollo y 102 en la copia estática compilada**:
los 17 métodos de las unidades 2 a 6, en anchos de 320, 390, 768, 1100, 1440 y
1920px. Cada escenario monta el método sin resultados, pulsa CALCULAR con los
datos de su ejemplo y espera la tabla o el resultado real. Unidad 6 utiliza
GeoGebra CAS real, sin respuestas simuladas.

Se verifica que:

- La tarjeta deje padding simétrico de al menos 16px y no haya borde adicional
  en el formulario interior.
- Los controles del formulario, fuera de las celdas de matrices, mantengan
  al menos 16px respecto de los bordes de la tarjeta y 100px de ancho.
- No aparezca desbordamiento horizontal de toda la página.
- CALCULAR conserve el ancho y la posición de la tarjeta y el ancho de sus
  campos, admitiendo únicamente diferencias de hasta 1px.
- El ejemplo produzca resultados sin mensajes de entrada inválida.

Registros:

- [Desarrollo, localhost:5173](PRUEBAS_MARGENES_METODOS.json).
- [Copia estática local, puerto 4173](PRUEBAS_MARGENES_METODOS_PRODUCCION.json).

Se inspeccionaron capturas reales de Bisección en móvil y Punto Fijo No Lineal
en escritorio, después de calcular. Las rutas de las capturas en TEMP figuran
en los registros. La prueba mide pantallas emuladas en Chromium; no representa
una comprobación sobre todos los dispositivos físicos y navegadores.

También pasaron los 40 escenarios específicos de los métodos no lineales en
desarrollo, incluidos los tamaños 2×2 y 6×6, recarga de estilos y edición tras
calcular. La suite completa aprobó sus 77 pruebas. Se actualizó una aserción
antigua que todavía exigía las instrucciones extensas de unidad 6 retiradas
por solicitud del usuario; los cálculos y validaciones de esa prueba se conservan.
Compilación y ESLint de scripts/pruebas afectados aprobados.

Se repitieron los 42 casos con CAS real sobre la copia estática final:
18 matrices, 22 sistemas no lineales y dos ejercicios de Müller. Registro:
[PRUEBAS_CAS_MARGENES_2026-10-13.json](PRUEBAS_CAS_MARGENES_2026-10-13.json).

## Reproducción

Desde `metodos-numericos/`, con la app servida y un navegador de pruebas con
depuración remota en el puerto 9223:

```powershell
node scripts/probar-margenes-metodos.mjs http://localhost:5173/Proyecto_Aplicada_3_2026/
node scripts/probar-margenes-metodos.mjs http://127.0.0.1:4173/Proyecto_Aplicada_3_2026/ http://127.0.0.1:9223 ../PRUEBAS_MARGENES_METODOS_PRODUCCION.json
```

Los registros solo constituyen una verificación completa cuando `aprobado` es
`true`, contienen 102 casos y el script finaliza con código 0. La copia estática
de la raíz se actualizó desde `dist/`, con sus rutas de recursos comprobadas.
No hubo publicación remota.
