import {
  GraduationCap, Landmark,
  User, Eye, Waves, Hand, Smile, Footprints,
  Volume2, Wind, Type, Music, Activity, Pause, Repeat, StretchHorizontal, Heart,
  Flag, Layout, Scale, ArrowRightLeft, Award,
  BookOpen, Megaphone, Anchor, Clock,
} from "lucide-react";
import { T } from "../theme.js";

/* ---------------------------------------------------------------------------
   Programas (tracks). Los criterios son los mismos para todos los alumnos;
   lo que cambia es el énfasis: qué se pesa más en cada tipo de formación.
   ------------------------------------------------------------------------- */
export const TRACKS = {
  infantil: {
    n: "Oratoria clásica",
    sub: "Niños · concurso · castrense",
    icon: GraduationCap,
    color: T.brass,
    enfasis: ["postura", "vision", "diccion", "volumen", "exordio", "cierre", "aplomo", "caminado"],
  },
  politico: {
    n: "Comunicación política",
    sub: "Candidatos · cabildo · congreso",
    icon: Landmark,
    color: T.sky,
    enfasis: ["argumentacion", "persuasion", "aplomo", "tiempo", "muletillas", "estructura", "vision", "calidez"],
  },
};

/* ---------------------------------------------------------------------------
   Los 24 criterios, en dos bloques de dos grupos.

   `auto`  → métrica que el analizador de audio calcula solo para este criterio.
   `quick` → aparece por defecto en la paleta rápida de la clase en vivo.
   ------------------------------------------------------------------------- */
export const BLOQUES = [
  {
    k: "ejecucion",
    n: "Ejecución",
    d: "Cómo lo dice",
    color: T.brass,
    grupos: [
      {
        k: "noverbal",
        n: "Lenguaje no verbal y presencia escénica",
        corto: "No verbal",
        color: T.violet,
        criterios: [
          { k: "postura",         n: "Postura",          d: "Eje firme, hombros abiertos, peso repartido, sin balanceo",            Icon: User,        quick: true },
          { k: "vision",          n: "Visión",           d: "Barrido de sala, sostiene la mirada, no lee el techo ni el piso",      Icon: Eye,         quick: true },
          { k: "gesticulacion",   n: "Gesticulación",    d: "El cuerpo acompaña la idea, sin rigidez ni exceso",                    Icon: Waves },
          { k: "ademanes",        n: "Ademanes",         d: "Manos con intención: amplitud, altura y precisión del gesto",          Icon: Hand,        quick: true },
          { k: "expresionFacial", n: "Expresión facial", d: "El rostro dice lo mismo que la boca; no queda inexpresivo",            Icon: Smile },
          { k: "caminado",        n: "Caminado",         d: "Desplazamiento con propósito, ocupa el foro, se planta al rematar",    Icon: Footprints },
        ],
      },
      {
        k: "vocal",
        n: "Técnica vocal y expresión oral",
        corto: "Voz",
        color: T.sky,
        criterios: [
          { k: "volumen",      n: "Volumen",            d: "Proyección suficiente y sostenida hasta la última fila",            Icon: Volume2,           quick: true, auto: "volumen" },
          { k: "colocacion",   n: "Colocación",         d: "Apoyo diafragmático y resonancia en máscara, sin gritar de garganta", Icon: Wind,             auto: "colocacion" },
          { k: "diccion",      n: "Dicción",            d: "Articulación limpia, consonantes finales, sin comerse sílabas",     Icon: Type,              quick: true },
          { k: "tono",         n: "Tono",               d: "Altura e inflexión: variedad melódica, sin monotonía ni cantadito", Icon: Music,             auto: "tono" },
          { k: "ritmo",        n: "Ritmo",              d: "Velocidad y cadencia; acelera o frena según el contenido",          Icon: Activity,          quick: true, auto: "ritmo" },
          { k: "pausas",       n: "Pausas",             d: "Silencios intencionados que enmarcan la idea y dejan respirar",     Icon: Pause,             auto: "pausas" },
          { k: "muletillas",   n: "Muletillas",         d: "Rellenos: este, eh, o sea, verdad, digamos",                        Icon: Repeat,            quick: true, auto: "muletillas" },
          { k: "alargamiento", n: "Alargamiento fónico", d: "Estirar vocales o consonantes para ganar tiempo: eeeel, yyyy",     Icon: StretchHorizontal, auto: "alargamiento" },
          { k: "calidez",      n: "Calidez",            d: "Timbre cercano y humano; convence porque suena verdadero",          Icon: Heart },
        ],
      },
    ],
  },
  {
    k: "discurso",
    n: "Discurso",
    d: "Qué dice",
    color: T.jade,
    grupos: [
      {
        k: "contenido",
        n: "Contenido y estructura del discurso",
        corto: "Estructura",
        color: T.jade,
        criterios: [
          { k: "exordio",       n: "Exordio",       d: "Apertura que capta, sitúa y anuncia por dónde va",              Icon: Flag,           quick: true },
          { k: "estructura",    n: "Estructura",    d: "Orden interno reconocible y proporcionado entre sus partes",    Icon: Layout },
          { k: "argumentacion", n: "Argumentación", d: "Tesis, razones, evidencia y refutación de la contraria",        Icon: Scale,          quick: true },
          { k: "transiciones",  n: "Transiciones",  d: "Enlaces limpios entre bloques; no se siente el corte",          Icon: ArrowRightLeft },
          { k: "cierre",        n: "Cierre fuerte", d: "Remate memorable con llamado; no se apaga ni pide disculpas",   Icon: Award,          quick: true },
        ],
      },
      {
        k: "dominio",
        n: "Dominio léxico y conexión",
        corto: "Dominio",
        color: T.amber,
        criterios: [
          { k: "vocabulario", n: "Vocabulario",   d: "Riqueza, precisión y adecuación al auditorio; sin repetir palabra", Icon: BookOpen,  auto: "vocabulario" },
          { k: "persuasion",  n: "Persuasión",    d: "Mueve al auditorio: emoción, credibilidad y razón trabajando juntas", Icon: Megaphone, quick: true },
          { k: "aplomo",      n: "Aplomo",        d: "Seguridad y dominio de nervios; resuelve el imprevisto sin quebrarse", Icon: Anchor,   quick: true },
          { k: "tiempo",      n: "Uso del tiempo", d: "Ajuste al tiempo asignado y reparto interno equilibrado",           Icon: Clock,     auto: "tiempo" },
        ],
      },
    ],
  },
];

/* --------------------------- Índices derivados ---------------------------- */
export const GRUPOS = BLOQUES.flatMap((b) => b.grupos.map((g) => ({ ...g, bloque: b.k, bloqueN: b.n })));
export const CRITERIOS = GRUPOS.flatMap((g) =>
  g.criterios.map((c) => ({ ...c, grupo: g.k, grupoN: g.n, grupoCorto: g.corto, color: g.color, bloque: g.bloque }))
);
export const CRIT = Object.fromEntries(CRITERIOS.map((c) => [c.k, c]));
export const CRIT_AUTO = CRITERIOS.filter((c) => c.auto);
export const QUICK_DEFAULT = CRITERIOS.filter((c) => c.quick).map((c) => c.k);

export const criteriosDeGrupo = (gk) => CRITERIOS.filter((c) => c.grupo === gk);

/* Promedio de un conjunto de calificaciones, ignorando los criterios no evaluados. */
export const promedioDe = (rubrica, keys) => {
  const v = (keys || Object.keys(rubrica || {}))
    .map((k) => rubrica?.[k])
    .filter((x) => typeof x === "number" && x > 0);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
};

export const promedioGrupo = (rubrica, gk) => promedioDe(rubrica, criteriosDeGrupo(gk).map((c) => c.k));
export const promedioTotal = (rubrica) => promedioDe(rubrica, CRITERIOS.map((c) => c.k));
