/* ====== Vista Entreno ====== */
import { el, hoyISO, fechaCorta, toast } from "../utils.js";
import { guardar, todos, borrar } from "../db.js";
import { SESIONES, CALENTAMIENTO } from "../seed.js";

// Nº de series por defecto a partir del rango ("3×8-10" → 3)
function seriesPorDefecto(rango) {
  const m = rango.match(/^(\d+)\s*[×x]/);
  return m ? parseInt(m[1], 10) : 3;
}

export async function render(cont) {
  // Estado de trabajo de la sesión en curso
  const estado = { tipo: "A", ejercicios: null, notas: "" };

  const wrap = el("div");
  cont.append(wrap);

  // --- Selector de sesión ---
  const selector = el("div", { class: "chips", style: "margin-bottom:14px" });
  for (const k of Object.keys(SESIONES)) {
    selector.append(el("button", {
      class: "chip" + (k === estado.tipo ? " activo" : ""),
      dataset: { k },
      onclick: () => { estado.tipo = k; estado.ejercicios = null; pintar(); }
    }, "Sesión " + k));
  }
  wrap.append(selector);

  const contenedor = el("div");
  wrap.append(contenedor);

  // Acordeón de calentamiento
  wrap.append(acordeonCalentamiento());

  // Historial reciente
  const histCont = el("div");
  wrap.append(histCont);

  function nuevoEstadoEjercicios() {
    return SESIONES[estado.tipo].ejercicios.map((ej) => ({
      nombre: ej.nombre, rango: ej.rango, nota: ej.nota,
      series: Array.from({ length: seriesPorDefecto(ej.rango) }, () => ({ reps: "", peso: ej.peso || "" })),
    }));
  }

  function pintar() {
    // Marcar chip activo
    [...selector.children].forEach((c) => c.classList.toggle("activo", c.dataset.k === estado.tipo));
    if (!estado.ejercicios) estado.ejercicios = nuevoEstadoEjercicios();

    contenedor.innerHTML = "";
    const sesion = SESIONES[estado.tipo];

    const card = el("div", { class: "card" });
    card.append(el("h2", {}, sesion.nombre));

    estado.ejercicios.forEach((ej, ei) => {
      const bloque = el("div", { class: "ejercicio" });
      bloque.append(el("div", { class: "ej-cabecera" },
        el("span", { class: "ej-nombre" }, ej.nombre),
        el("span", { class: "ej-rango" }, ej.rango),
      ));
      bloque.append(el("div", { class: "ej-nota" }, ej.nota));

      const filas = el("div");
      ej.series.forEach((s, si) => filas.append(filaSerie(ej, ei, si)));
      bloque.append(filas);

      bloque.append(el("button", {
        class: "btn btn-sm btn-bloque", style: "margin-top:6px",
        onclick: () => { ej.series.push({ reps: "", peso: ej.series.at(-1)?.peso || "" }); pintar(); }
      }, "+ Añadir serie"));

      card.append(bloque);
    });

    // Notas
    const notas = el("textarea", { placeholder: "Notas de la sesión (cómo te sentiste, molestias, técnica...)" });
    notas.value = estado.notas;
    notas.addEventListener("input", () => estado.notas = notas.value);
    card.append(el("div", { class: "campo", style: "margin-top:12px" },
      el("label", {}, "Notas"), notas));

    card.append(el("button", {
      class: "btn btn-primario btn-bloque", onclick: guardarSesion
    }, "💾 Guardar entreno"));

    contenedor.append(card);
  }

  function filaSerie(ej, ei, si) {
    const s = ej.series[si];
    const reps = el("input", { type: "number", inputmode: "numeric", placeholder: "reps", value: s.reps });
    const peso = el("input", { type: "number", inputmode: "decimal", step: "0.5", placeholder: "kg", value: s.peso });
    reps.addEventListener("input", () => s.reps = reps.value);
    peso.addEventListener("input", () => s.peso = peso.value);
    const quitar = el("button", {
      class: "quitar", title: "Quitar serie",
      onclick: () => { ej.series.splice(si, 1); pintar(); }
    }, "✕");
    return el("div", { class: "serie" },
      el("span", { class: "nser" }, si + 1), reps, peso,
      ej.series.length > 1 ? quitar : el("span"));
  }

  async function guardarSesion() {
    // Solo guardamos series con al menos reps rellenadas
    const ejercicios = estado.ejercicios.map((ej) => ({
      nombre: ej.nombre, rango: ej.rango,
      series: ej.series
        .filter((s) => s.reps !== "" && s.reps != null)
        .map((s) => ({ reps: Number(s.reps), peso: s.peso === "" ? 0 : Number(s.peso) })),
    })).filter((ej) => ej.series.length);

    if (!ejercicios.length) { toast("Apunta al menos una serie"); return; }

    await guardar("entrenos", {
      fecha: hoyISO(), tipo: estado.tipo, ejercicios, notas: estado.notas.trim(),
    });
    toast("Entreno guardado 💪");
    estado.ejercicios = null; estado.notas = "";
    pintar();
    pintarHistorial();
  }

  async function pintarHistorial() {
    const lista = (await todos("entrenos")).sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id).slice(0, 8);
    histCont.innerHTML = "";
    const card = el("div", { class: "card" });
    card.append(el("h2", {}, "Últimos entrenos"));
    if (!lista.length) {
      card.append(el("div", { class: "vacio" }, "Aún no has registrado entrenos."));
    } else {
      lista.forEach((e) => {
        const totSeries = e.ejercicios.reduce((a, ej) => a + ej.series.length, 0);
        card.append(el("div", { class: "lista-item" },
          el("div", {},
            el("div", {}, el("strong", {}, "Sesión " + e.tipo), "  ", el("span", { class: "mut" }, fechaCorta(e.fecha))),
            el("div", { class: "mini mut" }, `${e.ejercicios.length} ejercicios · ${totSeries} series`),
          ),
          el("button", {
            class: "btn btn-sm btn-peligro",
            onclick: async () => { await borrar("entrenos", e.id); toast("Entreno borrado"); pintarHistorial(); }
          }, "Borrar"),
        ));
      });
    }
    histCont.append(card);
  }

  pintar();
  pintarHistorial();
}

function acordeonCalentamiento() {
  const d = el("details", { class: "acordeon" });
  d.append(el("summary", {}, "🔥 Calentamiento · movilidad · acondicionamiento"));
  const cuerpo = el("div", { class: "acordeon-cuerpo" });
  cuerpo.append(el("p", {}, el("strong", {}, "Antes (5 min):")));
  cuerpo.append(lista(CALENTAMIENTO.antes));
  cuerpo.append(el("p", {}, el("strong", {}, "Después (10-15 min):")));
  cuerpo.append(lista(CALENTAMIENTO.despues));
  cuerpo.append(el("div", { class: "aviso-box", style: "margin-top:10px" }, "⚠️ " + CALENTAMIENTO.regla));
  d.append(cuerpo);
  return d;
}

function lista(items) {
  const ul = el("ul");
  items.forEach((t) => ul.append(el("li", {}, t)));
  return ul;
}
