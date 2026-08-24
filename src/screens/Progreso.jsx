import React, { useState, useMemo } from "react";
import { Users, TrendingUp, Repeat, Clock, Activity } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar, Legend,
} from "recharts";
import { T, FONT_M, notaColor } from "../theme.js";
import { fmt, fecha } from "../lib/format.js";
import { TRACKS, GRUPOS, CRITERIOS, CRIT, criteriosDeGrupo, promedioTotal, promedioGrupo } from "../data/rubrica.js";
import { TEMARIO } from "../data/temario.js";
import { Card, Eyebrow, H, Head, Empty, Chip, Barra, Metric } from "../ui/primitives.jsx";

const ejeX = { tick: { fill: T.muted, fontSize: 11 }, axisLine: { stroke: T.line }, tickLine: false };
const ejeY = { tick: { fill: T.muted, fontSize: 11 }, axisLine: false, tickLine: false };
const tip = { contentStyle: { background: T.raised, border: `1px solid ${T.line}`, borderRadius: 9, color: T.bone, fontSize: 12 } };

export function Progreso({ alumnos, sesionesDe, temario }) {
  const [sel, setSel] = useState(alumnos[0]?.id || null);
  const [vista, setVista] = useState("general");
  const a = alumnos.find((x) => x.id === sel);
  const ss = useMemo(() => (a ? sesionesDe(a.id) : []), [a, sesionesDe]);

  const serie = useMemo(() => ss.map((s, i) => ({
    n: `${i + 1}`,
    fecha: fecha(s.ts),
    calif: +promedioTotal(s.rubrica).toFixed(2),
    minutos: +(s.duracion / 60).toFixed(1),
    marcas: (s.marcas || []).filter((m) => m.signo < 0).length,
    aciertos: (s.marcas || []).filter((m) => m.signo > 0).length,
    wpm: s.resumenAudio?.wpm || null,
    muletillas: s.resumenAudio?.muletillas ?? (s.marcas || []).filter((m) => m.k === "muletillas" && m.signo < 0).length,
    rango: s.resumenAudio?.tono?.rangoSemitonos || null,
    pausas: s.resumenAudio?.pausas?.total ?? null,
  })), [ss]);

  const first = ss[0], last = ss[ss.length - 1];

  const comparativo = useMemo(() => GRUPOS.map((g) => ({
    m: g.corto,
    inicio: +promedioGrupo(first?.rubrica || {}, g.k).toFixed(2),
    ahora: +promedioGrupo(last?.rubrica || {}, g.k).toFixed(2),
  })), [first, last]);

  /* Evolución de cada criterio: cuánto subió o bajó entre la primera y la última. */
  const deltas = useMemo(() => {
    if (!first || !last || ss.length < 2) return [];
    return CRITERIOS
      .map((c) => {
        const ini = first.rubrica?.[c.k], fin = last.rubrica?.[c.k];
        if (!ini || !fin) return null;
        return { c, ini, fin, d: fin - ini };
      })
      .filter(Boolean)
      .sort((x, y) => y.d - x.d);
  }, [first, last, ss.length]);

  const conAudio = serie.filter((s) => s.wpm != null);

  return (
    <div>
      <Head title="Progreso" sub="Evolución medible" />
      <div style={{ padding: "0 18px 18px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
          {alumnos.map((x) => (
            <Chip key={x.id} activo={sel === x.id} color={T.brass} onClick={() => setSel(x.id)}>
              {x.nombre.split(" ")[0]}
            </Chip>
          ))}
        </div>

        {!a ? (
          <Empty Icon={Users} title="Elige un alumno" hint="Selecciona a alguien para ver su curva de avance." />
        ) : ss.length < 1 ? (
          <Empty Icon={TrendingUp} title="Aún no hay datos" hint="Las gráficas aparecen desde la primera práctica evaluada." />
        ) : (
          <>
            <div style={{ display: "flex", gap: 7, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
              {[["general", "General"], ["criterios", "Por criterio"], ["voz", "Voz"], ["temario", "Temario"]].map(([k, n]) => (
                <Chip key={k} activo={vista === k} color={T.sky} onClick={() => setVista(k)}>{n}</Chip>
              ))}
            </div>

            {/* ------------------------------ GENERAL ---------------------------- */}
            {vista === "general" && (
              <div className="aparece">
                <Card style={{ marginBottom: 12 }}>
                  <Eyebrow>Calificación por práctica</Eyebrow>
                  <ResponsiveContainer width="100%" height={190}>
                    <LineChart data={serie} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                      <CartesianGrid stroke={T.line} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="n" {...ejeX} />
                      <YAxis domain={[0, 5]} {...ejeY} />
                      <Tooltip {...tip} labelFormatter={(l) => `Práctica ${l}`} />
                      <Line type="monotone" dataKey="calif" name="Calificación" stroke={T.brass} strokeWidth={2.5} dot={{ r: 3, fill: T.brass }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                {ss.length > 1 && (
                  <Card style={{ marginBottom: 12 }}>
                    <Eyebrow>Primera práctica vs. última</Eyebrow>
                    <ResponsiveContainer width="100%" height={250}>
                      <RadarChart data={comparativo}>
                        <PolarGrid stroke={T.line} />
                        <PolarAngleAxis dataKey="m" tick={{ fill: T.muted, fontSize: 11 }} />
                        <Radar name="Inicio" dataKey="inicio" stroke={T.muted} fill={T.muted} fillOpacity={0.14} />
                        <Radar name="Ahora" dataKey="ahora" stroke={T.jade} fill={T.jade} fillOpacity={0.3} />
                        <Tooltip {...tip} />
                      </RadarChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", gap: 18, justifyContent: "center", fontSize: 11.5, color: T.muted, fontFamily: FONT_M }}>
                      <span><span style={{ color: T.muted }}>■</span> inicio</span>
                      <span><span style={{ color: T.jade }}>■</span> ahora</span>
                    </div>
                  </Card>
                )}

                <Card style={{ marginBottom: 12 }}>
                  <Eyebrow>Incidencias marcadas por práctica</Eyebrow>
                  <ResponsiveContainer width="100%" height={170}>
                    <BarChart data={serie} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                      <CartesianGrid stroke={T.line} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="n" {...ejeX} />
                      <YAxis {...ejeY} allowDecimals={false} />
                      <Tooltip {...tip} labelFormatter={(l) => `Práctica ${l}`} />
                      <Bar dataKey="marcas" name="A corregir" fill={T.red} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="aciertos" name="Aciertos" fill={T.jade} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <Card>
                  <Eyebrow>Tiempo en tribuna por práctica</Eyebrow>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={serie} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                      <CartesianGrid stroke={T.line} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="n" {...ejeX} />
                      <YAxis {...ejeY} />
                      <Tooltip {...tip} formatter={(v) => [`${v} min`, "Duración"]} labelFormatter={(l) => `Práctica ${l}`} />
                      <Bar dataKey="minutos" fill={T.sky} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            )}

            {/* ---------------------------- POR CRITERIO -------------------------- */}
            {vista === "criterios" && (
              <div className="aparece">
                {deltas.length === 0 ? (
                  <Empty Icon={TrendingUp} title="Faltan datos para comparar"
                    hint="Se necesitan al menos dos prácticas que evalúen los mismos criterios." />
                ) : (
                  <>
                    <Card style={{ marginBottom: 12 }}>
                      <Eyebrow color={T.jade}>Lo que más subió</Eyebrow>
                      {deltas.filter((x) => x.d > 0).slice(0, 5).map((x) => <FilaDelta key={x.c.k} {...x} />)}
                      {deltas.filter((x) => x.d > 0).length === 0 && (
                        <div style={{ fontSize: 12.5, color: T.muted }}>Ningún criterio subió todavía.</div>
                      )}
                    </Card>
                    <Card style={{ marginBottom: 12 }}>
                      <Eyebrow color={T.red}>Lo que bajó o sigue estancado</Eyebrow>
                      {deltas.filter((x) => x.d <= 0).slice(-5).reverse().map((x) => <FilaDelta key={x.c.k} {...x} />)}
                      {deltas.filter((x) => x.d <= 0).length === 0 && (
                        <div style={{ fontSize: 12.5, color: T.muted }}>Todo mejoró o se mantuvo.</div>
                      )}
                    </Card>
                  </>
                )}

                <Card>
                  <Eyebrow>Promedio histórico por criterio</Eyebrow>
                  {GRUPOS.map((g) => {
                    const crit = criteriosDeGrupo(g.k);
                    const filas = crit.map((c) => {
                      const v = ss.map((s) => s.rubrica?.[c.k]).filter((x) => typeof x === "number" && x > 0);
                      return { c, v: v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0, n: v.length };
                    }).filter((f) => f.n > 0);
                    if (!filas.length) return null;
                    return (
                      <div key={g.k} style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, color: g.color, fontFamily: FONT_M, letterSpacing: 1, marginBottom: 7, textTransform: "uppercase" }}>{g.corto}</div>
                        {filas.map(({ c, v, n }) => (
                          <div key={c.k} style={{ marginBottom: 8 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 3, alignItems: "center", gap: 8 }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                                <c.Icon size={12} color={g.color} />
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.n}</span>
                              </span>
                              <span style={{ fontFamily: FONT_M, color: notaColor(v), flexShrink: 0 }}>
                                {v.toFixed(1)} <span style={{ color: T.muted, fontSize: 10 }}>({n})</span>
                              </span>
                            </div>
                            <Barra v={v} color={notaColor(v)} alto={4} />
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </Card>
              </div>
            )}

            {/* -------------------------------- VOZ ------------------------------- */}
            {vista === "voz" && (
              <div className="aparece">
                {conAudio.length === 0 ? (
                  <Empty Icon={Activity} title="Sin mediciones de voz"
                    hint="Activa el asistente de voz al preparar la práctica para que se registren ritmo, tono y muletillas." />
                ) : (
                  <>
                    <Card style={{ marginBottom: 12 }}>
                      <Eyebrow color={T.brass}>Ritmo · palabras por minuto</Eyebrow>
                      <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 8, lineHeight: 1.45 }}>
                        Zona recomendada: {a.track === "infantil" ? "100–145" : "110–160"} ppm.
                      </div>
                      <ResponsiveContainer width="100%" height={170}>
                        <LineChart data={conAudio} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                          <CartesianGrid stroke={T.line} strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="n" {...ejeX} />
                          <YAxis {...ejeY} />
                          <Tooltip {...tip} labelFormatter={(l) => `Práctica ${l}`} />
                          <Line type="monotone" dataKey="wpm" name="ppm" stroke={T.brass} strokeWidth={2.5} dot={{ r: 3, fill: T.brass }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card>

                    <Card style={{ marginBottom: 12 }}>
                      <Eyebrow color={T.red}>Muletillas por práctica</Eyebrow>
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={serie} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                          <CartesianGrid stroke={T.line} strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="n" {...ejeX} />
                          <YAxis {...ejeY} allowDecimals={false} />
                          <Tooltip {...tip} labelFormatter={(l) => `Práctica ${l}`} />
                          <Bar dataKey="muletillas" name="Muletillas" fill={T.red} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>

                    <Card style={{ marginBottom: 12 }}>
                      <Eyebrow color={T.violet}>Rango expresivo · semitonos</Eyebrow>
                      <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 8, lineHeight: 1.45 }}>
                        Cuánto sube y baja la voz. Por debajo de 3 suena monótono; entre 4 y 12 es un discurso vivo.
                      </div>
                      <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={conAudio} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                          <CartesianGrid stroke={T.line} strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="n" {...ejeX} />
                          <YAxis {...ejeY} />
                          <Tooltip {...tip} labelFormatter={(l) => `Práctica ${l}`} />
                          <Line type="monotone" dataKey="rango" name="semitonos" stroke={T.violet} strokeWidth={2.5} dot={{ r: 3, fill: T.violet }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card>

                    <Card>
                      <Eyebrow color={T.sky}>Pausas por práctica</Eyebrow>
                      <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={conAudio} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                          <CartesianGrid stroke={T.line} strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="n" {...ejeX} />
                          <YAxis {...ejeY} allowDecimals={false} />
                          <Tooltip {...tip} labelFormatter={(l) => `Práctica ${l}`} />
                          <Bar dataKey="pausas" name="Pausas" fill={T.sky} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>
                  </>
                )}
              </div>
            )}

            {/* ------------------------------ TEMARIO ----------------------------- */}
            {vista === "temario" && (
              <Card className="aparece">
                <Eyebrow>Cobertura del temario</Eyebrow>
                {TEMARIO[a.track].map((t) => {
                  const e = (temario[a.id] || {})[t.k] || 0;
                  return (
                    <div key={t.k} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0" }}>
                      <div style={{ flex: 1, fontSize: 13 }}>{t.n}</div>
                      <div style={{ display: "flex", gap: 3 }}>
                        {[1, 2, 3].map((i) => (
                          <div key={i} style={{
                            width: 20, height: 5, borderRadius: 3,
                            background: e >= i ? (e === 3 ? T.jade : e === 2 ? T.amber : T.sky) : T.line,
                          }} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FilaDelta({ c, ini, fin, d }) {
  const col = d > 0 ? T.jade : d < 0 ? T.red : T.muted;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: `1px solid ${T.line}44` }}>
      <c.Icon size={13} color={c.color} />
      <span style={{ flex: 1, fontSize: 13, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.n}</span>
      <span style={{ fontFamily: FONT_M, fontSize: 12, color: T.muted }}>{ini} → {fin}</span>
      <span style={{ fontFamily: FONT_M, fontSize: 12.5, color: col, minWidth: 28, textAlign: "right" }}>
        {d > 0 ? "+" : ""}{d}
      </span>
    </div>
  );
}
