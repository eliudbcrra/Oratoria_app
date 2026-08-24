import React, { useState, useRef, useMemo } from "react";
import {
  Plus, FileText, Bookmark, ChevronRight, BookOpen, Search, FolderOpen,
  Upload, Trash2, X, Check, HardDrive,
} from "lucide-react";
import { T, FONT_M } from "../theme.js";
import { uid } from "../lib/format.js";
import { TRACKS } from "../data/rubrica.js";
import { TEMARIO, CARPETAS_BASE } from "../data/temario.js";
import { guardarBlob, borrarBlob, ST_ARCHIVOS, bytes } from "../lib/storage.js";
import { Btn, Card, Eyebrow, H, Head, Empty, Field, Chip, Sheet, Confirmar } from "../ui/primitives.jsx";
import { VisorPDF } from "./VisorPDF.jsx";

export function Biblioteca({ biblioteca, setBiblioteca, flash }) {
  const [ver, setVer] = useState(null);
  const [nuevo, setNuevo] = useState(false);
  const [carpeta, setCarpeta] = useState("todas");
  const [busca, setBusca] = useState("");
  const [borrar, setBorrar] = useState(null);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return biblioteca
      .filter((b) => carpeta === "todas" || b.carpeta === carpeta)
      .filter((b) => !q || [b.titulo, b.nota, b.tags, b.archivoNombre].join(" ").toLowerCase().includes(q))
      .sort((a, b) => (b.ts || 0) - (a.ts || 0));
  }, [biblioteca, carpeta, busca]);

  const eliminar = async (item) => {
    if (item.archivoId) { try { await borrarBlob(ST_ARCHIVOS, item.archivoId); } catch {} }
    setBiblioteca((p) => p.filter((b) => b.id !== item.id));
    setBorrar(null);
    flash("Material eliminado");
  };

  if (ver) {
    // Se relee de la lista para que los marcadores nuevos se vean al instante.
    const actual = biblioteca.find((b) => b.id === ver.id) || ver;
    return <VisorPDF item={actual} setBiblioteca={setBiblioteca} back={() => setVer(null)} flash={flash} />;
  }

  const porCarpeta = (k) => biblioteca.filter((b) => b.carpeta === k).length;

  return (
    <div>
      <Head title="Material" sub={`${biblioteca.length} documentos`}
        right={<Btn size="sm" Icon={Plus} onClick={() => setNuevo(true)}>Añadir</Btn>} />

      <div style={{ padding: "0 18px 18px" }}>
        {/* Buscador */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <Search size={15} color={T.muted} style={{ position: "absolute", left: 12, top: 12 }} />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por título, nota o etiqueta…"
            style={{
              width: "100%", background: T.ink, border: `1px solid ${T.line}`, borderRadius: 10,
              padding: "10px 12px 10px 34px", color: T.bone, fontFamily: "inherit", fontSize: 13.5, outline: "none",
            }} />
          {busca && (
            <button onClick={() => setBusca("")} style={{ position: "absolute", right: 8, top: 9, background: "none", border: "none", color: T.muted, cursor: "pointer", padding: 3 }}>
              <X size={15} />
            </button>
          )}
        </div>

        {/* Secciones */}
        <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 6, marginBottom: 13 }}>
          <Chip activo={carpeta === "todas"} color={T.brass} onClick={() => setCarpeta("todas")}>
            Todas · {biblioteca.length}
          </Chip>
          {CARPETAS_BASE.map((c) => (
            <Chip key={c.k} activo={carpeta === c.k} color={T.brass} onClick={() => setCarpeta(c.k)}>
              {c.n} · {porCarpeta(c.k)}
            </Chip>
          ))}
        </div>

        {lista.length === 0 ? (
          <Empty Icon={BookOpen}
            title={busca ? "Nada coincide con la búsqueda" : "Sin material en esta sección"}
            hint={busca
              ? "Prueba con otra palabra o revisa otra sección."
              : "Añade tus PDF para tenerlos ordenados por tema y abrirlos durante la clase, incluso sin internet."}
            action={!busca && <Btn Icon={Plus} onClick={() => setNuevo(true)}>Añadir material</Btn>} />
        ) : (
          lista.map((b) => {
            const carp = CARPETAS_BASE.find((c) => c.k === b.carpeta);
            const tm = b.track && b.tema ? TEMARIO[b.track]?.find((x) => x.k === b.tema) : null;
            const col = b.track ? TRACKS[b.track].color : T.brass;
            return (
              <Card key={b.id} onClick={() => setVer(b)} style={{ marginBottom: 9, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ background: `${col}18`, border: `1px solid ${col}55`, borderRadius: 9, padding: 9, flexShrink: 0 }}>
                  <FileText size={19} color={col} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5, lineHeight: 1.3 }}>{b.titulo}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4, alignItems: "center" }}>
                    {carp && <span style={{ fontSize: 10.5, fontFamily: FONT_M, color: T.brass, letterSpacing: .5 }}>{carp.n.toUpperCase()}</span>}
                    {tm && <span style={{ fontSize: 11, color: col }}>· {tm.n}</span>}
                  </div>
                  {b.nota && <div style={{ fontSize: 12, color: T.muted, marginTop: 4, lineHeight: 1.45 }}>{b.nota}</div>}
                  <div style={{ display: "flex", gap: 10, marginTop: 5, fontSize: 10.5, color: T.muted, fontFamily: FONT_M, flexWrap: "wrap" }}>
                    {b.archivoId
                      ? <span><HardDrive size={10} style={{ verticalAlign: -1 }} /> {bytes(b.archivoTam)}</span>
                      : <span style={{ color: T.amber }}>sin archivo vinculado</span>}
                    {b.marcas?.length > 0 && <span><Bookmark size={10} style={{ verticalAlign: -1 }} /> {b.marcas.length} marcador{b.marcas.length > 1 ? "es" : ""}</span>}
                    {b.ultimaPagina > 1 && <span>pág. {b.ultimaPagina}</span>}
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setBorrar(b); }}
                  style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", padding: 4, flexShrink: 0 }}>
                  <Trash2 size={15} />
                </button>
              </Card>
            );
          })
        )}
      </div>

      <NuevoMaterial abierto={nuevo} onClose={() => setNuevo(false)} setBiblioteca={setBiblioteca} flash={flash}
        carpetaInicial={carpeta === "todas" ? "estudio" : carpeta} />

      <Confirmar abierto={!!borrar} peligro
        titulo="¿Eliminar este material?"
        texto={`Se borra "${borrar?.titulo}" junto con su PDF y sus marcadores. No se puede deshacer.`}
        confirmar="Sí, eliminar" onOk={() => eliminar(borrar)} onCancel={() => setBorrar(null)} />
    </div>
  );
}

/* --------------------------- Alta de material ----------------------------- */
function NuevoMaterial({ abierto, onClose, setBiblioteca, flash, carpetaInicial }) {
  const [titulo, setTitulo] = useState("");
  const [carpeta, setCarpeta] = useState(carpetaInicial || "estudio");
  const [track, setTrack] = useState("");
  const [tema, setTema] = useState("");
  const [tags, setTags] = useState("");
  const [nota, setNota] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const inputRef = useRef(null);

  const elegir = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) return flash("Ese archivo no es un PDF");
    setArchivo(f);
    if (!titulo.trim()) setTitulo(f.name.replace(/\.pdf$/i, ""));
  };

  const limpiar = () => {
    setTitulo(""); setTags(""); setNota(""); setArchivo(null); setTema(""); setTrack("");
  };

  const guardar = async () => {
    if (!titulo.trim()) return flash("Ponle un título al material");
    setGuardando(true);
    let archivoId = null;
    if (archivo) {
      archivoId = uid();
      try {
        await guardarBlob(ST_ARCHIVOS, archivoId, archivo);
      } catch {
        setGuardando(false);
        return flash("No se pudo guardar el PDF: revisa el espacio libre del dispositivo");
      }
    }
    setBiblioteca((p) => [...p, {
      id: uid(), titulo: titulo.trim(), carpeta, track: track || null, tema: tema || null,
      tags, nota, marcas: [], ts: Date.now(),
      archivoId, archivoNombre: archivo?.name || null, archivoTam: archivo?.size || 0, ultimaPagina: 1,
    }]);
    setGuardando(false);
    limpiar(); onClose();
    flash(archivo ? "Material y PDF guardados" : "Material registrado — vincula el PDF cuando quieras");
  };

  return (
    <Sheet abierto={abierto} onClose={onClose} titulo="Añadir material">
      {/* Archivo */}
      <input ref={inputRef} type="file" accept="application/pdf,.pdf" onChange={elegir} style={{ display: "none" }} />
      <button onClick={() => inputRef.current?.click()} style={{
        width: "100%", padding: 16, borderRadius: 12, marginBottom: 14, cursor: "pointer", textAlign: "left",
        background: archivo ? `${T.jade}12` : T.ink,
        border: `1px dashed ${archivo ? T.jade : T.line}`, color: T.bone,
        display: "flex", alignItems: "center", gap: 12, fontFamily: "inherit",
      }}>
        {archivo ? <Check size={22} color={T.jade} /> : <Upload size={22} color={T.muted} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>
            {archivo ? archivo.name : "Elegir PDF del dispositivo"}
          </div>
          <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2 }}>
            {archivo ? `${bytes(archivo.size)} · toca para cambiarlo` : "Descargas, Documentos, Drive… queda copiado dentro de la app"}
          </div>
        </div>
      </button>

      <Field label="Título" value={titulo} onChange={setTitulo} placeholder="Ej. Manual de oratoria castrense" />

      <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>Sección</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {CARPETAS_BASE.map((c) => (
          <Chip key={c.k} activo={carpeta === c.k} color={T.brass} onClick={() => setCarpeta(c.k)}>{c.n}</Chip>
        ))}
      </div>

      <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>Programa (opcional)</div>
      <div style={{ display: "flex", gap: 7, marginBottom: 12 }}>
        {Object.entries(TRACKS).map(([k, v]) => (
          <Chip key={k} activo={track === k} color={v.color} onClick={() => { setTrack(track === k ? "" : k); setTema(""); }}>
            {v.n}
          </Chip>
        ))}
      </div>

      {track && (
        <div className="aparece">
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>Tema del programa (opcional)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            {TEMARIO[track].map((x) => (
              <Chip key={x.k} activo={tema === x.k} color={T.brass} onClick={() => setTema(tema === x.k ? "" : x.k)}
                style={{ fontSize: 11.5, padding: "6px 10px" }}>{x.n}</Chip>
            ))}
          </div>
        </div>
      )}

      <Field label="Etiquetas" value={tags} onChange={setTags} placeholder="postura, protocolo, concurso" />
      <Field label="Para qué lo usas" value={nota} onChange={setNota} rows={2}
        placeholder="Ej. Capítulos 3 y 4 para alumnos de nivel inicial" />

      <Btn full size="lg" Icon={Check} onClick={guardar} disabled={guardando}>
        {guardando ? "Guardando…" : "Guardar material"}
      </Btn>
    </Sheet>
  );
}
