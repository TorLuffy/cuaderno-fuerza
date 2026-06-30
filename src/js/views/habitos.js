/* ====== Vista Hábitos (agua + checklist diario, se reinicia cada día) ====== */
import { el, hoyISO, toast } from "../utils.js";
import { guardar, obtener } from "../db.js";
import { HABITOS_LISTA, META_AGUA } from "../seed.js";

export async function render(cont) {
  const fecha = hoyISO();
  const reg = await obtener("habitos", fecha) || { fecha, agua: 0, checks: {} };
  reg.checks = reg.checks || {};

  async function persistir() { await guardar("habitos", reg); }

  // --- Agua ---
  const cardAgua = el("div", { class: "card" });
  cardAgua.append(el("h2", {}, "💧 Agua"));
  const info = el("p", { class: "mut" });
  const vasos = el("div", { class: "vasos" });

  function pintarAgua() {
    vasos.innerHTML = "";
    const total = Math.max(META_AGUA, reg.agua);
    for (let i = 0; i < total; i++) {
      const v = el("button", { class: "vaso" + (i < reg.agua ? " lleno" : "") });
      v.addEventListener("click", async () => {
        reg.agua = (i < reg.agua) ? i : i + 1; // toca para llenar hasta ahí o vaciar
        await persistir(); pintarAgua();
      });
      vasos.append(v);
    }
    info.textContent = `${reg.agua} / ${META_AGUA} vasos (~${(reg.agua * 0.25).toFixed(2)} L · meta 2 L)`;
  }
  cardAgua.append(vasos, info);
  const filaBtns = el("div", { class: "fila" },
    el("button", { class: "btn btn-sm", onclick: async () => { if (reg.agua > 0) reg.agua--; await persistir(); pintarAgua(); } }, "− vaso"),
    el("button", { class: "btn btn-sm btn-primario", onclick: async () => { reg.agua++; await persistir(); pintarAgua(); } }, "+ vaso"),
  );
  cardAgua.append(filaBtns);
  cont.append(cardAgua);
  pintarAgua();

  // --- Checklist ---
  const cardCheck = el("div", { class: "card" });
  cardCheck.append(el("h2", {}, "✅ Hábitos de hoy"));
  HABITOS_LISTA.forEach((h) => {
    const item = el("div", { class: "check-item" + (reg.checks[h.id] ? " hecho" : "") });
    const box = el("div", { class: "box" }, reg.checks[h.id] ? "✓" : "");
    item.append(box, el("span", {}, h.texto));
    item.addEventListener("click", async () => {
      reg.checks[h.id] = !reg.checks[h.id];
      item.classList.toggle("hecho", reg.checks[h.id]);
      box.textContent = reg.checks[h.id] ? "✓" : "";
      await persistir();
    });
    cardCheck.append(item);
  });
  cardCheck.append(el("p", { class: "mut mini centro", style: "margin-top:10px" }, "Se reinicia automáticamente cada día."));
  cont.append(cardCheck);
}
