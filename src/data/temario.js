/* Programa de contenidos por track. El profesor marca el avance de cada tema
   por alumno: pendiente → visto → practicado → dominado. */

export const TEMARIO = {
  infantil: [
    { k: "i1",  n: "Respiración y apoyo",       d: "Diafragma, costo-diafragmática, columna de aire" },
    { k: "i2",  n: "Postura y marcialidad",     d: "Firmes, descanso, giros, saludo protocolario" },
    { k: "i3",  n: "Proyección y resonancia",   d: "Máscara facial, volumen sin gritar, cuidado vocal" },
    { k: "i4",  n: "Dicción y articulación",    d: "Trabalenguas, corcho, consonantes finales" },
    { k: "i5",  n: "Estructura del discurso",   d: "Exordio, narración, argumentación, peroración" },
    { k: "i6",  n: "Memorización",              d: "Palacio de memoria, anclas, bloques de sentido" },
    { k: "i7",  n: "Escena y desplazamiento",   d: "Entrada, ubicación, caminado, salida" },
    { k: "i8",  n: "Ademanes y mirada",         d: "Manos, rostro, barrido visual, énfasis" },
    { k: "i9",  n: "Manejo de nervios",         d: "Respiración 4-4-4, rutina previa, imprevistos" },
    { k: "i10", n: "Protocolo de concurso",     d: "Tiempos, jurado, saludo, presentación, cierre" },
  ],
  politico: [
    { k: "p1",  n: "Idea fuerza y framing",     d: "Una sola idea, encuadre, palabra propia" },
    { k: "p2",  n: "Arquitectura del discurso", d: "3 min, 7 min, 30 seg (spot), 1 min (video)" },
    { k: "p3",  n: "Argumentación",             d: "Dato, evidencia, ejemplo, refutación" },
    { k: "p4",  n: "Storytelling territorial",  d: "Caso real, nombre propio, colonia, cifra local" },
    { k: "p5",  n: "Media training",            d: "Entrevista, cámara, soundbite, pregunta trampa" },
    { k: "p6",  n: "Debate",                    d: "Ataque, defensa, pivoteo, cierre memorable" },
    { k: "p7",  n: "Comunicación de crisis",    d: "Pregunta hostil, disculpa pública, desmentido" },
    { k: "p8",  n: "No verbal y atril",         d: "Manos, mirada, traje, micrófono, distancia" },
    { k: "p9",  n: "Mitin y asamblea",          d: "Volumen, cadencia, coro, remate, aplauso" },
    { k: "p10", n: "Sesión y tribuna",          d: "Reglamento, tiempo, alusiones, réplica" },
  ],
};

export const ESTADOS = [
  { n: "Pendiente",  c: "#8FA8AE", bg: "transparent" },
  { n: "Visto",      c: "#5B9BC4", bg: "#5B9BC418" },
  { n: "Practicado", c: "#E0A03B", bg: "#E0A03B18" },
  { n: "Dominado",   c: "#4FB08A", bg: "#4FB08A18" },
];

/* Secciones de la biblioteca de material. El profesor puede añadir las suyas. */
export const CARPETAS_BASE = [
  { k: "estudio",   n: "Material de estudio", d: "Manuales, teoría, apuntes" },
  { k: "discursos", n: "Discursos",           d: "Piezas propias y ajenas para analizar" },
  { k: "lectura",   n: "Textos para leer",    d: "Práctica de lectura en voz alta" },
  { k: "ejercicios",n: "Ejercicios",          d: "Rutinas, trabalenguas, dinámicas" },
  { k: "referencia",n: "Referencia",          d: "Reglamentos, convocatorias, formatos" },
];
