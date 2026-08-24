import React from "react";
import { T, FONT_M } from "../theme.js";
import { fmt, bandColor } from "../lib/format.js";
import { CRIT } from "../data/rubrica.js";

/* ---------------------------------------------------------------------------
   Cinta de tiempo del discurso.

   Muestra de un vistazo: zona verde/ámbar/roja según el tiempo objetivo, el
   avance actual, y cada marca del profesor en el instante exacto en que la
   puso. Las marcas negativas cuelgan abajo y las positivas arriba, para leer
   el ritmo de aciertos y errores sin contar nada.
   ------------------------------------------------------------------------- */
export function Ribbon({
  elapsed, target, marks = [], height = 56, showLabels = true,
  cursor = null, onSeek = null, serie = null,
}) {
  const total = Math.max(target * 1.25, elapsed * 1.05, 30);
  const p = (t) => Math.min(100, Math.max(0, (t / total) * 100));
  const g1 = p(target * 0.8), g2 = p(target);

  const click = (e) => {
    if (!onSeek) return;
    const r = e.currentTarget.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    onSeek(frac * total);
  };

  return (
    <div>
      <div onClick={click} style={{
        position: "relative", height, borderRadius: 10, overflow: "hidden",
        border: `1px solid ${T.line}`, background: T.ink, cursor: onSeek ? "pointer" : "default",
      }}>
        {/* Bandas de tiempo objetivo */}
        <div style={{ position: "absolute", inset: 0, display: "flex" }}>
          <div style={{ width: `${g1}%`, background: `${T.jade}1A` }} />
          <div style={{ width: `${g2 - g1}%`, background: `${T.amber}22` }} />
          <div style={{ flex: 1, background: `${T.red}22` }} />
        </div>

        {/* Curva de volumen, si viene la serie de la grabación */}
        {serie?.length > 1 && (
          <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: .55 }}>
            <path
              d={serie.map((s, i) => {
                const x = p(s.t);
                const y = height - Math.min(height, s.n * height * 1.7);
                return `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`;
              }).join(" ") + ` L${p(serie[serie.length - 1].t).toFixed(2)},${height} L${p(serie[0].t).toFixed(2)},${height} Z`}
              fill={`${T.sky}44`} stroke={T.sky} strokeWidth={0.4} vectorEffect="non-scaling-stroke" />
          </svg>
        )}

        {/* Línea del objetivo */}
        <div style={{ position: "absolute", left: `${g2}%`, top: 0, bottom: 0, width: 2, background: T.bone, opacity: .5 }} />

        {/* Avance */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: `${p(elapsed)}%`,
          background: "linear-gradient(90deg, rgba(239,230,213,.03), rgba(239,230,213,.12))",
          borderRight: `2px solid ${bandColor(elapsed, target, T)}`,
          transition: "width .3s linear",
        }} />

        {/* Cursor de reproducción */}
        {cursor != null && (
          <div style={{
            position: "absolute", left: `${p(cursor)}%`, top: 0, bottom: 0, width: 2,
            background: T.brass, boxShadow: `0 0 8px ${T.brass}`, transition: "left .1s linear",
          }} />
        )}

        {/* Marcas del profesor */}
        {marks.map((m) => {
          const c = CRIT[m.k];
          const color = m.signo > 0 ? T.jade : c?.color || T.red;
          const arriba = m.signo > 0;
          return (
            <div key={m.id} title={`${c?.n || m.k} · ${fmt(m.t)}`} style={{
              position: "absolute", left: `calc(${p(m.t)}% - 1.5px)`,
              top: arriba ? 3 : "auto", bottom: arriba ? "auto" : 3,
              width: 3, height: height * 0.42, borderRadius: 2,
              background: color, boxShadow: `0 0 6px ${color}AA`,
            }} />
          );
        })}
      </div>

      {showLabels && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontFamily: FONT_M, fontSize: 10, color: T.muted }}>
          <span>00:00</span>
          <span style={{ color: T.bone }}>objetivo {fmt(target)}</span>
          <span>{fmt(total)}</span>
        </div>
      )}
    </div>
  );
}

/* Mini gráfica de línea en SVG para curvas densas (tono, volumen) sin
   depender de una librería de charts en pantallas de alta frecuencia. */
export function Sparkline({ datos, color = T.sky, alto = 70, referencia = null, dominio = null }) {
  const puntos = (datos || []).filter((d) => d.v > 0);
  if (puntos.length < 2) {
    return <div style={{ height: alto, display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontSize: 12 }}>Sin datos suficientes</div>;
  }
  const xs = puntos.map((d) => d.t), ys = puntos.map((d) => d.v);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const [y0, y1] = dominio || [Math.min(...ys), Math.max(...ys)];
  const nx = (x) => ((x - x0) / (x1 - x0 || 1)) * 100;
  const ny = (y) => alto - ((y - y0) / (y1 - y0 || 1)) * alto;

  return (
    <svg viewBox={`0 0 100 ${alto}`} preserveAspectRatio="none" style={{ width: "100%", height: alto, display: "block" }}>
      {referencia != null && (
        <line x1="0" x2="100" y1={ny(referencia)} y2={ny(referencia)}
          stroke={T.bone} strokeOpacity=".35" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
      )}
      <path d={puntos.map((d, i) => `${i ? "L" : "M"}${nx(d.t).toFixed(2)},${ny(d.v).toFixed(2)}`).join(" ")}
        fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke"
        strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
