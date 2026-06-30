/* ====== Vista Progreso / Gráficas ====== */
import { el, fechaCorta, claveSemana, parseISO } from "../utils.js";
import { todos } from "../db.js";
import { lineas, barras } from "../charts.js";
import { HABITOS_LISTA } from "../seed.js";

export async function render(cont) {
  const [peso, recup, entrenos, habitos] = await Promise.all([
    todos("peso"), todos("recuperacion"), todos("entrenos"), todos("habitos"),
  ]);

  // Helper: tarjeta con canvas
  const pendientes = [];
  function graficaCard(titulo, subtitulo, dibujar, alto = 180) {
    const canvas = el("canvas", { style: `height:${alto}px` });
    const card = el("div", { class: "card grafica-card" },
      el("h2", {}, titulo),
      subtitulo ? el("p", { class: "mut mini" }, subtitulo) : null,
      canvas);
    cont.append(card);
    pendientes.push(() => dibujar(canvas));
  }

  // 1) Peso en el tiempo
  const pesoOrd = [...peso].sort((a, b) => a.fecha.localeCompare(b.fecha));
  graficaCard("Peso", "Evolución del peso corporal (kg)", (cv) => {
    lineas(cv, pesoOrd.map((p) => fechaCorta(p.fecha)),
      [{ datos: pesoOrd.map((p) => p.kg), color: "#4f8cff" }]);
  });

  // 2) Dolor lumbar y canillas
  const recOrd = [...recup].sort((a, b) => a.fecha.localeCompare(b.fecha));
  graficaCard("Dolor / molestias", "Lumbar izq. (rojo) y canillas (naranja) — queremos que bajen", (cv) => {
    lineas(cv, recOrd.map((r) => fechaCorta(r.fecha)), [
      { datos: recOrd.map((r) => r.dolorLumbar), color: "#ff6b6b" },
      { datos: recOrd.map((r) => r.molestiaCanillas), color: "#ffb454" },
    ], { yMin: 0, yMax: 10 });
  });

  // 3) Volumen de entreno por semana (series totales)
  const semVol = agrupaSemanas(entrenos, (e) => (e.ejercicios || []).reduce((a, ej) => a + (ej.series?.length || 0), 0));
  graficaCard("Volumen semanal", "Series totales registradas por semana", (cv) => {
    barras(cv, semVol.etiquetas, [{ datos: semVol.valores, color: "#4f8cff" }]);
  });

  // 4) Nº de entrenos por semana (meta 3)
  const semEnt = agrupaSemanas(entrenos, () => 1);
  graficaCard("Entrenos por semana", "Meta: 3/semana (línea verde)", (cv) => {
    barras(cv, semEnt.etiquetas, [{ datos: semEnt.valores, color: "#36c98e" }], { meta: 3, yMax: Math.max(4, ...semEnt.valores) });
  });

  // 5) Adherencia de hábitos por semana (%)
  const semHab = adherenciaSemanas(habitos);
  graficaCard("Adherencia de hábitos", "% de hábitos cumplidos por semana", (cv) => {
    lineas(cv, semHab.etiquetas, [{ datos: semHab.valores, color: "#36c98e" }], { yMin: 0, yMax: 100 });
  });

  if (!peso.length && !recup.length && !entrenos.length && !habitos.length) {
    cont.innerHTML = "";
    cont.append(el("div", { class: "vacio" },
      el("p", {}, "📈 Aún no hay datos."),
      el("p", { class: "mini" }, "Registra entrenos, peso y recuperación y aquí verás tu progreso.")));
    return;
  }

  // Dibujar ya: leer clientWidth fuerza el cálculo de layout, así que el
  // canvas tiene ancho real sin depender de requestAnimationFrame.
  const dibujarTodo = () => pendientes.forEach((fn) => fn());
  dibujarTodo();
  // Reintento por si la fuente/tipografía cambió el layout, y redibujo al rotar
  requestAnimationFrame(dibujarTodo);
  let t;
  window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(dibujarTodo, 150); });
}

// Agrupa registros con fecha en semanas ISO, sumando con la función dada
function agrupaSemanas(registros, valorFn) {
  const mapa = new Map();
  for (const r of registros) {
    const k = claveSemana(r.fecha);
    mapa.set(k, (mapa.get(k) || 0) + valorFn(r));
  }
  return ordenarSemanas(mapa);
}

function adherenciaSemanas(habitos) {
  const acum = new Map(); // k -> {hechos, total}
  for (const h of habitos) {
    const k = claveSemana(h.fecha);
    const cur = acum.get(k) || { hechos: 0, total: 0 };
    cur.hechos += HABITOS_LISTA.filter((x) => h.checks?.[x.id]).length;
    cur.total += HABITOS_LISTA.length;
    acum.set(k, cur);
  }
  const mapa = new Map();
  for (const [k, v] of acum) mapa.set(k, v.total ? Math.round((v.hechos / v.total) * 100) : 0);
  return ordenarSemanas(mapa);
}

function ordenarSemanas(mapa) {
  const claves = [...mapa.keys()].sort().slice(-10); // últimas 10 semanas
  return {
    etiquetas: claves.map((k) => k.split("-S")[1] ? "S" + k.split("-S")[1] : k),
    valores: claves.map((k) => mapa.get(k)),
  };
}
