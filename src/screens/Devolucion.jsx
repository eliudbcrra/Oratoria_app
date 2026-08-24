import React, { useState, useEffect, useMemo } from "react";
import {
  Volume2, Music, Activity, Pause, Repeat, Clock, BookOpen, FileText,
  AlertTriangle, TrendingUp, TrendingDown, Minus, Headphones, Trash2,
} from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { T, FONT_D, FONT_M, notaColor } from "../theme.js";
import { fmt, fecha, fechaLarga, hzANota } from "../lib/format.js";
import { BLOQUES, GRUPOS, CRITERIOS, CRIT, criteriosDeGrupo, promedioTotal, promedioGrupo } from "../data/rubrica.js";
import { EJERCICIOS } from "../data/ejercicios.js";
import { diagnosticar } from "../lib/diagnostico.js";
import { MULETILLAS } from "../lib/audioLab.js";
import { leerBlob, ST_AUDIO, ST_ANALISIS } from "../lib/storage.js";
import { Card, Eyebrow, H, Head, Btn, Metric, Barra, Chip, Confirmar } from "../ui/primitives.jsx";
import { Ribbon, Sparkline } from "../ui/Ribbon.jsx";
import { Reproductor } from "../ui/Reproductor.jsx";

export function Devolucion({ sesion: s, alumnos, sesionesDe, back, onBorrar, flash }) {
  const [audio, setAudio] = useState(null);
  const [analisis, setAnalisis] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [pestana, setPestana] = useState("resumen");
  const [confirmBorrar, setConfirmBorrar] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      if (!s) return setCargando(false);
      try {
        const [a, an] = await Promise.all([
          s.tieneAudio ? leerBlob(ST_AUDIO, s.id) : Promise.resolve(null),
          leerBlob(ST_ANALISIS, s.id),
        ]);
        if (!vivo) return;
        setAudio(a || null);
        setAnalisis(an || null);
      } catch {}
      if (vivo) setCargando(false);
    })();
    return () => { vivo = false; };
  }, [s]);

  if (!s) return <div style={{ padding: 20 }}>Práctica no encontrada.</div>;

  const a = alumnos.find((x) => x.id === s.alumnoId);
  const todas = sesionesDe(s.alumnoId);
  const idx = todas.findIndex((x) => x.id === s.id);
  const prev = idx > 0 ? todas[idx - 1] : null;
  const p = promedioTotal(s.rubrica);
  const pPrev = prev ? promedioTotal(prev.rubrica) : null;

  const audioData = analisis || s.resumenAudio;
  const diag = diagnosticar(audioData, { track: s.track, objetivo: s.objetivo, duracion: s.duracion });

  const evaluados = CRITERIOS.filter((c) => s.rubrica[c.k] > 0);
  const ordenados = [...evaluados].sort((x, y) => s.rubrica[y.k] - s.rubrica[x.k]);
  const fuertes = ordenados.slice(0, 3);
  const debiles = [...ordenados].reverse().slice(0, 3);

  const PESTANAS = [
    ["resumen", "Resumen"],
    ...(audio || audioData ? [["audio", "Grabación"]] : []),
    ...(audioData?.hayTranscripcion ? [["texto", "Transcripción"]] : []),
    ["rubrica", "Rúbrica"],
    ["tarea", "Tarea"],
  ];

  return (
    <div>
      <Head title="Devolución" sub={`${a?.nombre || "Alumno"} · ${fecha(s.ts, { day: "2-digit", month: "long" })}`} onBack={back}
        right={
          <button onClick={() => setConfirmBorrar(true)} title="Borrar esta práctica"
            style={{ background: "transparent", border: `1px solid ${T.red}44`, borderRadius: 10, padding: 9, color: T.red, cursor: "pointer" }}>
            <Trash2 size={16} />
          </button>
        } />

      <div style={{ padding: "0 18px 34px" }}>
        {/* Calificación global */}
        <Card style={{ marginBottom: 13, textAlign: "center", background: `linear-gradient(135deg,${T.raised},${T.surface})` }}>
          <Eyebrow color={T.brass}>Calificación de la práctica</Eyebrow>
          <div style={{ fontFamily: FONT_D, fontSize: 62, color: notaColor(p), lineHeight: 1 }}>{p.toFixed(1)}</div>
          {pPrev !== null && (
            <div style={{ fontSize: 12.5, color: p >= pPrev ? T.jade : T.red, marginTop: 4, fontFamily: FONT_M, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              {p > pPrev ? <TrendingUp size={13} /> : p < pPrev ? <TrendingDown size={13} /> : <Minus size={13} />}
              {Math.abs(p - pPrev).toFixed(1)} respecto a la práctica anterior
            </div>
          )}
          <div style={{ fontSize: 12, color: T.muted, marginTop: 6, fontFamily: FONT_M }}>
            {s.tipo} · {fmt(s.duracion)} de {fmt(s.objetivo)} · {evaluados.length} criterios evaluados
          </div>
        </Card>

        {/* Promedio por grupo */}
        <Card style={{ marginBottom: 13 }}>
          <Eyebrow>Promedio por familia</Eyebrow>
          {GRUPOS.map((g) => {
            const v = promedioGrupo(s.rubrica, g.k);
            if (!v) return null;
            return (
              <div key={g.k} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ color: T.bone }}>{g.n}</span>
                  <span style={{ fontFamily: FONT_M, color: notaColor(v) }}>{v.toFixed(1)}</span>
                </div>
                <Barra v={v} color={notaColor(v)} alto={7} />
              </div>
            );
          })}
        </Card>

        {/* Pestañas */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 13 }}>
          {PESTANAS.map(([k, n]) => (
            <Chip key={k} activo={pestana === k} color={T.brass} onClick={() => setPestana(k)}>{n}</Chip>
          ))}
        </div>

        {/* --------------------------- RESUMEN --------------------------- */}
        {pestana === "resumen" && (
          <div className="aparece">
            <Card style={{ marginBottom: 13 }}>
              <Eyebrow>Línea de tiempo del discurso</Eyebrow>
              <Ribbon elapsed={s.duracion} target={s.objetivo} marks={s.marcas || []} serie={analisis?.serie} height={50} />
              <div style={{ marginTop: 12, maxHeight: 210, overflowY: "auto" }}>
                {(s.marcas || []).length === 0
                  ? <div style={{ fontSize: 12.5, color: T.muted }}>No se marcó ninguna incidencia durante la práctica.</div>
                  : [...s.marcas].sort((x, y) => x.t - y.t).map((m) => {
                    const c = CRIT[m.k];
                    const col = m.signo > 0 ? T.jade : c?.color || T.red;
                    return (
                      <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: `1px solid ${T.line}44` }}>
                        <span style={{ fontFamily: FONT_M, fontSize: 12, color: T.muted, width: 44 }}>{fmt(m.t)}</span>
                        {c?.Icon && <c.Icon size={14} color={col} />}
                        <span style={{ fontSize: 13, flex: 1 }}>{c?.n || m.k}</span>
                        <span style={{ fontSize: 11, fontFamily: FONT_M, color: col }}>{m.signo > 0 ? "acierto" : "a corregir"}</span>
                      </div>
                    );
                  })}
              </div>
            </Card>

            {Object.keys(diag).length > 0 && <PanelMediciones diag={diag} audio={audioData} />}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 13 }}>
              <Card style={{ borderColor: `${T.jade}55` }}>
                <Eyebrow color={T.jade}>Lo que funcionó</Eyebrow>
                {fuertes.length === 0 && <div style={{ fontSize: 12.5, color: T.muted }}>Sin datos</div>}
                {fuertes.map((f) => (
                  <div key={f.k} style={{ fontSize: 12.5, marginBottom: 6, lineHeight: 1.35, display: "flex", justifyContent: "space-between", gap: 6 }}>
                    <span>{f.n}</span><b style={{ fontFamily: FONT_M, color: T.jade }}>{s.rubrica[f.k]}</b>
                  </div>
                ))}
              </Card>
              <Card style={{ borderColor: `${T.red}55` }}>
                <Eyebrow color={T.red}>A corregir</Eyebrow>
                {debiles.length === 0 && <div style={{ fontSize: 12.5, color: T.muted }}>Sin datos</div>}
                {debiles.map((f) => (
                  <div key={f.k} style={{ fontSize: 12.5, marginBottom: 6, lineHeight: 1.35, display: "flex", justifyContent: "space-between", gap: 6 }}>
                    <span>{f.n}</span><b style={{ fontFamily: FONT_M, color: T.red }}>{s.rubrica[f.k]}</b>
                  </div>
                ))}
              </Card>
            </div>

            {s.notas && (
              <Card style={{ marginBottom: 13 }}>
                <Eyebrow>Notas del profesor</Eyebrow>
                <div style={{ fontSize: 13.5, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{s.notas}</div>
              </Card>
            )}
          </div>
        )}

        {/* --------------------------- GRABACIÓN -------------------------- */}
        {pestana === "audio" && (
          <div className="aparece">
            <Card style={{ marginBottom: 13 }}>
              <Eyebrow color={T.brass}>Escuchar la práctica</Eyebrow>
              {cargando ? (
                <div style={{ padding: 20, textAlign: "center", color: T.muted, fontSize: 13 }}>Cargando la grabación…</div>
              ) : audio ? (
                <Reproductor blob={audio} duracion={s.duracion} marcas={s.marcas || []} serie={analisis?.serie} objetivo={s.objetivo} />
              ) : (
                <div style={{ padding: "18px 6px", textAlign: "center", color: T.muted }}>
                  <Headphones size={26} style={{ opacity: .5, marginBottom: 8 }} />
                  <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                    Esta práctica no tiene audio guardado. Activa <b style={{ color: T.bone }}>Grabar la práctica</b> antes de empezar
                    para poder revisarla después.
                  </div>
                </div>
              )}
            </Card>

            {analisis?.serie?.length > 1 && (
              <>
                <Card style={{ marginBottom: 13 }}>
                  <Eyebrow color={T.violet}>Curva de tono</Eyebrow>
                  <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 8, lineHeight: 1.45 }}>
                    La línea punteada es el tono medio. Los picos son las inflexiones; una línea plana delata monotonía.
                  </div>
                  <Sparkline
                    datos={analisis.serie.filter((x) => x.h > 0).map((x) => ({ t: x.t, v: x.h }))}
                    color={T.violet} alto={84} referencia={audioData?.tono?.mediana} />
                  <div style={{ display: "flex", justifyContent: "space-around", marginTop: 10 }}>
                    <Metric size={17} label="grave" value={`${audioData?.tono?.min || 0} Hz`} sub={hzANota(audioData?.tono?.min)} color={T.sky} />
                    <Metric size={17} label="medio" value={`${audioData?.tono?.mediana || 0} Hz`} sub={hzANota(audioData?.tono?.mediana)} color={T.bone} />
                    <Metric size={17} label="agudo" value={`${audioData?.tono?.max || 0} Hz`} sub={hzANota(audioData?.tono?.max)} color={T.rose} />
                    <Metric size={17} label="rango" value={`${audioData?.tono?.rangoSemitonos || 0} st`} color={T.violet} />
                  </div>
                </Card>

                <Card style={{ marginBottom: 13 }}>
                  <Eyebrow color={T.sky}>Curva de volumen</Eyebrow>
                  <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 8, lineHeight: 1.45 }}>
                    Los valles son las pausas. Si la curva baja al final de cada frase, la voz se está cayendo.
                  </div>
                  <Sparkline
                    datos={analisis.serie.map((x) => ({ t: x.t, v: x.n }))}
                    color={T.sky} alto={70} referencia={audioData?.volumen?.media} dominio={[0, 1]} />
                </Card>
              </>
            )}
          </div>
        )}

        {/* ------------------------- TRANSCRIPCIÓN ------------------------ */}
        {pestana === "texto" && (
          <div className="aparece">
            <Card style={{ marginBottom: 13 }}>
              <Eyebrow color={T.jade}>Transcripción de lo que dijo</Eyebrow>
              <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 10, lineHeight: 1.45 }}>
                Reconocimiento automático: puede tener errores en nombres propios y tecnicismos.
                Las muletillas van resaltadas.
              </div>
              <TextoResaltado texto={analisis?.transcripcion || ""} />
            </Card>

            {audioData?.muletillasDetalle && Object.keys(audioData.muletillasDetalle).length > 0 && (
              <Card style={{ marginBottom: 13 }}>
                <Eyebrow color={T.red}>Muletillas detectadas</Eyebrow>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 4 }}>
                  {Object.entries(audioData.muletillasDetalle).sort((a, b) => b[1] - a[1]).map(([m, c]) => (
                    <span key={m} style={{
                      background: `${T.red}18`, border: `1px solid ${T.red}44`, color: T.bone,
                      padding: "5px 11px", borderRadius: 14, fontSize: 12.5,
                    }}>«{m}» <b style={{ fontFamily: FONT_M, color: T.red }}>×{c}</b></span>
                  ))}
                </div>
              </Card>
            )}

            {audioData?.lexico?.repetidas?.length > 0 && (
              <Card>
                <Eyebrow color={T.amber}>Palabras que más repite</Eyebrow>
                <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 9, lineHeight: 1.45 }}>
                  Buscarles sinónimos precisos es el ejercicio directo para subir vocabulario.
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {audioData.lexico.repetidas.map((r) => (
                    <span key={r.w} style={{
                      background: `${T.amber}15`, border: `1px solid ${T.amber}40`, color: T.bone,
                      padding: "5px 11px", borderRadius: 14, fontSize: 12.5,
                    }}>{r.w} <b style={{ fontFamily: FONT_M, color: T.amber }}>×{r.c}</b></span>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ---------------------------- RÚBRICA --------------------------- */}
        {pestana === "rubrica" && (
          <div className="aparece">
            {evaluados.length >= 3 && (
              <Card style={{ marginBottom: 13 }}>
                <Eyebrow>Perfil de la práctica</Eyebrow>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={GRUPOS.map((g) => ({ m: g.corto, v: +promedioGrupo(s.rubrica, g.k).toFixed(2) }))}>
                    <PolarGrid stroke={T.line} />
                    <PolarAngleAxis dataKey="m" tick={{ fill: T.muted, fontSize: 11 }} />
                    <Radar dataKey="v" stroke={T.brass} fill={T.brass} fillOpacity={0.3} />
                    <Tooltip contentStyle={{ background: T.raised, border: `1px solid ${T.line}`, borderRadius: 9, color: T.bone, fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            )}
            {BLOQUES.map((b) => (
              <div key={b.k} style={{ marginBottom: 13 }}>
                <H size={18} style={{ color: b.color, marginBottom: 8 }}>{b.n}</H>
                {b.grupos.map((g) => {
                  const crit = criteriosDeGrupo(g.k).filter((c) => s.rubrica[c.k] > 0);
                  if (!crit.length) return null;
                  return (
                    <Card key={g.k} style={{ marginBottom: 9 }}>
                      <Eyebrow color={g.color}>{g.n}</Eyebrow>
                      {crit.map((c) => (
                        <div key={c.k} style={{ marginBottom: 9 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4, alignItems: "center", gap: 8 }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><c.Icon size={12} color={g.color} />{c.n}</span>
                            <span style={{ fontFamily: FONT_M, color: notaColor(s.rubrica[c.k]) }}>{s.rubrica[c.k]}/5</span>
                          </div>
                          <Barra v={s.rubrica[c.k]} color={notaColor(s.rubrica[c.k])} alto={5} />
                        </div>
                      ))}
                    </Card>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* ----------------------------- TAREA ---------------------------- */}
        {pestana === "tarea" && (
          <div className="aparece">
            <Card style={{ marginBottom: 13 }}>
              <Eyebrow color={T.brass}>Tarea sugerida para la próxima clase</Eyebrow>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 12, lineHeight: 1.5 }}>
                Salida directa de los tres criterios más bajos de esta práctica.
              </div>
              {debiles.length === 0 && <div style={{ fontSize: 13, color: T.muted }}>Evalúa al menos un criterio para generar la tarea.</div>}
              {debiles.map((d) => (
                <div key={d.k} style={{ padding: "11px 0", borderBottom: `1px solid ${T.line}55` }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 5, display: "flex", alignItems: "center", gap: 7 }}>
                    <d.Icon size={14} color={d.color} />{d.n}
                    <span style={{ fontFamily: FONT_M, fontSize: 12, color: notaColor(s.rubrica[d.k]) }}>{s.rubrica[d.k]}/5</span>
                  </div>
                  {(EJERCICIOS[d.k] || []).map((e, i) => (
                    <div key={i} style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.55, paddingLeft: 14, position: "relative", marginBottom: 2 }}>
                      <span style={{ position: "absolute", left: 0, color: T.brass }}>·</span>{e}
                    </div>
                  ))}
                </div>
              ))}
            </Card>
          </div>
        )}

        <Confirmar abierto={confirmBorrar} peligro
          titulo="¿Borrar esta práctica?"
          texto="Se elimina la evaluación, las marcas y la grabación de esta sesión. No se puede deshacer."
          confirmar="Sí, borrar" onOk={() => { onBorrar(s.id); }} onCancel={() => setConfirmBorrar(false)} />
      </div>
    </div>
  );
}

/* ------------------- Panel de mediciones objetivas ------------------------ */
function PanelMediciones({ diag, audio }) {
  const items = Object.entries(diag).map(([k, d]) => ({ k, ...d, c: CRIT[k] })).filter((x) => x.c);
  if (!items.length) return null;
  return (
    <Card style={{ marginBottom: 13 }}>
      <Eyebrow color={T.sky}>Análisis automático</Eyebrow>
      <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 11, lineHeight: 1.45 }}>
        Medido durante la práctica, sin intervención del profesor.
      </div>
      {items.map((x) => {
        const col = x.estado === "bien" ? T.jade : x.estado === "leve" ? T.amber : T.red;
        return (
          <div key={x.k} style={{ padding: "10px 0", borderBottom: `1px solid ${T.line}44` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <x.c.Icon size={14} color={col} />
              <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{x.c.n}</span>
              <span style={{ fontFamily: FONT_M, fontSize: 12.5, color: col }}>{x.titulo}</span>
            </div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5, paddingLeft: 22 }}>
              {x.txt ? <b style={{ color: col }}>{x.txt}. </b> : null}{x.detalle}
              {x.aproximado && <span style={{ color: T.amber }}> · lectura aproximada</span>}
            </div>
          </div>
        );
      })}
      {audio && !audio.hayTranscripcion && (
        <div style={{ marginTop: 11, fontSize: 11.5, color: T.amber, lineHeight: 1.45, display: "flex", gap: 7 }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          Sin transcripción no hay conteo de palabras, ritmo real ni muletillas en esta práctica.
        </div>
      )}
    </Card>
  );
}

/* Resalta las muletillas dentro de la transcripción. */
function TextoResaltado({ texto }) {
  const partes = useMemo(() => {
    if (!texto) return [];
    const orden = [...MULETILLAS].sort((a, b) => b.length - a.length);
    const esc = orden.map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    const re = new RegExp(`(?<=^|\\s)(${esc})(?=\\s|$|[.,;:!?])`, "gi");
    const out = [];
    let ultimo = 0, m;
    while ((m = re.exec(texto)) !== null) {
      if (m.index > ultimo) out.push({ t: texto.slice(ultimo, m.index), mul: false });
      out.push({ t: m[0], mul: true });
      ultimo = m.index + m[0].length;
    }
    if (ultimo < texto.length) out.push({ t: texto.slice(ultimo), mul: false });
    return out;
  }, [texto]);

  if (!texto) {
    return <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>No se guardó transcripción de esta práctica.</div>;
  }
  return (
    <div style={{ fontSize: 14, lineHeight: 1.85, maxHeight: 400, overflowY: "auto", color: T.bone }}>
      {partes.map((p, i) =>
        p.mul
          ? <mark key={i} style={{ background: `${T.red}33`, color: T.red, borderRadius: 4, padding: "1px 4px", fontWeight: 600 }}>{p.t}</mark>
          : <span key={i}>{p.t}</span>
      )}
    </div>
  );
}
