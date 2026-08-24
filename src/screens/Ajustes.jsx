import React, { useState, useEffect } from "react";
import {
  Save, Trash2, HardDrive, Check, AlertTriangle, Upload, ShieldCheck,
  Mic, Headphones, Radio, Info, Database,
} from "lucide-react";
import { T, FONT_M } from "../theme.js";
import { hoy } from "../lib/format.js";
import {
  espacio, bytes, pedirPersistencia, pruebaDeEscritura,
  vaciarStore, ST_ARCHIVOS, ST_AUDIO, ST_ANALISIS, borrarTodoLocal,
} from "../lib/storage.js";
import { Btn, Card, Eyebrow, H, Head, Confirmar, Barra } from "../ui/primitives.jsx";

export function Ajustes({ alumnos, sesiones, planes, temario, biblioteca, onBorrarTodo, onImportar, flash }) {
  const [conf, setConf] = useState(false);
  const [uso, setUso] = useState(null);
  const [persistente, setPersistente] = useState(null);
  const [escribible, setEscribible] = useState(true);
  const [soporte, setSoporte] = useState({ mic: false, grabar: false, voz: false, idb: false });

  useEffect(() => {
    setEscribible(pruebaDeEscritura());
    espacio().then(setUso);
    navigator.storage?.persisted?.().then(setPersistente).catch(() => setPersistente(null));
    setSoporte({
      mic: !!navigator.mediaDevices?.getUserMedia,
      grabar: typeof window.MediaRecorder !== "undefined",
      voz: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
      idb: "indexedDB" in window,
    });
  }, []);

  const exportar = () => {
    const data = { version: 2, exportado: new Date().toISOString(), alumnos, sesiones, planes, temario, biblioteca };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const u = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = u;
    link.download = `agora-respaldo-${hoy()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(u), 1000);
    flash("Respaldo descargado");
  };

  const importar = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (!d.alumnos) throw new Error("formato");
        onImportar(d);
        flash(`Respaldo restaurado: ${d.alumnos.length} alumnos`);
      } catch {
        flash("El archivo no es un respaldo válido de Ágora");
      }
    };
    r.readAsText(f);
    e.target.value = "";
  };

  const borrar = async () => {
    setConf(false);
    await Promise.all([
      vaciarStore(ST_ARCHIVOS).catch(() => {}),
      vaciarStore(ST_AUDIO).catch(() => {}),
      vaciarStore(ST_ANALISIS).catch(() => {}),
    ]);
    borrarTodoLocal();
    onBorrarTodo();
    espacio().then(setUso);
    flash("Todos los datos fueron borrados");
  };

  const activarPersistencia = async () => {
    const ok = await pedirPersistencia();
    setPersistente(ok);
    flash(ok ? "El sistema ya protege tus datos" : "El sistema no concedió la protección");
  };

  return (
    <div>
      <Head title="Ajustes" sub="Datos, respaldo y diagnóstico" />
      <div style={{ padding: "0 18px 18px" }}>

        {/* Estado del guardado */}
        <Card style={{ marginBottom: 12, borderColor: escribible ? T.line : `${T.red}66` }}>
          <Eyebrow color={escribible ? T.jade : T.red}>Estado del guardado</Eyebrow>
          {escribible ? (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Check size={18} color={T.jade} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.55 }}>
                Los datos se están guardando correctamente en este dispositivo. No hay servidor, no hay cuenta
                y nada sale a internet: los datos de menores no salen de aquí.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <AlertTriangle size={18} color={T.red} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 13, color: T.bone, lineHeight: 1.55 }}>
                <b style={{ color: T.red }}>El almacenamiento está bloqueado.</b> Nada de lo que registres se conservará
                al cerrar la app. Suele ocurrir en modo incógnito o con el almacenamiento del sitio deshabilitado.
              </div>
            </div>
          )}
        </Card>

        {/* Espacio */}
        {uso && (
          <Card style={{ marginBottom: 12 }}>
            <Eyebrow>Espacio ocupado</Eyebrow>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 7 }}>
              <span style={{ color: T.bone }}>{bytes(uso.usado)}</span>
              <span style={{ color: T.muted, fontFamily: FONT_M }}>de {bytes(uso.total)} disponibles</span>
            </div>
            <Barra v={uso.usado} max={uso.total || 1} color={uso.usado / (uso.total || 1) > 0.85 ? T.red : T.sky} alto={7} />
            <div style={{ fontSize: 11.5, color: T.muted, marginTop: 9, lineHeight: 1.5 }}>
              Incluye los PDF de la biblioteca y las grabaciones de las prácticas, que son lo que más pesa.
            </div>
            {persistente === false && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: T.amber, marginBottom: 9, lineHeight: 1.5 }}>
                  El sistema podría borrar estos datos si el dispositivo se queda sin espacio.
                  Pide protección permanente para evitarlo.
                </div>
                <Btn variant="ghost" full size="sm" Icon={ShieldCheck} onClick={activarPersistencia}>
                  Proteger los datos de borrado automático
                </Btn>
              </div>
            )}
            {persistente === true && (
              <div style={{ marginTop: 10, fontSize: 12, color: T.jade, display: "flex", gap: 7, alignItems: "center" }}>
                <ShieldCheck size={14} />Datos protegidos contra borrado automático.
              </div>
            )}
          </Card>
        )}

        {/* Respaldo */}
        <Card style={{ marginBottom: 12 }}>
          <Eyebrow>Respaldo</Eyebrow>
          <div style={{ fontSize: 13, color: T.muted, marginBottom: 12, lineHeight: 1.55 }}>
            Descarga un archivo con alumnos, prácticas, planes y fichas de material para guardarlo o pasarlo a
            otro dispositivo. Los PDF y las grabaciones no se incluyen: pesan demasiado para un solo archivo.
          </div>
          <Btn variant="ghost" full Icon={Save} onClick={exportar} style={{ marginBottom: 9 }}>Descargar respaldo</Btn>
          <label style={{ display: "block" }}>
            <input type="file" accept="application/json,.json" onChange={importar} style={{ display: "none" }} />
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "11px 16px", borderRadius: 10, border: `1px solid ${T.line}`,
              color: T.bone, fontSize: 14.5, fontWeight: 600, cursor: "pointer",
            }}>
              <Upload size={17} />Restaurar desde un respaldo
            </div>
          </label>
        </Card>

        {/* Diagnóstico del dispositivo */}
        <Card style={{ marginBottom: 12 }}>
          <Eyebrow color={T.sky}>Qué puede hacer este dispositivo</Eyebrow>
          <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 12, lineHeight: 1.5 }}>
            Si algo aparece en rojo, esa función no estará disponible durante la clase.
          </div>
          <Fila ok={soporte.idb} Icon={Database} n="Guardar archivos y grabaciones"
            no="Sin IndexedDB no se pueden almacenar PDF ni audio." />
          <Fila ok={soporte.mic} Icon={Mic} n="Micrófono"
            no="Sin acceso al micrófono no hay análisis de voz." />
          <Fila ok={soporte.grabar} Icon={Headphones} n="Grabar la práctica"
            no="Este navegador no permite grabar audio." />
          <Fila ok={soporte.voz} Icon={Radio} n="Transcripción de voz a texto"
            no="Sin reconocimiento de voz no hay conteo de palabras ni muletillas." />
        </Card>

        {/* Zona de riesgo */}
        <Card>
          <Eyebrow color={T.red}>Zona de riesgo</Eyebrow>
          <div style={{ fontSize: 13, color: T.muted, marginBottom: 12, lineHeight: 1.55 }}>
            Borrar elimina alumnos, prácticas, planes, material, PDF y grabaciones de este dispositivo.
            No se puede deshacer. Descarga un respaldo antes.
          </div>
          <Btn variant="danger" full Icon={Trash2} onClick={() => setConf(true)}>Borrar todos los datos</Btn>
        </Card>

        <div style={{ textAlign: "center", marginTop: 22, fontFamily: FONT_M, fontSize: 11, color: T.muted, letterSpacing: 1, lineHeight: 1.7 }}>
          ÁGORA · v2.0<br />
          <span style={{ fontSize: 10 }}>{alumnos.length} alumnos · {sesiones.length} prácticas · {biblioteca.length} documentos</span>
        </div>
      </div>

      <Confirmar abierto={conf} peligro
        titulo="¿Borrar todos los datos?"
        texto="Se eliminan alumnos, prácticas, grabaciones, planes y todos los PDF guardados en la app. Esta acción no se puede deshacer."
        confirmar="Sí, borrar todo" onOk={borrar} onCancel={() => setConf(false)} />
    </div>
  );
}

function Fila({ ok, Icon, n, no }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderBottom: `1px solid ${T.line}44` }}>
      <Icon size={16} color={ok ? T.jade : T.red} style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: T.bone }}>{n}</div>
        {!ok && <div style={{ fontSize: 11.5, color: T.red, marginTop: 2, lineHeight: 1.45 }}>{no}</div>}
      </div>
      <span style={{ fontFamily: FONT_M, fontSize: 10.5, color: ok ? T.jade : T.red, letterSpacing: .5 }}>
        {ok ? "OK" : "NO"}
      </span>
    </div>
  );
}
