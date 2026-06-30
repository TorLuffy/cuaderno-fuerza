/* ====== Exportar / Importar datos e informe mensual ======
   Como no hay servidor, esta es la vía para llevar los datos a otro dispositivo
   o pasárselos al entrenador (IA): exportas el JSON / informe y lo compartes. */

import { todos, guardar, vaciar, NOMBRES_STORE } from "./db.js";
import { descargar, hoyISO, claveFecha, nombreMes, media, r1, fechaCorta } from "./utils.js";
import { HABITOS_LISTA } from "./seed.js";

const VERSION_EXPORT = 1;

/** Reúne todos los datos (las fotos solo por fecha, sin las imágenes). */
async function recopilar() {
  const data = {};
  for (const store of NOMBRES_STORE) {
    if (store === "config") continue; // no exportamos el hash del PIN
    let registros = await todos(store);
    if (store === "fotos") {
      // Solo metadatos, nunca la imagen
      registros = registros.map((f) => ({ id: f.id, fecha: f.fecha }));
    }
    data[store] = registros;
  }
  return data;
}

/** Exporta todo a un archivo .json descargable. */
export async function exportarJSON() {
  const datos = await recopilar();
  const paquete = {
    app: "Cuaderno de Fuerza",
    version: VERSION_EXPORT,
    exportado: new Date().toISOString(),
    datos,
  };
  descargar(`cuaderno-fuerza-${hoyISO()}.json`, JSON.stringify(paquete, null, 2));
}

/** Importa desde un archivo .json. reemplazar=true vacía antes de cargar. */
export async function importarJSON(file, reemplazar = false) {
  const texto = await file.text();
  const paquete = JSON.parse(texto);
  const datos = paquete.datos || paquete; // tolerante a formatos
  for (const store of NOMBRES_STORE) {
    if (store === "config") continue;
    if (!datos[store]) continue;
    if (reemplazar && store !== "fotos") await vaciar(store);
    for (const reg of datos[store]) {
      if (store === "fotos") continue; // las fotos no se importan (solo eran metadatos)
      await guardar(store, reg);
    }
  }
}

/** Genera un informe mensual en Markdown listo para pegar en el chat. */
export async function informeMensual(fechaRef = new Date()) {
  const año = fechaRef.getFullYear();
  const mes = fechaRef.getMonth();
  const desde = new Date(año, mes, 1);
  const hasta = new Date(año, mes + 1, 0);
  const dentro = (iso) => { const d = new Date(iso); return d >= desde && d <= new Date(año, mes + 1, 1); };
  const enRango = (iso) => iso >= claveFecha(desde) && iso <= claveFecha(hasta);

  const [entrenos, recup, peso, comidas, habitos] = await Promise.all([
    todos("entrenos"), todos("recuperacion"), todos("peso"), todos("comidas"), todos("habitos"),
  ]);

  const entMes = entrenos.filter((e) => enRango(e.fecha));
  const recMes = recup.filter((r) => enRango(r.fecha));
  const pesoMes = peso.filter((p) => enRango(p.fecha)).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const habMes = habitos.filter((h) => enRango(h.fecha));

  // Peso: inicio/fin y variación
  let lineaPeso = "Sin pesajes este mes.";
  if (pesoMes.length) {
    const ini = pesoMes[0], fin = pesoMes[pesoMes.length - 1];
    const delta = r1(fin.kg - ini.kg);
    lineaPeso = `${ini.kg} kg (${fechaCorta(ini.fecha)}) → ${fin.kg} kg (${fechaCorta(fin.fecha)}) · variación ${delta > 0 ? "+" : ""}${delta} kg`;
  }

  // Medias de dolor
  const mLumbar = media(recMes.map((r) => r.dolorLumbar));
  const mCanillas = media(recMes.map((r) => r.molestiaCanillas));
  const mSueno = media(recMes.map((r) => r.sueno));
  const mEnergia = media(recMes.map((r) => r.energia));

  // Adherencia de hábitos
  const totalChecks = habMes.reduce((s, h) => s + HABITOS_LISTA.filter((x) => h.checks?.[x.id]).length, 0);
  const maxChecks = habMes.length * HABITOS_LISTA.length;
  const adherencia = maxChecks ? Math.round((totalChecks / maxChecks) * 100) : 0;

  // Volumen de entreno (series totales)
  const seriesTot = entMes.reduce((s, e) => s + (e.ejercicios || []).reduce((a, ej) => a + (ej.series?.length || 0), 0), 0);
  const tipos = entMes.reduce((m, e) => { m[e.tipo] = (m[e.tipo] || 0) + 1; return m; }, {});

  // Notas destacadas
  const notas = entMes.filter((e) => e.notas?.trim()).map((e) => `- ${fechaCorta(e.fecha)} (${e.tipo}): ${e.notas.trim()}`);
  const notasRec = recMes.filter((r) => r.notas?.trim()).map((r) => `- ${fechaCorta(r.fecha)}: ${r.notas.trim()}`);

  const md = `# Informe — ${nombreMes(fechaRef)}

## Entrenamiento
- **Sesiones:** ${entMes.length} (meta 12-13/mes ≈ 3/sem)
- **Reparto:** A=${tipos.A || 0} · B=${tipos.B || 0} · C=${tipos.C || 0}
- **Series totales (volumen):** ${seriesTot}

## Peso
- ${lineaPeso}

## Recuperación (medias, registros: ${recMes.length})
- **Dolor lumbar izq.:** ${mLumbar == null ? "—" : r1(mLumbar) + " / 10"}
- **Molestia canillas:** ${mCanillas == null ? "—" : r1(mCanillas) + " / 10"}
- **Sueño:** ${mSueno == null ? "—" : r1(mSueno) + " / 5"}
- **Energía:** ${mEnergia == null ? "—" : r1(mEnergia) + " / 5"}

## Hábitos
- **Días registrados:** ${habMes.length}
- **Adherencia checklist:** ${adherencia}%

## Notas destacadas
${notas.length ? notas.join("\n") : "- (sin notas de entreno)"}
${notasRec.length ? "\n**Recuperación:**\n" + notasRec.join("\n") : ""}

---
*Generado por Cuaderno de Fuerza el ${hoyISO()}. Pega esto en el chat con tu entrenador IA.*
`;
  return md;
}
