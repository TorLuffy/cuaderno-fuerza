/* ====== Bloqueo opcional por PIN ======
   El PIN nunca se guarda en claro: solo su hash SHA-256 en IndexedDB (config). */

import { obtener, guardar, borrar } from "./db.js";
import { sha256 } from "./utils.js";

const CLAVE = "pin";

export async function tienePIN() {
  const reg = await obtener("config", CLAVE);
  return !!(reg && reg.hash);
}

export async function ponerPIN(pin) {
  const hash = await sha256(pin);
  await guardar("config", { clave: CLAVE, hash });
}

export async function quitarPIN() {
  await borrar("config", CLAVE);
}

export async function comprobarPIN(pin) {
  const reg = await obtener("config", CLAVE);
  if (!reg) return true;
  return reg.hash === (await sha256(pin));
}

/** Gestiona la pantalla de bloqueo al arrancar. Resuelve cuando se desbloquea. */
export async function exigirDesbloqueo() {
  if (!(await tienePIN())) return; // sin PIN configurado → entrada directa
  const pantalla = document.getElementById("lock-screen");
  const input = document.getElementById("lock-input");
  const btn = document.getElementById("lock-btn");
  const msg = document.getElementById("lock-msg");
  pantalla.classList.remove("oculto");
  input.focus();

  return new Promise((resolve) => {
    const intentar = async () => {
      if (await comprobarPIN(input.value)) {
        pantalla.classList.add("oculto");
        resolve();
      } else {
        msg.textContent = "PIN incorrecto, prueba otra vez";
        input.value = ""; input.focus();
      }
    };
    btn.addEventListener("click", intentar);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") intentar(); });
  });
}
