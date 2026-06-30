/* ====== Vista Recuperación ====== */
import { el, hoyISO, fechaLarga, fechaCorta, toast } from "../utils.js";
import { guardar, obtener, todos, borrar } from "../db.js";

const DESLIZADORES = [
  { id: "dolorLumbar",      label: "Dolor lumbar izquierda", min: 0, max: 10, def: 0, clase: "s-dolor" },
  { id: "molestiaCanillas", label: "Molestia en canillas",   min: 0, max: 10, def: 0, clase: "s-dolor" },
  { id: "sueno",            label: "Sueño",                  min: 1, max: 5,  def: 3, clase: "" },
  { id: "energia",          label: "Energía",                min: 1, max: 5,  def: 3, clase: "" },
];

export async function render(cont) {
  const fecha = hoyISO();
  const existente = await obtener("recuperacion", fecha) || {};
  const estado = { fecha };
  for (const d of DESLIZADORES) estado[d.id] = existente[d.id] ?? d.def;
  estado.notas = existente.notas || "";

  const card = el("div", { class: "card" });
  card.append(el("h2", {}, "¿Cómo estás hoy?"));
  card.append(el("p", { class: "mut mini" }, fechaLarga(fecha)));

  for (const d of DESLIZADORES) {
    const valSpan = el("span", { class: "slider-val" }, String(estado[d.id]));
    const rango = el("input", {
      type: "range", min: d.min, max: d.max, step: 1, value: estado[d.id],
      class: d.clase,
    });
    rango.addEventListener("input", () => { estado[d.id] = Number(rango.value); valSpan.textContent = rango.value; });
    card.append(el("div", { class: "slider-bloque" },
      el("div", { class: "slider-top" },
        el("label", { style: "margin:0" }, d.label + (d.max === 10 ? " (0-10)" : " (1-5)")),
        valSpan),
      rango));
  }

  const notas = el("textarea", { placeholder: "Notas (sueño, molestias, estrés...)" });
  notas.value = estado.notas;
  notas.addEventListener("input", () => estado.notas = notas.value);
  card.append(el("div", { class: "campo" }, el("label", {}, "Notas"), notas));

  card.append(el("button", {
    class: "btn btn-primario btn-bloque",
    onclick: async () => {
      await guardar("recuperacion", {
        fecha, dolorLumbar: estado.dolorLumbar, molestiaCanillas: estado.molestiaCanillas,
        sueno: estado.sueno, energia: estado.energia, notas: estado.notas.trim(),
      });
      toast("Recuperación guardada");
      pintarHistorial();
    }
  }, "💾 Guardar hoy"));

  cont.append(card);

  const histCont = el("div");
  cont.append(histCont);

  async function pintarHistorial() {
    const lista = (await todos("recuperacion")).sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 10);
    histCont.innerHTML = "";
    const c = el("div", { class: "card" });
    c.append(el("h2", {}, "Días registrados"));
    if (!lista.length) { c.append(el("div", { class: "vacio" }, "Sin registros aún.")); }
    else lista.forEach((r) => {
      c.append(el("div", { class: "lista-item" },
        el("div", {},
          el("div", {}, el("strong", {}, fechaCorta(r.fecha))),
          el("div", { class: "mini mut" },
            `Lumbar ${r.dolorLumbar} · Canillas ${r.molestiaCanillas} · Sueño ${r.sueno} · Energía ${r.energia}`),
        ),
        el("button", {
          class: "btn btn-sm btn-peligro",
          onclick: async () => { await borrar("recuperacion", r.fecha); toast("Borrado"); pintarHistorial(); }
        }, "Borrar"),
      ));
    });
    histCont.append(c);
  }
  pintarHistorial();
}
