/* Tokens de diseño de Ágora. Un solo lugar para color, tipografía y ritmo visual. */

export const T = {
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
  rose:     "#C77B9B",
};

export const FONT_D = "'Barlow Condensed','Arial Narrow',Impact,system-ui,sans-serif";
export const FONT_B = "'IBM Plex Sans',system-ui,-apple-system,Segoe UI,sans-serif";
export const FONT_M = "'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace";

/* Escala de color para calificaciones de 1 a 5. */
export const notaColor = (v) =>
  !v ? T.muted : v >= 4.5 ? T.jade : v >= 3.5 ? "#7FBF6A" : v >= 2.5 ? T.amber : v >= 1.5 ? "#D97D48" : T.red;
