import React, { useMemo } from "react";
import { Mic, ChevronRight, TrendingUp, Users, Clock, Flame, Headphones } from "lucide-react";
import { T, FONT_D, FONT_M, notaColor } from "../theme.js";
import { fmt, fecha } from "../lib/format.js";
import { promedioTotal, CRITERIOS, CRIT } from "../data/rubrica.js";
import { Card, Eyebrow, H, Head, Btn, Avatar, Barra } from "../ui/primitives.jsx";

export function Inicio({ alumnos, sesiones, go, setTab }) {
  const ult = useMemo(() => [...sesiones].sort((a, b) => b.ts - a.ts).slice(0, 5), [sesiones]);
  const sem = sesiones.filter((s) => Date.now() - s.ts < 7 * 864e5);
  const minutos = Math.round(sesiones.reduce((a, s) => a + s.duracion, 0) / 60);

  /* Criterios que más se repiten como problema en las últimas prácticas:
     le dice al profesor dónde poner el foco de la semana. */
  const focos = useMemo(() => {
    const recientes = sesiones.filter((s) => Date.now() - s.ts < 21 * 864e5);
    const acum = {};
    recientes.forEach((s) => {
      CRITERIOS.forEach((c) => {
        const v = s.rubrica?.[c.k];
        if (typeof v === "number" && v > 0 && v <= 3) acum[c.k] = (acum[c.k] || 0) + (4 - v);
      });
    });
    return Object.entries(acum).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => ({ c: CRIT[k], peso: v }));
  }, [sesiones]);

  return (
    <div>
      <Head title="Ágora" sub="Estudio de oratoria" />
      <div style={{ padding: "0 18px 18px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { n: alumnos.length, l: "alumnos", c: T.brass },
            { n: sem.length, l: "prácticas / 7 días", c: T.jade },
            { n: minutos, l: "min. en tribuna", c: T.sky },
          ].map((x) => (
            <Card key={x.l} style={{ padding: 13 }}>
              <div style={{ fontFamily: FONT_D, fontSize: 32, color: x.c, lineHeight: 1 }}>{x.n}</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 4, lineHeight: 1.25 }}>{x.l}</div>
            </Card>
          ))}
        </div>

        <Card style={{ background: `linear-gradient(135deg, ${T.raised}, ${T.surface})`, marginBottom: 16 }}>
          <Eyebrow color={T.brass}>Empezar</Eyebrow>
          <H size={21} style={{ marginBottom: 6 }}>Abrir una clase en vivo</H>
          <div style={{ fontSize: 13.5, color: T.muted, lineHeight: 1.55, marginBottom: 14 }}>
            Cronómetro con banda de tiempo, marcado de los 24 criterios con un toque, grabación de la
            práctica y evaluación precargada con lo que midió el micrófono.
          </div>
          <Btn Icon={Mic} onClick={() => setTab("clase")} full size="lg">Elegir alumno y empezar</Btn>
        </Card>

        {focos.length > 0 && (
          <Card style={{ marginBottom: 16 }}>
            <Eyebrow color={T.amber}>Foco de las últimas semanas</Eyebrow>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 11, lineHeight: 1.45 }}>
              Los criterios que más se repiten como problema entre todos tus alumnos.
            </div>
            {focos.map(({ c, peso }) => c && (
              <div key={c.k} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
                <c.Icon size={15} color={c.color} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, marginBottom: 3 }}>{c.n}</div>
                  <Barra v={peso} max={focos[0].peso} color={c.color} alto={5} />
                </div>
              </div>
            ))}
          </Card>
        )}

        <Eyebrow>Últimas prácticas</Eyebrow>
        {ult.length === 0 ? (
          <Card>
            <div style={{ color: T.muted, fontSize: 13.5, lineHeight: 1.55 }}>
              Todavía no hay prácticas registradas. La primera clase que corras aparecerá aquí.
            </div>
          </Card>
        ) : ult.map((s) => {
          const al = alumnos.find((a) => a.id === s.alumnoId);
          const p = promedioTotal(s.rubrica);
          return (
            <Card key={s.id} onClick={() => go("devolucion", s.id)} style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar nombre={al?.nombre} color={al?.color || T.brass} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {al?.nombre || "Alumno"}
                </div>
                <div style={{ fontSize: 11.5, color: T.muted, fontFamily: FONT_M, display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                  {fecha(s.ts)} · {fmt(s.duracion)} · {(s.marcas || []).length} marcas
                  {s.tieneAudio && <Headphones size={11} color={T.brass} />}
                </div>
              </div>
              <div style={{ fontFamily: FONT_D, fontSize: 24, color: notaColor(p) }}>{p.toFixed(1)}</div>
              <ChevronRight size={16} color={T.muted} />
            </Card>
          );
        })}
      </div>
    </div>
  );
}
