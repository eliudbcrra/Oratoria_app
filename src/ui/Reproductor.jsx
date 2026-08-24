import React, { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward, Rewind, FastForward, Volume2 } from "lucide-react";
import { T, FONT_M } from "../theme.js";
import { fmt } from "../lib/format.js";
import { Ribbon } from "./Ribbon.jsx";
import { Eyebrow, Chip } from "./primitives.jsx";
import { CRIT } from "../data/rubrica.js";

/* ---------------------------------------------------------------------------
   Reproductor de la grabación de la práctica.

   MediaRecorder produce WebM sin metadato de duración: el navegador reporta
   `Infinity` hasta que se fuerza una búsqueda al final. Como la duración real
   ya la conocemos por el cronómetro de la clase, la usamos y desbloqueamos el
   desplazamiento con esa maniobra al cargar.
   ------------------------------------------------------------------------- */
export function Reproductor({ blob, duracion, marcas = [], serie = null, objetivo = 0 }) {
  const audioRef = useRef(null);
  const [url, setUrl] = useState(null);
  const [listo, setListo] = useState(false);
  const [sonando, setSonando] = useState(false);
  const [t, setT] = useState(0);
  const [vel, setVel] = useState(1);

  useEffect(() => {
    if (!blob) return;
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);

  /* Desbloquea el desplazamiento en WebM sin duración declarada. */
  const alCargar = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.duration === Infinity || Number.isNaN(a.duration)) {
      const alActualizar = () => {
        a.removeEventListener("timeupdate", alActualizar);
        a.currentTime = 0;
        setListo(true);
      };
      a.addEventListener("timeupdate", alActualizar);
      a.currentTime = 1e101;
    } else {
      setListo(true);
    }
  }, []);

  const irA = useCallback((seg) => {
    const a = audioRef.current;
    if (!a) return;
    const destino = Math.max(0, Math.min(duracion - 0.2, seg));
    try { a.currentTime = destino; setT(destino); } catch {}
  }, [duracion]);

  const alternar = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) { a.play().catch(() => {}); } else { a.pause(); }
  };

  const cambiarVel = () => {
    const ciclo = [1, 0.75, 0.5, 1.5];
    const nueva = ciclo[(ciclo.indexOf(vel) + 1) % ciclo.length];
    setVel(nueva);
    if (audioRef.current) audioRef.current.playbackRate = nueva;
  };

  const ordenadas = [...marcas].sort((a, b) => a.t - b.t);
  const siguiente = () => { const m = ordenadas.find((x) => x.t > t + 0.4); if (m) irA(m.t - 2.5); };
  const anterior = () => {
    const previas = ordenadas.filter((x) => x.t < t - 1.5);
    const m = previas[previas.length - 1];
    irA(m ? m.t - 2.5 : 0);
  };

  if (!blob) return null;

  return (
    <div>
      <audio
        ref={audioRef} src={url || undefined} preload="metadata"
        onLoadedMetadata={alCargar}
        onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
        onPlay={() => setSonando(true)}
        onPause={() => setSonando(false)}
        onEnded={() => setSonando(false)}
      />

      <Ribbon elapsed={duracion} target={objetivo || duracion} marks={marcas} serie={serie}
        height={62} cursor={t} onSeek={irA} showLabels={false} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, marginBottom: 10 }}>
        <span style={{ fontFamily: FONT_M, fontSize: 13, color: T.brass }}>{fmt(t)}</span>
        <span style={{ fontFamily: FONT_M, fontSize: 11.5, color: T.muted }}>
          {listo ? "toca la cinta para saltar" : "preparando audio…"}
        </span>
        <span style={{ fontFamily: FONT_M, fontSize: 13, color: T.muted }}>{fmt(duracion)}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <BotonCtrl onClick={anterior} title="Marca anterior"><SkipBack size={17} /></BotonCtrl>
        <BotonCtrl onClick={() => irA(t - 10)} title="Atrás 10 s"><Rewind size={17} /></BotonCtrl>
        <button onClick={alternar} style={{
          width: 58, height: 58, borderRadius: 29, border: "none", cursor: "pointer",
          background: T.brass, color: T.ink, display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 4px 16px ${T.brass}44`, transition: "transform .12s ease",
        }}
          onPointerDown={(e) => (e.currentTarget.style.transform = "scale(.94)")}
          onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}>
          {sonando ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: 3 }} />}
        </button>
        <BotonCtrl onClick={() => irA(t + 10)} title="Adelante 10 s"><FastForward size={17} /></BotonCtrl>
        <BotonCtrl onClick={siguiente} title="Marca siguiente"><SkipForward size={17} /></BotonCtrl>
        <BotonCtrl onClick={cambiarVel} title="Velocidad" ancho={46}>
          <span style={{ fontFamily: FONT_M, fontSize: 12 }}>{vel}×</span>
        </BotonCtrl>
      </div>

      {ordenadas.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Eyebrow>Saltar a un momento marcado</Eyebrow>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {ordenadas.map((m) => {
              const c = CRIT[m.k];
              const color = m.signo > 0 ? T.jade : c?.color || T.red;
              const activo = Math.abs(t - (m.t - 2.5)) < 1.2;
              return (
                <button key={m.id} onClick={() => irA(m.t - 2.5)} style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  background: activo ? `${color}33` : `${color}14`,
                  border: `1px solid ${color}${activo ? "AA" : "44"}`,
                  color: T.bone, padding: "5px 10px", borderRadius: 14,
                  fontSize: 11.5, cursor: "pointer", fontFamily: "inherit",
                  transition: "background .15s ease",
                }}>
                  {c?.Icon && <c.Icon size={11} color={color} />}
                  <span>{c?.n || m.k}</span>
                  <span style={{ fontFamily: FONT_M, color: T.muted }}>{fmt(m.t)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function BotonCtrl({ children, onClick, title, ancho = 40 }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: ancho, height: 40, borderRadius: 10, cursor: "pointer",
      background: T.raised, border: `1px solid ${T.line}`, color: T.bone,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>{children}</button>
  );
}
