/* ====== App principal: navegación, ajustes, PWA ====== */
import { abrirDB, guardar, obtener } from "./db.js";
import { el, toast, descargar, hoyISO, nombreMes } from "./utils.js";
import { exigirDesbloqueo, tienePIN, ponerPIN, quitarPIN } from "./pin.js";
import { exportarJSON, importarJSON, informeMensual } from "./export.js";

import * as Entreno from "./views/entreno.js";
import * as Recuperacion from "./views/recuperacion.js";
import * as Comida from "./views/comida.js";
import * as Habitos from "./views/habitos.js";
import * as Peso from "./views/peso.js";
import * as Progreso from "./views/progreso.js";

const VISTAS = {
  entreno:      { titulo: "Entreno",       render: Entreno.render },
  recuperacion: { titulo: "Recuperación",  render: Recuperacion.render },
  comida:       { titulo: "Comida",        render: Comida.render },
  habitos:      { titulo: "Hábitos",       render: Habitos.render },
  peso:         { titulo: "Peso",          render: Peso.render },
  progreso:     { titulo: "Progreso",      render: Progreso.render },
};

const app = document.getElementById("app");
const titulo = document.getElementById("titulo-vista");
const tabbar = document.getElementById("tabbar");
let vistaActual = null;

async function mostrar(nombre) {
  if (!VISTAS[nombre]) nombre = "entreno";
  vistaActual = nombre;
  titulo.textContent = VISTAS[nombre].titulo;
  app.innerHTML = "";
  app.scrollTo?.(0, 0); window.scrollTo(0, 0);
  [...tabbar.children].forEach((b) => b.classList.toggle("activa", b.dataset.vista === nombre));
  localStorage.setItem("ultima-vista", nombre);
  await VISTAS[nombre].render(app);
}

tabbar.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (btn) mostrar(btn.dataset.vista);
});

/* ---------- Ajustes (modal) ---------- */
let promptInstalar = null;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); promptInstalar = e; });

document.getElementById("btn-ajustes").addEventListener("click", abrirAjustes);

async function abrirAjustes() {
  const conPIN = await tienePIN();
  const fondo = el("div", { class: "modal-fondo", onclick: (e) => { if (e.target === fondo) fondo.remove(); } });
  const modal = el("div", { class: "modal" });

  modal.append(el("h2", {},
    el("span", {}, "⚙️ Ajustes"),
    el("button", { class: "icono-btn", onclick: () => fondo.remove() }, "✕")));

  // --- Datos: export / import / informe ---
  modal.append(el("h3", { style: "margin-top:8px" }, "Tus datos"));
  modal.append(el("p", { class: "mut mini" },
    "Todo se guarda solo en este dispositivo. Para tener al entrenador (IA) al día: exporta y pégale el JSON o el informe."));

  modal.append(botonBloque("⬇️ Exportar JSON", async () => { await exportarJSON(); toast("JSON exportado"); }));

  const inputImport = el("input", { type: "file", accept: "application/json,.json", style: "display:none" });
  inputImport.addEventListener("change", async () => {
    const f = inputImport.files[0]; if (!f) return;
    if (!confirm("¿Importar datos de este archivo? Se añadirán a los actuales.")) return;
    try { await importarJSON(f, false); toast("Datos importados"); fondo.remove(); mostrar(vistaActual); }
    catch (err) { toast("Archivo no válido"); }
  });
  modal.append(botonBloque("⬆️ Importar JSON", () => inputImport.click()));
  modal.append(inputImport);

  modal.append(botonBloque("📝 Generar informe del mes", async () => {
    const md = await informeMensual(new Date());
    descargar(`informe-${hoyISO()}.md`, md, "text/markdown");
    try { await navigator.clipboard.writeText(md); toast("Informe copiado y descargado"); }
    catch { toast("Informe descargado"); }
  }));

  modal.append(el("div", { class: "sep" }));

  // --- Seguridad: PIN ---
  modal.append(el("h3", {}, "Seguridad"));
  if (conPIN) {
    modal.append(botonBloque("🔓 Quitar PIN", async () => {
      if (confirm("¿Quitar el PIN de bloqueo?")) { await quitarPIN(); toast("PIN eliminado"); fondo.remove(); }
    }));
  } else {
    modal.append(botonBloque("🔒 Poner PIN de bloqueo", async () => {
      const pin = prompt("Elige un PIN de 4 a 6 dígitos:");
      if (!pin) return;
      if (!/^\d{4,6}$/.test(pin)) { toast("Debe tener 4-6 dígitos"); return; }
      await ponerPIN(pin); toast("PIN activado"); fondo.remove();
    }));
  }

  modal.append(el("div", { class: "sep" }));

  // --- Instalar PWA ---
  modal.append(el("h3", {}, "Instalar app"));
  if (promptInstalar) {
    modal.append(botonBloque("📲 Instalar en este dispositivo", async () => {
      promptInstalar.prompt();
      const r = await promptInstalar.userChoice;
      if (r.outcome === "accepted") toast("¡Instalada!");
      promptInstalar = null; fondo.remove();
    }));
  } else {
    modal.append(el("p", { class: "mut mini" },
      "En iPhone: Compartir → «Añadir a pantalla de inicio». En Android/PC: menú del navegador → «Instalar app»."));
  }

  modal.append(el("div", { class: "sep" }));

  // --- Borrar todo ---
  modal.append(botonBloque("🗑️ Borrar TODOS mis datos", async () => {
    if (!confirm("Esto borra TODOS tus datos de este dispositivo. ¿Seguro?")) return;
    if (!confirm("Última confirmación: no se puede deshacer.")) return;
    indexedDB.deleteDatabase("cuaderno-fuerza");
    localStorage.clear();
    toast("Datos borrados"); setTimeout(() => location.reload(), 800);
  }, "btn-peligro"));

  modal.append(el("p", { class: "mut mini centro", style: "margin-top:14px" }, "Cuaderno de Fuerza · local-first · sin servidores"));

  fondo.append(modal);
  document.body.append(fondo);
}

function botonBloque(texto, onclick, extra = "") {
  return el("button", { class: "btn btn-bloque " + extra, style: "margin-bottom:8px", onclick }, texto);
}

/* ---------- Recordatorio de informe a principios de mes ---------- */
async function recordatorioMensual() {
  const ahora = new Date();
  if (ahora.getDate() > 5) return; // solo primeros días del mes
  const claveMes = `${ahora.getFullYear()}-${ahora.getMonth()}`;
  const reg = await obtener("config", "ultimo-aviso-informe").catch(() => null);
  if (reg && reg.mes === claveMes) return; // ya avisado este mes
  setTimeout(() => {
    toast("📝 Nuevo mes: genera tu informe en Ajustes ⚙️");
  }, 1500);
  await guardar("config", { clave: "ultimo-aviso-informe", mes: claveMes });
}

/* ---------- Almacenamiento duradero ----------
   Pide al navegador que NO borre los datos automáticamente aunque haya poco
   espacio. Así no se pierden tus entrenos. (Se concede solo si instalas la app
   o la usas con frecuencia; si no, los datos siguen guardados igualmente.) */
async function pedirAlmacenamientoDuradero() {
  try {
    if (navigator.storage && navigator.storage.persist) {
      const yaDurable = await navigator.storage.persisted();
      if (!yaDurable) await navigator.storage.persist();
    }
  } catch { /* sin soporte: no pasa nada, los datos siguen en IndexedDB */ }
}

/* ---------- Service worker (offline / PWA) ---------- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

/* ---------- Arranque ---------- */
async function iniciar() {
  await abrirDB();
  await pedirAlmacenamientoDuradero();
  await exigirDesbloqueo();        // pide PIN si está configurado
  await mostrar(localStorage.getItem("ultima-vista") || "entreno");
  recordatorioMensual();
}
iniciar();
