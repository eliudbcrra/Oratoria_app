import React, { useState, useEffect, useRef, useCallback } from "react";
import { Home, Users, Mic, BookOpen, BarChart3, Settings } from "lucide-react";
import { T, FONT_B, FONT_M } from "./theme.js";
import { uid, hoy } from "./lib/format.js";
import { TRACKS, QUICK_DEFAULT } from "./data/rubrica.js";
import {
  leer, escribir, K_CORE, K_SES, K_PREFS,
  guardarBlob, borrarBlob, ST_AUDIO, ST_ANALISIS, pedirPersistencia,
} from "./lib/storage.js";
import { GlobalStyle, Toast } from "./ui/primitives.jsx";
import { Inicio } from "./screens/Inicio.jsx";
import { Alumnos, NuevoAlumno, AlumnoDetalle, ElegirAlumno } from "./screens/Alumnos.jsx";
import { ClaseLive } from "./screens/ClaseLive.jsx";
import { Devolucion } from "./screens/Devolucion.jsx";
import { Biblioteca } from "./screens/Biblioteca.jsx";
import { Progreso } from "./screens/Progreso.jsx";
import { Ajustes } from "./screens/Ajustes.jsx";

const SEED_ALUMNOS = [
  { id: "a1", nombre: "Renata Ibarra", track: "infantil", nivel: "Intermedio", edad: "11",
    objetivo: "Concurso estatal de oratoria — abril", tiempoObjetivo: 180, alta: hoy(), color: TRACKS.infantil.color },
  { id: "a2", nombre: "Dip. Ernesto Villar", track: "politico", nivel: "Avanzado", edad: "",
    objetivo: "Comparecencia y debate de presupuesto", tiempoObjetivo: 300, alta: hoy(), color: TRACKS.politico.color },
];

export default function App() {
  const [listo, setListo] = useState(false);
  const [alumnos, setAlumnos] = useState([]);
  const [sesiones, setSesiones] = useState([]);
  const [planes, setPlanes] = useState({});
  const [temario, setTemario] = useState({});
  const [biblioteca, setBiblioteca] = useState([]);
  const [quick, setQuick] = useState(QUICK_DEFAULT);
  const [tab, setTab] = useState("inicio");
  const [nav, setNav] = useState(null);
  const [toast, setToast] = useState(null);

  /* ------------------------------ Carga inicial --------------------------- */
  useEffect(() => {
    const core = leer(K_CORE, null);
    const ses = leer(K_SES, null);
    const prefs = leer(K_PREFS, null);

    if (core) {
      setAlumnos(core.alumnos || []);
      setPlanes(core.planes || {});
      setTemario(core.temario || {});
      setBiblioteca(core.biblioteca || []);
    } else {
      // Primer arranque: se siembran dos alumnos de ejemplo para que la app
      // no se vea vacía; se borran desde Ajustes en cuanto estorben.
      setAlumnos(SEED_ALUMNOS);
    }
    setSesiones(ses?.sesiones || []);
    if (prefs?.quick?.length) setQuick(prefs.quick);
    setListo(true);

    // Pide al sistema que no borre los datos por falta de espacio.
    pedirPersistencia();
  }, []);

  /* ------------------------- Guardado con rebote -------------------------- */
  // Se escribe también en el primer ciclo tras la carga: así los alumnos de
  // ejemplo quedan guardados desde el arranque inicial.
  useEffect(() => {
    if (!listo) return;
    const t = setTimeout(() => {
      const r = escribir(K_CORE, { alumnos, planes, temario, biblioteca });
      if (!r.ok) flash(r.error === "cuota"
        ? "No hay espacio para guardar. Libera memoria en Ajustes."
        : "No se pudo guardar el cambio.");
    }, 500);
    return () => clearTimeout(t);
  }, [alumnos, planes, temario, biblioteca, listo]);

  useEffect(() => {
    if (!listo) return;
    const t = setTimeout(() => {
      const r = escribir(K_SES, { sesiones });
      if (!r.ok) flash("No se pudieron guardar las prácticas: falta espacio.");
    }, 500);
    return () => clearTimeout(t);
  }, [sesiones, listo]);

  useEffect(() => {
    if (!listo) return;
    escribir(K_PREFS, { quick });
  }, [quick, listo]);

  /* --------------------------------- Utilidad ----------------------------- */
  const flash = useCallback((m) => {
    setToast(m);
    setTimeout(() => setToast(null), 2600);
  }, []);

  const go = (name, params) => setNav({ name, params });
  const back = () => setNav(null);

  const sesionesDe = useCallback(
    (id) => sesiones.filter((s) => s.alumnoId === id).sort((a, b) => a.ts - b.ts),
    [sesiones]
  );

  /* Guarda la sesión: metadatos en localStorage, audio y series en IndexedDB. */
  const guardarSesion = useCallback(async (sesion, { audio, analisis } = {}) => {
    try {
      if (audio) await guardarBlob(ST_AUDIO, sesion.id, audio);
      if (analisis) {
        await guardarBlob(ST_ANALISIS, sesion.id, {
          transcripcion: analisis.transcripcion,
          serie: analisis.serie,
          pausas: analisis.pausas,
          alargamientos: analisis.alargamientos,
          muletillasDetalle: analisis.muletillasDetalle,
          lexico: analisis.lexico,
          tono: analisis.tono,
          volumen: analisis.volumen,
          timbre: analisis.timbre,
          palabras: analisis.palabras,
          wpm: analisis.wpm,
          muletillas: analisis.muletillas,
          hayTranscripcion: analisis.hayTranscripcion,
        });
      }
    } catch {
      flash("La práctica se guardó, pero el audio no cupo en la memoria");
      sesion = { ...sesion, tieneAudio: false };
    }
    setSesiones((p) => [...p, sesion]);
    flash("Práctica guardada");
    go("devolucion", sesion.id);
  }, [flash]);

  const borrarSesion = useCallback(async (id) => {
    try {
      await borrarBlob(ST_AUDIO, id);
      await borrarBlob(ST_ANALISIS, id);
    } catch {}
    setSesiones((p) => p.filter((s) => s.id !== id));
    flash("Práctica eliminada");
    back();
  }, [flash]);

  const importar = (d) => {
    setAlumnos(d.alumnos || []);
    setSesiones(d.sesiones || []);
    setPlanes(d.planes || {});
    setTemario(d.temario || {});
    setBiblioteca(d.biblioteca || []);
    setNav(null);
    setTab("inicio");
  };

  const borrarTodo = () => {
    setAlumnos([]); setSesiones([]); setPlanes({}); setTemario({}); setBiblioteca([]);
    setQuick(QUICK_DEFAULT); setNav(null);
  };

  /* --------------------------------- Render ------------------------------- */
  if (!listo) {
    return (
      <div style={{ minHeight: "100vh", background: T.ink, display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontFamily: FONT_B }}>
        <GlobalStyle />Cargando el estudio…
      </div>
    );
  }

  let body;
  if (nav?.name === "alumno") {
    body = <AlumnoDetalle {...{ alumnos, setAlumnos, sesionesDe, planes, setPlanes, temario, setTemario, go, back, flash, id: nav.params }} />;
  } else if (nav?.name === "clase") {
    const a = alumnos.find((x) => x.id === nav.params);
    body = <ClaseLive alumno={a} quick={quick} setQuick={setQuick} onGuardar={guardarSesion} back={back} flash={flash} />;
  } else if (nav?.name === "devolucion") {
    body = <Devolucion sesion={sesiones.find((s) => s.id === nav.params)} alumnos={alumnos}
      sesionesDe={sesionesDe} back={back} onBorrar={borrarSesion} flash={flash} />;
  } else if (nav?.name === "nuevo") {
    body = <NuevoAlumno {...{ setAlumnos, back, flash }} />;
  } else if (tab === "inicio") {
    body = <Inicio {...{ alumnos, sesiones, go, setTab }} />;
  } else if (tab === "alumnos") {
    body = <Alumnos {...{ alumnos, sesionesDe, go }} />;
  } else if (tab === "clase") {
    body = <ElegirAlumno {...{ alumnos, go }} />;
  } else if (tab === "biblioteca") {
    body = <Biblioteca {...{ biblioteca, setBiblioteca, flash }} />;
  } else if (tab === "progreso") {
    body = <Progreso {...{ alumnos, sesionesDe, temario }} />;
  } else {
    body = <Ajustes {...{ alumnos, sesiones, planes, temario, biblioteca, onBorrarTodo: borrarTodo, onImportar: importar, flash }} />;
  }

  const enClase = nav?.name === "clase";

  return (
    <div style={{ minHeight: "100vh", background: T.ink, color: T.bone, fontFamily: FONT_B, paddingBottom: nav ? 0 : 78 }}>
      <GlobalStyle />
      <div style={{ maxWidth: 860, margin: "0 auto" }}>{body}</div>
      <Toast msg={toast} />

      {!nav && (
        <nav style={{
          position: "fixed", bottom: 0, left: 0, right: 0, background: `${T.surface}F2`,
          borderTop: `1px solid ${T.line}`, display: "flex", zIndex: 50, backdropFilter: "blur(8px)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}>
          {[
            { k: "inicio", n: "Inicio", I: Home },
            { k: "alumnos", n: "Alumnos", I: Users },
            { k: "clase", n: "Clase", I: Mic },
            { k: "biblioteca", n: "Material", I: BookOpen },
            { k: "progreso", n: "Progreso", I: BarChart3 },
            { k: "ajustes", n: "Ajustes", I: Settings },
          ].map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)} style={{
              flex: 1, background: "none", border: "none", padding: "10px 2px 12px",
              color: tab === t.k ? T.brass : T.muted, cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              borderTop: `2px solid ${tab === t.k ? T.brass : "transparent"}`, marginTop: -1,
              transition: "color .15s ease",
            }}>
              <t.I size={19} />
              <span style={{ fontSize: 10, fontFamily: FONT_M, letterSpacing: .4 }}>{t.n}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
