import { useState, useRef, useCallback, useEffect } from "react";
import { media, mediana, desviacion } from "./format.js";

/* ---------------------------------------------------------------------------
   Laboratorio de voz.

   Todo corre en el dispositivo, sin servidores ni costo: el análisis acústico
   usa la Web Audio API y la transcripción usa el reconocedor que el propio
   sistema ya trae. Si la transcripción no está disponible, el resto sigue
   midiendo igual.
   ------------------------------------------------------------------------- */

/* Muletillas de alta señal. Se evitan conectores legítimos ("porque", "entonces")
   que en un discurso bien construido no son un defecto. */
export const MULETILLAS = [
  "este", "esteee", "eh", "ehh", "ehhh", "em", "mmm", "mm",
  "o sea", "osea", "digamos", "verdad", "no", "como que", "este que",
  "entonces este", "pues", "bueno", "ajá", "okey", "tipo", "y este",
];

/* Palabras vacías: no cuentan para medir riqueza de vocabulario. */
const VACIAS = new Set(
  ("de la que el en y a los se del las un por con no una su para es al lo como más " +
   "pero sus le ya o este sí porque esta entre cuando muy sin sobre también me hasta " +
   "hay donde quien desde todo nos durante todos uno les ni contra otros ese eso ante " +
   "ellos e esto mí antes algunos qué unos yo otro otras otra él tanto esa estos mucho " +
   "quienes nada muchos cual poco ella estar estas algunas algo nosotros mi mis tú te ti " +
   "tu tus ellas nosotras vosotros vosotras os mío mía").split(" ")
);

/* --------------------------- Detección de tono ---------------------------- */
/* Autocorrelación acotada al rango de la voz humana (70–400 Hz). Se acota el
   barrido de desfases para que corra fluido en un teléfono de gama media. */
export function detectarTono(buf, sampleRate) {
  const n = buf.length;
  let energia = 0;
  for (let i = 0; i < n; i++) energia += buf[i] * buf[i];
  const rms = Math.sqrt(energia / n);
  if (rms < 0.012) return { hz: 0, conf: 0 };

  const lagMin = Math.max(2, Math.floor(sampleRate / 400));
  const lagMax = Math.min(Math.floor(sampleRate / 70), n - 2);
  if (lagMax <= lagMin) return { hz: 0, conf: 0 };

  let mejorLag = -1, mejorVal = -Infinity;
  const acf = new Float32Array(lagMax + 2);
  for (let lag = lagMin; lag <= lagMax; lag++) {
    let s = 0;
    const lim = n - lag;
    for (let i = 0; i < lim; i++) s += buf[i] * buf[i + lag];
    const v = s / lim;
    acf[lag] = v;
    if (v > mejorVal) { mejorVal = v; mejorLag = lag; }
  }

  const conf = mejorVal / (energia / n || 1);
  // Por debajo de 0.4 la señal no es periódica: consonante sorda o ruido.
  if (mejorLag < 0 || conf < 0.4) return { hz: 0, conf: 0 };

  // Interpolación parabólica: afina el desfase entre muestras enteras.
  const y0 = acf[mejorLag - 1] || mejorVal, y1 = mejorVal, y2 = acf[mejorLag + 1] || mejorVal;
  const denom = 2 * (2 * y1 - y0 - y2);
  const ajuste = denom ? (y2 - y0) / denom : 0;
  const hz = sampleRate / (mejorLag + Math.max(-1, Math.min(1, ajuste)));
  return hz >= 60 && hz <= 500 ? { hz, conf } : { hz: 0, conf: 0 };
}

/* ------------------------ Conteo de muletillas ---------------------------- */
/* La v1 usaba un patrón que consumía el separador final, así que "este este"
   contaba una sola vez y las muletillas seguidas se perdían. Con lookahead se
   permiten coincidencias contiguas. */
export function contarMuletillas(texto) {
  const t = " " + (texto || "").toLowerCase().replace(/[.,;:!¡?¿\n]/g, " ").replace(/\s+/g, " ") + " ";
  const detalle = {};
  let total = 0;
  for (const m of MULETILLAS) {
    const esc = m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\s${esc}(?=\\s)`, "g");
    const c = (t.match(re) || []).length;
    if (c > 0) { detalle[m] = c; total += c; }
  }
  return { total, detalle };
}

export function contarPalabras(texto) {
  return (texto || "").trim().split(/\s+/).filter(Boolean).length;
}

/* Riqueza léxica: proporción de palabras distintas con contenido semántico. */
export function riquezaLexica(texto) {
  const pal = (texto || "").toLowerCase().replace(/[^\wáéíóúüñ\s]/gi, " ")
    .split(/\s+/).filter((w) => w.length > 2 && !VACIAS.has(w));
  if (pal.length < 12) return { ratio: 0, unicas: 0, total: pal.length, repetidas: [] };
  const conteo = {};
  pal.forEach((w) => { conteo[w] = (conteo[w] || 0) + 1; });
  const unicas = Object.keys(conteo).length;
  const repetidas = Object.entries(conteo).filter(([, c]) => c >= 3)
    .sort((a, b) => b[1] - a[1]).slice(0, 8).map(([w, c]) => ({ w, c }));
  return { ratio: unicas / pal.length, unicas, total: pal.length, repetidas };
}

/* --------------------------------- Hook ----------------------------------- */
export function useAudioLab() {
  const [activo, setActivo] = useState(false);
  const [error, setError] = useState(null);
  const [nivel, setNivel] = useState(0);
  const [tono, setTono] = useState(0);
  const [transcribe, setTranscribe] = useState(false);
  const [grabando, setGrabando] = useState(false);
  const [texto, setTexto] = useState("");
  const [vivo, setVivo] = useState({ wpm: 0, palabras: 0, muletillas: 0, pausas: 0, alargamientos: 0 });

  const ctxRef = useRef(null), streamRef = useRef(null), rafRef = useRef(null);
  const anRef = useRef(null), recRef = useRef(null), mrRef = useRef(null);
  const bufRef = useRef(null), freqRef = useRef(null);
  const chunksRef = useRef([]);
  const quiereVozRef = useRef(false);
  const bucleRef = useRef(null);
  const arrancarVozRef = useRef(null);

  const t0Ref = useRef(0);
  const finalRef = useRef("");
  const interimRef = useRef("");
  const serieRef = useRef([]);          // {t, nivel, tono, centroide}
  const pausasRef = useRef([]);          // {t, dur}
  const alargRef = useRef([]);           // {t, dur, hz}
  const wpmSerieRef = useRef([]);        // {t, palabras}
  const ultMuestraRef = useRef(0);
  const ultTonoRef = useRef(0);
  const silencioDesdeRef = useRef(null);
  const vozDesdeRef = useRef(null);
  const tonoEstableDesdeRef = useRef(null);
  const tonoRefEstable = useRef(0);
  const pausaRef = useRef(false);
  const offsetRef = useRef(0);           // tiempo acumulado antes de una pausa

  const ahora = () => offsetRef.current + (Date.now() - t0Ref.current) / 1000;

  /* El muestreo va por temporizador y no por requestAnimationFrame: si el
     profesor cambia de aplicación a mitad de la clase, rAF se detiene por
     completo y el análisis quedaría con un hueco mientras el cronómetro sigue
     corriendo. Con un intervalo el muestreo continúa. */
  const MUESTREO_MS = 40;

  /* -------------------------------- Detener ------------------------------- */
  const detener = useCallback(() => {
    quiereVozRef.current = false;
    clearInterval(rafRef.current);
    try { recRef.current?.stop(); } catch {}
    recRef.current = null;
    try { if (mrRef.current?.state === "recording") mrRef.current.stop(); } catch {}
    try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
    try { ctxRef.current?.close(); } catch {}
    streamRef.current = null; ctxRef.current = null; anRef.current = null;
    setActivo(false); setNivel(0); setTono(0); setGrabando(false);
  }, []);

  /* -------------------------------- Iniciar ------------------------------- */
  const iniciar = useCallback(async ({ grabar = true, transcribir = true } = {}) => {
    setError(null);
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false, channelCount: 1 },
      });
    } catch (e) {
      setError(
        e?.name === "NotAllowedError"
          ? "Permiso de micrófono denegado. La clase funciona igual con marcado manual."
          : "No se encontró micrófono. La clase funciona igual con marcado manual."
      );
      return false;
    }

    streamRef.current = stream;
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    ctxRef.current = ctx;
    // Algunos navegadores abren el contexto suspendido hasta que hay un gesto.
    if (ctx.state === "suspended") { try { await ctx.resume(); } catch {} }

    const src = ctx.createMediaStreamSource(stream);
    const an = ctx.createAnalyser();
    an.fftSize = 2048;
    an.smoothingTimeConstant = 0.6;
    src.connect(an);
    anRef.current = an;
    bufRef.current = new Float32Array(an.fftSize);
    freqRef.current = new Uint8Array(an.frequencyBinCount);

    t0Ref.current = Date.now();
    offsetRef.current = 0;
    finalRef.current = ""; interimRef.current = "";
    serieRef.current = []; pausasRef.current = []; alargRef.current = []; wpmSerieRef.current = [];
    silencioDesdeRef.current = null; vozDesdeRef.current = null; tonoEstableDesdeRef.current = null;
    ultMuestraRef.current = 0; ultTonoRef.current = 0; pausaRef.current = false;
    setTexto("");
    setVivo({ wpm: 0, palabras: 0, muletillas: 0, pausas: 0, alargamientos: 0 });

    /* ---------------------------- Grabación ------------------------------ */
    if (grabar && typeof window.MediaRecorder !== "undefined") {
      const tipos = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
      const mime = tipos.find((t) => { try { return MediaRecorder.isTypeSupported(t); } catch { return false; } });
      try {
        const mr = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 64000 } : undefined);
        chunksRef.current = [];
        mr.ondataavailable = (e) => { if (e.data?.size) chunksRef.current.push(e.data); };
        mr.start(1000);
        mrRef.current = mr;
        setGrabando(true);
      } catch { mrRef.current = null; }
    }

    /* -------------------------- Bucle de análisis ------------------------- */
    const bucle = () => {
      const an = anRef.current;
      if (!an) return;
      const buf = bufRef.current;
      an.getFloatTimeDomainData(buf);

      let suma = 0;
      for (let i = 0; i < buf.length; i++) suma += buf[i] * buf[i];
      const rms = Math.sqrt(suma / buf.length);
      const lv = Math.min(1, rms * 7);
      setNivel(lv);

      const t = ahora();
      const hayVoz = lv >= 0.045;

      /* Pausas: silencio sostenido por encima de 0.55 s cuenta como pausa. */
      if (!hayVoz) {
        if (silencioDesdeRef.current == null) silencioDesdeRef.current = t;
        vozDesdeRef.current = null;
        tonoEstableDesdeRef.current = null;
      } else {
        if (silencioDesdeRef.current != null) {
          const dur = t - silencioDesdeRef.current;
          if (dur >= 0.55) {
            pausasRef.current.push({ t: silencioDesdeRef.current, dur });
            setVivo((v) => ({ ...v, pausas: pausasRef.current.length }));
          }
          silencioDesdeRef.current = null;
        }
        if (vozDesdeRef.current == null) vozDesdeRef.current = t;
      }

      /* Tono y timbre: más caros, se calculan ~8 veces por segundo. */
      if (t - ultTonoRef.current >= 0.12) {
        ultTonoRef.current = t;
        const { hz } = hayVoz ? detectarTono(buf, ctxRef.current?.sampleRate || 44100) : { hz: 0 };
        setTono(hz);

        /* Alargamiento fónico: tono sostenido y estable más de 0.65 s.
           Una vocal normal no pasa de ~0.3 s; estirarla es la marca del relleno. */
        if (hz > 0) {
          if (tonoEstableDesdeRef.current == null || Math.abs(12 * Math.log2(hz / (tonoRefEstable.current || hz))) > 1.2) {
            tonoEstableDesdeRef.current = t;
            tonoRefEstable.current = hz;
          } else {
            const dur = t - tonoEstableDesdeRef.current;
            const ya = alargRef.current[alargRef.current.length - 1];
            if (dur >= 0.65 && (!ya || tonoEstableDesdeRef.current > ya.t)) {
              alargRef.current.push({ t: tonoEstableDesdeRef.current, dur, hz });
              setVivo((v) => ({ ...v, alargamientos: alargRef.current.length }));
            } else if (ya && tonoEstableDesdeRef.current === ya.t) {
              ya.dur = dur;
            }
          }
        } else {
          tonoEstableDesdeRef.current = null;
        }

        /* Centroide espectral: aproxima el brillo del timbre, útil para leer
           si la voz sale colocada en máscara o apagada en la garganta. */
        an.getByteFrequencyData(freqRef.current);
        const f = freqRef.current;
        const sr = ctxRef.current?.sampleRate || 44100;
        let num = 0, den = 0;
        for (let i = 0; i < f.length; i++) { const fr = (i * sr) / (2 * f.length); num += fr * f[i]; den += f[i]; }
        const centroide = den ? num / den : 0;

        if (t - ultMuestraRef.current >= 0.2) {
          ultMuestraRef.current = t;
          serieRef.current.push({ t: +t.toFixed(2), n: +lv.toFixed(3), h: Math.round(hz), c: Math.round(centroide) });
        }
      }

    };
    bucleRef.current = bucle;
    clearInterval(rafRef.current);
    rafRef.current = setInterval(bucle, MUESTREO_MS);

    /* ------------------------- Transcripción -------------------------- */
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (transcribir && SR) {
      quiereVozRef.current = true;
      const arrancar = () => {
        if (!quiereVozRef.current) return;
        try {
          const rec = new SR();
          rec.lang = "es-MX";
          rec.continuous = true;
          rec.interimResults = true;
          rec.maxAlternatives = 1;
          rec.onresult = (e) => {
            let interim = "";
            for (let i = e.resultIndex; i < e.results.length; i++) {
              const txt = e.results[i][0].transcript;
              if (e.results[i].isFinal) finalRef.current += " " + txt.trim();
              else interim += " " + txt;
            }
            interimRef.current = interim;
            const todo = (finalRef.current + " " + interim).trim();
            setTexto(todo);
            const palabras = contarPalabras(todo);
            const minutos = Math.max(0.2, ahora() / 60);
            const { total: muletillas } = contarMuletillas(todo);
            wpmSerieRef.current.push({ t: +ahora().toFixed(1), p: palabras });
            setVivo((v) => ({ ...v, palabras, wpm: Math.round(palabras / minutos), muletillas }));
          };
          rec.onerror = (e) => {
            // "no-speech" y "aborted" son normales; solo desactivamos si el
            // servicio no está disponible en este dispositivo.
            if (e?.error === "not-allowed" || e?.error === "service-not-allowed") {
              quiereVozRef.current = false;
              setTranscribe(false);
            }
          };
          rec.onend = () => { if (quiereVozRef.current) setTimeout(arrancar, 250); };
          rec.start();
          recRef.current = rec;
          setTranscribe(true);
        } catch {
          quiereVozRef.current = false;
          setTranscribe(false);
        }
      };
      arrancarVozRef.current = arrancar;
      arrancar();
    } else {
      arrancarVozRef.current = null;
      setTranscribe(false);
    }

    setActivo(true);
    return true;
  }, []);

  /* Pausar y reanudar sin perder la serie ni la grabación. */
  const pausar = useCallback(() => {
    if (pausaRef.current) return;
    pausaRef.current = true;
    offsetRef.current = ahora();
    clearInterval(rafRef.current);
    quiereVozRef.current = false;
    try { if (mrRef.current?.state === "recording") mrRef.current.pause(); } catch {}
    try { recRef.current?.stop(); } catch {}
  }, []);

  /* Reanuda con el mismo bucle de análisis con el que arrancó, para que la
     serie mantenga las mismas métricas antes y después de la pausa. */
  const reanudar = useCallback(() => {
    if (!pausaRef.current || !anRef.current || !bucleRef.current) return;
    pausaRef.current = false;
    t0Ref.current = Date.now();
    try { if (mrRef.current?.state === "paused") mrRef.current.resume(); } catch {}
    clearInterval(rafRef.current);
    rafRef.current = setInterval(bucleRef.current, MUESTREO_MS);
    // El reconocedor se detuvo al pausar y su `onend` no lo relevantó porque
    // la bandera estaba abajo: hay que volver a arrancarlo a mano.
    if (arrancarVozRef.current) {
      quiereVozRef.current = true;
      arrancarVozRef.current();
    }
  }, []);

  /* Cierra la grabación y devuelve el blob de audio. */
  const cerrarGrabacion = useCallback(
    () =>
      new Promise((resolve) => {
        const mr = mrRef.current;
        if (!mr || mr.state === "inactive") {
          const c = chunksRef.current;
          return resolve(c.length ? new Blob(c, { type: c[0].type || "audio/webm" }) : null);
        }
        mr.onstop = () => {
          const c = chunksRef.current;
          resolve(c.length ? new Blob(c, { type: mr.mimeType || "audio/webm" }) : null);
        };
        try { mr.stop(); } catch { resolve(null); }
      }),
    []
  );

  /* Descarta todo sin dejar rastro: para cancelar una práctica. */
  const descartar = useCallback(() => {
    chunksRef.current = [];
    serieRef.current = []; pausasRef.current = []; alargRef.current = []; wpmSerieRef.current = [];
    finalRef.current = ""; interimRef.current = "";
    detener();
  }, [detener]);

  /* Resumen final consolidado, listo para guardar con la sesión. */
  const resumen = useCallback((duracion) => {
    const serie = serieRef.current;
    const tonos = serie.map((s) => s.h).filter((h) => h > 0);
    const niveles = serie.map((s) => s.n);
    const centroides = serie.map((s) => s.c).filter((c) => c > 0);
    const txt = finalRef.current.trim();
    const palabras = contarPalabras(txt);
    const mul = contarMuletillas(txt);
    const lex = riquezaLexica(txt);
    const pausas = pausasRef.current;

    return {
      duracion,
      transcripcion: txt,
      hayTranscripcion: palabras > 0,
      palabras,
      wpm: duracion > 0 ? Math.round(palabras / (duracion / 60)) : 0,
      muletillas: mul.total,
      muletillasDetalle: mul.detalle,
      lexico: lex,
      tono: {
        media: Math.round(media(tonos)),
        mediana: Math.round(mediana(tonos)),
        min: tonos.length ? Math.round(Math.min(...tonos)) : 0,
        max: tonos.length ? Math.round(Math.max(...tonos)) : 0,
        desviacion: +desviacion(tonos).toFixed(1),
        // Rango expresivo en semitonos: por debajo de 3 suena monótono.
        rangoSemitonos: tonos.length
          ? +(12 * Math.log2(Math.max(...tonos) / Math.min(...tonos))).toFixed(1) : 0,
      },
      volumen: {
        media: +media(niveles).toFixed(3),
        min: niveles.length ? +Math.min(...niveles).toFixed(3) : 0,
        max: niveles.length ? +Math.max(...niveles).toFixed(3) : 0,
        desviacion: +desviacion(niveles).toFixed(3),
      },
      timbre: { centroide: Math.round(media(centroides)) },
      pausas: {
        total: pausas.length,
        tiempoTotal: +pausas.reduce((a, p) => a + p.dur, 0).toFixed(1),
        larga: pausas.filter((p) => p.dur >= 2).length,
        lista: pausas.map((p) => ({ t: +p.t.toFixed(1), dur: +p.dur.toFixed(1) })),
      },
      alargamientos: {
        total: alargRef.current.length,
        lista: alargRef.current.map((a) => ({ t: +a.t.toFixed(1), dur: +a.dur.toFixed(1) })),
      },
      serie,
    };
  }, []);

  useEffect(() => () => detener(), [detener]);

  return {
    activo, error, nivel, tono, transcribe, grabando, texto, vivo,
    iniciar, detener, pausar, reanudar, cerrarGrabacion, descartar, resumen,
    soportaTranscripcion: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
    soportaGrabacion: typeof window.MediaRecorder !== "undefined",
  };
}
