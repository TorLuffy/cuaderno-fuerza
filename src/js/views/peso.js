/* ====== Vista Peso + fotos de progreso ====== */
import { el, hoyISO, fechaCorta, toast, r1, redimensionarImagen } from "../utils.js";
import { guardar, todos, borrar } from "../db.js";

export async function render(cont) {
  // --- Registro de peso ---
  const card = el("div", { class: "card" });
  card.append(el("h2", {}, "⚖️ Registrar peso"));
  const inKg = el("input", { type: "number", inputmode: "decimal", step: "0.1", placeholder: "kg (ej: 71.4)" });
  const inFecha = el("input", { type: "date", value: hoyISO() });
  card.append(el("div", { class: "grid-2" },
    el("div", {}, el("label", {}, "Peso (kg)"), inKg),
    el("div", {}, el("label", {}, "Fecha"), inFecha),
  ));
  card.append(el("button", {
    class: "btn btn-primario btn-bloque", style: "margin-top:10px",
    onclick: async () => {
      const kg = Number(inKg.value);
      if (!kg || kg <= 0) { toast("Introduce un peso válido"); return; }
      await guardar("peso", { fecha: inFecha.value || hoyISO(), kg: r1(kg) });
      toast("Peso guardado");
      inKg.value = "";
      pintarPesos();
    }
  }, "💾 Guardar peso"));
  cont.append(card);

  const listaPeso = el("div");
  cont.append(listaPeso);

  async function pintarPesos() {
    const datos = (await todos("peso")).sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id);
    listaPeso.innerHTML = "";
    const c = el("div", { class: "card" });
    c.append(el("h2", {}, "Histórico"));
    if (!datos.length) { c.append(el("div", { class: "vacio" }, "Sin pesajes aún.")); }
    else datos.forEach((p, i) => {
      const previo = datos[i + 1];
      let delta = null;
      if (previo) delta = r1(p.kg - previo.kg);
      c.append(el("div", { class: "lista-item" },
        el("div", {},
          el("strong", {}, p.kg + " kg"), "  ",
          el("span", { class: "mut mini" }, fechaCorta(p.fecha)),
        ),
        el("div", { class: "fila" },
          delta != null ? el("span", { class: delta > 0 ? "delta-sube" : delta < 0 ? "delta-baja" : "mut" },
            (delta > 0 ? "▲ +" : delta < 0 ? "▼ " : "= ") + delta + " kg") : el("span", { class: "mut mini" }, "—"),
          el("button", { class: "btn btn-sm btn-peligro", onclick: async () => { await borrar("peso", p.id); toast("Borrado"); pintarPesos(); } }, "✕"),
        ),
      ));
    });
    listaPeso.append(c);
  }
  pintarPesos();

  // --- Fotos de progreso ---
  const cardFoto = el("div", { class: "card" });
  cardFoto.append(el("h2", {}, "📸 Fotos de progreso"));
  cardFoto.append(el("p", { class: "mut mini" }, "Las fotos se redimensionan en tu móvil y se guardan SOLO aquí. Nunca se suben a internet."));
  const inputFoto = el("input", { type: "file", accept: "image/*", style: "display:none" });
  const btnFoto = el("button", { class: "btn btn-primario btn-bloque", onclick: () => inputFoto.click() }, "+ Añadir foto");
  inputFoto.addEventListener("change", async () => {
    const file = inputFoto.files[0];
    if (!file) return;
    try {
      const blob = await redimensionarImagen(file, 760, 0.82);
      await guardar("fotos", { fecha: hoyISO(), blob });
      toast("Foto guardada");
      inputFoto.value = "";
      pintarGaleria();
    } catch (e) { toast("No se pudo procesar la imagen"); }
  });
  cardFoto.append(inputFoto, btnFoto);
  const galeria = el("div", { class: "galeria", style: "margin-top:12px" });
  cardFoto.append(galeria);
  cont.append(cardFoto);

  async function pintarGaleria() {
    const fotos = (await todos("fotos")).sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id);
    galeria.innerHTML = "";
    if (!fotos.length) { galeria.append(el("div", { class: "vacio", style: "grid-column:1/-1" }, "Sin fotos todavía.")); return; }
    fotos.forEach((f) => {
      const url = URL.createObjectURL(f.blob);
      const img = el("img", { src: url, alt: "Progreso " + f.fecha, loading: "lazy" });
      img.addEventListener("load", () => setTimeout(() => URL.revokeObjectURL(url), 2000));
      galeria.append(el("div", { class: "foto-item" },
        img,
        el("div", { class: "fecha" }, fechaCorta(f.fecha)),
        el("button", { class: "borrar", onclick: async () => { await borrar("fotos", f.id); toast("Foto borrada"); pintarGaleria(); } }, "✕"),
      ));
    });
  }
  pintarGaleria();
}
