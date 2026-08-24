import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Play, Pause, Square, Undo2, Save, Maximize2, Minimize2, AlertTriangle, Star,
  Mic, MicOff, Ban, Circle, Sliders, Check, ChevronDown, ChevronUp, Radio,
} from "lucide-react";
import { T, FONT_D, FONT_M, notaColor } from "../theme.js";
import { fmt, uid, bandColor, hzANota } from "../lib/format.js";
import { BLOQUES, GRUPOS, CRITERIOS, CRIT, criteriosDeGrupo, promedioTotal, promedioGrupo, TRACKS } from "../data/rubrica.js";
import { useAudioLab } from "../lib/audioLab.js";
import { diagnosticar, precargarRubrica } from "../lib/diagnostico.js";
import { Btn, Card, Eyebrow, H, Field, Metric, Chip, Head, Confirmar, TapHold, Sheet, Barra } from "../ui/primitives.jsx";
import { Ribbon } from "../ui/Ribbon.jsx";

export const TIPOS = ["Discurso preparado", "Improvisación", "Lectura en voz alta", "Entrevista / debate", "Ejercicio técnico"];

export function ClaseLive({ alumno: a, quick, setQuick, onGuardar, back, flash }) {
  const [fase, setFase] = useState("prep");
  const [tipo, setTipo] = useState(TIPOS[0]);
  const [objetivo, setObjetivo] = useState(a?.tiempoObjetivo || 180);
  const [correteando, setCorreteando] = useState(false);
  const [el, setEl] = useState(0);
  const [marcas, setMarcas] = useState([]);
  const [rubrica, setRubrica] = useState({});
  const [notas, setNotas] = useState("");
  const [modoAlumno, setModoAlumno] = useState(false);
  const [usarMic, setUsarMic] = useState(true);
  const [grabarAudio, setGrabarAudio] = useState(true);
  const [transcribir, setTranscribir] = useState(true);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [ultima, setUltima] = useState(null);
  const [panel, setPanel] = useState("rapidos");
  const [configQuick, setConfigQuick] = useState(false);
  const [audioFinal, setAudioFinal] = useState(null);
  const [resumenAudio, setResumenAudio] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const lab = useAudioLab();
  const tickRef = useRef(null);

  /* Cronómetro */
  useEffect(() => {
    if (correteando) tickRef.current = setInterval(() => setEl((e) => e + 1), 1000);
    return () => clearInterval(tickRef.current);
  }, [correteando]);

  /* Evita que la pantalla se apague durante la práctica. */
  useEffect(() => {
    let lock = null;
    if (fase === "live" && "wakeLock" in navigator) {
      navigator.wakeLock.request("screen").then((l) => (lock = l)).catch(() => {});
    }
    return () => { try { lock?.release(); } catch {} };
  }, [fase]);

  const conteo = useCallback((k, signo) => marcas.filter((m) => m.k === k && (signo ? m.signo === signo : true)).length, [marcas]);

  const marcar = useCallback((k, signo = -1) => {
    setMarcas((m) => [...m, { id: uid(), k, t: el, signo }]);
    setUltima({ k, signo, id: Date.now() });
    if (navigator.vibrate) navigator.vibrate(signo > 0 ? [12, 40, 12] : 18);
  }, [el]);

  const deshacer = () => setMarcas((m) => m.slice(0, -1));

  /* ------------------------------ Cancelar ------------------------------- */
  const cancelar = () => {
    lab.descartar();
    clearInterval(tickRef.current);
    setConfirmCancel(false);
    flash("Práctica cancelada, no se guardó nada");
    back();
  };

  /* ------------------------------ Terminar ------------------------------- */
  const terminar = async () => {
    setCorreteando(false);
    clearInterval(tickRef.current);
    const res = lab.activo ? lab.resumen(el) : null;
    const blob = lab.activo && grabarAudio ? await lab.cerrarGrabacion() : null;
    lab.detener();
    setResumenAudio(res);
    setAudioFinal(blob);

    const diag = diagnosticar(res, { track: a.track, objetivo, duracion: el });
    setRubrica(precargarRubrica(CRITERIOS, { diag, marcas }));
    setFase("eval");
  };

  const guardar = async () => {
    setGuardando(true);
    const sesion = {
      id: uid(), alumnoId: a.id, ts: Date.now(), duracion: el, objetivo, tipo,
      marcas, rubrica, notas, track: a.track,
      tieneAudio: !!audioFinal,
      resumenAudio: resumenAudio
        ? {
            palabras: resumenAudio.palabras, wpm: resumenAudio.wpm,
            muletillas: resumenAudio.muletillas, muletillasDetalle: resumenAudio.muletillasDetalle,
            hayTranscripcion: resumenAudio.hayTranscripcion,
            tono: resumenAudio.tono, volumen: resumenAudio.volumen, timbre: resumenAudio.timbre,
            pausas: { total: resumenAudio.pausas.total, tiempoTotal: resumenAudio.pausas.tiempoTotal, larga: resumenAudio.pausas.larga },
            alargamientos: { total: resumenAudio.alargamientos.total },
            lexico: resumenAudio.lexico,
          }
        : null,
    };
    await onGuardar(sesion, { audio: audioFinal, analisis: resumenAudio });
    setGuardando(false);
  };

  if (!a) return <div style={{ padding: 20 }}>Alumno no encontrado.</div>;

  /* ======================= FASE 1 · PREPARACIÓN ========================== */
  if (fase === "prep") {
    return (
      <div>
        <Head title="Preparar la práctica" sub={a.nombre} onBack={back} />
        <div style={{ padding: "0 18px 34px" }}>
          <Card style={{ marginBottom: 12 }}>
            <Eyebrow>Tipo de práctica</Eyebrow>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 4 }}>
              {TIPOS.map((x) => <Chip key={x} activo={tipo === x} color={T.brass} onClick={() => setTipo(x)}>{x}</Chip>)}
            </div>
          </Card>

          <Card style={{ marginBottom: 12 }}>
            <Eyebrow>Tiempo objetivo</Eyebrow>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 6, flexWrap: "wrap" }}>
              <div style={{ fontFamily: FONT_M, fontSize: 34, color: T.bone }}>{fmt(objetivo)}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
                {[60, 120, 180, 300, 420, 600].map((s) => (
                  <Chip key={s} activo={objetivo === s} color={T.brass} onClick={() => setObjetivo(s)}
                    style={{ fontFamily: FONT_M, padding: "6px 10px" }}>{fmt(s)}</Chip>
                ))}
              </div>
            </div>
          </Card>

          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: usarMic ? 14 : 0 }}>
              <div style={{ flex: 1 }}>
                <Eyebrow color={T.jade}>Asistente de voz</Eyebrow>
                <div style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.5 }}>
                  Mide volumen, tono, ritmo y pausas con el micrófono. Todo se procesa en el dispositivo.
                </div>
              </div>
              <Interruptor on={usarMic} onChange={setUsarMic} />
            </div>

            {usarMic && (
              <div className="aparece" style={{ borderTop: `1px solid ${T.line}`, paddingTop: 12 }}>
                <Opcion
                  on={grabarAudio} onChange={setGrabarAudio}
                  disponible={lab.soportaGrabacion}
                  titulo="Grabar la práctica"
                  txt="Guarda el audio para escucharlo después con el alumno y saltar a cada momento marcado."
                  noDisp="Este dispositivo no permite grabar audio desde el navegador." />
                <Opcion
                  on={transcribir} onChange={setTranscribir}
                  disponible={lab.soportaTranscripcion}
                  titulo="Transcribir a texto"
                  txt="Necesario para contar palabras, medir el ritmo real y detectar muletillas. Requiere conexión a internet."
                  noDisp="Este dispositivo no trae reconocimiento de voz. El resto de mediciones funciona igual." />
              </div>
            )}
          </Card>

          <Btn full size="lg" Icon={Play} onClick={async () => {
            setFase("live"); setCorreteando(true);
            if (usarMic) await lab.iniciar({ grabar: grabarAudio, transcribir });
          }}>Empezar · {fmt(objetivo)}</Btn>

          <div style={{ fontSize: 12, color: T.muted, textAlign: "center", marginTop: 12, lineHeight: 1.55 }}>
            Durante la práctica, <b style={{ color: T.bone }}>un toque</b> marca un fallo y{" "}
            <b style={{ color: T.jade }}>mantener pulsado</b> marca un acierto. Puedes cancelar en cualquier momento.
          </div>
        </div>
      </div>
    );
  }

  /* ========================== FASE 2 · EN VIVO =========================== */
  if (fase === "live") {
    const color = bandColor(el, objetivo, T);

    /* Vista para proyectar al alumno: solo cronómetro grande. */
    if (modoAlumno) {
      return (
        <div style={{ minHeight: "100vh", background: T.ink, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ fontFamily: FONT_M, fontSize: 12, color: T.muted, letterSpacing: 2, marginBottom: 10 }}>{a.nombre.toUpperCase()}</div>
          <div style={{ fontFamily: FONT_M, fontSize: "clamp(64px,22vw,150px)", color, lineHeight: 1 }}>{fmt(el)}</div>
          <div style={{ fontFamily: FONT_D, fontSize: 20, color: T.muted, marginTop: 4 }}>de {fmt(objetivo)}</div>
          <div style={{ width: "100%", maxWidth: 560, marginTop: 26 }}>
            <Ribbon elapsed={el} target={objetivo} marks={marcas} height={44} />
          </div>
          {lab.activo && (
            <div style={{ display: "flex", gap: 30, marginTop: 28 }}>
              <Metric label="volumen" value={Math.round(lab.nivel * 100)} color={lab.nivel > 0.12 ? T.jade : T.amber} size={30} />
              {lab.transcribe && <Metric label="pal./min" value={lab.vivo.wpm || "—"} color={lab.vivo.wpm > 170 ? T.red : lab.vivo.wpm > 95 ? T.jade : T.amber} size={30} />}
              <Metric label="tono" value={lab.tono ? Math.round(lab.tono) : "—"} sub={lab.tono ? hzANota(lab.tono) : ""} color={T.sky} size={30} />
            </div>
          )}
          <Btn variant="ghost" Icon={Minimize2} style={{ marginTop: 34 }} onClick={() => setModoAlumno(false)}>Volver al panel</Btn>
        </div>
      );
    }

    const grupoActivo = panel === "rapidos" ? null : GRUPOS.find((g) => g.k === panel);
    const lista = panel === "rapidos" ? quick.map((k) => CRIT[k]).filter(Boolean) : criteriosDeGrupo(panel);

    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Barra superior */}
        <div style={{ padding: "12px 16px 0", display: "flex", alignItems: "center", gap: 9 }}>
          <div className="live-dot" style={{ width: 9, height: 9, borderRadius: 5, background: correteando ? T.red : T.muted, flexShrink: 0 }} />
          <div style={{ fontFamily: FONT_M, fontSize: 10.5, letterSpacing: 1.4, color: T.muted, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {correteando ? "EN VIVO" : "EN PAUSA"} · {a.nombre.toUpperCase()}
          </div>
          {lab.grabando && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: FONT_M, fontSize: 10, color: T.red }}>
              <Circle size={8} fill={T.red} className="live-dot" />REC
            </span>
          )}
          <button onClick={() => setConfirmCancel(true)} title="Cancelar práctica"
            style={{ background: "transparent", border: `1px solid ${T.red}55`, borderRadius: 9, padding: 7, color: T.red, cursor: "pointer" }}>
            <Ban size={15} />
          </button>
          <button onClick={() => setModoAlumno(true)} title="Modo alumno"
            style={{ background: T.raised, border: `1px solid ${T.line}`, borderRadius: 9, padding: 7, color: T.bone, cursor: "pointer" }}>
            <Maximize2 size={15} />
          </button>
        </div>

        {/* Cronómetro */}
        <div style={{ padding: "4px 18px 10px", textAlign: "center" }}>
          <div style={{ fontFamily: FONT_M, fontSize: "clamp(46px,13vw,76px)", color, lineHeight: 1.05 }}>{fmt(el)}</div>
          <div style={{ fontSize: 11.5, color: T.muted, fontFamily: FONT_M }}>
            objetivo {fmt(objetivo)} · {el > objetivo ? `+${fmt(el - objetivo)} de más` : `faltan ${fmt(objetivo - el)}`}
          </div>
        </div>

        <div style={{ padding: "0 16px 12px" }}>
          <Ribbon elapsed={el} target={objetivo} marks={marcas} height={44} />
        </div>

        {/* Estado del micrófono */}
        {lab.error && (
          <div style={{ margin: "0 16px 10px", padding: 10, borderRadius: 10, background: `${T.amber}15`, border: `1px solid ${T.amber}44`, fontSize: 12.5, display: "flex", gap: 9 }}>
            <AlertTriangle size={16} color={T.amber} style={{ flexShrink: 0, marginTop: 1 }} />{lab.error}
          </div>
        )}

        {lab.activo && (
          <div style={{ margin: "0 16px 12px", padding: 11, borderRadius: 12, background: T.surface, border: `1px solid ${T.line}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 9, flexWrap: "wrap", gap: 6 }}>
              <Metric size={19} label="pal./min" value={lab.transcribe ? (lab.vivo.wpm || "—") : "n/d"} color={lab.vivo.wpm > 170 ? T.red : lab.vivo.wpm > 95 ? T.jade : T.amber} />
              <Metric size={19} label="palabras" value={lab.transcribe ? lab.vivo.palabras : "n/d"} color={T.bone} />
              <Metric size={19} label="muletillas" value={lab.transcribe ? lab.vivo.muletillas : "n/d"} color={T.red} />
              <Metric size={19} label="pausas" value={lab.vivo.pausas} color={T.sky} />
              <Metric size={19} label="tono" value={lab.tono ? Math.round(lab.tono) : "—"} sub={lab.tono ? hzANota(lab.tono) : ""} color={T.violet} />
            </div>
            <Barra v={lab.nivel} max={1} alto={7} color={lab.nivel > 0.6 ? T.red : lab.nivel > 0.1 ? T.jade : T.amber} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
              <span style={{ fontSize: 10, color: T.muted, fontFamily: FONT_M }}>NIVEL DE VOZ</span>
              {!lab.transcribe && <span style={{ fontSize: 10, color: T.amber, fontFamily: FONT_M }}>SIN TRANSCRIPCIÓN</span>}
            </div>
          </div>
        )}

        {/* -------------------- Consola de marcado -------------------- */}
        <div style={{ padding: "0 16px", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Eyebrow style={{ margin: 0, flex: 1 }}>Marcar lo que ocurre</Eyebrow>
            <span style={{ fontFamily: FONT_M, fontSize: 10.5, color: T.muted }}>{marcas.length} marcas</span>
            <button onClick={() => setConfigQuick(true)} title="Configurar accesos rápidos"
              style={{ background: "transparent", border: "none", color: T.muted, cursor: "pointer", padding: 2 }}>
              <Sliders size={15} />
            </button>
          </div>

          {/* Pestañas de familias */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 9 }}>
            <Chip activo={panel === "rapidos"} color={T.brass} onClick={() => setPanel("rapidos")} Icon={Star}>Rápidos</Chip>
            {GRUPOS.map((g) => (
              <Chip key={g.k} activo={panel === g.k} color={g.color} onClick={() => setPanel(g.k)}>{g.corto}</Chip>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(96px,1fr))", gap: 8 }}>
            {lista.map((c) => {
              const err = conteo(c.k, -1), ok = conteo(c.k, 1);
              const activo = err + ok > 0;
              const reciente = ultima?.k === c.k;
              return (
                <TapHold key={c.k}
                  onTap={() => marcar(c.k, -1)}
                  onHold={() => marcar(c.k, 1)}
                  className={reciente ? "marcado" : ""}
                  style={{
                    background: activo ? `${c.color}18` : T.surface,
                    border: `1px solid ${activo ? c.color + "77" : T.line}`,
                    borderRadius: 12, padding: "12px 5px 10px", color: T.bone, cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                    position: "relative", minHeight: 84, fontFamily: "inherit",
                    transition: "background .15s ease, border-color .15s ease",
                  }}>
                  <c.Icon size={20} color={c.color} />
                  <span style={{ fontSize: 11, textAlign: "center", lineHeight: 1.2, padding: "0 2px" }}>{c.n}</span>
                  {err > 0 && (
                    <span style={{ position: "absolute", top: 5, right: 7, fontFamily: FONT_M, fontSize: 12.5, color: T.red, fontWeight: 600 }}>{err}</span>
                  )}
                  {ok > 0 && (
                    <span style={{ position: "absolute", top: 5, left: 7, fontFamily: FONT_M, fontSize: 12.5, color: T.jade, fontWeight: 600 }}>+{ok}</span>
                  )}
                </TapHold>
              );
            })}
          </div>

          {panel !== "rapidos" && grupoActivo && (
            <div style={{ fontSize: 11.5, color: T.muted, marginTop: 10, lineHeight: 1.45 }}>
              {grupoActivo.n}
            </div>
          )}
        </div>

        {/* Controles */}
        <div style={{
          padding: "12px 16px", display: "flex", gap: 8, position: "sticky", bottom: 0,
          background: `${T.ink}F2`, borderTop: `1px solid ${T.line}`, backdropFilter: "blur(8px)",
          paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
        }}>
          <Btn variant="ghost" Icon={Undo2} onClick={deshacer} disabled={!marcas.length} style={{ flex: 1 }}>Deshacer</Btn>
          <Btn variant="quiet" Icon={correteando ? Pause : Play} style={{ flex: 1 }}
            onClick={() => { const n = !correteando; setCorreteando(n); n ? lab.reanudar() : lab.pausar(); }}>
            {correteando ? "Pausa" : "Seguir"}
          </Btn>
          <Btn variant="red" Icon={Square} onClick={terminar} style={{ flex: 1.2 }}>Terminar</Btn>
        </div>

        <Confirmar abierto={confirmCancel} peligro
          titulo="¿Cancelar la práctica?"
          texto="Se descartan el cronómetro, las marcas y la grabación de esta práctica. No queda registro y no se puede deshacer."
          confirmar="Sí, cancelar" cancelar="Seguir con la práctica"
          onOk={cancelar} onCancel={() => setConfirmCancel(false)} />

        <ConfigRapidos abierto={configQuick} onClose={() => setConfigQuick(false)} quick={quick} setQuick={setQuick} />
      </div>
    );
  }

  /* ========================= FASE 3 · EVALUACIÓN ========================= */
  const diag = diagnosticar(resumenAudio, { track: a.track, objetivo, duracion: el });
  const evaluados = Object.values(rubrica).filter((v) => v > 0).length;

  return (
    <div>
      <Head title="Evaluar" sub={`${a.nombre} · ${fmt(el)}`} onBack={() => setFase("live")}
        right={
          <button onClick={() => setConfirmCancel(true)} title="Descartar práctica"
            style={{ background: "transparent", border: `1px solid ${T.red}55`, borderRadius: 10, padding: 9, color: T.red, cursor: "pointer" }}>
            <Ban size={16} />
          </button>
        } />
      <div style={{ padding: "0 18px 34px" }}>
        <Card style={{ marginBottom: 13 }}>
          <Ribbon elapsed={el} target={objetivo} marks={marcas} serie={resumenAudio?.serie} height={46} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
            {CRITERIOS.filter((c) => conteo(c.k)).map((c) => {
              const err = conteo(c.k, -1), ok = conteo(c.k, 1);
              return (
                <span key={c.k} style={{
                  display: "inline-flex", alignItems: "center", gap: 5, background: `${c.color}18`,
                  border: `1px solid ${c.color}55`, color: T.bone, padding: "4px 9px", borderRadius: 14, fontSize: 11.5,
                }}>
                  <c.Icon size={11} color={c.color} />{c.n}
                  {err > 0 && <b style={{ color: T.red, fontFamily: FONT_M }}>{err}</b>}
                  {ok > 0 && <b style={{ color: T.jade, fontFamily: FONT_M }}>+{ok}</b>}
                </span>
              );
            })}
            {marcas.length === 0 && <span style={{ fontSize: 12.5, color: T.muted }}>No se marcó ninguna incidencia.</span>}
          </div>
        </Card>

        {Object.keys(diag).length > 0 && <TarjetaMedicion diag={diag} resumen={resumenAudio} usoMic={!!resumenAudio} />}

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <Eyebrow style={{ margin: 0, flex: 1 }}>Rúbrica · {evaluados} de {CRITERIOS.length} criterios</Eyebrow>
          <div style={{ fontFamily: FONT_D, fontSize: 26, color: notaColor(promedioTotal(rubrica)) }}>
            {promedioTotal(rubrica).toFixed(1)}
          </div>
        </div>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 14, lineHeight: 1.5 }}>
          Precargada con lo que midió el micrófono y lo que marcaste en vivo. Ajusta solo lo que no coincida;
          lo que dejes en blanco no cuenta para el promedio.
        </div>

        {BLOQUES.map((b) => (
          <div key={b.k} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
              <H size={19} style={{ color: b.color }}>{b.n}</H>
              <span style={{ fontSize: 11.5, color: T.muted }}>{b.d}</span>
            </div>
            {b.grupos.map((g) => (
              <GrupoRubrica key={g.k} grupo={g} rubrica={rubrica} setRubrica={setRubrica} diag={diag}
                enfasis={TRACKS[a.track].enfasis} />
            ))}
          </div>
        ))}

        <Card style={{ marginTop: 4, marginBottom: 14 }}>
          <Field label="Notas para la devolución" value={notas} onChange={setNotas} rows={4}
            placeholder="Lo que sí funcionó, lo que hay que corregir y la tarea concreta para la próxima clase…" />
        </Card>

        <Btn full size="lg" Icon={Save} onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar práctica"}
        </Btn>

        <Confirmar abierto={confirmCancel} peligro
          titulo="¿Descartar esta práctica?"
          texto="Se pierde el cronómetro, las marcas, la grabación y la evaluación. No se puede deshacer."
          confirmar="Sí, descartar" cancelar="Volver a la evaluación"
          onOk={cancelar} onCancel={() => setConfirmCancel(false)} />
      </div>
    </div>
  );
}

/* -------------------------- Grupo de la rúbrica --------------------------- */
function GrupoRubrica({ grupo, rubrica, setRubrica, diag, enfasis }) {
  const [abierto, setAbierto] = useState(true);
  const crit = criteriosDeGrupo(grupo.k);
  const prom = promedioGrupo(rubrica, grupo.k);
  const hechos = crit.filter((c) => rubrica[c.k] > 0).length;

  return (
    <Card style={{ marginBottom: 9, padding: 0, overflow: "hidden" }}>
      <button onClick={() => setAbierto(!abierto)} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "13px 15px",
        background: "transparent", border: "none", color: T.bone, cursor: "pointer", textAlign: "left",
      }}>
        <div style={{ width: 4, height: 30, borderRadius: 2, background: grupo.color, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{grupo.n}</div>
          <div style={{ fontSize: 11, color: T.muted, fontFamily: FONT_M }}>{hechos}/{crit.length} evaluados</div>
        </div>
        {prom > 0 && <div style={{ fontFamily: FONT_D, fontSize: 22, color: notaColor(prom) }}>{prom.toFixed(1)}</div>}
        {abierto ? <ChevronUp size={16} color={T.muted} /> : <ChevronDown size={16} color={T.muted} />}
      </button>

      {abierto && (
        <div style={{ padding: "0 15px 14px" }}>
          {crit.map((c) => {
            const d = diag[c.k];
            const clave = enfasis?.includes(c.k);
            return (
              <div key={c.k} style={{ marginBottom: 13, paddingTop: 10, borderTop: `1px solid ${T.line}55` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                      <c.Icon size={13} color={c.color} />{c.n}
                      {clave && <span title="Criterio clave para este programa" style={{ fontSize: 9, fontFamily: FONT_M, color: T.brass, border: `1px solid ${T.brass}55`, borderRadius: 4, padding: "1px 4px" }}>CLAVE</span>}
                    </div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 2, lineHeight: 1.4 }}>{c.d}</div>
                    {d && (
                      <div style={{
                        marginTop: 6, fontSize: 11.5, lineHeight: 1.45, padding: "6px 9px", borderRadius: 8,
                        background: `${d.estado === "bien" ? T.jade : d.estado === "leve" ? T.amber : T.red}12`,
                        border: `1px solid ${d.estado === "bien" ? T.jade : d.estado === "leve" ? T.amber : T.red}33`,
                      }}>
                        <b style={{ color: d.estado === "bien" ? T.jade : d.estado === "leve" ? T.amber : T.red }}>
                          {d.titulo}
                        </b>
                        {d.txt ? ` — ${d.txt}.` : ""} <span style={{ color: T.muted }}>{d.detalle}</span>
                      </div>
                    )}
                  </div>
                  {rubrica[c.k] > 0 && (
                    <button onClick={() => setRubrica((p) => { const n = { ...p }; delete n[c.k]; return n; })}
                      title="Quitar la calificación de este criterio"
                      style={{ background: "transparent", border: "none", color: T.muted, fontSize: 11, cursor: "pointer", fontFamily: FONT_M, flexShrink: 0 }}>
                      n/a
                    </button>
                  )}
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                  {[1, 2, 3, 4, 5].map((v) => {
                    const act = rubrica[c.k] === v;
                    return (
                      <button key={v} onClick={() => setRubrica((p) => ({ ...p, [c.k]: v }))} style={{
                        flex: 1, padding: "9px 0", borderRadius: 8, cursor: "pointer", fontFamily: FONT_M, fontSize: 13.5,
                        background: act ? notaColor(v) : "transparent", color: act ? T.ink : T.muted,
                        border: `1px solid ${act ? notaColor(v) : T.line}`, fontWeight: 600,
                        transition: "background .15s ease",
                      }}>{v}</button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* --------------------- Resumen de lo que midió el micro -------------------- */
function TarjetaMedicion({ diag, resumen, usoMic }) {
  const items = Object.entries(diag).map(([k, d]) => ({ k, ...d, c: CRIT[k] })).filter((x) => x.c);
  if (!items.length) return null;
  return (
    <Card style={{ marginBottom: 13 }}>
      <Eyebrow color={T.sky}>{usoMic ? "Lo que midió el micrófono" : "Medición automática"}</Eyebrow>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 8, marginTop: 4 }}>
        {items.map((x) => {
          const col = x.estado === "bien" ? T.jade : x.estado === "leve" ? T.amber : T.red;
          return (
            <div key={x.k} style={{ padding: 10, borderRadius: 10, background: `${col}10`, border: `1px solid ${col}30` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: T.muted, marginBottom: 3 }}>
                <x.c.Icon size={11} color={col} />{x.c.n}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.bone, lineHeight: 1.25 }}>{x.titulo}</div>
            </div>
          );
        })}
      </div>
      {usoMic && !resumen?.hayTranscripcion && (
        <div style={{ marginTop: 11, fontSize: 11.5, color: T.amber, lineHeight: 1.45, display: "flex", gap: 7 }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          No hubo transcripción, así que no se pudieron contar palabras, ritmo real ni muletillas.
          Revisa que haya conexión a internet y que el reconocimiento de voz esté disponible.
        </div>
      )}
    </Card>
  );
}

/* ------------------------- Configurar accesos rápidos ---------------------- */
function ConfigRapidos({ abierto, onClose, quick, setQuick }) {
  const alternar = (k) =>
    setQuick(quick.includes(k) ? quick.filter((x) => x !== k) : [...quick, k]);
  return (
    <Sheet abierto={abierto} onClose={onClose} titulo="Accesos rápidos">
      <div style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.5, marginBottom: 14 }}>
        Elige los criterios que marcas más seguido. Aparecen juntos en la pestaña <b style={{ color: T.brass }}>Rápidos</b>,
        sin tener que buscarlos por familia. {quick.length} seleccionados.
      </div>
      {GRUPOS.map((g) => (
        <div key={g.k} style={{ marginBottom: 14 }}>
          <Eyebrow color={g.color}>{g.n}</Eyebrow>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {criteriosDeGrupo(g.k).map((c) => (
              <Chip key={c.k} activo={quick.includes(c.k)} color={g.color} Icon={c.Icon} onClick={() => alternar(c.k)}>
                {c.n}
              </Chip>
            ))}
          </div>
        </div>
      ))}
    </Sheet>
  );
}

function Interruptor({ on, onChange, disabled }) {
  return (
    <button disabled={disabled} onClick={() => onChange(!on)} style={{
      width: 50, height: 29, borderRadius: 16, flexShrink: 0, cursor: disabled ? "not-allowed" : "pointer",
      background: on ? T.jade : T.line, border: "none", position: "relative",
      transition: "background .2s", opacity: disabled ? .4 : 1,
    }}>
      <div style={{ position: "absolute", top: 3, left: on ? 24 : 3, width: 23, height: 23, borderRadius: 12, background: T.bone, transition: "left .2s" }} />
    </button>
  );
}

function Opcion({ on, onChange, titulo, txt, disponible, noDisp }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 3 }}>{titulo}</div>
        <div style={{ fontSize: 11.5, color: disponible ? T.muted : T.amber, lineHeight: 1.45 }}>
          {disponible ? txt : noDisp}
        </div>
      </div>
      <Interruptor on={disponible && on} onChange={onChange} disabled={!disponible} />
    </div>
  );
}
