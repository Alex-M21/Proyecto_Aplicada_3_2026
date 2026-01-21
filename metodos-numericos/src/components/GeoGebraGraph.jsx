import { useEffect, useRef } from "react";
import { loadGeoGebra } from "../utils/loadGeogebra";

// Convierte expresiones a sintaxis GeoGebra:
// - tu app acepta log(x) como natural, en GeoGebra es ln(x)
// - acepta "sen(" como "sin("
function toGgb(expr) {
  if (!expr || !expr.trim()) return "x";
  return expr
    .replace(/\bsen\(/gi, "sin(")
    .replace(/\bln\(/gi, "ln(") // por si ya viene ln
    .replace(/\blog\(/gi, "ln(");
}

export default function GeoGebraGraph({ fx, a, b, p, width = 520, height = 340 }) {
  const containerRef = useRef(null);
  const onceRef = useRef(false);

  // Montar el applet una vez
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (onceRef.current) return;
      await loadGeoGebra();
      if (cancel) return;

      const params = {
        appName: "graphing",
        width,
        height,
        showToolBar: false,
        showMenuBar: false,
        showAlgebraInput: false,
        showResetIcon: false,
        enableShiftDragZoom: true,
        capturingThreshold: null,
      };

      const applet = new window.GGBApplet(params, true);
      applet.inject(containerRef.current);

      // Esperar a que el applet esté operativo
      const tick = setInterval(() => {
        if (window.ggbApplet && typeof window.ggbApplet.evalCommand === "function") {
          clearInterval(tick);
          onceRef.current = true;
          // Primer pintado
          drawAll({ fx, a, b, p, width, height });
        }
      }, 80);
    })();
    return () => { cancel = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redibujar al cambiar props
  useEffect(() => {
    if (!onceRef.current) return;
    drawAll({ fx, a, b, p, width, height });
  }, [fx, a, b, p, width, height]);

  return <div ref={containerRef} style={{ width, height }} />;
}

function drawAll({ fx, a, b, p, width, height }) {
  const g = window.ggbApplet;
  if (!g) return;

  // Limpia objetos previos si existen
  const toDelete = ["f", "IA", "IB", "Seg", "P", "vline"];
  toDelete.forEach(name => { try { g.deleteObject(name); } catch {} });

  // Función
  const fstr = toGgb(fx);
  try {
    g.evalCommand(`f(x) = ${fstr}`);
  } catch {
    // si falla, no seguimos
    return;
  }

  // Determinar ventana basada en [a,b] si son válidos
  const ax = Number(a), bx = Number(b);
  if (Number.isFinite(ax) && Number.isFinite(bx) && ax !== bx) {
    const xmin = Math.min(ax, bx) - Math.abs(bx - ax) * 0.5;
    const xmax = Math.max(ax, bx) + Math.abs(bx - ax) * 0.5;

    // muestreo de f para estimar y
    let ymin = Infinity, ymax = -Infinity;
    for (let i = 0; i <= 60; i++) {
      const x = xmin + (i * (xmax - xmin)) / 60;
      const y = g.getValue(`f(${x})`);
      if (Number.isFinite(y)) {
        ymin = Math.min(ymin, y);
        ymax = Math.max(ymax, y);
      }
    }
    if (!Number.isFinite(ymin) || !Number.isFinite(ymax) || ymin === ymax) {
      ymin = -5; ymax = 5;
    }
    const pad = (ymax - ymin) * 0.2 || 1;
    g.setCoordSystem(xmin, xmax, ymin - pad, ymax + pad);
  }

  // Intervalo [a,b] sobre eje x
  if (Number.isFinite(ax) && Number.isFinite(bx)) {
    g.evalCommand(`IA = (${ax}, 0)`);
    g.evalCommand(`IB = (${bx}, 0)`);
    g.evalCommand(`Seg = Segment(IA, IB)`);
    g.setColor("Seg", 255, 150, 150);
    g.setLineThickness("Seg", 5);
  }

  // Última aproximación p
  if (Number.isFinite(p)) {
    g.evalCommand(`P = (${p}, 0)`);
    g.setPointSize("P", 6);
    g.setColor("P", 220, 40, 40);
    g.evalCommand(`vline: x = ${p}`);
    g.setLineStyle("vline", 1);
    g.setLineThickness("vline", 4);
    g.setColor("vline", 220, 40, 40);
  }
}
