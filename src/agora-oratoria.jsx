import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Home, Users, Mic, BookOpen, BarChart3, Settings, Plus, ChevronRight, ArrowLeft,
  Play, Pause, Square, Timer, Star, EyeOff, Hand, Repeat, Zap, Volume2, MicOff,
  Trash2, X, Check, CheckCircle2, Target, Clock, GraduationCap, Landmark,
  FileText, Bookmark, ListChecks, Sparkles, Flag, TrendingUp, Presentation,
  Undo2, Save, Upload, Award, AlertTriangle, Maximize2, Minimize2
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar
} from "recharts";

/* ============================================================================
   ÁGORA — Estudio de Oratoria
   Núcleo funcional: alumnos, clase en vivo, evaluación, progreso, biblioteca.
   Persistencia local. Sin servidores, sin costos, sin cuentas.
   ========================================================================== */

/* ----------------------------- Tokens de diseño --------------------------- */
const T = {
  ink:      "#0F1D21",
  surface:  "#152A30",
  raised:   "#1C363E",
  line:     "#27474F",
  bone:     "#EFE6D5",
  muted:    "#8FA8AE",
  brass:    "#D6A93C",
  brassDim: "#7A6224",
  jade:     "#4FB08A",
  amber:    "#E0A03B",
  red:      "#D6544C",
  violet:   "#8C7BC7",
  sky:      "#5B9BC4",
};

const FONT_D = "'Barlow Condensed','Arial Narrow',Impact,system-ui,sans-serif";
const FONT_B = "'IBM Plex Sans',system-ui,-apple-system,Segoe UI,sans-serif";
const FONT_M = "'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace";

/* ------------------------------- Contenido -------------------------------- */
const TRACKS = {
  infantil: { n: "Oratoria clásica", sub: "Niños · concurso · castrense", icon: GraduationCap, color: T.brass },
  politico: { n: "Comunicación política", sub: "Candidatos · cabildo · congreso", icon: Landmark, color: T.sky },
};

const RUBRICAS = {
  infantil: [
    { k: "postura",   n: "Postura y marcialidad", d: "Firmeza, simetría, control del cuerpo" },
    { k: "proyeccion",n: "Proyección de voz",     d: "Volumen sostenido sin forzar la garganta" },
    { k: "diccion",   n: "Dicción",               d: "Consonantes finales, vocales abiertas" },
    { k: "memoria",   n: "Fidelidad al texto",    d: "Dominio sin titubeos ni rescates" },
    { k: "mirada",    n: "Contacto visual",       d: "Barrido de sala, sostiene la mirada" },
    { k: "gesto",     n: "Gestualidad",           d: "Manos y rostro al servicio del texto" },
    { k: "ritmo",     n: "Ritmo y pausas",        d: "Velocidad, silencios, énfasis" },
    { k: "presencia", n: "Presencia escénica",    d: "Entrada, saludo, ocupación del foro" },
  ],
  politico: [
    { k: "mensaje",     n: "Claridad del mensaje", d: "Idea fuerza reconocible y repetible" },
    { k: "estructura",  n: "Estructura",           d: "Apertura, desarrollo, cierre con llamado" },
    { k: "evidencia",   n: "Manejo de datos",      d: "Cifras exactas, fuente, contexto" },
    { k: "conexion",    n: "Conexión con el auditorio", d: "Lenguaje y ejemplos del territorio" },
    { k: "presion",     n: "Manejo de presión",    d: "Pregunta hostil, interrupción, pivoteo" },
    { k: "noverbal",    n: "Lenguaje corporal",    d: "Atril, manos, mirada a cámara" },
    { k: "concision",   n: "Concisión",            d: "Frase corta, sin rodeos ni muletillas" },
    { k: "credibilidad",n: "Credibilidad y tono",  d: "Coherencia entre fondo y forma" },
  ],
};

const TEMARIO = {
  infantil: [
    { k: "i1", n: "Respiración y apoyo",     d: "Diafragma, costo-diafragmática, columna de aire" },
    { k: "i2", n: "Postura y marcialidad",   d: "Firmes, descanso, giros, saludo protocolario" },
    { k: "i3", n: "Proyección y resonancia", d: "Máscara facial, volumen sin gritar, cuidado vocal" },
    { k: "i4", n: "Dicción y articulación",  d: "Trabalenguas, corcho, consonantes finales" },
    { k: "i5", n: "Estructura del discurso", d: "Exordio, narración, argumentación, peroración" },
    { k: "i6", n: "Memorización",            d: "Palacio de memoria, anclas, bloques de sentido" },
    { k: "i7", n: "Escena",                  d: "Entrada, ubicación, desplazamiento, salida" },
    { k: "i8", n: "Gesto y mirada",          d: "Manos, rostro, barrido visual, énfasis" },
    { k: "i9", n: "Manejo de nervios",       d: "Respiración 4-4-4, rutina previa, imprevistos" },
    { k: "i10",n: "Protocolo de concurso",   d: "Tiempos, jurado, saludo, presentación, cierre" },
  ],
  politico: [
    { k: "p1", n: "Idea fuerza y framing",   d: "Una sola idea, encuadre, palabra propia" },
    { k: "p2", n: "Arquitectura del discurso", d: "3 min, 7 min, 30 seg (spot), 1 min (video)" },
    { k: "p3", n: "Argumentación",           d: "Dato, evidencia, ejemplo, refutación" },
    { k: "p4", n: "Storytelling territorial",d: "Caso real, nombre propio, colonia, cifra local" },
    { k: "p5", n: "Media training",          d: "Entrevista, cámara, soundbite, pregunta trampa" },
    { k: "p6", n: "Debate",                  d: "Ataque, defensa, pivoteo, cierre memorable" },
    { k: "p7", n: "Comunicación de crisis",  d: "Pregunta hostil, disculpa pública, desmentido" },
    { k: "p8", n: "No verbal y atril",       d: "Manos, mirada, traje, micrófono, distancia" },
    { k: "p9", n: "Mitin y asamblea",        d: "Volumen, cadencia, coro, remate, aplauso" },
    { k: "p10",n: "Sesión y tribuna",        d: "Reglamento, tiempo, alusiones, réplica" },
  ],
};

const EJERCICIOS = {
  postura:    ["Firmes contra pared, 3 min, hombros a la pared", "Discurso completo con libro sobre la cabeza", "Giros militares antes de cada bloque del texto"],
  proyeccion: ["Contar del 1 al 20 alejándose del profesor un paso por número", "Vocalizar con la mano en el diafragma, sin subir hombros", "Repetir el exordio a 3 distancias del aula"],
  diccion:    ["Trabalenguas con lápiz entre los dientes, 90 seg", "Leer el discurso exagerando consonantes finales", "Silabeo lento del párrafo más difícil, x3"],
  memoria:    ["Dividir en 5 bloques y nombrar cada bloque", "Recitar solo primeras frases de cada bloque", "Recitar el texto caminando una ruta fija (palacio de memoria)"],
  mirada:     ["Barrido en 3 puntos: izquierda, centro, derecha, por párrafo", "Sostener 3 segundos por idea completa", "Ensayo con 3 objetos que sustituyen público"],
  gesto:      ["Manos a la cintura: recitar sin gesticular, luego liberar", "Un gesto por idea, prohibido repetir", "Grabar y contar gestos que no significan nada"],
  ritmo:      ["Marcar pausas con lápiz en el texto y cumplirlas", "Recitar con metrónomo mental: rápido / lento / normal", "Regla del silencio: 2 seg completos antes del remate"],
  presencia:  ["Entrada completa 5 veces: caminar, plantarse, respirar, saludar", "Ocupar 3 posiciones del escenario en el mismo discurso", "Cierre y salida sin correr, contando 3 pasos"],
  mensaje:    ["Reducir el discurso a una sola frase de 12 palabras", "Repetir la idea fuerza en apertura, medio y cierre", "Prueba del pasillo: explicarlo en 20 segundos"],
  estructura: ["Escaleta en 4 tarjetas: gancho, problema, propuesta, llamado", "Reordenar el discurso empezando por el final", "Cronometrar cada bloque y ajustar al 25/50/25"],
  evidencia:  ["Tres cifras memorizadas con fuente y año", "Traducir cada cifra a una imagen cotidiana", "Anticipar la contra-cifra del adversario"],
  conexion:   ["Nombrar 3 colonias o sectores concretos en el discurso", "Sustituir un tecnicismo por una frase de la calle", "Abrir con una historia de una persona con nombre"],
  presion:    ["Simulacro: 5 preguntas hostiles seguidas, 30 seg c/u", "Técnica puente: reconocer, reencuadrar, redirigir", "Responder sin repetir la palabra negativa del ataque"],
  noverbal:   ["Discurso con manos visibles sobre el atril todo el tiempo", "Mirada a cámara 80% del tiempo, grabación de 60 seg", "Eliminar balanceo: pies fijos, marcados en el piso"],
  concision:  ["Regla de 15 palabras por frase durante todo el ensayo", "Contar muletillas con penalización de 5 seg", "Decir lo mismo en 60, 30 y 15 segundos"],
  credibilidad:["Bajar medio tono y desacelerar 15% el cierre", "Eliminar superlativos y absolutos del texto", "Decir una limitación real antes de la propuesta"],
};

const MARK_TYPES = [
  { k: "muletilla", n: "Muletilla",    color: T.red,    Icon: Repeat,  rub: { infantil: "diccion", politico: "concision" } },
  { k: "mirada",    n: "Perdió mirada",color: T.amber,  Icon: EyeOff,  rub: { infantil: "mirada",  politico: "noverbal" } },
  { k: "ritmo",     n: "Se aceleró",   color: T.violet, Icon: Zap,     rub: { infantil: "ritmo",   politico: "concision" } },
  { k: "cuerpo",    n: "Cuerpo/manos", color: T.sky,    Icon: Hand,    rub: { infantil: "postura", politico: "noverbal" } },
  { k: "volumen",   n: "Bajó volumen", color: "#B48EAD",Icon: Volume2, rub: { infantil: "proyeccion", politico: "credibilidad" } },
  { k: "destacado", n: "Buen momento", color: T.jade,   Icon: Star,    rub: null },
];

// Solo muletillas de alta señal: evita falsos positivos con conectores legítimos.
const MULETILLAS = ["este", "eh", "mmm", "o sea", "digamos", "verdad", "como que", "este este", "ehh"];

/* ------------------------------ Persistencia ------------------------------ */
const K_CORE = "agora_core_v1";
const K_SES = "agora_sesiones_v1";

async function readKey(key, fallback) {
  try {
    const r = await window.storage.get(key);
    if (!r || !r.value) return fallback;
    return JSON.parse(r.value);
  } catch { return fallback; }
}
async function writeKey(key, value) {
  try { await window.storage.set(key, JSON.stringify(value)); return true; }
  catch { return false; }
}

const uid = () => Math.random().toString(36).slice(2, 10);
const hoy = () => new Date().toISOString().slice(0, 10);

const SEED_ALUMNOS = [
  { id: "a1", nombre: "Renata Ibarra", track: "infantil", nivel: "Intermedio", edad: "11", objetivo: "Concurso estatal de oratoria — abril", tiempoObjetivo: 180, alta: hoy(), color: T.brass },
  { id: "a2", nombre: "Dip. Ernesto Villar", track: "politico", nivel: "Avanzado", edad: "", objetivo: "Comparecencia y debate de presupuesto", tiempoObjetivo: 300, alta: hoy(), color: T.sky },
];

/* ------------------------------- Utilidades ------------------------------- */
const fmt = (s) => {
  s = Math.max(0, Math.floor(s));
  const m = Math.floor(s / 60), r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
};
const prom = (obj) => {
  const v = Object.values(obj || {}).filter((x) => typeof x === "number");
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
};
const bandColor = (elapsed, target) => {
  if (!target) return T.jade;
  const p = elapsed / target;
  if (p < 0.8) return T.jade;
  if (p <= 1.0) return T.amber;
  return T.red;
};

/* --------------------------- Primitivas de UI ----------------------------- */
function Btn({ children, onClick, variant = "solid", size = "md", full, style, disabled, Icon }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    fontFamily: FONT_B, fontWeight: 600, borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer",
    border: "1px solid transparent", transition: "transform .12s ease, background .15s ease",
    width: full ? "100%" : undefined, opacity: disabled ? 0.45 : 1,
    padding: size === "sm" ? "7px 12px" : size === "lg" ? "15px 20px" : "11px 16px",
    fontSize: size === "sm" ? 13 : size === "lg" ? 16 : 14.5,
  };
  const variants = {
    solid:  { background: T.brass, color: T.ink },
    ghost:  { background: "transparent", color: T.bone, border: `1px solid ${T.line}` },
    quiet:  { background: T.raised, color: T.bone },
    danger: { background: "transparent", color: T.red, border: `1px solid ${T.red}55` },
    jade:   { background: T.jade, color: T.ink },
  };
  return (
    <button disabled={disabled} onClick={onClick} style={{ ...base, ...variants[variant], ...style }}
      onPointerDown={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(.97)"; }}
      onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}>
      {Icon && <Icon size={size === "sm" ? 14 : 17} />}
      {children}
    </button>
  );
}

function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: T.surface, border: `1px solid ${T.line}`, borderRadius: 14,
      padding: 16, cursor: onClick ? "pointer" : undefined, ...style,
    }}>{children}</div>
  );
}

function Eyebrow({ children, color = T.muted }) {
  return <div style={{ fontFamily: FONT_M, fontSize: 10.5, letterSpacing: 1.6, textTransform: "uppercase", color, marginBottom: 6 }}>{children}</div>;
}

function H({ children, size = 22, style }) {
  return <div style={{ fontFamily: FONT_D, fontSize: size, fontWeight: 600, letterSpacing: 0.3, color: T.bone, lineHeight: 1.1, ...style }}>{children}</div>;
}

function Field({ label, value, onChange, placeholder, type = "text", rows }) {
  const s = {
    width: "100%", background: T.ink, border: `1px solid ${T.line}`, borderRadius: 10,
    padding: "11px 12px", color: T.bone, fontFamily: FONT_B, fontSize: 14.5, outline: "none",
    resize: "vertical", boxSizing: "border-box",
  };
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 5, fontFamily: FONT_B }}>{label}</div>
      {rows
        ? <textarea rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={s} />
        : <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={s} />}
    </label>
  );
}

function Empty({ Icon, title, hint, action }) {
  return (
    <div style={{ textAlign: "center", padding: "44px 20px", color: T.muted }}>
      {Icon && <Icon size={34} style={{ opacity: .5, marginBottom: 12 }} />}
      <H size={19} style={{ marginBottom: 6 }}>{title}</H>
      <div style={{ fontSize: 13.5, marginBottom: 16, lineHeight: 1.5 }}>{hint}</div>
      {action}
    </div>
  );
}

function Avatar({ nombre, color, size = 40 }) {
  const ini = (nombre || "?").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: 10, flexShrink: 0,
      background: `${color}22`, border: `1px solid ${color}66`, color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: FONT_D, fontWeight: 700, fontSize: size * 0.42,
    }}>{ini}</div>
  );
}

/* ------------------------- SIGNATURE: Cinta de tiempo --------------------- */
function Ribbon({ elapsed, target, marks = [], height = 56, showLabels = true }) {
  const total = Math.max(target * 1.25, elapsed * 1.05, 30);
  const p = (t) => Math.min(100, Math.max(0, (t / total) * 100));
  const g1 = p(target * 0.8), g2 = p(target);
  return (
    <div>
      <div style={{
        position: "relative", height, borderRadius: 10, overflow: "hidden",
        border: `1px solid ${T.line}`, background: T.ink,
      }}>
        {/* bandas de tiempo */}
        <div style={{ position: "absolute", inset: 0, display: "flex" }}>
          <div style={{ width: `${g1}%`, background: `${T.jade}1A` }} />
          <div style={{ width: `${g2 - g1}%`, background: `${T.amber}22` }} />
          <div style={{ flex: 1, background: `${T.red}22` }} />
        </div>
        {/* línea de objetivo */}
        <div style={{ position: "absolute", left: `${g2}%`, top: 0, bottom: 0, width: 2, background: T.bone, opacity: .5 }} />
        {/* avance */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: `${p(elapsed)}%`,
          background: "linear-gradient(90deg, rgba(239,230,213,.04), rgba(239,230,213,.14))",
          borderRight: `2px solid ${bandColor(elapsed, target)}`,
        }} />
        {/* marcas */}
        {marks.map((m) => {
          const mt = MARK_TYPES.find((x) => x.k === m.k);
          return (
            <div key={m.id} title={`${mt?.n} · ${fmt(m.t)}`} style={{
              position: "absolute", left: `calc(${p(m.t)}% - 1.5px)`,
              top: m.k === "destacado" ? 4 : "auto", bottom: m.k === "destacado" ? "auto" : 4,
              width: 3, height: height * 0.44, borderRadius: 2,
              background: mt?.color || T.bone, boxShadow: `0 0 6px ${mt?.color}88`,
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

/* ------------------------ Hook: análisis de audio ------------------------- */
function useAudioCoach(track) {
  const [on, setOn] = useState(false);
  const [err, setErr] = useState(null);
  const [level, setLevel] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [palabras, setPalabras] = useState(0);
  const [autoMuletillas, setAutoMuletillas] = useState(0);
  const [silencios, setSilencios] = useState(0);
  const [reconoce, setReconoce] = useState(false);

  const ctxRef = useRef(null), streamRef = useRef(null), rafRef = useRef(null), recRef = useRef(null);
  const t0Ref = useRef(0), quietRef = useRef(0), lastQuietRef = useRef(false), finalRef = useRef("");

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    try { recRef.current && recRef.current.stop(); } catch {}
    recRef.current = null;
    try { streamRef.current && streamRef.current.getTracks().forEach((t) => t.stop()); } catch {}
    try { ctxRef.current && ctxRef.current.close(); } catch {}
    streamRef.current = null; ctxRef.current = null;
    setOn(false); setLevel(0);
  }, []);

  const start = useCallback(async () => {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false },
      });
      streamRef.current = stream;
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC(); ctxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser(); an.fftSize = 1024; an.smoothingTimeConstant = 0.75;
      src.connect(an);
      const buf = new Float32Array(an.fftSize);
      t0Ref.current = Date.now(); quietRef.current = 0; lastQuietRef.current = false;
      setSilencios(0); setPalabras(0); setWpm(0); setAutoMuletillas(0); finalRef.current = "";

      const loop = () => {
        an.getFloatTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        const rms = Math.sqrt(sum / buf.length);
        const lv = Math.min(1, rms * 7);
        setLevel(lv);
        const quiet = lv < 0.045;
        const now = Date.now();
        if (quiet) {
          if (!lastQuietRef.current) quietRef.current = now;
          else if (now - quietRef.current > 1400 && !lastQuietRef.silent) {
            lastQuietRef.silent = true;
            setSilencios((s) => s + 1);
          }
        } else { lastQuietRef.silent = false; }
        lastQuietRef.current = quiet;
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();

      // Transcripción opcional (Web Speech API). Si no existe, el resto sigue funcionando.
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        try {
          const rec = new SR();
          rec.lang = "es-MX"; rec.continuous = true; rec.interimResults = true;
          rec.onresult = (e) => {
            let interim = "";
            for (let i = e.resultIndex; i < e.results.length; i++) {
              const txt = e.results[i][0].transcript;
              if (e.results[i].isFinal) finalRef.current += " " + txt;
              else interim += " " + txt;
            }
            const all = (finalRef.current + " " + interim).toLowerCase();
            const w = all.split(/\s+/).filter(Boolean).length;
            setPalabras(w);
            const mins = Math.max(0.15, (Date.now() - t0Ref.current) / 60000);
            setWpm(Math.round(w / mins));
            let c = 0;
            MULETILLAS.forEach((m) => {
              const re = new RegExp(`(^|\\s)${m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$|,)`, "g");
              c += (all.match(re) || []).length;
            });
            setAutoMuletillas(c);
          };
          rec.onerror = () => {};
          rec.onend = () => { if (recRef.current) { try { rec.start(); } catch {} } };
          rec.start(); recRef.current = rec; setReconoce(true);
        } catch { setReconoce(false); }
      } else setReconoce(false);

      setOn(true);
    } catch (e) {
      setErr(e && e.name === "NotAllowedError"
        ? "Permiso de micrófono denegado. La clase funciona igual con marcado manual."
        : "No hay micrófono disponible. La clase funciona igual con marcado manual.");
      setOn(false);
    }
  }, []);

  useEffect(() => () => stop(), [stop]);
  return { on, err, level, wpm, palabras, autoMuletillas, silencios, reconoce, start, stop, transcripcion: () => finalRef.current.trim() };
}

/* ================================== APP =================================== */
export default function App() {
  const [ready, setReady] = useState(false);
  const [alumnos, setAlumnos] = useState([]);
  const [sesiones, setSesiones] = useState([]);
  const [planes, setPlanes] = useState({});
  const [temario, setTemario] = useState({});
  const [biblioteca, setBiblioteca] = useState([]);
  const [tab, setTab] = useState("inicio");
  const [nav, setNav] = useState(null);            // pila de vistas
  const [toast, setToast] = useState(null);

  /* Carga inicial */
  useEffect(() => {
    (async () => {
      const core = await readKey(K_CORE, null);
      const ses = await readKey(K_SES, null);
      if (core) {
        setAlumnos(core.alumnos || []); setPlanes(core.planes || {});
        setTemario(core.temario || {}); setBiblioteca(core.biblioteca || []);
      } else {
        setAlumnos(SEED_ALUMNOS);
        setBiblioteca([
          { id: uid(), titulo: "Manual de oratoria castrense", track: "infantil", tema: "i2", tags: "postura, protocolo", nota: "Cap. 3 y 4 para nivel inicial", marcas: [] },
          { id: uid(), titulo: "Guía de media training", track: "politico", tema: "p5", tags: "entrevista, cámara", nota: "Usar el bloque de preguntas trampa", marcas: [] },
        ]);
      }
      setSesiones(ses ? ses.sesiones || [] : []);
      setReady(true);
    })();
  }, []);

  /* Guardado con rebote */
  const first = useRef(true);
  useEffect(() => {
    if (!ready) return;
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => { writeKey(K_CORE, { alumnos, planes, temario, biblioteca }); }, 700);
    return () => clearTimeout(t);
  }, [alumnos, planes, temario, biblioteca, ready]);

  const firstS = useRef(true);
  useEffect(() => {
    if (!ready) return;
    if (firstS.current) { firstS.current = false; return; }
    const t = setTimeout(() => { writeKey(K_SES, { sesiones }); }, 700);
    return () => clearTimeout(t);
  }, [sesiones, ready]);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 2200); };
  const go = (name, params) => setNav({ name, params });
  const back = () => setNav(null);

  const sesionesDe = useCallback((id) => sesiones.filter((s) => s.alumnoId === id).sort((a, b) => a.ts - b.ts), [sesiones]);

  /* ------------------------------- Render -------------------------------- */
  if (!ready) {
    return (
      <div style={{ minHeight: "100vh", background: T.ink, display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontFamily: FONT_B }}>
        <GlobalStyle />Cargando el estudio…
      </div>
    );
  }

  let body;
  if (nav?.name === "alumno") body = <AlumnoDetalle {...{ alumnos, setAlumnos, sesionesDe, planes, setPlanes, temario, setTemario, go, back, flash, id: nav.params }} />;
  else if (nav?.name === "clase") body = <ClaseLive {...{ alumnos, id: nav.params, onSave: (s) => { setSesiones((p) => [...p, s]); }, back, go, flash }} />;
  else if (nav?.name === "devolucion") body = <Devolucion {...{ sesion: sesiones.find((s) => s.id === nav.params), alumnos, sesionesDe, back, go }} />;
  else if (nav?.name === "nuevo") body = <NuevoAlumno {...{ setAlumnos, back, flash }} />;
  else if (tab === "inicio") body = <Inicio {...{ alumnos, sesiones, go, setTab }} />;
  else if (tab === "alumnos") body = <Alumnos {...{ alumnos, sesionesDe, go }} />;
  else if (tab === "clase") body = <ElegirAlumno {...{ alumnos, go, setTab }} />;
  else if (tab === "biblioteca") body = <Biblioteca {...{ biblioteca, setBiblioteca, flash }} />;
  else if (tab === "progreso") body = <Progreso {...{ alumnos, sesionesDe, temario }} />;
  else body = <Ajustes {...{ setAlumnos, setSesiones, setPlanes, setTemario, setBiblioteca, flash, alumnos, sesiones }} />;

  return (
    <div style={{ minHeight: "100vh", background: T.ink, color: T.bone, fontFamily: FONT_B, paddingBottom: nav ? 0 : 76 }}>
      <GlobalStyle />
      <div style={{ maxWidth: 860, margin: "0 auto" }}>{body}</div>

      {toast && (
        <div style={{
          position: "fixed", bottom: 88, left: "50%", transform: "translateX(-50%)",
          background: T.raised, border: `1px solid ${T.line}`, color: T.bone,
          padding: "10px 16px", borderRadius: 10, fontSize: 13.5, zIndex: 60, whiteSpace: "nowrap",
        }}>{toast}</div>
      )}

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

function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
      * { -webkit-tap-highlight-color: transparent; }
      body { margin:0; background:${T.ink}; }
      input::placeholder, textarea::placeholder { color:${T.muted}88; }
      ::-webkit-scrollbar { width:8px; height:8px; }
      ::-webkit-scrollbar-thumb { background:${T.line}; border-radius:8px; }
      button:focus-visible, input:focus-visible, textarea:focus-visible { outline:2px solid ${T.brass}; outline-offset:2px; }
      @keyframes pulseLive { 0%,100%{opacity:1} 50%{opacity:.35} }
      .live-dot { animation: pulseLive 1.4s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) { .live-dot { animation:none } }
    `}</style>
  );
}

/* --------------------------------- Header --------------------------------- */
function Head({ title, sub, onBack, right }) {
  return (
    <div style={{ padding: "18px 18px 10px", display: "flex", alignItems: "flex-start", gap: 12 }}>
      {onBack && (
        <button onClick={onBack} style={{ background: T.raised, border: `1px solid ${T.line}`, borderRadius: 10, padding: 9, color: T.bone, cursor: "pointer", marginTop: 2 }}>
          <ArrowLeft size={18} />
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {sub && <Eyebrow>{sub}</Eyebrow>}
        <H size={27}>{title}</H>
      </div>
      {right}
    </div>
  );
}

/* --------------------------------- INICIO --------------------------------- */
function Inicio({ alumnos, sesiones, go, setTab }) {
  const ult = [...sesiones].sort((a, b) => b.ts - a.ts).slice(0, 4);
  const sem = sesiones.filter((s) => Date.now() - s.ts < 7 * 864e5);
  const minutos = Math.round(sesiones.reduce((a, s) => a + s.duracion, 0) / 60);

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
            Cronómetro con banda de tiempo, marcado de incidencias con un toque y evaluación por rúbrica al terminar.
          </div>
          <Btn Icon={Mic} onClick={() => setTab("clase")} full size="lg">Elegir alumno y empezar</Btn>
        </Card>

        <Eyebrow>Últimas prácticas</Eyebrow>
        {ult.length === 0 ? (
          <Card><div style={{ color: T.muted, fontSize: 13.5 }}>Todavía no hay prácticas registradas. La primera clase que corras aparecerá aquí.</div></Card>
        ) : ult.map((s) => {
          const al = alumnos.find((a) => a.id === s.alumnoId);
          const p = prom(s.rubrica);
          return (
            <Card key={s.id} onClick={() => go("devolucion", s.id)} style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar nombre={al?.nombre} color={al?.color || T.brass} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{al?.nombre || "Alumno"}</div>
                <div style={{ fontSize: 11.5, color: T.muted, fontFamily: FONT_M }}>
                  {new Date(s.ts).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })} · {fmt(s.duracion)} · {s.marks.length} marcas
                </div>
              </div>
              <div style={{ fontFamily: FONT_D, fontSize: 24, color: p >= 4 ? T.jade : p >= 3 ? T.brass : T.red }}>{p.toFixed(1)}</div>
              <ChevronRight size={16} color={T.muted} />
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------- ALUMNOS --------------------------------- */
function Alumnos({ alumnos, sesionesDe, go }) {
  const [f, setF] = useState("todos");
  const lista = alumnos.filter((a) => f === "todos" || a.track === f);
  return (
    <div>
      <Head title="Alumnos" sub={`${alumnos.length} registrados`}
        right={<Btn Icon={Plus} size="sm" onClick={() => go("nuevo")}>Nuevo</Btn>} />
      <div style={{ padding: "0 18px 18px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
          {[["todos", "Todos"], ["infantil", "Oratoria clásica"], ["politico", "Política"]].map(([k, n]) => (
            <button key={k} onClick={() => setF(k)} style={{
              padding: "7px 13px", borderRadius: 20, fontSize: 12.5, whiteSpace: "nowrap", cursor: "pointer",
              background: f === k ? T.brass : "transparent", color: f === k ? T.ink : T.muted,
              border: `1px solid ${f === k ? T.brass : T.line}`, fontWeight: 600,
            }}>{n}</button>
          ))}
        </div>
        {lista.length === 0
          ? <Empty Icon={Users} title="Sin alumnos en este filtro" hint="Registra a tu primer alumno para empezar a llevar su bitácora." action={<Btn Icon={Plus} onClick={() => go("nuevo")}>Registrar alumno</Btn>} />
          : lista.map((a) => {
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
                    {ss.length} prácticas{last ? ` · última ${new Date(last.ts).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}` : " · sin práctica aún"}
                  </div>
                </div>
                {last && <div style={{ fontFamily: FONT_D, fontSize: 26, color: T.brass }}>{prom(last.rubrica).toFixed(1)}</div>}
                <ChevronRight size={16} color={T.muted} />
              </Card>
            );
          })}
      </div>
    </div>
  );
}

function NuevoAlumno({ setAlumnos, back, flash }) {
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
      <div style={{ padding: "0 18px 30px" }}>
        <Field label="Nombre completo" value={n} onChange={setN} placeholder="Ej. Renata Ibarra" />
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>Programa</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 14 }}>
          {Object.entries(TRACKS).map(([k, v]) => {
            const I = v.icon, act = tr === k;
            return (
              <button key={k} onClick={() => setTr(k)} style={{
                textAlign: "left", padding: 13, borderRadius: 12, cursor: "pointer",
                background: act ? `${v.color}18` : T.surface, border: `1px solid ${act ? v.color : T.line}`, color: T.bone,
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
            <button key={x} onClick={() => setNiv(x)} style={{
              flex: 1, padding: "9px 6px", borderRadius: 9, fontSize: 13, cursor: "pointer", fontWeight: 600,
              background: niv === x ? T.raised : "transparent", color: niv === x ? T.bone : T.muted,
              border: `1px solid ${niv === x ? T.brass : T.line}`,
            }}>{x}</button>
          ))}
        </div>
        <Field label="Edad (opcional)" value={ed} onChange={setEd} placeholder="11" />
        <Field label="Objetivo" value={obj} onChange={setObj} placeholder="Ej. Concurso estatal de oratoria — abril" />
        <Field label="Tiempo objetivo del discurso (segundos)" value={tie} onChange={setTie} type="number" />
        <Btn full size="lg" Icon={Check} onClick={guardar}>Guardar alumno</Btn>
      </div>
    </div>
  );
}

/* ----------------------------- DETALLE ALUMNO ------------------------------ */
function AlumnoDetalle({ alumnos, setAlumnos, sesionesDe, planes, setPlanes, temario, setTemario, go, back, flash, id }) {
  const a = alumnos.find((x) => x.id === id);
  const [sec, setSec] = useState("resumen");
  const ss = useMemo(() => (a ? sesionesDe(id) : []), [a, id, sesionesDe]);
  const rub = a ? RUBRICAS[a.track] : [];

  const promedios = useMemo(() => {
    const out = {};
    rub.forEach((r) => {
      const v = ss.map((s) => s.rubrica?.[r.k]).filter((x) => typeof x === "number");
      out[r.k] = v.length ? v.reduce((x, y) => x + y, 0) / v.length : 0;
    });
    return out;
  }, [ss, rub]);

  const debiles = useMemo(() =>
    Object.entries(promedios).filter(([, v]) => v > 0).sort((x, y) => x[1] - y[1]).slice(0, 3).map(([k]) => k),
    [promedios]);

  if (!a) return <div style={{ padding: 20 }}>Alumno no encontrado.</div>;

  const plan = planes[id] || { objetivo: a.objetivo || "", meta: "", hitos: [] };
  const setPlan = (p) => setPlanes((prev) => ({ ...prev, [id]: p }));

  const generarPlan = () => {
    if (debiles.length === 0) return flash("Registra al menos una práctica evaluada");
    const hitos = [];
    debiles.forEach((k) => {
      const nombre = rub.find((r) => r.k === k)?.n || k;
      (EJERCICIOS[k] || []).slice(0, 2).forEach((e) => hitos.push({ id: uid(), t: `${nombre}: ${e}`, ok: false }));
    });
    setPlan({ ...plan, hitos: [...plan.hitos, ...hitos] });
    flash(`${hitos.length} ejercicios añadidos al plan`);
  };

  const tem = TEMARIO[a.track];
  const estados = temario[id] || {};
  const cicloEstado = (k) =>
    setTemario((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), [k]: ((prev[id]?.[k] || 0) + 1) % 4 } }));
  const EST = [
    { n: "Pendiente", c: T.muted, bg: "transparent" },
    { n: "Visto", c: T.sky, bg: `${T.sky}18` },
    { n: "Practicado", c: T.amber, bg: `${T.amber}18` },
    { n: "Dominado", c: T.jade, bg: `${T.jade}18` },
  ];
  const cubierto = tem.filter((t) => (estados[t.k] || 0) >= 2).length;

  return (
    <div>
      <Head title={a.nombre} sub={TRACKS[a.track].n} onBack={back} />
      <div style={{ padding: "0 18px 20px" }}>
        <Card style={{ marginBottom: 14, display: "flex", gap: 13, alignItems: "center" }}>
          <Avatar nombre={a.nombre} color={a.color} size={52} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.5 }}>
              {a.nivel}{a.edad ? ` · ${a.edad} años` : ""} · objetivo {fmt(a.tiempoObjetivo)}
            </div>
            {a.objetivo && <div style={{ fontSize: 13, marginTop: 4, color: T.bone }}><Target size={12} style={{ verticalAlign: -1 }} /> {a.objetivo}</div>}
          </div>
        </Card>

        <Btn full size="lg" Icon={Mic} onClick={() => go("clase", id)} style={{ marginBottom: 16 }}>Iniciar clase con {a.nombre.split(" ")[0]}</Btn>

        <div style={{ display: "flex", gap: 7, marginBottom: 14, overflowX: "auto" }}>
          {[["resumen", "Resumen"], ["plan", "Plan de trabajo"], ["temario", "Temario"], ["historial", "Historial"]].map(([k, n]) => (
            <button key={k} onClick={() => setSec(k)} style={{
              padding: "7px 13px", borderRadius: 20, fontSize: 12.5, whiteSpace: "nowrap", cursor: "pointer", fontWeight: 600,
              background: sec === k ? T.raised : "transparent", color: sec === k ? T.bone : T.muted,
              border: `1px solid ${sec === k ? T.brass : T.line}`,
            }}>{n}</button>
          ))}
        </div>

        {sec === "resumen" && (ss.length === 0
          ? <Empty Icon={Mic} title="Sin prácticas todavía" hint="Corre una clase en vivo para generar el primer diagnóstico." />
          : (
            <>
              <Card style={{ marginBottom: 12 }}>
                <Eyebrow>Perfil de competencias · promedio de {ss.length} prácticas</Eyebrow>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={rub.map((r) => ({ m: r.n.split(" ")[0], v: +promedios[r.k].toFixed(2) }))}>
                    <PolarGrid stroke={T.line} />
                    <PolarAngleAxis dataKey="m" tick={{ fill: T.muted, fontSize: 10 }} />
                    <Radar dataKey="v" stroke={T.brass} fill={T.brass} fillOpacity={0.28} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
              <Card style={{ marginBottom: 12 }}>
                <Eyebrow color={T.red}>Prioridades de entrenamiento</Eyebrow>
                {debiles.map((k, i) => {
                  const r = rub.find((x) => x.k === k);
                  return (
                    <div key={k} style={{ padding: "10px 0", borderBottom: i < debiles.length - 1 ? `1px solid ${T.line}` : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{r?.n}</div>
                        <div style={{ fontFamily: FONT_M, fontSize: 13, color: T.red }}>{promedios[k].toFixed(1)}</div>
                      </div>
                      <div style={{ fontSize: 12, color: T.muted, marginTop: 3, lineHeight: 1.45 }}>→ {(EJERCICIOS[k] || [])[0]}</div>
                    </div>
                  );
                })}
              </Card>
            </>
          ))}

        {sec === "plan" && (
          <div>
            <Card style={{ marginBottom: 12 }}>
              <Field label="Objetivo del ciclo" value={plan.objetivo} onChange={(v) => setPlan({ ...plan, objetivo: v })} placeholder="Ej. Ganar la etapa municipal" />
              <Field label="Fecha meta" value={plan.meta} onChange={(v) => setPlan({ ...plan, meta: v })} type="date" />
              <Btn variant="ghost" full Icon={Sparkles} onClick={generarPlan}>Sugerir ejercicios según sus puntos débiles</Btn>
            </Card>
            <Card>
              <Eyebrow>Ejercicios del plan · {plan.hitos.filter((h) => h.ok).length}/{plan.hitos.length}</Eyebrow>
              {plan.hitos.length === 0 && <div style={{ color: T.muted, fontSize: 13, padding: "8px 0" }}>El plan está vacío. Usa el botón de arriba o añade un ejercicio manualmente.</div>}
              {plan.hitos.map((h) => (
                <div key={h.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 0", borderBottom: `1px solid ${T.line}` }}>
                  <button onClick={() => setPlan({ ...plan, hitos: plan.hitos.map((x) => x.id === h.id ? { ...x, ok: !x.ok } : x) })}
                    style={{ background: h.ok ? T.jade : "transparent", border: `1px solid ${h.ok ? T.jade : T.line}`, borderRadius: 6, width: 22, height: 22, flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                    {h.ok && <Check size={14} color={T.ink} />}
                  </button>
                  <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.45, color: h.ok ? T.muted : T.bone, textDecoration: h.ok ? "line-through" : "none" }}>{h.t}</div>
                  <button onClick={() => setPlan({ ...plan, hitos: plan.hitos.filter((x) => x.id !== h.id) })} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", padding: 2 }}><X size={15} /></button>
                </div>
              ))}
              <AddHito onAdd={(t) => setPlan({ ...plan, hitos: [...plan.hitos, { id: uid(), t, ok: false }] })} />
            </Card>
          </div>
        )}

        {sec === "temario" && (
          <Card>
            <Eyebrow>Avance del temario · {cubierto}/{tem.length} temas trabajados</Eyebrow>
            <div style={{ height: 6, background: T.ink, borderRadius: 4, overflow: "hidden", margin: "6px 0 14px" }}>
              <div style={{ height: "100%", width: `${(cubierto / tem.length) * 100}%`, background: T.jade }} />
            </div>
            {tem.map((t) => {
              const e = estados[t.k] || 0, E = EST[e];
              return (
                <button key={t.k} onClick={() => cicloEstado(t.k)} style={{
                  width: "100%", textAlign: "left", display: "flex", gap: 11, alignItems: "center",
                  padding: "11px 10px", marginBottom: 6, borderRadius: 10, cursor: "pointer",
                  background: E.bg, border: `1px solid ${e ? E.c + "55" : T.line}`, color: T.bone,
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

        {sec === "historial" && (ss.length === 0
          ? <Empty Icon={Clock} title="Sin historial" hint="Aquí quedará la bitácora completa de sus prácticas." />
          : [...ss].reverse().map((s) => (
            <Card key={s.id} onClick={() => go("devolucion", s.id)} style={{ marginBottom: 9 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{new Date(s.ts).toLocaleDateString("es-MX", { weekday: "short", day: "2-digit", month: "long" })}</div>
                  <div style={{ fontSize: 11.5, color: T.muted, fontFamily: FONT_M }}>{fmt(s.duracion)} · {s.marks.length} marcas · {s.tipo}</div>
                </div>
                <div style={{ fontFamily: FONT_D, fontSize: 26, color: prom(s.rubrica) >= 4 ? T.jade : T.brass }}>{prom(s.rubrica).toFixed(1)}</div>
              </div>
              <Ribbon elapsed={s.duracion} target={s.objetivo} marks={s.marks} height={26} showLabels={false} />
            </Card>
          )))}
      </div>
    </div>
  );
}

function AddHito({ onAdd }) {
  const [v, setV] = useState("");
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder="Añadir ejercicio…"
        onKeyDown={(e) => { if (e.key === "Enter" && v.trim()) { onAdd(v.trim()); setV(""); } }}
        style={{ flex: 1, background: T.ink, border: `1px solid ${T.line}`, borderRadius: 9, padding: "10px 11px", color: T.bone, fontFamily: FONT_B, fontSize: 13.5, outline: "none" }} />
      <Btn size="sm" onClick={() => { if (v.trim()) { onAdd(v.trim()); setV(""); } }} Icon={Plus}>Añadir</Btn>
    </div>
  );
}

/* -------------------------- ELEGIR ALUMNO (CLASE) -------------------------- */
function ElegirAlumno({ alumnos, go }) {
  return (
    <div>
      <Head title="Clase en vivo" sub="Paso 1 de 2 · elegir alumno" />
      <div style={{ padding: "0 18px 18px" }}>
        {alumnos.length === 0
          ? <Empty Icon={Users} title="Registra un alumno primero" hint="Necesitas al menos un alumno para abrir una clase." action={<Btn onClick={() => go("nuevo")} Icon={Plus}>Registrar alumno</Btn>} />
          : alumnos.map((a) => (
            <Card key={a.id} onClick={() => go("clase", a.id)} style={{ marginBottom: 9, display: "flex", alignItems: "center", gap: 13 }}>
              <Avatar nombre={a.nombre} color={a.color} size={42} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{a.nombre}</div>
                <div style={{ fontSize: 11.5, color: T.muted }}>{TRACKS[a.track].n} · objetivo {fmt(a.tiempoObjetivo)}</div>
              </div>
              <Play size={18} color={T.brass} />
            </Card>
          ))}
      </div>
    </div>
  );
}

/* ------------------------------- CLASE EN VIVO ----------------------------- */
const TIPOS = ["Discurso preparado", "Improvisación", "Lectura", "Entrevista / debate", "Ejercicio técnico"];

function ClaseLive({ alumnos, id, onSave, back, go, flash }) {
  const a = alumnos.find((x) => x.id === id);
  const [fase, setFase] = useState("prep");        // prep | live | eval
  const [tipo, setTipo] = useState(TIPOS[0]);
  const [objetivo, setObjetivo] = useState(a?.tiempoObjetivo || 180);
  const [run, setRun] = useState(false);
  const [el, setEl] = useState(0);
  const [marks, setMarks] = useState([]);
  const [rubrica, setRubrica] = useState({});
  const [notas, setNotas] = useState("");
  const [modoAlumno, setModoAlumno] = useState(false);
  const [usarMic, setUsarMic] = useState(false);
  const coach = useAudioCoach(a?.track);
  const tickRef = useRef(null);

  useEffect(() => {
    if (run) { tickRef.current = setInterval(() => setEl((e) => e + 1), 1000); }
    return () => clearInterval(tickRef.current);
  }, [run]);

  if (!a) return <div style={{ padding: 20 }}>Alumno no encontrado.</div>;
  const rub = RUBRICAS[a.track];

  const marcar = (k) => {
    setMarks((m) => [...m, { id: uid(), k, t: el }]);
    if (navigator.vibrate) navigator.vibrate(18);
  };
  const deshacer = () => setMarks((m) => m.slice(0, -1));
  const conteo = (k) => marks.filter((m) => m.k === k).length;

  const terminar = () => {
    setRun(false); coach.stop();
    // Pre-carga de rúbrica: parte de 4 y descuenta según incidencias marcadas
    const pre = {};
    rub.forEach((r) => {
      const inc = MARK_TYPES.filter((mt) => mt.rub && mt.rub[a.track] === r.k)
        .reduce((s, mt) => s + conteo(mt.k), 0);
      pre[r.k] = Math.max(1, Math.min(5, 4 - Math.floor(inc / 2)));
    });
    setRubrica(pre); setFase("eval");
  };

  const guardar = () => {
    const s = {
      id: uid(), alumnoId: a.id, ts: Date.now(), duracion: el, objetivo, tipo,
      marks, rubrica, notas, track: a.track,
      audio: coach.on || coach.palabras > 0
        ? { wpm: coach.wpm, palabras: coach.palabras, autoMuletillas: coach.autoMuletillas, silencios: coach.silencios }
        : null,
    };
    onSave(s); flash("Práctica guardada"); go("devolucion", s.id);
  };

  /* ---------- Fase 1: preparación ---------- */
  if (fase === "prep") {
    return (
      <div>
        <Head title="Preparar la práctica" sub={a.nombre} onBack={back} />
        <div style={{ padding: "0 18px 30px" }}>
          <Card style={{ marginBottom: 12 }}>
            <Eyebrow>Tipo de práctica</Eyebrow>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 4 }}>
              {TIPOS.map((t) => (
                <button key={t} onClick={() => setTipo(t)} style={{
                  padding: "8px 12px", borderRadius: 9, fontSize: 12.5, cursor: "pointer", fontWeight: 600,
                  background: tipo === t ? `${T.brass}22` : "transparent", color: tipo === t ? T.brass : T.muted,
                  border: `1px solid ${tipo === t ? T.brass : T.line}`,
                }}>{t}</button>
              ))}
            </div>
          </Card>

          <Card style={{ marginBottom: 12 }}>
            <Eyebrow>Tiempo objetivo</Eyebrow>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 6 }}>
              <div style={{ fontFamily: FONT_M, fontSize: 34, color: T.bone }}>{fmt(objetivo)}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[60, 120, 180, 300, 420, 600].map((s) => (
                  <button key={s} onClick={() => setObjetivo(s)} style={{
                    padding: "6px 10px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: FONT_M,
                    background: objetivo === s ? T.brass : "transparent", color: objetivo === s ? T.ink : T.muted,
                    border: `1px solid ${objetivo === s ? T.brass : T.line}`,
                  }}>{fmt(s)}</button>
                ))}
              </div>
            </div>
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <Eyebrow>Asistente de voz (opcional)</Eyebrow>
                <div style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.5 }}>
                  Mide volumen, silencios y palabras por minuto con el micrófono. Si no hay permiso, el marcado manual funciona igual.
                </div>
              </div>
              <button onClick={() => setUsarMic(!usarMic)} style={{
                width: 52, height: 30, borderRadius: 16, flexShrink: 0, cursor: "pointer",
                background: usarMic ? T.jade : T.line, border: "none", position: "relative", transition: "background .2s",
              }}>
                <div style={{ position: "absolute", top: 3, left: usarMic ? 25 : 3, width: 24, height: 24, borderRadius: 12, background: T.bone, transition: "left .2s" }} />
              </button>
            </div>
          </Card>

          <Btn full size="lg" Icon={Play} onClick={() => { setFase("live"); setRun(true); if (usarMic) coach.start(); }}>
            Empezar · {fmt(objetivo)}
          </Btn>
          <div style={{ fontSize: 12, color: T.muted, textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>
            Durante la práctica marca las incidencias con un toque. Quedan fijadas en la línea de tiempo para revisarlas juntos al final.
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Fase 2: en vivo ---------- */
  if (fase === "live") {
    const color = bandColor(el, objetivo);
    if (modoAlumno) {
      return (
        <div style={{ minHeight: "100vh", background: T.ink, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ fontFamily: FONT_M, fontSize: 12, color: T.muted, letterSpacing: 2, marginBottom: 10 }}>{a.nombre.toUpperCase()}</div>
          <div style={{ fontFamily: FONT_M, fontSize: "clamp(64px,22vw,150px)", color, lineHeight: 1, fontWeight: 500 }}>{fmt(el)}</div>
          <div style={{ fontFamily: FONT_D, fontSize: 20, color: T.muted, marginTop: 4 }}>de {fmt(objetivo)}</div>
          <div style={{ width: "100%", maxWidth: 560, marginTop: 26 }}>
            <Ribbon elapsed={el} target={objetivo} marks={marks} height={44} />
          </div>
          {coach.on && (
            <div style={{ display: "flex", gap: 26, marginTop: 26 }}>
              <Metric label="volumen" value={`${Math.round(coach.level * 100)}`} color={coach.level > 0.12 ? T.jade : T.amber} />
              {coach.reconoce && <Metric label="pal./min" value={coach.wpm || "—"} color={coach.wpm > 170 ? T.red : coach.wpm > 90 ? T.jade : T.amber} />}
            </div>
          )}
          <Btn variant="ghost" Icon={Minimize2} style={{ marginTop: 30 }} onClick={() => setModoAlumno(false)}>Volver al panel del profesor</Btn>
        </div>
      );
    }
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "14px 18px 0", display: "flex", alignItems: "center", gap: 10 }}>
          <div className="live-dot" style={{ width: 9, height: 9, borderRadius: 5, background: run ? T.red : T.muted }} />
          <div style={{ fontFamily: FONT_M, fontSize: 11, letterSpacing: 1.5, color: T.muted, flex: 1 }}>
            {run ? "EN VIVO" : "EN PAUSA"} · {a.nombre.toUpperCase()}
          </div>
          <button onClick={() => setModoAlumno(true)} style={{ background: T.raised, border: `1px solid ${T.line}`, borderRadius: 9, padding: 8, color: T.bone, cursor: "pointer" }}><Maximize2 size={16} /></button>
        </div>

        <div style={{ padding: "6px 18px 12px", textAlign: "center" }}>
          <div style={{ fontFamily: FONT_M, fontSize: "clamp(52px,15vw,88px)", color, lineHeight: 1.05 }}>{fmt(el)}</div>
          <div style={{ fontSize: 12, color: T.muted, fontFamily: FONT_M }}>objetivo {fmt(objetivo)} · {el > objetivo ? `+${fmt(el - objetivo)} de más` : `faltan ${fmt(objetivo - el)}`}</div>
        </div>

        <div style={{ padding: "0 18px 14px" }}>
          <Ribbon elapsed={el} target={objetivo} marks={marks} height={50} />
        </div>

        {coach.err && (
          <div style={{ margin: "0 18px 12px", padding: 11, borderRadius: 10, background: `${T.amber}15`, border: `1px solid ${T.amber}44`, fontSize: 12.5, color: T.bone, display: "flex", gap: 9 }}>
            <AlertTriangle size={16} color={T.amber} style={{ flexShrink: 0, marginTop: 1 }} />{coach.err}
          </div>
        )}
        {coach.on && (
          <div style={{ margin: "0 18px 14px", padding: 12, borderRadius: 12, background: T.surface, border: `1px solid ${T.line}` }}>
            <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 10 }}>
              <Metric label="pal./min" value={coach.reconoce ? (coach.wpm || "—") : "n/d"} color={coach.wpm > 170 ? T.red : coach.wpm > 90 ? T.jade : T.amber} />
              <Metric label="silencios" value={coach.silencios} color={T.sky} />
              <Metric label="muletillas" value={coach.reconoce ? coach.autoMuletillas : "n/d"} color={T.red} />
            </div>
            <div style={{ height: 8, background: T.ink, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, coach.level * 100)}%`, background: coach.level > 0.6 ? T.red : coach.level > 0.1 ? T.jade : T.amber, transition: "width .08s linear" }} />
            </div>
            <div style={{ fontSize: 10.5, color: T.muted, marginTop: 5, fontFamily: FONT_M }}>NIVEL DE VOZ</div>
          </div>
        )}

        <div style={{ padding: "0 18px", flex: 1 }}>
          <Eyebrow>Marcar lo que ocurre</Eyebrow>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9 }}>
            {MARK_TYPES.map((m) => {
              const c = conteo(m.k);
              return (
                <button key={m.k} onClick={() => marcar(m.k)} style={{
                  background: c ? `${m.color}18` : T.surface, border: `1px solid ${c ? m.color + "77" : T.line}`,
                  borderRadius: 12, padding: "14px 6px", color: T.bone, cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 5, position: "relative", minHeight: 82,
                }}>
                  <m.Icon size={21} color={m.color} />
                  <span style={{ fontSize: 11.5, textAlign: "center", lineHeight: 1.2 }}>{m.n}</span>
                  {c > 0 && <span style={{ position: "absolute", top: 6, right: 8, fontFamily: FONT_M, fontSize: 13, color: m.color, fontWeight: 600 }}>{c}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding: 18, display: "flex", gap: 9, position: "sticky", bottom: 0, background: `${T.ink}F0`, borderTop: `1px solid ${T.line}` }}>
          <Btn variant="ghost" Icon={Undo2} onClick={deshacer} disabled={!marks.length} style={{ flex: 1 }}>Deshacer</Btn>
          <Btn variant="quiet" Icon={run ? Pause : Play} onClick={() => setRun(!run)} style={{ flex: 1 }}>{run ? "Pausa" : "Seguir"}</Btn>
          <Btn Icon={Square} onClick={terminar} style={{ flex: 1.3, background: T.red, color: T.bone }}>Terminar</Btn>
        </div>
      </div>
    );
  }

  /* ---------- Fase 3: evaluación ---------- */
  return (
    <div>
      <Head title="Evaluar" sub={`${a.nombre} · ${fmt(el)}`} onBack={() => setFase("live")} />
      <div style={{ padding: "0 18px 30px" }}>
        <Card style={{ marginBottom: 14 }}>
          <Ribbon elapsed={el} target={objetivo} marks={marks} height={44} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 12 }}>
            {MARK_TYPES.filter((m) => conteo(m.k) > 0).map((m) => (
              <span key={m.k} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: `${m.color}18`, border: `1px solid ${m.color}55`, color: m.color, padding: "4px 9px", borderRadius: 14, fontSize: 11.5, fontFamily: FONT_M }}>
                <m.Icon size={12} />{m.n} · {conteo(m.k)}
              </span>
            ))}
          </div>
        </Card>

        <Eyebrow>Rúbrica · {TRACKS[a.track].n}</Eyebrow>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 12, lineHeight: 1.5 }}>
          Precargada a partir de tus marcas. Ajusta cada renglón con un toque.
        </div>
        {rub.map((r) => (
          <div key={r.k} style={{ marginBottom: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{r.n}</div>
                <div style={{ fontSize: 11, color: T.muted }}>{r.d}</div>
              </div>
              <div style={{ fontFamily: FONT_M, fontSize: 15, color: T.brass }}>{rubrica[r.k] || "—"}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3, 4, 5].map((v) => {
                const act = rubrica[r.k] === v;
                const c = v <= 2 ? T.red : v === 3 ? T.amber : T.jade;
                return (
                  <button key={v} onClick={() => setRubrica((p) => ({ ...p, [r.k]: v }))} style={{
                    flex: 1, padding: "11px 0", borderRadius: 9, cursor: "pointer", fontFamily: FONT_M, fontSize: 14,
                    background: act ? c : "transparent", color: act ? T.ink : T.muted,
                    border: `1px solid ${act ? c : T.line}`, fontWeight: 600,
                  }}>{v}</button>
                );
              })}
            </div>
          </div>
        ))}

        <div style={{ marginTop: 16 }}>
          <Field label="Notas para la devolución" value={notas} onChange={setNotas} rows={4}
            placeholder="Lo que sí funcionó, lo que hay que corregir y la tarea concreta para la próxima clase…" />
        </div>
        <Btn full size="lg" Icon={Save} onClick={guardar}>Guardar práctica</Btn>
      </div>
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: FONT_M, fontSize: 24, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: T.muted, fontFamily: FONT_M, letterSpacing: .8, marginTop: 3 }}>{label}</div>
    </div>
  );
}

/* ------------------------------- DEVOLUCIÓN -------------------------------- */
function Devolucion({ sesion: s, alumnos, sesionesDe, back, go }) {
  if (!s) return <div style={{ padding: 20 }}>Práctica no encontrada.</div>;
  const a = alumnos.find((x) => x.id === s.alumnoId);
  const rub = RUBRICAS[s.track];
  const ss = sesionesDe(s.alumnoId);
  const idx = ss.findIndex((x) => x.id === s.id);
  const prev = idx > 0 ? ss[idx - 1] : null;
  const p = prom(s.rubrica), pPrev = prev ? prom(prev.rubrica) : null;

  const orden = rub.map((r) => ({ ...r, v: s.rubrica[r.k] || 0 })).sort((x, y) => y.v - x.v);
  const fuertes = orden.slice(0, 2), debiles = [...orden].reverse().slice(0, 2);

  return (
    <div>
      <Head title="Devolución" sub={`${a?.nombre} · ${new Date(s.ts).toLocaleDateString("es-MX", { day: "2-digit", month: "long" })}`} onBack={back} />
      <div style={{ padding: "0 18px 30px" }}>
        <Card style={{ marginBottom: 13, textAlign: "center", background: `linear-gradient(135deg,${T.raised},${T.surface})` }}>
          <Eyebrow color={T.brass}>Calificación de la práctica</Eyebrow>
          <div style={{ fontFamily: FONT_D, fontSize: 62, color: p >= 4 ? T.jade : p >= 3 ? T.brass : T.red, lineHeight: 1 }}>{p.toFixed(1)}</div>
          {pPrev !== null && (
            <div style={{ fontSize: 12.5, color: p >= pPrev ? T.jade : T.red, marginTop: 5, fontFamily: FONT_M }}>
              {p >= pPrev ? "▲" : "▼"} {Math.abs(p - pPrev).toFixed(1)} respecto a la práctica anterior
            </div>
          )}
          <div style={{ fontSize: 12, color: T.muted, marginTop: 6, fontFamily: FONT_M }}>
            {s.tipo} · {fmt(s.duracion)} de {fmt(s.objetivo)}
          </div>
        </Card>

        <Card style={{ marginBottom: 13 }}>
          <Eyebrow>Línea de tiempo del discurso</Eyebrow>
          <Ribbon elapsed={s.duracion} target={s.objetivo} marks={s.marks} height={48} />
          <div style={{ marginTop: 12, maxHeight: 190, overflowY: "auto" }}>
            {s.marks.length === 0 && <div style={{ fontSize: 12.5, color: T.muted }}>No se marcó ninguna incidencia.</div>}
            {s.marks.map((m) => {
              const mt = MARK_TYPES.find((x) => x.k === m.k);
              return (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: `1px solid ${T.line}55` }}>
                  <span style={{ fontFamily: FONT_M, fontSize: 12, color: T.muted, width: 44 }}>{fmt(m.t)}</span>
                  <mt.Icon size={14} color={mt.color} />
                  <span style={{ fontSize: 13 }}>{mt.n}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {s.audio && (
          <Card style={{ marginBottom: 13 }}>
            <Eyebrow>Medición de voz</Eyebrow>
            <div style={{ display: "flex", justifyContent: "space-around", marginTop: 8 }}>
              <Metric label="pal./min" value={s.audio.wpm || "—"} color={T.brass} />
              <Metric label="palabras" value={s.audio.palabras || "—"} color={T.sky} />
              <Metric label="silencios" value={s.audio.silencios} color={T.violet} />
              <Metric label="muletillas" value={s.audio.autoMuletillas} color={T.red} />
            </div>
            <div style={{ fontSize: 11.5, color: T.muted, marginTop: 10, lineHeight: 1.5 }}>
              Referencia: 120–150 palabras por minuto en discurso formal; por debajo de 100 suena lento, por encima de 170 el público pierde el hilo.
            </div>
          </Card>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 13 }}>
          <Card style={{ borderColor: `${T.jade}55` }}>
            <Eyebrow color={T.jade}>Lo que funcionó</Eyebrow>
            {fuertes.map((f) => <div key={f.k} style={{ fontSize: 13, marginBottom: 6, lineHeight: 1.35 }}>{f.n} <span style={{ fontFamily: FONT_M, color: T.jade }}>{f.v}</span></div>)}
          </Card>
          <Card style={{ borderColor: `${T.red}55` }}>
            <Eyebrow color={T.red}>A corregir</Eyebrow>
            {debiles.map((f) => <div key={f.k} style={{ fontSize: 13, marginBottom: 6, lineHeight: 1.35 }}>{f.n} <span style={{ fontFamily: FONT_M, color: T.red }}>{f.v}</span></div>)}
          </Card>
        </div>

        <Card style={{ marginBottom: 13 }}>
          <Eyebrow color={T.brass}>Tarea sugerida para la próxima clase</Eyebrow>
          {debiles.map((d) => (
            <div key={d.k} style={{ padding: "9px 0", borderBottom: `1px solid ${T.line}55` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{d.n}</div>
              {(EJERCICIOS[d.k] || []).slice(0, 2).map((e, i) => (
                <div key={i} style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.5, paddingLeft: 12, position: "relative" }}>
                  <span style={{ position: "absolute", left: 0, color: T.brass }}>·</span>{e}
                </div>
              ))}
            </div>
          ))}
        </Card>

        {s.notas && (
          <Card style={{ marginBottom: 13 }}>
            <Eyebrow>Notas del profesor</Eyebrow>
            <div style={{ fontSize: 13.5, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{s.notas}</div>
          </Card>
        )}

        <Card>
          <Eyebrow>Rúbrica completa</Eyebrow>
          {rub.map((r) => {
            const v = s.rubrica[r.k] || 0;
            return (
              <div key={r.k} style={{ marginBottom: 9 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span>{r.n}</span><span style={{ fontFamily: FONT_M, color: T.bone }}>{v}/5</span>
                </div>
                <div style={{ height: 5, background: T.ink, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(v / 5) * 100}%`, background: v >= 4 ? T.jade : v === 3 ? T.amber : T.red }} />
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------- BIBLIOTECA -------------------------------- */
function Biblioteca({ biblioteca, setBiblioteca, flash }) {
  const [nuevo, setNuevo] = useState(false);
  const [ver, setVer] = useState(null);
  const [f, setF] = useState("todos");
  const [t, setT] = useState(""), [tk, setTk] = useState("infantil"), [tema, setTema] = useState(""), [tags, setTags] = useState(""), [nota, setNota] = useState("");

  const lista = biblioteca.filter((b) => f === "todos" || b.track === f);
  const add = () => {
    if (!t.trim()) return flash("Ponle título al material");
    setBiblioteca((p) => [...p, { id: uid(), titulo: t.trim(), track: tk, tema, tags, nota, marcas: [] }]);
    setT(""); setTags(""); setNota(""); setNuevo(false); flash("Material registrado");
  };

  if (ver) return <VisorPDF item={ver} setBiblioteca={setBiblioteca} back={() => setVer(null)} flash={flash} />;

  return (
    <div>
      <Head title="Material" sub="PDF, guías y referencias"
        right={<Btn size="sm" Icon={Plus} onClick={() => setNuevo(!nuevo)}>Añadir</Btn>} />
      <div style={{ padding: "0 18px 18px" }}>
        {nuevo && (
          <Card style={{ marginBottom: 14 }}>
            <Field label="Título del material" value={t} onChange={setT} placeholder="Ej. Manual de oratoria castrense" />
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>Programa</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {Object.entries(TRACKS).map(([k, v]) => (
                <button key={k} onClick={() => { setTk(k); setTema(""); }} style={{
                  flex: 1, padding: "9px 6px", borderRadius: 9, fontSize: 13, cursor: "pointer", fontWeight: 600,
                  background: tk === k ? `${v.color}22` : "transparent", color: tk === k ? v.color : T.muted,
                  border: `1px solid ${tk === k ? v.color : T.line}`,
                }}>{v.n}</button>
              ))}
            </div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>Tema del programa (opcional)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {TEMARIO[tk].map((x) => (
                <button key={x.k} onClick={() => setTema(tema === x.k ? "" : x.k)} style={{
                  padding: "6px 10px", borderRadius: 14, fontSize: 11.5, cursor: "pointer",
                  background: tema === x.k ? T.brass : "transparent", color: tema === x.k ? T.ink : T.muted,
                  border: `1px solid ${tema === x.k ? T.brass : T.line}`,
                }}>{x.n}</button>
              ))}
            </div>
            <Field label="Etiquetas" value={tags} onChange={setTags} placeholder="postura, protocolo, concurso" />
            <Field label="Para qué lo usas" value={nota} onChange={setNota} rows={2} placeholder="Ej. Capítulos 3 y 4 para alumnos de nivel inicial" />
            <Btn full Icon={Check} onClick={add}>Registrar material</Btn>
          </Card>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[["todos", "Todos"], ["infantil", "Oratoria clásica"], ["politico", "Política"]].map(([k, n]) => (
            <button key={k} onClick={() => setF(k)} style={{
              padding: "7px 13px", borderRadius: 20, fontSize: 12.5, cursor: "pointer", fontWeight: 600,
              background: f === k ? T.brass : "transparent", color: f === k ? T.ink : T.muted,
              border: `1px solid ${f === k ? T.brass : T.line}`,
            }}>{n}</button>
          ))}
        </div>

        {lista.length === 0
          ? <Empty Icon={BookOpen} title="Sin material aquí" hint="Registra tus PDF para tenerlos ordenados por tema y abrirlos durante la clase." action={<Btn Icon={Plus} onClick={() => setNuevo(true)}>Añadir material</Btn>} />
          : lista.map((b) => {
            const tm = TEMARIO[b.track].find((x) => x.k === b.tema);
            return (
              <Card key={b.id} onClick={() => setVer(b)} style={{ marginBottom: 9, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ background: `${TRACKS[b.track].color}18`, border: `1px solid ${TRACKS[b.track].color}55`, borderRadius: 9, padding: 9 }}>
                  <FileText size={19} color={TRACKS[b.track].color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5 }}>{b.titulo}</div>
                  {tm && <div style={{ fontSize: 11.5, color: T.brass, marginTop: 2 }}>{tm.n}</div>}
                  {b.nota && <div style={{ fontSize: 12, color: T.muted, marginTop: 3, lineHeight: 1.4 }}>{b.nota}</div>}
                  {b.marcas?.length > 0 && <div style={{ fontSize: 11, color: T.muted, marginTop: 4, fontFamily: FONT_M }}><Bookmark size={10} style={{ verticalAlign: -1 }} /> {b.marcas.length} marcadores</div>}
                </div>
                <ChevronRight size={16} color={T.muted} style={{ marginTop: 4 }} />
              </Card>
            );
          })}
      </div>
    </div>
  );
}

function VisorPDF({ item, setBiblioteca, back, flash }) {
  const [url, setUrl] = useState(null);
  const [pag, setPag] = useState("");
  const [nota, setNota] = useState("");
  const inputRef = useRef(null);

  const abrir = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUrl(URL.createObjectURL(f));
  };
  const addMarca = () => {
    if (!nota.trim()) return flash("Escribe la nota del marcador");
    setBiblioteca((p) => p.map((b) => b.id === item.id
      ? { ...b, marcas: [...(b.marcas || []), { id: uid(), pag: pag || "—", nota: nota.trim() }] } : b));
    setNota(""); setPag(""); flash("Marcador guardado");
  };
  const delMarca = (mid) => setBiblioteca((p) => p.map((b) => b.id === item.id ? { ...b, marcas: b.marcas.filter((m) => m.id !== mid) } : b));

  return (
    <div>
      <Head title={item.titulo} sub="Material" onBack={back} />
      <div style={{ padding: "0 18px 30px" }}>
        {!url ? (
          <Card style={{ marginBottom: 14, textAlign: "center", padding: 26 }}>
            <Upload size={30} color={T.muted} style={{ marginBottom: 10 }} />
            <H size={18} style={{ marginBottom: 5 }}>Abrir el PDF de este material</H>
            <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 14, lineHeight: 1.5 }}>
              Selecciona el archivo desde el dispositivo. Los marcadores que crees quedan guardados aunque cierres el archivo.
            </div>
            <input ref={inputRef} type="file" accept="application/pdf" onChange={abrir} style={{ display: "none" }} />
            <Btn Icon={FileText} onClick={() => inputRef.current?.click()}>Elegir PDF</Btn>
          </Card>
        ) : (
          <div style={{ marginBottom: 14, borderRadius: 12, overflow: "hidden", border: `1px solid ${T.line}` }}>
            <iframe src={url} title={item.titulo} style={{ width: "100%", height: 460, border: "none", background: "#fff" }} />
          </div>
        )}

        <Card style={{ marginBottom: 12 }}>
          <Eyebrow>Nuevo marcador</Eyebrow>
          <div style={{ display: "flex", gap: 8, marginBottom: 9 }}>
            <input value={pag} onChange={(e) => setPag(e.target.value)} placeholder="Pág."
              style={{ width: 74, background: T.ink, border: `1px solid ${T.line}`, borderRadius: 9, padding: "10px 11px", color: T.bone, fontFamily: FONT_M, fontSize: 13.5, outline: "none" }} />
            <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Para qué sirve este fragmento"
              onKeyDown={(e) => e.key === "Enter" && addMarca()}
              style={{ flex: 1, background: T.ink, border: `1px solid ${T.line}`, borderRadius: 9, padding: "10px 11px", color: T.bone, fontFamily: FONT_B, fontSize: 13.5, outline: "none" }} />
          </div>
          <Btn full size="sm" Icon={Bookmark} onClick={addMarca}>Guardar marcador</Btn>
        </Card>

        {(item.marcas || []).length > 0 && (
          <Card>
            <Eyebrow>Marcadores</Eyebrow>
            {item.marcas.map((m) => (
              <div key={m.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 0", borderBottom: `1px solid ${T.line}55` }}>
                <span style={{ fontFamily: FONT_M, fontSize: 12, color: T.brass, minWidth: 34 }}>p.{m.pag}</span>
                <span style={{ flex: 1, fontSize: 13.5, lineHeight: 1.45 }}>{m.nota}</span>
                <button onClick={() => delMarca(m.id)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}><X size={15} /></button>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}

/* -------------------------------- PROGRESO --------------------------------- */
function Progreso({ alumnos, sesionesDe, temario }) {
  const [sel, setSel] = useState(alumnos[0]?.id || null);
  const a = alumnos.find((x) => x.id === sel);
  const ss = a ? sesionesDe(a.id) : [];
  const rub = a ? RUBRICAS[a.track] : [];

  const serie = ss.map((s, i) => ({
    n: `${i + 1}`,
    calif: +prom(s.rubrica).toFixed(2),
    muletillas: s.marks.filter((m) => m.k === "muletilla").length,
    minutos: +(s.duracion / 60).toFixed(1),
  }));
  const first = ss[0], last = ss[ss.length - 1];
  const comp = rub.map((r) => ({
    m: r.n.split(" ")[0],
    inicio: first?.rubrica?.[r.k] || 0,
    ahora: last?.rubrica?.[r.k] || 0,
  }));

  return (
    <div>
      <Head title="Progreso" sub="Evolución medible" />
      <div style={{ padding: "0 18px 18px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 2 }}>
          {alumnos.map((x) => (
            <button key={x.id} onClick={() => setSel(x.id)} style={{
              padding: "7px 13px", borderRadius: 20, fontSize: 12.5, whiteSpace: "nowrap", cursor: "pointer", fontWeight: 600,
              background: sel === x.id ? T.brass : "transparent", color: sel === x.id ? T.ink : T.muted,
              border: `1px solid ${sel === x.id ? T.brass : T.line}`,
            }}>{x.nombre.split(" ")[0]}</button>
          ))}
        </div>

        {!a ? <Empty Icon={Users} title="Elige un alumno" hint="Selecciona a alguien para ver su curva de avance." />
          : ss.length < 1 ? <Empty Icon={TrendingUp} title="Aún no hay datos" hint="Las gráficas aparecen desde la primera práctica evaluada." />
            : (
              <>
                <Card style={{ marginBottom: 12 }}>
                  <Eyebrow>Calificación por práctica</Eyebrow>
                  <ResponsiveContainer width="100%" height={190}>
                    <LineChart data={serie} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                      <CartesianGrid stroke={T.line} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="n" tick={{ fill: T.muted, fontSize: 11 }} axisLine={{ stroke: T.line }} tickLine={false} />
                      <YAxis domain={[0, 5]} tick={{ fill: T.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: T.raised, border: `1px solid ${T.line}`, borderRadius: 9, color: T.bone, fontSize: 12 }} />
                      <Line type="monotone" dataKey="calif" stroke={T.brass} strokeWidth={2.5} dot={{ r: 3, fill: T.brass }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                {ss.length > 1 && (
                  <Card style={{ marginBottom: 12 }}>
                    <Eyebrow>Primera práctica vs. última</Eyebrow>
                    <ResponsiveContainer width="100%" height={250}>
                      <RadarChart data={comp}>
                        <PolarGrid stroke={T.line} />
                        <PolarAngleAxis dataKey="m" tick={{ fill: T.muted, fontSize: 10 }} />
                        <Radar name="Inicio" dataKey="inicio" stroke={T.muted} fill={T.muted} fillOpacity={0.12} />
                        <Radar name="Ahora" dataKey="ahora" stroke={T.jade} fill={T.jade} fillOpacity={0.3} />
                        <Tooltip contentStyle={{ background: T.raised, border: `1px solid ${T.line}`, borderRadius: 9, color: T.bone, fontSize: 12 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", gap: 16, justifyContent: "center", fontSize: 11.5, color: T.muted, fontFamily: FONT_M }}>
                      <span><span style={{ color: T.muted }}>■</span> inicio</span>
                      <span><span style={{ color: T.jade }}>■</span> ahora</span>
                    </div>
                  </Card>
                )}

                <Card style={{ marginBottom: 12 }}>
                  <Eyebrow>Muletillas marcadas por práctica</Eyebrow>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={serie} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                      <CartesianGrid stroke={T.line} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="n" tick={{ fill: T.muted, fontSize: 11 }} axisLine={{ stroke: T.line }} tickLine={false} />
                      <YAxis tick={{ fill: T.muted, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: T.raised, border: `1px solid ${T.line}`, borderRadius: 9, color: T.bone, fontSize: 12 }} />
                      <Bar dataKey="muletillas" fill={T.red} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <Card>
                  <Eyebrow>Cobertura del temario</Eyebrow>
                  {TEMARIO[a.track].map((t) => {
                    const e = (temario[a.id] || {})[t.k] || 0;
                    return (
                      <div key={t.k} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
                        <div style={{ flex: 1, fontSize: 13 }}>{t.n}</div>
                        <div style={{ display: "flex", gap: 3 }}>
                          {[1, 2, 3].map((i) => (
                            <div key={i} style={{ width: 20, height: 5, borderRadius: 3, background: e >= i ? (e === 3 ? T.jade : e === 2 ? T.amber : T.sky) : T.line }} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </Card>
              </>
            )}
      </div>
    </div>
  );
}

/* --------------------------------- AJUSTES --------------------------------- */
function Ajustes({ setAlumnos, setSesiones, setPlanes, setTemario, setBiblioteca, flash, alumnos, sesiones }) {
  const [conf, setConf] = useState(false);
  const exportar = () => {
    const data = { alumnos, sesiones, exportado: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const u = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = u; link.download = `agora-respaldo-${hoy()}.json`; link.click();
    URL.revokeObjectURL(u); flash("Respaldo descargado");
  };
  const borrar = async () => {
    setAlumnos([]); setSesiones([]); setPlanes({}); setTemario({}); setBiblioteca([]);
    await writeKey(K_CORE, { alumnos: [], planes: {}, temario: {}, biblioteca: [] });
    await writeKey(K_SES, { sesiones: [] });
    setConf(false); flash("Datos borrados");
  };
  return (
    <div>
      <Head title="Ajustes" sub="Datos y respaldo" />
      <div style={{ padding: "0 18px 18px" }}>
        <Card style={{ marginBottom: 12 }}>
          <Eyebrow>Dónde viven tus datos</Eyebrow>
          <div style={{ fontSize: 13.5, color: T.muted, lineHeight: 1.6 }}>
            Todo se guarda en este dispositivo. No hay servidor, no hay cuenta y no se envía nada a internet.
            Los datos de menores no salen de aquí.
          </div>
        </Card>
        <Card style={{ marginBottom: 12 }}>
          <Eyebrow>Respaldo</Eyebrow>
          <div style={{ fontSize: 13, color: T.muted, marginBottom: 12, lineHeight: 1.55 }}>
            Descarga un archivo con alumnos y prácticas para guardarlo o pasarlo a otro dispositivo.
          </div>
          <Btn variant="ghost" full Icon={Save} onClick={exportar}>Descargar respaldo</Btn>
        </Card>
        <Card>
          <Eyebrow color={T.red}>Zona de riesgo</Eyebrow>
          <div style={{ fontSize: 13, color: T.muted, marginBottom: 12, lineHeight: 1.55 }}>
            Borrar elimina alumnos, prácticas, planes y material de este dispositivo. No se puede deshacer.
          </div>
          {!conf
            ? <Btn variant="danger" full Icon={Trash2} onClick={() => setConf(true)}>Borrar todos los datos</Btn>
            : (
              <div style={{ display: "flex", gap: 9 }}>
                <Btn variant="ghost" style={{ flex: 1 }} onClick={() => setConf(false)}>Cancelar</Btn>
                <Btn style={{ flex: 1, background: T.red, color: T.bone }} onClick={borrar}>Sí, borrar todo</Btn>
              </div>
            )}
        </Card>
        <div style={{ textAlign: "center", marginTop: 22, fontFamily: FONT_M, fontSize: 11, color: T.muted, letterSpacing: 1 }}>
          ÁGORA · v1.0
        </div>
      </div>
    </div>
  );
}
