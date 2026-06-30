/* ====== Capa de datos: IndexedDB sin dependencias ======
   Todos los datos viven SOLO en este dispositivo. Nada se sube a internet. */

const NOMBRE_DB = "cuaderno-fuerza";
const VERSION_DB = 1;

// Almacenes (object stores) y su clave
const STORES = {
  entrenos:      { keyPath: "id", autoIncrement: true },      // sesiones de entreno
  recuperacion:  { keyPath: "fecha" },                        // 1 registro por día (clave = AAAA-MM-DD)
  comidas:       { keyPath: "id", autoIncrement: true },      // comidas individuales
  habitos:       { keyPath: "fecha" },                        // 1 registro por día
  peso:          { keyPath: "id", autoIncrement: true },      // pesajes
  fotos:         { keyPath: "id", autoIncrement: true },      // fotos de progreso (blob local)
  config:        { keyPath: "clave" },                        // ajustes (PIN, etc.)
};

let _db = null;

/** Abre (y migra si hace falta) la base de datos. */
export function abrirDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(NOMBRE_DB, VERSION_DB);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      for (const [nombre, opts] of Object.entries(STORES)) {
        if (!db.objectStoreNames.contains(nombre)) {
          const store = db.createObjectStore(nombre, opts);
          // Índice por fecha en los almacenes con clave autoincremental
          if (opts.autoIncrement) store.createIndex("fecha", "fecha", { unique: false });
        }
      }
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

function tx(store, modo = "readonly") {
  return _db.transaction(store, modo).objectStore(store);
}

function prom(req) {
  return new Promise((res, rej) => {
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

/** Inserta o actualiza un registro. Devuelve la clave. */
export async function guardar(store, valor) {
  await abrirDB();
  return prom(tx(store, "readwrite").put(valor));
}

/** Obtiene un registro por su clave. */
export async function obtener(store, clave) {
  await abrirDB();
  return prom(tx(store).get(clave));
}

/** Devuelve todos los registros de un almacén. */
export async function todos(store) {
  await abrirDB();
  return prom(tx(store).getAll());
}

/** Borra un registro por clave. */
export async function borrar(store, clave) {
  await abrirDB();
  return prom(tx(store, "readwrite").delete(clave));
}

/** Vacía un almacén entero. */
export async function vaciar(store) {
  await abrirDB();
  return prom(tx(store, "readwrite").clear());
}

/** Lista de nombres de almacenes (para export/import). */
export const NOMBRES_STORE = Object.keys(STORES);
