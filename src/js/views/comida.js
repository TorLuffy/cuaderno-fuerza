/* ====== Vista Comida ====== */
import { el, hoyISO, fechaCorta, toast } from "../utils.js";
import { guardar, todos, borrar } from "../db.js";
import { PLAN_DIETA } from "../seed.js";

const TIPOS = ["Desayuno", "Comida", "Snack", "Cena"];
const SENSACIONES = [
  { id: "energia", txt: "Con energía", emo: "⚡" },
  { id: "normal", txt: "Normal", emo: "😐" },
  { id: "pesado", txt: "Pesado / con hambre", emo: "🥱" },
];

export async function render(cont) {
  const estado = { tipo: "Comida", descripcion: "", proteina: false, verdura: false, sensacion: "normal" };

  const card = el("div", { class: "card" });
  card.append(el("h2", {}, "Registrar comida"));

  // Tipo
  const chipsTipo = el("div", { class: "chips" });
  TIPOS.forEach((t) => chipsTipo.append(el("button", {
    class: "chip" + (t === estado.tipo ? " activo" : ""),
    onclick: () => { estado.tipo = t; [...chipsTipo.children].forEach((c) => c.classList.toggle("activo", c.textContent === t)); }
  }, t)));
  card.append(el("div", { class: "campo" }, el("label", {}, "Tipo"), chipsTipo));

  // Descripción
  const desc = el("input", { placeholder: "Ej: salmón + arroz integral + ensalada" });
  desc.addEventListener("input", () => estado.descripcion = desc.value);
  card.append(el("div", { class: "campo" }, el("label", {}, "¿Qué comiste?"), desc));

  // Toggles proteína / verdura
  const tProt = el("button", { class: "toggle" }, "🥚 Tiene proteína");
  const tVerd = el("button", { class: "toggle" }, "🥦 Tiene verdura");
  tProt.addEventListener("click", () => { estado.proteina = !estado.proteina; tProt.classList.toggle("activo", estado.proteina); });
  tVerd.addEventListener("click", () => { estado.verdura = !estado.verdura; tVerd.classList.toggle("activo", estado.verdura); });
  card.append(el("div", { class: "campo fila", style: "flex-wrap:wrap" }, tProt, tVerd));

  // Sensación
  const chipsSens = el("div", { class: "chips" });
  SENSACIONES.forEach((s) => chipsSens.append(el("button", {
    class: "chip" + (s.id === estado.sensacion ? " activo" : ""),
    dataset: { id: s.id },
    onclick: () => { estado.sensacion = s.id; [...chipsSens.children].forEach((c) => c.classList.toggle("activo", c.dataset.id === s.id)); }
  }, `${s.emo} ${s.txt}`)));
  card.append(el("div", { class: "campo" }, el("label", {}, "¿Cómo te sentó?"), chipsSens));

  card.append(el("button", {
    class: "btn btn-primario btn-bloque",
    onclick: async () => {
      if (!estado.descripcion.trim()) { toast("Describe la comida"); return; }
      await guardar("comidas", {
        fecha: hoyISO(), tipo: estado.tipo, descripcion: estado.descripcion.trim(),
        proteina: estado.proteina, verdura: estado.verdura, sensacion: estado.sensacion,
      });
      toast("Comida registrada 🍽️");
      desc.value = ""; estado.descripcion = "";
      estado.proteina = false; estado.verdura = false;
      tProt.classList.remove("activo"); tVerd.classList.remove("activo");
      pintarResumen();
    }
  }, "💾 Guardar comida"));
  cont.append(card);

  // Plan de dieta (desplegable)
  cont.append(acordeonPlan());

  // Resumen del día
  const resumenCont = el("div");
  cont.append(resumenCont);

  async function pintarResumen() {
    const hoy = hoyISO();
    const lista = (await todos("comidas")).filter((c) => c.fecha === hoy).sort((a, b) => b.id - a.id);
    resumenCont.innerHTML = "";
    const c = el("div", { class: "card" });
    c.append(el("h2", {}, "Hoy"));
    c.append(el("div", { class: "resumen" },
      pill(lista.length, "comidas"),
      pill(lista.filter((x) => x.proteina).length, "con proteína"),
      pill(lista.filter((x) => x.verdura).length, "con verdura"),
    ));
    if (!lista.length) c.append(el("div", { class: "vacio" }, "Aún no has registrado comidas hoy."));
    else lista.forEach((m) => {
      const sens = SENSACIONES.find((s) => s.id === m.sensacion);
      c.append(el("div", { class: "lista-item" },
        el("div", {},
          el("div", {}, el("strong", {}, m.tipo), " ", el("span", { class: "mut mini" }, m.descripcion)),
          el("div", { class: "mini mut" },
            `${m.proteina ? "🥚 " : ""}${m.verdura ? "🥦 " : ""}${sens ? sens.emo + " " + sens.txt : ""}`),
        ),
        el("button", {
          class: "btn btn-sm btn-peligro",
          onclick: async () => { await borrar("comidas", m.id); toast("Borrada"); pintarResumen(); }
        }, "✕"),
      ));
    });
    resumenCont.append(c);
  }
  pintarResumen();
}

function pill(n, t) {
  return el("div", { class: "pill" }, el("div", { class: "n" }, String(n)), el("div", { class: "t" }, t));
}

function acordeonPlan() {
  const d = el("details", { class: "acordeon" });
  d.append(el("summary", {}, "🥗 Mi plan (dieta de referencia)"));
  const cuerpo = el("div", { class: "acordeon-cuerpo" });
  cuerpo.append(parrafo("Método del plato", PLAN_DIETA.metodo));
  cuerpo.append(parrafo("Proteína", PLAN_DIETA.proteina));
  cuerpo.append(parrafo("Por qué acabas con hambre", PLAN_DIETA.porque));
  cuerpo.append(el("p", {}, el("strong", {}, "Día ejemplo:")));
  const ul = el("ul");
  PLAN_DIETA.dia.forEach(([k, v]) => ul.append(el("li", {}, el("strong", {}, k + ": "), v)));
  cuerpo.append(ul);
  cuerpo.append(parrafo("Snacks", PLAN_DIETA.snacks));
  cuerpo.append(el("div", { class: "aviso-box", style: "margin-top:10px" }, "🎯 " + PLAN_DIETA.objetivo));
  d.append(cuerpo);
  return d;
}

function parrafo(titulo, texto) {
  return el("p", {}, el("strong", {}, titulo + ": "), texto);
}
