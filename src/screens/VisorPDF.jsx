import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Bookmark, X, Upload,
  FileText, Loader, AlertTriangle, PenLine, Search, Maximize2,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { T, FONT_M } from "../theme.js";
import { uid } from "../lib/format.js";
import { leerBlob, guardarBlob, ST_ARCHIVOS } from "../lib/storage.js";
import { Btn, Card, Eyebrow, H, Head, Empty, Field, Sheet, Confirmar } from "../ui/primitives.jsx";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

/* ---------------------------------------------------------------------------
   Visor de PDF propio, sobre pdf.js.

   Un <iframe> con un PDF no se renderiza en el WebView de Android, que es
   justo donde corre la app empaquetada: por eso la v1 mostraba un recuadro en
   blanco. Dibujando cada página en un canvas funciona igual en teléfono,
   tablet y escritorio, y además permite anclar los marcadores a la página real.
   ------------------------------------------------------------------------- */
export function VisorPDF({ item, setBiblioteca, back, flash }) {
  const [doc, setDoc] = useState(null);
  const [pagina, setPagina] = useState(item.ultimaPagina || 1);
  const [total, setTotal] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [estado, setEstado] = useState("cargando"); // cargando | listo | sinArchivo | error
  const [errorMsg, setErrorMsg] = useState("");
  const [hojaMarcador, setHojaMarcador] = useState(false);
  const [notaMarcador, setNotaMarcador] = useState("");
  const [verMarcadores, setVerMarcadores] = useState(false);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);

  const canvasRef = useRef(null);
  const contRef = useRef(null);
  const inputRef = useRef(null);
  const tareaRef = useRef(null);
  const tokenRef = useRef(0);

  /* Carga el archivo guardado en IndexedDB. */
  useEffect(() => {
    let vivo = true;
    (async () => {
      if (!item.archivoId) { setEstado("sinArchivo"); return; }
      try {
        const blob = await leerBlob(ST_ARCHIVOS, item.archivoId);
        if (!vivo) return;
        if (!blob) { setEstado("sinArchivo"); return; }
        const buf = await blob.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        if (!vivo) return;
        setDoc(pdf);
        setTotal(pdf.numPages);
        setEstado("listo");
      } catch (e) {
        if (!vivo) return;
        setErrorMsg(e?.message || "No se pudo abrir el archivo");
        setEstado("error");
      }
    })();
    return () => { vivo = false; };
  }, [item.archivoId]);

  /* Dibuja la página actual.

     Dos dibujos simultáneos sobre el mismo lienzo hacen que pdf.js aborte y
     deje la página en blanco, y React invoca los efectos por duplicado en
     desarrollo. Por eso cada llamada toma un turno: si mientras espera llega
     otra petición, se retira, y el lienzo solo se toca tras cancelar y
     esperar de verdad el dibujo anterior. */
  const dibujar = useCallback(async () => {
    if (!doc || !canvasRef.current) return;
    const turno = ++tokenRef.current;

    const p = Math.min(Math.max(1, pagina), doc.numPages);
    const page = await doc.getPage(p);
    if (turno !== tokenRef.current) return;

    if (tareaRef.current) {
      try { tareaRef.current.cancel(); } catch {}
      try { await tareaRef.current.promise; } catch {}
      if (turno !== tokenRef.current) return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ancho = contRef.current?.clientWidth || 340;
    const base = page.getViewport({ scale: 1 });
    // Ajusta al ancho disponible y multiplica por el zoom del usuario.
    const escala = ((ancho - 4) / base.width) * zoom;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const vp = page.getViewport({ scale: escala * dpr });
    canvas.width = Math.round(vp.width);
    canvas.height = Math.round(vp.height);
    canvas.style.width = `${Math.round(vp.width / dpr)}px`;
    canvas.style.height = `${Math.round(vp.height / dpr)}px`;

    const ctx = canvas.getContext("2d");
    const tarea = page.render({ canvasContext: ctx, viewport: vp });
    tareaRef.current = tarea;
    try { await tarea.promise; } catch {}
    if (tareaRef.current === tarea) tareaRef.current = null;
  }, [doc, pagina, zoom]);

  useEffect(() => { dibujar(); }, [dibujar]);

  useEffect(() => {
    let t;
    const r = () => { clearTimeout(t); t = setTimeout(dibujar, 180); };
    window.addEventListener("resize", r);
    return () => { clearTimeout(t); window.removeEventListener("resize", r); };
  }, [dibujar]);

  /* Recuerda por dónde se quedó el profesor. */
  useEffect(() => {
    if (estado !== "listo") return;
    const t = setTimeout(() => {
      setBiblioteca((p) => p.map((b) => (b.id === item.id ? { ...b, ultimaPagina: pagina } : b)));
    }, 800);
    return () => clearTimeout(t);
  }, [pagina, estado, item.id, setBiblioteca]);

  /* Vincular o reemplazar el archivo del material. */
  const elegirArchivo = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      return flash("Ese archivo no es un PDF");
    }
    const archivoId = item.archivoId || uid();
    try {
      await guardarBlob(ST_ARCHIVOS, archivoId, f);
      setBiblioteca((p) => p.map((b) => (b.id === item.id
        ? { ...b, archivoId, archivoNombre: f.name, archivoTam: f.size, ultimaPagina: 1 } : b)));
      flash("PDF guardado en la app");
      setEstado("cargando");
    } catch {
      flash("No se pudo guardar el archivo: revisa el espacio disponible");
    }
  };

  const guardarMarcador = () => {
    if (!notaMarcador.trim()) return flash("Escribe para qué sirve este fragmento");
    setBiblioteca((p) => p.map((b) => (b.id === item.id
      ? { ...b, marcas: [...(b.marcas || []), { id: uid(), pag: pagina, nota: notaMarcador.trim(), ts: Date.now() }] }
      : b)));
    setNotaMarcador(""); setHojaMarcador(false); flash(`Marcador guardado en la página ${pagina}`);
  };

  const borrarMarcador = (mid) =>
    setBiblioteca((p) => p.map((b) => (b.id === item.id ? { ...b, marcas: b.marcas.filter((m) => m.id !== mid) } : b)));

  const marcas = [...(item.marcas || [])].sort((a, b) => a.pag - b.pag);

  /* ------------------------------ Sin archivo ---------------------------- */
  if (estado === "sinArchivo") {
    return (
      <div>
        <Head title={item.titulo} sub="Material" onBack={back} />
        <div style={{ padding: "0 18px 30px" }}>
          <Card style={{ textAlign: "center", padding: 28 }}>
            <Upload size={32} color={T.muted} style={{ marginBottom: 12 }} />
            <H size={19} style={{ marginBottom: 6 }}>Vincula el PDF de este material</H>
            <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 16, lineHeight: 1.55 }}>
              Elige el archivo desde Descargas o desde donde lo tengas en el dispositivo.
              Se copia dentro de la app: después se abre sin depender del archivo original
              y sin conexión a internet.
            </div>
            <input ref={inputRef} type="file" accept="application/pdf,.pdf" onChange={elegirArchivo} style={{ display: "none" }} />
            <Btn Icon={FileText} onClick={() => inputRef.current?.click()}>Elegir PDF del dispositivo</Btn>
          </Card>
        </div>
      </div>
    );
  }

  /* -------------------------------- Visor -------------------------------- */
  return (
    <div style={pantallaCompleta ? { position: "fixed", inset: 0, background: T.ink, zIndex: 150, display: "flex", flexDirection: "column" } : undefined}>
      {!pantallaCompleta && (
        <Head title={item.titulo} sub={`${item.archivoNombre || "PDF"}${total ? ` · ${total} páginas` : ""}`} onBack={back}
          right={
            <button onClick={() => setVerMarcadores(true)} title="Marcadores"
              style={{ background: T.raised, border: `1px solid ${T.line}`, borderRadius: 10, padding: 9, color: marcas.length ? T.brass : T.bone, cursor: "pointer", position: "relative" }}>
              <Bookmark size={16} />
              {marcas.length > 0 && (
                <span style={{ position: "absolute", top: -5, right: -5, background: T.brass, color: T.ink, borderRadius: 8, fontSize: 9.5, fontFamily: FONT_M, padding: "1px 4px", fontWeight: 700 }}>
                  {marcas.length}
                </span>
              )}
            </button>
          } />
      )}

      <div ref={contRef} style={{
        padding: pantallaCompleta ? "6px" : "0 14px", flex: 1, overflow: "auto",
        display: "flex", justifyContent: "center", alignItems: "flex-start",
        paddingTop: pantallaCompleta ? "calc(6px + env(safe-area-inset-top))" : 0,
      }}>
        {estado === "cargando" && (
          <div style={{ padding: 50, textAlign: "center", color: T.muted }}>
            <Loader size={26} className="live-dot" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 13 }}>Abriendo el documento…</div>
          </div>
        )}
        {estado === "error" && (
          <div style={{ padding: 40, textAlign: "center", color: T.amber }}>
            <AlertTriangle size={28} style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 13.5, lineHeight: 1.5, marginBottom: 14 }}>
              No se pudo abrir el PDF.<br />
              <span style={{ color: T.muted, fontSize: 12 }}>{errorMsg}</span>
            </div>
            <input ref={inputRef} type="file" accept="application/pdf,.pdf" onChange={elegirArchivo} style={{ display: "none" }} />
            <Btn variant="ghost" Icon={Upload} onClick={() => inputRef.current?.click()}>Vincular otro archivo</Btn>
          </div>
        )}
        <canvas ref={canvasRef} style={{
          display: estado === "listo" ? "block" : "none",
          borderRadius: pantallaCompleta ? 0 : 8, background: "#fff", maxWidth: "100%",
        }} />
      </div>

      {estado === "listo" && (
        <div style={{
          position: "sticky", bottom: 0, display: "flex", alignItems: "center", gap: 6,
          padding: "10px 14px", paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
          background: `${T.ink}F2`, borderTop: `1px solid ${T.line}`, backdropFilter: "blur(8px)",
        }}>
          <BotonV onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina <= 1}><ChevronLeft size={17} /></BotonV>
          <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, justifyContent: "center" }}>
            <input value={pagina} onChange={(e) => { const v = parseInt(e.target.value); if (!Number.isNaN(v)) setPagina(Math.min(Math.max(1, v), total)); }}
              type="number" style={{
                width: 52, textAlign: "center", background: T.ink, border: `1px solid ${T.line}`, borderRadius: 8,
                padding: "7px 4px", color: T.bone, fontFamily: FONT_M, fontSize: 13, outline: "none",
              }} />
            <span style={{ fontFamily: FONT_M, fontSize: 12.5, color: T.muted }}>/ {total}</span>
          </div>
          <BotonV onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.25).toFixed(2)))} disabled={zoom <= 0.6}><ZoomOut size={16} /></BotonV>
          <BotonV onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))} disabled={zoom >= 4}><ZoomIn size={16} /></BotonV>
          <BotonV onClick={() => setPantallaCompleta(!pantallaCompleta)}><Maximize2 size={16} /></BotonV>
          <BotonV onClick={() => setHojaMarcador(true)} color={T.brass}><Bookmark size={16} /></BotonV>
          <BotonV onClick={() => setPagina((p) => Math.min(total, p + 1))} disabled={pagina >= total}><ChevronRight size={17} /></BotonV>
        </div>
      )}

      {/* Nuevo marcador */}
      <Sheet abierto={hojaMarcador} onClose={() => setHojaMarcador(false)} titulo={`Marcador · página ${pagina}`}>
        <Field label="¿Para qué sirve este fragmento?" value={notaMarcador} onChange={setNotaMarcador} rows={3}
          placeholder="Ej. Ejercicio de respiración para calentar antes del ensayo" />
        <Btn full Icon={Bookmark} onClick={guardarMarcador}>Guardar marcador</Btn>
      </Sheet>

      {/* Lista de marcadores */}
      <Sheet abierto={verMarcadores} onClose={() => setVerMarcadores(false)} titulo="Marcadores del documento">
        {marcas.length === 0 && (
          <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.55, padding: "8px 0 16px" }}>
            Todavía no hay marcadores. Abre una página y toca el ícono de marcador para anclar una nota ahí.
          </div>
        )}
        {marcas.map((m) => (
          <div key={m.id} style={{ display: "flex", gap: 11, alignItems: "flex-start", padding: "11px 0", borderBottom: `1px solid ${T.line}55` }}>
            <button onClick={() => { setPagina(m.pag); setVerMarcadores(false); }} style={{
              background: `${T.brass}18`, border: `1px solid ${T.brass}55`, color: T.brass, borderRadius: 8,
              padding: "6px 9px", fontFamily: FONT_M, fontSize: 12, cursor: "pointer", flexShrink: 0, minWidth: 46,
            }}>p.{m.pag}</button>
            <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.5 }}>{m.nota}</div>
            <button onClick={() => borrarMarcador(m.id)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", padding: 2 }}>
              <X size={15} />
            </button>
          </div>
        ))}
      </Sheet>
    </div>
  );
}

function BotonV({ children, onClick, disabled, color }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: 38, height: 38, borderRadius: 9, flexShrink: 0,
      background: T.raised, border: `1px solid ${T.line}`, color: color || T.bone,
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? .35 : 1,
    }}>{children}</button>
  );
}
