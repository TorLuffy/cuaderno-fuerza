/* ====== Utilidades compartidas ====== */

/** Fecha de hoy en formato AAAA-MM-DD (hora local). */
export function hoyISO() {
  const d = new Date();
  return claveFecha(d);
}

/** Convierte un Date a clave AAAA-MM-DD local. */
export function claveFecha(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Muestra una fecha ISO en formato legible (ej. "mar 12 mar"). */
export function fechaCorta(iso) {
  const d = parseISO(iso);
  return d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
}

/** Fecha larga legible. */
export function fechaLarga(iso) {
  const d = parseISO(iso);
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function parseISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Devuelve el nombre del mes en español a partir de un Date. */
export function nombreMes(d) {
  return d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

/** Clave de semana ISO (AAAA-Www) para agrupar entrenos por semana. */
export function claveSemana(iso) {
  const d = parseISO(iso);
  // Jueves de la semana ISO
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const fnr = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - fnr + 3);
  const semana = 1 + Math.round((target - firstThursday) / (7 * 24 * 3600 * 1000));
  return `${target.getFullYear()}-S${String(semana).padStart(2, "0")}`;
}

/** Pequeño helper para crear elementos del DOM. */
export function el(tag, attrs = {}, ...hijos) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (k === "dataset") Object.assign(node.dataset, v);
    else if (v !== null && v !== undefined && v !== false) node.setAttribute(k, v);
  }
  for (const h of hijos.flat()) {
    if (h === null || h === undefined || h === false) continue;
    node.append(h.nodeType ? h : document.createTextNode(String(h)));
  }
  return node;
}

/** Aviso emergente breve. */
let _toastTimer = null;
export function toast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.remove("oculto");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.add("oculto"), 2200);
}

/** Redondea a 1 decimal. */
export const r1 = (n) => Math.round(n * 10) / 10;

/** Descarga un blob como archivo. */
export function descargar(nombre, contenido, tipo = "application/json") {
  const blob = contenido instanceof Blob ? contenido : new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nombre;
  document.body.appendChild(a); a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Redimensiona una imagen en el cliente a JPEG ~maxLado px. Devuelve un Blob.
    La imagen NUNCA sale del dispositivo. */
export function redimensionarImagen(file, maxLado = 760, calidad = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > height && width > maxLado) { height = Math.round(height * maxLado / width); width = maxLado; }
      else if (height > maxLado) { width = Math.round(width * maxLado / height); height = maxLado; }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("No se pudo procesar la imagen")), "image/jpeg", calidad);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Imagen no válida")); };
    img.src = url;
  });
}

/** Hash SHA-256 en hex (para el PIN, sin guardar el PIN en claro). */
export async function sha256(texto) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Media de una lista de números (ignora null/undefined). */
export function media(nums) {
  const v = nums.filter((n) => typeof n === "number" && !isNaN(n));
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}
