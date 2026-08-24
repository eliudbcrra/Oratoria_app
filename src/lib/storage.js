/* ---------------------------------------------------------------------------
   Persistencia de Ágora.

   La v1 llamaba a `window.storage`, que no existe en ningún navegador: todos
   los guardados fallaban en silencio y los datos se perdían al cerrar la app.

   Ahora hay dos capas reales:
     · localStorage — datos ligeros (alumnos, sesiones, planes, temario, fichas).
     · IndexedDB    — binarios y series pesadas (PDF, audio de la práctica,
                      curvas de voz y transcripción), que no caben en 5 MB.
   ------------------------------------------------------------------------- */

const PREFIJO = "agora:";
export const K_CORE = "core_v2";
export const K_SES = "sesiones_v2";
export const K_PREFS = "prefs_v2";

/* ------------------------------- localStorage ----------------------------- */
export function leer(key, fallback) {
  try {
    const raw = window.localStorage.getItem(PREFIJO + key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function escribir(key, value) {
  try {
    window.localStorage.setItem(PREFIJO + key, JSON.stringify(value));
    return { ok: true };
  } catch (e) {
    // QuotaExceededError: el disco de la app está lleno. Lo reportamos para
    // que la interfaz avise en vez de perder el trabajo en silencio.
    return { ok: false, error: e?.name === "QuotaExceededError" ? "cuota" : "desconocido" };
  }
}

export function borrarTodoLocal() {
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(PREFIJO))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {}
}

/* Comprueba de verdad que se puede escribir; la interfaz lo muestra en Ajustes. */
export function pruebaDeEscritura() {
  try {
    const k = PREFIJO + "__test";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

/* --------------------------------- IndexedDB ------------------------------ */
const DB_NOMBRE = "agora";
const DB_VERSION = 1;
export const ST_ARCHIVOS = "archivos"; // PDFs subidos por el profesor
export const ST_AUDIO = "audio";       // grabaciones de práctica
export const ST_ANALISIS = "analisis"; // series de voz + transcripción por sesión

let dbPromesa = null;

function abrirDB() {
  if (dbPromesa) return dbPromesa;
  dbPromesa = new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) return reject(new Error("Sin IndexedDB"));
    const req = window.indexedDB.open(DB_NOMBRE, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      [ST_ARCHIVOS, ST_AUDIO, ST_ANALISIS].forEach((s) => {
        if (!db.objectStoreNames.contains(s)) db.createObjectStore(s);
      });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromesa;
}

function tx(store, modo, fn) {
  return abrirDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(store, modo);
        const req = fn(t.objectStore(store));
        t.oncomplete = () => resolve(req?.result);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      })
  );
}

export const guardarBlob = (store, id, valor) => tx(store, "readwrite", (s) => s.put(valor, id));
export const leerBlob = (store, id) => tx(store, "readonly", (s) => s.get(id));
export const borrarBlob = (store, id) => tx(store, "readwrite", (s) => s.delete(id));
export const listarClaves = (store) => tx(store, "readonly", (s) => s.getAllKeys());
export const vaciarStore = (store) => tx(store, "readwrite", (s) => s.clear());

/* Espacio usado y disponible, para mostrarlo en Ajustes. */
export async function espacio() {
  try {
    if (navigator.storage?.estimate) {
      const { usage, quota } = await navigator.storage.estimate();
      return { usado: usage || 0, total: quota || 0 };
    }
  } catch {}
  return null;
}

/* Pide al sistema que no borre los datos si el dispositivo se queda sin espacio. */
export async function pedirPersistencia() {
  try {
    if (navigator.storage?.persist) {
      if (await navigator.storage.persisted()) return true;
      return await navigator.storage.persist();
    }
  } catch {}
  return false;
}

export const bytes = (n) => {
  if (!n) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  const i = Math.min(u.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return `${(n / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${u[i]}`;
};
