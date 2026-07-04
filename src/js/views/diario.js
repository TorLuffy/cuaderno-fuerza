/* ====== Vista Diario: resumen de todo lo registrado un día, con navegación por fechas ====== */
import { el, hoyISO, claveFecha, parseISO, fechaLarga, fechaCorta } from "../utils.js";
import { todos, obtener } from "../db.js";
import { HABITOS_LISTA, META_AGUA } from "../seed.js";

const SENSACIONES = {
  energia: "⚡ Con energía",
  normal: "😐 Normal",
  pesado: "🥱 Pesado / con hambre",
};

export async function render(cont) {
  // Datos de los almacenes con varias entradas por día (se cargan una vez)
  const [entrenos, comidas, pesajes, habitosTodos, recupTodos] = await Promise.all([
    todos("entrenos"), todos("comidas"), todos("peso"), todos("habitos"), todos("recuperacion"),
  ]);

  // Días con algún registro (para accesos rápidos e indicadores)
  const diasConDatos = new Map(); // fecha → Set de emojis
  const marcar = (fecha, emoji) => {
    if (!fecha) return;
    if (!diasConDatos.has(fecha)) diasConDatos.set(fecha, new Set());
    diasConDatos.get(fecha).add(emoji);
  };
  entrenos.forEach((e) => marcar(e.fecha, "🏋️"));
  comidas.forEach((c) => marcar(c.fecha, "🍽️"));
  pesajes.forEach((p) => marcar(p.fecha, "⚖️"));
  habitosTodos.forEach((h) => { if (h.agua || Object.values(h.checks || {}).some(Boolean)) marcar(h.fecha, "💧"); });
  recupTodos.forEach((r) => marcar(r.fecha, "🩹"));

  let fecha = hoyISO();

  // --- Navegador de fecha ---
  const nav = el("div", { class: "card" });
  const btnPrev = el("button", { class: "btn", onclick: () => mover(-1) }, "◀");
  const btnNext = el("button", { class: "btn", onclick: () => mover(1) }, "▶");
  const inputFecha = el("input", { type: "date", max: hoyISO(), style: "text-align:center" });
  inputFecha.addEventListener("change", () => {
    if (!inputFecha.value) return;
    fecha = inputFecha.value > hoyISO() ? hoyISO() : inputFecha.value;
    pintarDia();
  });
  const btnHoy = el("button", { class: "btn btn-sm", onclick: () => { fecha = hoyISO(); pintarDia(); } }, "Hoy");
  const tituloFecha = el("div", { class: "centro", style: "margin-top:8px; font-weight:700" });
  nav.append(
    el("div", { class: "fila" }, btnPrev, inputFecha, btnNext),
    tituloFecha,
    el("div", { class: "centro", style: "margin-top:6px" }, btnHoy),
  );
  cont.append(nav);

  const diaCont = el("div");
  cont.append(diaCont);

  // --- Últimos días con actividad (acceso rápido) ---
  const recientes = [...diasConDatos.keys()].sort().reverse().slice(0, 7);
  if (recientes.length) {
    const c = el("div", { class: "card" });
    c.append(el("h2", {}, "Últimos días con registros"));
    recientes.forEach((f) => c.append(el("div", { class: "lista-item", style: "cursor:pointer", onclick: () => { fecha = f; pintarDia(); window.scrollTo(0, 0); } },
      el("div", {},
        el("div", {}, el("strong", {}, fechaCorta(f)), f === hoyISO() ? el("span", { class: "mut mini" }, " (hoy)") : ""),
        el("div", { class: "mini" }, [...diasConDatos.get(f)].join(" ")),
      ),
      el("span", { class: "mut" }, "›"),
    )));
    cont.append(c);
  }

  function mover(dias) {
    const d = parseISO(fecha);
    d.setDate(d.getDate() + dias);
    const nueva = claveFecha(d);
    if (nueva > hoyISO()) return;
    fecha = nueva;
    pintarDia();
  }

  async function pintarDia() {
    inputFecha.value = fecha;
    btnNext.disabled = fecha >= hoyISO();
    tituloFecha.textContent = fechaLarga(fecha) + (fecha === hoyISO() ? " · hoy" : "");
    diaCont.innerHTML = "";

    const sesiones = entrenos.filter((e) => e.fecha === fecha);
    const comidasDia = comidas.filter((c) => c.fecha === fecha).sort((a, b) => a.id - b.id);
    const pesoDia = pesajes.filter((p) => p.fecha === fecha);
    const [hab, rec] = await Promise.all([obtener("habitos", fecha), obtener("recuperacion", fecha)]);

    const hayDatos = sesiones.length || comidasDia.length || pesoDia.length ||
      (hab && (hab.agua || Object.values(hab.checks || {}).some(Boolean))) || rec;

    if (!hayDatos) {
      diaCont.append(el("div", { class: "card" }, el("div", { class: "vacio" }, "Sin registros este día.")));
      return;
    }

    // 🏋️ Entreno
    if (sesiones.length) {
      const c = el("div", { class: "card" });
      c.append(el("h2", {}, "🏋️ Entreno"));
      sesiones.forEach((s) => {
        c.append(el("h3", { style: "margin-top:8px" }, `Sesión ${s.tipo}`));
        (s.ejercicios || []).forEach((ej) => {
          const conSeries = (ej.series || []).filter((x) => x.reps || x.peso);
          if (!conSeries.length) return;
          c.append(el("div", { class: "lista-item" },
            el("div", {},
              el("div", {}, el("strong", {}, ej.nombre)),
              el("div", { class: "mini mut" }, formatoSeries(conSeries)),
            ),
          ));
        });
        if (s.notas) c.append(el("p", { class: "mut mini", style: "margin-top:6px" }, "📝 " + s.notas));
      });
      diaCont.append(c);
    }

    // 🍽️ Comida
    if (comidasDia.length) {
      const c = el("div", { class: "card" });
      c.append(el("h2", {}, "🍽️ Comida"));
      c.append(el("div", { class: "resumen", style: "margin-bottom:8px" },
        pill(comidasDia.length, "comidas"),
        pill(comidasDia.filter((x) => x.proteina).length, "con proteína"),
        pill(comidasDia.filter((x) => x.verdura).length, "con verdura"),
      ));
      comidasDia.forEach((m) => c.append(el("div", { class: "lista-item" },
        el("div", {},
          el("div", {}, el("strong", {}, m.tipo), " ", el("span", { class: "mut mini" }, m.descripcion)),
          el("div", { class: "mini mut" },
            `${m.proteina ? "🥚 " : ""}${m.verdura ? "🥦 " : ""}${SENSACIONES[m.sensacion] || ""}`),
        ),
      )));
      diaCont.append(c);
    }

    // 💧 Hábitos
    if (hab && (hab.agua || Object.values(hab.checks || {}).some(Boolean))) {
      const c = el("div", { class: "card" });
      c.append(el("h2", {}, "💧 Hábitos"));
      c.append(el("p", {}, `Agua: ${hab.agua || 0} de ${META_AGUA} vasos`));
      const hechos = HABITOS_LISTA.filter((h) => hab.checks?.[h.id]);
      if (hechos.length) {
        const ul = el("ul", { style: "margin:0; padding-left:18px" });
        hechos.forEach((h) => ul.append(el("li", {}, "✅ " + h.texto)));
        c.append(ul);
      } else {
        c.append(el("p", { class: "mut mini" }, "Ningún ítem del checklist marcado."));
      }
      diaCont.append(c);
    }

    // ⚖️ Peso
    if (pesoDia.length) {
      const c = el("div", { class: "card" });
      c.append(el("h2", {}, "⚖️ Peso"));
      pesoDia.forEach((p) => c.append(el("p", {}, el("strong", {}, `${p.kg} kg`))));
      diaCont.append(c);
    }

    // 🩹 Recuperación
    if (rec) {
      const c = el("div", { class: "card" });
      c.append(el("h2", {}, "🩹 Recuperación"));
      c.append(el("div", { class: "resumen" },
        pill(rec.dolorLumbar ?? "—", "dolor lumbar /10"),
        pill(rec.molestiaCanillas ?? "—", "canillas /10"),
        pill(rec.sueno ?? "—", "sueño /5"),
        pill(rec.energia ?? "—", "energía /5"),
      ));
      if (rec.notas) c.append(el("p", { class: "mut mini", style: "margin-top:8px" }, "📝 " + rec.notas));
      diaCont.append(c);
    }
  }

  pintarDia();
}

/** Formatea series: agrupa consecutivas iguales ("3×10 @9kg"), si no "10×9, 8×9". */
function formatoSeries(series) {
  const partes = [];
  let i = 0;
  while (i < series.length) {
    let j = i;
    while (j + 1 < series.length && series[j + 1].reps === series[i].reps && series[j + 1].peso === series[i].peso) j++;
    const n = j - i + 1;
    const { reps, peso } = series[i];
    const pesoTxt = peso ? ` @${peso}kg` : "";
    partes.push(`${n}×${reps || 0}${pesoTxt}`);
    i = j + 1;
  }
  return partes.join(", ");
}

function pill(n, t) {
  return el("div", { class: "pill" }, el("div", { class: "n" }, String(n)), el("div", { class: "t" }, t));
}
