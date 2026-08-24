import React, { useState, useMemo } from "react";
import {
  Plus, Users, ChevronRight, Mic, Target, Clock, Check, X, Sparkles,
  Trash2, PenLine, TrendingUp,
} from "lucide-react";
import { T, FONT_D, FONT_M, notaColor } from "../theme.js";
import { fmt, uid, hoy, fecha } from "../lib/format.js";
import { TRACKS, CRITERIOS, CRIT, GRUPOS, BLOQUES, criteriosDeGrupo, promedioTotal, promedioGrupo } from "../data/rubrica.js";
import { TEMARIO, ESTADOS } from "../data/temario.js";
import { EJERCICIOS } from "../data/ejercicios.js";
import { Btn, Card, Eyebrow, H, Head, Empty, Field, Chip, Avatar, Barra, Confirmar, Sheet } from "../ui/primitives.jsx";
import { Ribbon } from "../ui/Ribbon.jsx";

/* --------------------------------- LISTA ---------------------------------- */
export function Alumnos({ alumnos, sesionesDe, go }) {
  const [f, setF] = useState("todos");
  const lista = alumnos.filter((a) => f === "todos" || a.track === f);
  return (
    <div>
      <Head title="Alumnos" sub={`${alumnos.length} registrados`}
        right={<Btn Icon={Plus} size="sm" onClick={() => go("nuevo")}>Nuevo</Btn>} />
      <div style={{ padding: "0 18px 18px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
          {[["todos", "Todos"], ...Object.entries(TRACKS).map(([k, v]) => [k, v.n])].map(([k, n]) => (
            <Chip key={k} activo={f === k} color={T.brass} onClick={() => setF(k)}>{n}</Chip>
          ))}
        </div>
        {lista.length === 0 ? (
          <Empty Icon={Users} title="Sin alumnos en este filtro"
            hint="Registra a tu primer alumno para empezar a llevar su bitácora."
            action={<Btn Icon={Plus} onClick={() => go("nuevo")}>Registrar alumno</Btn>} />
        ) : lista.map((a) => {
          const ss = sesionesDe(a.id);
          const last = ss[ss.length - 1];
          const Tk = TRACKS[a.track].icon;
          return (
            <Card key={a.id} onClick={() => go("alumno", a.id)} style={{ marginBottom: 9, display: "flex", alignItems: "center", gap: 13 }}>
              <Avatar nombre={a.nombre} color={a.color} size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15.5 }}>{a.nombre}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: T.muted, marginTop: 2 }}>
                  <Tk size={12} />{TRACKS[a.track].n} · {a.nivel}
                </div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 3, fontFamily: FONT_M }}>
                  {ss.length} práctica{ss.length === 1 ? "" : "s"}{last ? ` · última ${fecha(last.ts)}` : " · sin práctica aún"}
                </div>
              </div>
              {last && <div style={{ fontFamily: FONT_D, fontSize: 26, color: notaColor(promedioTotal(last.rubrica)) }}>{promedioTotal(last.rubrica).toFixed(1)}</div>}
              <ChevronRight size={16} color={T.muted} />
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------ NUEVO ALUMNO ------------------------------ */
export function NuevoAlumno({ setAlumnos, back, flash }) {
  const [n, setN] = useState(""), [tr, setTr] = useState("infantil");
  const [niv, setNiv] = useState("Inicial"), [ed, setEd] = useState("");
  const [obj, setObj] = useState(""), [tie, setTie] = useState("180");

  const guardar = () => {
    if (!n.trim()) return flash("Escribe el nombre del alumno");
    setAlumnos((p) => [...p, {
      id: uid(), nombre: n.trim(), track: tr, nivel: niv, edad: ed, objetivo: obj,
      tiempoObjetivo: parseInt(tie) || 180, alta: hoy(), color: TRACKS[tr].color,
    }]);
    flash("Alumno registrado"); back();
  };

  return (
    <div>
      <Head title="Nuevo alumno" onBack={back} />
      <div style={{ padding: "0 18px 34px" }}>
        <Field label="Nombre completo" value={n} onChange={setN} placeholder="Ej. Renata Ibarra" />

        <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>Programa</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 14 }}>
          {Object.entries(TRACKS).map(([k, v]) => {
            const I = v.icon, act = tr === k;
            return (
              <button key={k} onClick={() => setTr(k)} style={{
                textAlign: "left", padding: 13, borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
                background: act ? `${v.color}18` : T.surface, border: `1px solid ${act ? v.color : T.line}`, color: T.bone,
                transition: "background .15s ease",
              }}>
                <I size={20} color={v.color} />
                <div style={{ fontFamily: FONT_D, fontSize: 17, marginTop: 7 }}>{v.n}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2, lineHeight: 1.35 }}>{v.sub}</div>
              </button>
            );
          })}
        </div>

        <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>Nivel</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {["Inicial", "Intermedio", "Avanzado"].map((x) => (
            <Chip key={x} activo={niv === x} color={T.brass} onClick={() => setNiv(x)} style={{ flex: 1, justifyContent: "center" }}>{x}</Chip>
          ))}
        </div>

        <Field label="Edad (opcional)" value={ed} onChange={setEd} placeholder="11" />
        <Field label="Objetivo" value={obj} onChange={setObj} placeholder="Ej. Concurso estatal de oratoria — abril" />
        <Field label="Tiempo objetivo del discurso (segundos)" value={tie} onChange={setTie} type="number"
          hint="Se puede cambiar en cada práctica." />
        <Btn full size="lg" Icon={Check} onClick={guardar}>Guardar alumno</Btn>
      </div>
    </div>
  );
}

/* ----------------------------- DETALLE ALUMNO ----------------------------- */
export function AlumnoDetalle({ alumnos, setAlumnos, sesionesDe, planes, setPlanes, temario, setTemario, go, back, flash, id }) {
  const a = alumnos.find((x) => x.id === id);
  const [sec, setSec] = useState("resumen");
  const [editar, setEditar] = useState(false);
  const [confirmBorrar, setConfirmBorrar] = useState(false);
  const ss = useMemo(() => (a ? sesionesDe(id) : []), [a, id, sesionesDe]);

  const promedios = useMemo(() => {
    const out = {};
    CRITERIOS.forEach((c) => {
      const v = ss.map((s) => s.rubrica?.[c.k]).filter((x) => typeof x === "number" && x > 0);
      out[c.k] = v.length ? v.reduce((x, y) => x + y, 0) / v.length : 0;
    });
    return out;
  }, [ss]);

  const debiles = useMemo(() =>
    Object.entries(promedios).filter(([, v]) => v > 0).sort((x, y) => x[1] - y[1]).slice(0, 4).map(([k]) => k),
    [promedios]);

  if (!a) return <div style={{ padding: 20 }}>Alumno no encontrado.</div>;

  const plan = planes[id] || { objetivo: a.objetivo || "", meta: "", hitos: [] };
  const setPlan = (p) => setPlanes((prev) => ({ ...prev, [id]: p }));

  const generarPlan = () => {
    if (debiles.length === 0) return flash("Registra al menos una práctica evaluada");
    const hitos = [];
    debiles.slice(0, 3).forEach((k) => {
      const c = CRIT[k];
      (EJERCICIOS[k] || []).slice(0, 2).forEach((e) => hitos.push({ id: uid(), t: `${c?.n || k}: ${e}`, ok: false, crit: k }));
    });
    setPlan({ ...plan, hitos: [...plan.hitos, ...hitos] });
    flash(`${hitos.length} ejercicios añadidos al plan`);
  };

  const tem = TEMARIO[a.track];
  const estados = temario[id] || {};
  const cicloEstado = (k) =>
    setTemario((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), [k]: ((prev[id]?.[k] || 0) + 1) % 4 } }));
  const cubierto = tem.filter((t) => (estados[t.k] || 0) >= 2).length;

  return (
    <div>
      <Head title={a.nombre} sub={TRACKS[a.track].n} onBack={back}
        right={
          <button onClick={() => setEditar(true)} title="Editar alumno"
            style={{ background: T.raised, border: `1px solid ${T.line}`, borderRadius: 10, padding: 9, color: T.bone, cursor: "pointer" }}>
            <PenLine size={16} />
          </button>
        } />
      <div style={{ padding: "0 18px 24px" }}>
        <Card style={{ marginBottom: 14, display: "flex", gap: 13, alignItems: "center" }}>
          <Avatar nombre={a.nombre} color={a.color} size={52} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.5 }}>
              {a.nivel}{a.edad ? ` · ${a.edad} años` : ""} · objetivo {fmt(a.tiempoObjetivo)}
            </div>
            {a.objetivo && (
              <div style={{ fontSize: 13, marginTop: 4, color: T.bone, lineHeight: 1.4 }}>
                <Target size={12} style={{ verticalAlign: -1 }} /> {a.objetivo}
              </div>
            )}
          </div>
        </Card>

        <Btn full size="lg" Icon={Mic} onClick={() => go("clase", id)} style={{ marginBottom: 16 }}>
          Iniciar clase con {a.nombre.split(" ")[0]}
        </Btn>

        <div style={{ display: "flex", gap: 7, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
          {[["resumen", "Resumen"], ["plan", "Plan de trabajo"], ["temario", "Temario"], ["historial", "Historial"]].map(([k, n]) => (
            <Chip key={k} activo={sec === k} color={T.brass} onClick={() => setSec(k)}>{n}</Chip>
          ))}
        </div>

        {/* ------------------------------ RESUMEN ----------------------------- */}
        {sec === "resumen" && (ss.length === 0 ? (
          <Empty Icon={Mic} title="Sin prácticas todavía" hint="Corre una clase en vivo para generar el primer diagnóstico." />
        ) : (
          <div className="aparece">
            <Card style={{ marginBottom: 12 }}>
              <Eyebrow>Perfil por familia · promedio de {ss.length} práctica{ss.length === 1 ? "" : "s"}</Eyebrow>
              {GRUPOS.map((g) => {
                const crit = criteriosDeGrupo(g.k).filter((c) => promedios[c.k] > 0);
                if (!crit.length) return null;
                const v = crit.reduce((x, c) => x + promedios[c.k], 0) / crit.length;
                return (
                  <div key={g.k} style={{ marginBottom: 11 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                      <span>{g.n}</span>
                      <span style={{ fontFamily: FONT_M, color: notaColor(v) }}>{v.toFixed(1)}</span>
                    </div>
                    <Barra v={v} color={notaColor(v)} alto={7} />
                  </div>
                );
              })}
            </Card>

            <Card style={{ marginBottom: 12 }}>
              <Eyebrow color={T.red}>Prioridades de entrenamiento</Eyebrow>
              {debiles.map((k, i) => {
                const c = CRIT[k];
                return (
                  <div key={k} style={{ padding: "10px 0", borderBottom: i < debiles.length - 1 ? `1px solid ${T.line}55` : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, display: "flex", alignItems: "center", gap: 7 }}>
                        {c?.Icon && <c.Icon size={13} color={c.color} />}{c?.n}
                      </div>
                      <div style={{ fontFamily: FONT_M, fontSize: 13, color: notaColor(promedios[k]) }}>{promedios[k].toFixed(1)}</div>
                    </div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 3, lineHeight: 1.45 }}>→ {(EJERCICIOS[k] || [])[0]}</div>
                  </div>
                );
              })}
            </Card>
          </div>
        ))}

        {/* -------------------------------- PLAN ------------------------------ */}
        {sec === "plan" && (
          <div className="aparece">
            <Card style={{ marginBottom: 12 }}>
              <Field label="Objetivo del ciclo" value={plan.objetivo} onChange={(v) => setPlan({ ...plan, objetivo: v })}
                placeholder="Ej. Ganar la etapa municipal" />
              <Field label="Fecha meta" value={plan.meta} onChange={(v) => setPlan({ ...plan, meta: v })} type="date" />
              <Btn variant="ghost" full Icon={Sparkles} onClick={generarPlan}>
                Sugerir ejercicios según sus puntos débiles
              </Btn>
            </Card>
            <Card>
              <Eyebrow>Ejercicios del plan · {plan.hitos.filter((h) => h.ok).length}/{plan.hitos.length}</Eyebrow>
              {plan.hitos.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <Barra v={plan.hitos.filter((h) => h.ok).length} max={plan.hitos.length || 1} color={T.jade} alto={6} />
                </div>
              )}
              {plan.hitos.length === 0 && (
                <div style={{ color: T.muted, fontSize: 13, padding: "8px 0", lineHeight: 1.5 }}>
                  El plan está vacío. Usa el botón de arriba para generarlo desde los puntos débiles, o añade un ejercicio a mano.
                </div>
              )}
              {plan.hitos.map((h) => (
                <div key={h.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 0", borderBottom: `1px solid ${T.line}55` }}>
                  <button onClick={() => setPlan({ ...plan, hitos: plan.hitos.map((x) => x.id === h.id ? { ...x, ok: !x.ok } : x) })}
                    style={{
                      background: h.ok ? T.jade : "transparent", border: `1px solid ${h.ok ? T.jade : T.line}`,
                      borderRadius: 6, width: 22, height: 22, flexShrink: 0, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1,
                      transition: "background .15s ease",
                    }}>
                    {h.ok && <Check size={14} color={T.ink} />}
                  </button>
                  <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.45, color: h.ok ? T.muted : T.bone, textDecoration: h.ok ? "line-through" : "none" }}>{h.t}</div>
                  <button onClick={() => setPlan({ ...plan, hitos: plan.hitos.filter((x) => x.id !== h.id) })}
                    style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", padding: 2 }}>
                    <X size={15} />
                  </button>
                </div>
              ))}
              <AddHito onAdd={(t) => setPlan({ ...plan, hitos: [...plan.hitos, { id: uid(), t, ok: false }] })} />
            </Card>
          </div>
        )}

        {/* ------------------------------ TEMARIO ----------------------------- */}
        {sec === "temario" && (
          <Card className="aparece">
            <Eyebrow>Avance del temario · {cubierto}/{tem.length} temas trabajados</Eyebrow>
            <div style={{ margin: "6px 0 14px" }}>
              <Barra v={cubierto} max={tem.length} color={T.jade} alto={6} />
            </div>
            {tem.map((t) => {
              const e = estados[t.k] || 0, E = ESTADOS[e];
              return (
                <button key={t.k} onClick={() => cicloEstado(t.k)} style={{
                  width: "100%", textAlign: "left", display: "flex", gap: 11, alignItems: "center",
                  padding: "11px 10px", marginBottom: 6, borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                  background: E.bg, border: `1px solid ${e ? E.c + "55" : T.line}`, color: T.bone,
                  transition: "background .15s ease",
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{t.n}</div>
                    <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2, lineHeight: 1.4 }}>{t.d}</div>
                  </div>
                  <div style={{ fontFamily: FONT_M, fontSize: 10, color: E.c, letterSpacing: .8, textTransform: "uppercase", whiteSpace: "nowrap" }}>{E.n}</div>
                </button>
              );
            })}
            <div style={{ fontSize: 11.5, color: T.muted, marginTop: 8 }}>Toca un tema para avanzar su estado.</div>
          </Card>
        )}

        {/* ----------------------------- HISTORIAL ---------------------------- */}
        {sec === "historial" && (ss.length === 0 ? (
          <Empty Icon={Clock} title="Sin historial" hint="Aquí quedará la bitácora completa de sus prácticas." />
        ) : [...ss].reverse().map((s) => (
          <Card key={s.id} onClick={() => go("devolucion", s.id)} style={{ marginBottom: 9 }} className="aparece">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9, gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{fecha(s.ts, { weekday: "short", day: "2-digit", month: "long" })}</div>
                <div style={{ fontSize: 11.5, color: T.muted, fontFamily: FONT_M }}>
                  {fmt(s.duracion)} · {(s.marcas || []).length} marcas · {s.tipo}
                  {s.tieneAudio && " · con audio"}
                </div>
              </div>
              <div style={{ fontFamily: FONT_D, fontSize: 26, color: notaColor(promedioTotal(s.rubrica)) }}>
                {promedioTotal(s.rubrica).toFixed(1)}
              </div>
            </div>
            <Ribbon elapsed={s.duracion} target={s.objetivo} marks={s.marcas || []} height={24} showLabels={false} />
          </Card>
        )))}
      </div>

      <EditarAlumno abierto={editar} onClose={() => setEditar(false)} alumno={a} setAlumnos={setAlumnos}
        onBorrar={() => { setEditar(false); setConfirmBorrar(true); }} flash={flash} />

      <Confirmar abierto={confirmBorrar} peligro
        titulo={`¿Eliminar a ${a.nombre}?`}
        texto="Se borra el alumno junto con su plan y su avance de temario. Las prácticas guardadas quedan sin dueño."
        confirmar="Sí, eliminar"
        onOk={() => { setAlumnos((p) => p.filter((x) => x.id !== a.id)); flash("Alumno eliminado"); back(); }}
        onCancel={() => setConfirmBorrar(false)} />
    </div>
  );
}

function EditarAlumno({ abierto, onClose, alumno, setAlumnos, onBorrar, flash }) {
  const [n, setN] = useState(alumno.nombre);
  const [niv, setNiv] = useState(alumno.nivel);
  const [ed, setEd] = useState(alumno.edad || "");
  const [obj, setObj] = useState(alumno.objetivo || "");
  const [tie, setTie] = useState(String(alumno.tiempoObjetivo));

  const guardar = () => {
    if (!n.trim()) return flash("El nombre no puede quedar vacío");
    setAlumnos((p) => p.map((x) => x.id === alumno.id
      ? { ...x, nombre: n.trim(), nivel: niv, edad: ed, objetivo: obj, tiempoObjetivo: parseInt(tie) || 180 } : x));
    flash("Alumno actualizado"); onClose();
  };

  return (
    <Sheet abierto={abierto} onClose={onClose} titulo="Editar alumno">
      <Field label="Nombre completo" value={n} onChange={setN} />
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>Nivel</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {["Inicial", "Intermedio", "Avanzado"].map((x) => (
          <Chip key={x} activo={niv === x} color={T.brass} onClick={() => setNiv(x)} style={{ flex: 1, justifyContent: "center" }}>{x}</Chip>
        ))}
      </div>
      <Field label="Edad" value={ed} onChange={setEd} />
      <Field label="Objetivo" value={obj} onChange={setObj} />
      <Field label="Tiempo objetivo (segundos)" value={tie} onChange={setTie} type="number" />
      <Btn full size="lg" Icon={Check} onClick={guardar} style={{ marginBottom: 10 }}>Guardar cambios</Btn>
      <Btn full variant="danger" Icon={Trash2} onClick={onBorrar}>Eliminar alumno</Btn>
    </Sheet>
  );
}

function AddHito({ onAdd }) {
  const [v, setV] = useState("");
  const add = () => { if (v.trim()) { onAdd(v.trim()); setV(""); } };
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder="Añadir ejercicio…"
        onKeyDown={(e) => e.key === "Enter" && add()}
        style={{
          flex: 1, background: T.ink, border: `1px solid ${T.line}`, borderRadius: 9,
          padding: "10px 11px", color: T.bone, fontFamily: "inherit", fontSize: 13.5, outline: "none",
        }} />
      <Btn size="sm" onClick={add} Icon={Plus}>Añadir</Btn>
    </div>
  );
}

/* ------------------------- ELEGIR ALUMNO (CLASE) -------------------------- */
export function ElegirAlumno({ alumnos, go }) {
  return (
    <div>
      <Head title="Clase en vivo" sub="Paso 1 de 2 · elegir alumno" />
      <div style={{ padding: "0 18px 18px" }}>
        {alumnos.length === 0 ? (
          <Empty Icon={Users} title="Registra un alumno primero"
            hint="Necesitas al menos un alumno para abrir una clase."
            action={<Btn onClick={() => go("nuevo")} Icon={Plus}>Registrar alumno</Btn>} />
        ) : alumnos.map((a) => (
          <Card key={a.id} onClick={() => go("clase", a.id)} style={{ marginBottom: 9, display: "flex", alignItems: "center", gap: 13 }}>
            <Avatar nombre={a.nombre} color={a.color} size={42} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{a.nombre}</div>
              <div style={{ fontSize: 11.5, color: T.muted }}>{TRACKS[a.track].n} · objetivo {fmt(a.tiempoObjetivo)}</div>
            </div>
            <Mic size={18} color={T.brass} />
          </Card>
        ))}
      </div>
    </div>
  );
}
