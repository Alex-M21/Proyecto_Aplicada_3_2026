// Carga deployggb.js una sola vez y resuelve cuando está listo.
export function loadGeoGebra() {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.GGBApplet) return resolve();
    const s = document.createElement("script");
    s.src = "https://www.geogebra.org/apps/deployggb.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("No se pudo cargar GeoGebra."));
    document.head.appendChild(s);
  });
}
