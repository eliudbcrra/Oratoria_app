export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const hoy = () => new Date().toISOString().slice(0, 10);

/* mm:ss */
export const fmt = (s) => {
  s = Math.max(0, Math.floor(s || 0));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

/* Segundos con un decimal, para pausas y fragmentos cortos. */
export const fmtSeg = (s) => `${(s || 0).toFixed(1)} s`;

export const fecha = (ts, opts) =>
  new Date(ts).toLocaleDateString("es-MX", opts || { day: "2-digit", month: "short" });

export const fechaLarga = (ts) =>
  new Date(ts).toLocaleDateString("es-MX", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

export const media = (a) => (a?.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

export const mediana = (a) => {
  if (!a?.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export const desviacion = (a) => {
  if (!a || a.length < 2) return 0;
  const m = media(a);
  return Math.sqrt(media(a.map((x) => (x - m) ** 2)));
};

/* Color de la banda de tiempo según cuánto falta para el objetivo. */
export const bandColor = (elapsed, target, T) => {
  if (!target) return T.jade;
  const p = elapsed / target;
  if (p < 0.8) return T.jade;
  if (p <= 1.0) return T.amber;
  return T.red;
};

/* Hz → nombre de nota, para leer el tono sin saber solfeo. */
export const hzANota = (hz) => {
  if (!hz || hz <= 0) return "—";
  const nombres = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];
  const n = Math.round(12 * Math.log2(hz / 440) + 69);
  return `${nombres[((n % 12) + 12) % 12]}${Math.floor(n / 12) - 1}`;
};

/* Distancia en semitonos entre dos frecuencias. */
export const semitonos = (hz, ref) => (!hz || !ref ? 0 : 12 * Math.log2(hz / ref));
