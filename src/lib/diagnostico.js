/* ---------------------------------------------------------------------------
   Traduce las mediciones acústicas en lecturas que un profesor puede usar:
   una calificación sugerida de 1 a 5, un veredicto en palabras y el porqué.

   Nada de esto sustituye al ojo del profesor: precarga la rúbrica para que
   solo tenga que corregir lo que no coincida con lo que vio.
   ------------------------------------------------------------------------- */

const clamp = (v) => Math.max(1, Math.min(5, Math.round(v)));

/* Rangos de referencia. Se ajustan según el tipo de alumno: un niño en
   concurso proyecta distinto que un diputado en tribuna. */
const REF = {
  wpm:        { ideal: [110, 160], amplio: [95, 180] },
  wpmInfantil:{ ideal: [100, 145], amplio: [85, 165] },
  rangoSemis: { ideal: [4, 12],    amplio: [2.5, 16] },
  pausasPorMin: { ideal: [3, 9],   amplio: [1.5, 14] },
  lexico:     { ideal: [0.55, 1],  amplio: [0.42, 1] },
  volumenMedia:{ ideal: [0.12, 0.45], amplio: [0.07, 0.6] },
};

const enRango = (v, [a, b]) => v >= a && v <= b;

/* Puntúa una medida contra su rango ideal y su rango tolerable. */
function puntuarRango(v, ref, { bajo, alto }) {
  if (!v) return null;
  if (enRango(v, ref.ideal)) return { nota: 5, estado: "bien", txt: "En rango" };
  if (enRango(v, ref.amplio)) {
    return v < ref.ideal[0]
      ? { nota: 4, estado: "leve", txt: bajo.leve }
      : { nota: 4, estado: "leve", txt: alto.leve };
  }
  return v < ref.amplio[0]
    ? { nota: 2, estado: "mal", txt: bajo.fuerte }
    : { nota: 2, estado: "mal", txt: alto.fuerte };
}

/* --------------------------------------------------------------------------
   Devuelve, por cada criterio medible, { nota, estado, titulo, detalle, valor }
   -------------------------------------------------------------------------- */
export function diagnosticar(audio, { track = "politico", objetivo = 180, duracion = 0 } = {}) {
  const out = {};
  const mins = Math.max(0.2, duracion / 60);

  /* Uso del tiempo se puede medir siempre: solo necesita el cronómetro,
     no el micrófono. Va primero para que exista aunque no haya audio. */
  if (objetivo > 0 && duracion > 0) {
    const desv = Math.abs(duracion - objetivo) / objetivo;
    const nota = desv <= 0.05 ? 5 : desv <= 0.12 ? 4 : desv <= 0.25 ? 3 : desv <= 0.4 ? 2 : 1;
    const dif = Math.round(duracion - objetivo);
    out.tiempo = {
      nota,
      estado: nota >= 4 ? "bien" : nota === 3 ? "leve" : "mal",
      titulo: dif === 0 ? "Tiempo exacto" : `${dif > 0 ? "+" : ""}${dif} s respecto al objetivo`,
      detalle: `Duró ${Math.round(duracion)} s de ${objetivo} s asignados (${(desv * 100).toFixed(0)} % de desviación).`,
      valor: dif,
    };
  }

  if (!audio) return out;

  /* ------------------------------- Ritmo -------------------------------- */
  if (audio.hayTranscripcion && audio.wpm > 0) {
    const ref = track === "infantil" ? REF.wpmInfantil : REF.wpm;
    const r = puntuarRango(audio.wpm, ref, {
      bajo:  { leve: "Un poco lento", fuerte: "Demasiado lento: el público se desengancha" },
      alto:  { leve: "Un poco acelerado", fuerte: "Muy acelerado: no da tiempo a procesar" },
    });
    out.ritmo = {
      ...r,
      titulo: `${audio.wpm} palabras por minuto`,
      detalle: `Referencia para este perfil: ${ref.ideal[0]}–${ref.ideal[1]} ppm.`,
      valor: audio.wpm,
    };
  }

  /* ------------------------------- Tono --------------------------------- */
  if (audio.tono?.mediana > 0) {
    const rango = audio.tono.rangoSemitonos;
    const r = puntuarRango(rango, REF.rangoSemis, {
      bajo: { leve: "Poca variación melódica", fuerte: "Monótono: la voz no sube ni baja" },
      alto: { leve: "Mucha variación", fuerte: "Melodía excesiva: suena cantadito" },
    });
    out.tono = {
      ...r,
      titulo: `Rango de ${rango} semitonos`,
      detalle: `Tono central ${audio.tono.mediana} Hz, de ${audio.tono.min} a ${audio.tono.max} Hz. Un discurso expresivo se mueve entre 4 y 12 semitonos.`,
      valor: rango,
    };
  }

  /* ----------------------------- Volumen -------------------------------- */
  if (audio.volumen?.media > 0) {
    const v = audio.volumen.media;
    const r = puntuarRango(v, REF.volumenMedia, {
      bajo: { leve: "Proyección justa", fuerte: "Volumen bajo: no llegaría al fondo de la sala" },
      alto: { leve: "Proyección alta", fuerte: "Saturado: riesgo de forzar la garganta" },
    });
    // Un volumen sostenido y parejo vale más que uno que se cae a mitad.
    const constancia = audio.volumen.desviacion / (v || 1);
    const penal = constancia > 0.85 ? 1 : 0;
    out.volumen = {
      ...r,
      nota: r ? clamp(r.nota - penal) : null,
      titulo: `Nivel medio ${Math.round(v * 100)} / 100`,
      detalle: penal
        ? "El volumen sube y baja demasiado: se cae al final de las frases."
        : "Volumen sostenido a lo largo de la práctica.",
      valor: v,
    };
  }

  /* ------------------------------ Pausas -------------------------------- */
  if (audio.pausas) {
    const porMin = audio.pausas.total / mins;
    const r = puntuarRango(porMin, REF.pausasPorMin, {
      bajo: { leve: "Pocas pausas", fuerte: "Casi sin pausas: discurso atropellado, sin respirar" },
      alto: { leve: "Muchas pausas", fuerte: "Demasiadas interrupciones: se pierde el hilo" },
    });
    const largas = audio.pausas.larga;
    out.pausas = {
      ...r,
      nota: r ? clamp(r.nota - (largas > 2 ? 1 : 0)) : null,
      titulo: `${audio.pausas.total} pausas · ${porMin.toFixed(1)} por minuto`,
      detalle: largas > 0
        ? `${largas} pausa${largas > 1 ? "s" : ""} de más de 2 segundos: revisar si fueron intencionadas o lagunas.`
        : "Ninguna pausa larga: no hubo huecos de memoria.",
      valor: +porMin.toFixed(1),
    };
  }

  /* ---------------------------- Muletillas ------------------------------ */
  if (audio.hayTranscripcion) {
    const porMin = audio.muletillas / mins;
    const nota = porMin === 0 ? 5 : porMin < 1 ? 5 : porMin < 2 ? 4 : porMin < 4 ? 3 : porMin < 6 ? 2 : 1;
    const top = Object.entries(audio.muletillasDetalle || {}).sort((a, b) => b[1] - a[1]).slice(0, 3);
    out.muletillas = {
      nota,
      estado: nota >= 4 ? "bien" : nota === 3 ? "leve" : "mal",
      titulo: `${audio.muletillas} muletillas · ${porMin.toFixed(1)} por minuto`,
      detalle: top.length
        ? `Las más repetidas: ${top.map(([m, c]) => `"${m}" ×${c}`).join(", ")}.`
        : "No se detectaron muletillas en la transcripción.",
      valor: audio.muletillas,
    };
  }

  /* ------------------------ Alargamiento fónico ------------------------- */
  if (audio.alargamientos) {
    const n = audio.alargamientos.total;
    const porMin = n / mins;
    const nota = porMin < 0.5 ? 5 : porMin < 1.5 ? 4 : porMin < 3 ? 3 : porMin < 5 ? 2 : 1;
    out.alargamiento = {
      nota,
      estado: nota >= 4 ? "bien" : nota === 3 ? "leve" : "mal",
      titulo: `${n} alargamiento${n === 1 ? "" : "s"} detectado${n === 1 ? "" : "s"}`,
      detalle: n
        ? "Sonidos sostenidos de más de 0,65 s con tono plano: es el clásico «eeeel» para ganar tiempo."
        : "No se detectaron sonidos estirados para ganar tiempo.",
      valor: n,
    };
  }

  /* ---------------------------- Vocabulario ----------------------------- */
  if (audio.lexico?.total >= 12) {
    const r = puntuarRango(audio.lexico.ratio, REF.lexico, {
      bajo: { leve: "Vocabulario algo repetitivo", fuerte: "Léxico pobre: se repiten las mismas palabras" },
      alto: { leve: "", fuerte: "" },
    });
    out.vocabulario = {
      ...r,
      titulo: `${audio.lexico.unicas} palabras distintas de ${audio.lexico.total}`,
      detalle: audio.lexico.repetidas.length
        ? `Más repetidas: ${audio.lexico.repetidas.slice(0, 4).map((r) => `${r.w} ×${r.c}`).join(", ")}.`
        : "Buena variedad léxica, sin palabras dominantes.",
      valor: +(audio.lexico.ratio * 100).toFixed(0),
    };
  }

  /* ---------------------------- Colocación ------------------------------ */
  if (audio.timbre?.centroide > 0) {
    const c = audio.timbre.centroide;
    // Un centroide muy bajo indica voz apagada, atrás, sin resonancia frontal;
    // uno muy alto, voz apretada y estridente.
    const nota = c < 700 ? 2 : c < 1000 ? 3 : c <= 2200 ? 5 : c <= 2800 ? 4 : 3;
    out.colocacion = {
      nota,
      estado: nota >= 4 ? "bien" : nota === 3 ? "leve" : "mal",
      titulo: `Brillo del timbre ${c} Hz`,
      detalle:
        c < 1000
          ? "Voz apagada, sin resonancia en máscara: suena hacia adentro."
          : c > 2800
          ? "Timbre muy agudo y tenso: posible aprieto de garganta."
          : "Timbre con resonancia frontal adecuada.",
      valor: c,
      aproximado: true,
    };
  }

  return out;
}

/* Precarga la rúbrica combinando lo medido con lo marcado a mano por el
   profesor durante la práctica. */
export function precargarRubrica(criterios, { diag = {}, marcas = [] } = {}) {
  const pre = {};
  for (const c of criterios) {
    const errores = marcas.filter((m) => m.k === c.k && m.signo < 0).length;
    const aciertos = marcas.filter((m) => m.k === c.k && m.signo > 0).length;

    let base = diag[c.k]?.nota ?? null;
    if (base == null && (errores || aciertos)) base = 3;
    if (base == null) continue;

    // Cada dos incidencias marcadas baja un punto; cada acierto sube medio.
    const ajustada = base - Math.floor(errores / 2) + aciertos * 0.5;
    pre[c.k] = clamp(ajustada);
  }
  return pre;
}
