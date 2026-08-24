import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { T, FONT_D, FONT_B, FONT_M } from "../theme.js";

export function Btn({ children, onClick, variant = "solid", size = "md", full, style, disabled, Icon, title }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    fontFamily: FONT_B, fontWeight: 600, borderRadius: 10,
    cursor: disabled ? "not-allowed" : "pointer",
    border: "1px solid transparent",
    transition: "transform .12s ease, background .15s ease, opacity .15s ease",
    width: full ? "100%" : undefined, opacity: disabled ? 0.4 : 1,
    padding: size === "sm" ? "7px 12px" : size === "lg" ? "15px 20px" : "11px 16px",
    fontSize: size === "sm" ? 13 : size === "lg" ? 16 : 14.5,
    lineHeight: 1.2,
  };
  const variants = {
    solid:  { background: T.brass, color: T.ink },
    ghost:  { background: "transparent", color: T.bone, border: `1px solid ${T.line}` },
    quiet:  { background: T.raised, color: T.bone },
    danger: { background: "transparent", color: T.red, border: `1px solid ${T.red}55` },
    jade:   { background: T.jade, color: T.ink },
    red:    { background: T.red, color: T.bone },
  };
  return (
    <button title={title} disabled={disabled} onClick={onClick} style={{ ...base, ...variants[variant], ...style }}
      onPointerDown={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(.97)"; }}
      onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}>
      {Icon && <Icon size={size === "sm" ? 14 : 17} />}
      {children}
    </button>
  );
}

export function Card({ children, style, onClick, className }) {
  return (
    <div onClick={onClick} className={className} style={{
      background: T.surface, border: `1px solid ${T.line}`, borderRadius: 14, padding: 16,
      cursor: onClick ? "pointer" : undefined, ...style,
    }}>{children}</div>
  );
}

export function Eyebrow({ children, color = T.muted, style }) {
  return <div style={{ fontFamily: FONT_M, fontSize: 10.5, letterSpacing: 1.6, textTransform: "uppercase", color, marginBottom: 6, ...style }}>{children}</div>;
}

export function H({ children, size = 22, style }) {
  return <div style={{ fontFamily: FONT_D, fontSize: size, fontWeight: 600, letterSpacing: 0.3, color: T.bone, lineHeight: 1.1, ...style }}>{children}</div>;
}

export function Field({ label, value, onChange, placeholder, type = "text", rows, hint }) {
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
      {hint && <div style={{ fontSize: 11.5, color: T.muted, marginTop: 4, lineHeight: 1.4 }}>{hint}</div>}
    </label>
  );
}

export function Empty({ Icon, title, hint, action }) {
  return (
    <div style={{ textAlign: "center", padding: "44px 20px", color: T.muted }}>
      {Icon && <Icon size={34} style={{ opacity: .5, marginBottom: 12 }} />}
      <H size={19} style={{ marginBottom: 6 }}>{title}</H>
      <div style={{ fontSize: 13.5, marginBottom: 16, lineHeight: 1.5 }}>{hint}</div>
      {action}
    </div>
  );
}

export function Avatar({ nombre, color = T.brass, size = 40 }) {
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

export function Metric({ label, value, color = T.bone, size = 24, sub }) {
  return (
    <div style={{ textAlign: "center", minWidth: 58 }}>
      <div style={{ fontFamily: FONT_M, fontSize: size, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: T.muted, fontFamily: FONT_M, letterSpacing: .8, marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export function Chip({ children, color = T.muted, activo, onClick, Icon, style }) {
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
      padding: "7px 13px", borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: onClick ? "pointer" : "default",
      background: activo ? color : "transparent", color: activo ? T.ink : T.muted,
      border: `1px solid ${activo ? color : T.line}`, fontFamily: FONT_B,
      transition: "background .15s ease, color .15s ease", ...style,
    }}>
      {Icon && <Icon size={13} />}{children}
    </button>
  );
}

export function Barra({ v, max = 5, color, alto = 6, fondo = T.ink }) {
  return (
    <div style={{ height: alto, background: fondo, borderRadius: alto, overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${Math.min(100, (v / max) * 100)}%`, background: color,
        borderRadius: alto, transition: "width .4s cubic-bezier(.4,0,.2,1)",
      }} />
    </div>
  );
}

/* Hoja inferior deslizante, para acciones sin sacar al profesor de la clase. */
export function Sheet({ abierto, onClose, titulo, children, alto = "auto" }) {
  useEffect(() => {
    if (!abierto) return;
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [abierto, onClose]);
  if (!abierto) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "#0006", zIndex: 200,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      animation: "fadeIn .18s ease",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "100%", maxWidth: 620, maxHeight: "86vh", height: alto, overflowY: "auto",
        background: T.surface, borderTop: `1px solid ${T.line}`,
        borderTopLeftRadius: 18, borderTopRightRadius: 18,
        paddingBottom: "env(safe-area-inset-bottom)", animation: "slideUp .24s cubic-bezier(.2,.8,.2,1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px 10px", position: "sticky", top: 0, background: T.surface, zIndex: 2 }}>
          <div style={{ flex: 1 }}><H size={20}>{titulo}</H></div>
          <button onClick={onClose} style={{ background: T.raised, border: `1px solid ${T.line}`, borderRadius: 9, padding: 7, color: T.bone, cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: "0 18px 20px" }}>{children}</div>
      </div>
    </div>
  );
}

/* Confirmación explícita para acciones que no se pueden deshacer. */
export function Confirmar({ abierto, titulo, texto, confirmar = "Sí, continuar", cancelar = "Cancelar", onOk, onCancel, peligro }) {
  if (!abierto) return null;
  return (
    <div onClick={onCancel} style={{
      position: "fixed", inset: 0, background: "#0008", zIndex: 300,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 22, animation: "fadeIn .16s ease",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "100%", maxWidth: 380, background: T.surface, border: `1px solid ${T.line}`,
        borderRadius: 16, padding: 20, animation: "pop .2s cubic-bezier(.2,.9,.3,1.2)",
      }}>
        <H size={21} style={{ marginBottom: 8 }}>{titulo}</H>
        <div style={{ fontSize: 13.5, color: T.muted, lineHeight: 1.55, marginBottom: 18 }}>{texto}</div>
        <div style={{ display: "flex", gap: 9 }}>
          <Btn variant="ghost" style={{ flex: 1 }} onClick={onCancel}>{cancelar}</Btn>
          <Btn variant={peligro ? "red" : "solid"} style={{ flex: 1 }} onClick={onOk}>{confirmar}</Btn>
        </div>
      </div>
    </div>
  );
}

export function Head({ title, sub, onBack, right }) {
  return (
    <div style={{ padding: "18px 18px 10px", display: "flex", alignItems: "flex-start", gap: 12 }}>
      {onBack && (
        <button onClick={onBack} style={{ background: T.raised, border: `1px solid ${T.line}`, borderRadius: 10, padding: 9, color: T.bone, cursor: "pointer", marginTop: 2, flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
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

/* Botón que distingue toque corto de pulsación larga: en la clase en vivo,
   un toque marca un error y mantener pulsado marca un acierto. */
export function TapHold({ onTap, onHold, children, style, className, holdMs = 420, disabled }) {
  const timer = useRef(null);
  const disparado = useRef(false);
  const start = () => {
    if (disabled) return;
    disparado.current = false;
    timer.current = setTimeout(() => { disparado.current = true; onHold?.(); }, holdMs);
  };
  const end = () => {
    clearTimeout(timer.current);
    if (!disparado.current && !disabled) onTap?.();
  };
  const cancel = () => { clearTimeout(timer.current); disparado.current = true; };
  return (
    <button
      className={className}
      onPointerDown={start} onPointerUp={end} onPointerLeave={cancel} onPointerCancel={cancel}
      onContextMenu={(e) => e.preventDefault()}
      style={{ userSelect: "none", WebkitUserSelect: "none", touchAction: "manipulation", ...style }}>
      {children}
    </button>
  );
}

export function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", bottom: 92, left: "50%", transform: "translateX(-50%)",
      background: T.raised, border: `1px solid ${T.line}`, color: T.bone,
      padding: "10px 16px", borderRadius: 10, fontSize: 13.5, zIndex: 400,
      maxWidth: "88vw", textAlign: "center", animation: "slideUp .2s ease",
      boxShadow: "0 8px 24px #0006",
    }}>{msg}</div>
  );
}

export function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
      * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
      html, body { margin:0; background:${T.ink}; overscroll-behavior-y: contain; }
      input::placeholder, textarea::placeholder { color:${T.muted}88; }
      ::-webkit-scrollbar { width:8px; height:8px; }
      ::-webkit-scrollbar-thumb { background:${T.line}; border-radius:8px; }
      button:focus-visible, input:focus-visible, textarea:focus-visible { outline:2px solid ${T.brass}; outline-offset:2px; }
      @keyframes pulseLive { 0%,100%{opacity:1} 50%{opacity:.3} }
      @keyframes fadeIn { from{opacity:0} to{opacity:1} }
      @keyframes slideUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
      @keyframes pop { from{transform:scale(.94);opacity:0} to{transform:scale(1);opacity:1} }
      @keyframes flashMark { 0%{transform:scale(1)} 40%{transform:scale(1.06)} 100%{transform:scale(1)} }
      @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
      .live-dot { animation: pulseLive 1.4s ease-in-out infinite; }
      .marcado { animation: flashMark .28s ease; }
      .aparece { animation: slideUp .3s cubic-bezier(.2,.8,.2,1) both; }
      @media (prefers-reduced-motion: reduce) {
        .live-dot, .marcado, .aparece { animation: none !important; }
        * { transition: none !important; }
      }
    `}</style>
  );
}

export { T, FONT_D, FONT_B, FONT_M };
