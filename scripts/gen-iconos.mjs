/* Genera los iconos PNG de la app sin dependencias externas.
   Uso: node scripts/gen-iconos.mjs  */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const SALIDA = new URL("../src/assets/", import.meta.url);
mkdirSync(SALIDA, { recursive: true });

// --- CRC32 para chunks PNG ---
const CRC_TABLA = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLA[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(tipo, datos) {
  const tipoBuf = Buffer.from(tipo, "ascii");
  const largo = Buffer.alloc(4); largo.writeUInt32BE(datos.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([tipoBuf, datos])));
  return Buffer.concat([largo, tipoBuf, datos, crc]);
}
function png(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8 bits, RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filtro 0
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

// --- Dibujo del icono ---
function dibujar(size, maskable) {
  const buf = Buffer.alloc(size * size * 4);
  const set = (x, y, r, g, b, a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = a;
  };
  const radio = maskable ? size : size * 0.22;
  // Fondo (azul) con esquinas redondeadas si no es maskable
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let dentro = true;
    if (!maskable) {
      const rx = Math.min(x, size - 1 - x), ry = Math.min(y, size - 1 - y);
      if (rx < radio && ry < radio) {
        const dx = radio - rx, dy = radio - ry;
        if (dx * dx + dy * dy > radio * radio) dentro = false;
      }
    }
    if (dentro) {
      // degradado vertical azul
      const t = y / size;
      set(x, y, Math.round(47 + t * 32), Math.round(111 - t * 20), Math.round(224 - t * 30));
    }
  }
  // Mancuerna (blanca) centrada
  const c = size / 2;
  const escala = maskable ? 0.58 : 0.66; // zona segura para maskable
  const L = size * escala;            // largo barra
  const grosorBarra = size * 0.07;
  const discoW = size * 0.075;
  const discoH = size * 0.34 * (maskable ? 0.9 : 1);
  const discoH2 = size * 0.22;
  const blanco = (x, y) => set(x, y, 255, 255, 255);
  const rect = (x0, y0, w, h) => {
    for (let y = Math.round(y0); y < y0 + h; y++)
      for (let x = Math.round(x0); x < x0 + w; x++) blanco(x, y);
  };
  // barra
  rect(c - L / 2, c - grosorBarra / 2, L, grosorBarra);
  // discos interiores
  rect(c - L / 2, c - discoH2 / 2, discoW, discoH2);
  rect(c + L / 2 - discoW, c - discoH2 / 2, discoW, discoH2);
  // discos exteriores (más grandes)
  rect(c - L / 2 - discoW, c - discoH / 2, discoW, discoH);
  rect(c + L / 2, c - discoH / 2, discoW, discoH);
  return buf;
}

function guardar(nombre, size, maskable = false) {
  const data = png(size, size, dibujar(size, maskable));
  writeFileSync(new URL(nombre, SALIDA), data);
  console.log("✔", nombre, size + "px");
}

guardar("icon-192.png", 192);
guardar("icon-512.png", 512);
guardar("icon-maskable-512.png", 512, true);
console.log("Iconos generados en src/assets/");
