/* ====== Gráficas ligeras en canvas (sin dependencias, 100% offline) ======
   Soporta gráfica de líneas y de barras con ejes y etiquetas. */

const COL = {
  txt: "#9aa3b2", linea: "#2a303c", primario: "#4f8cff",
  alerta: "#ff6b6b", aviso: "#ffb454", ok: "#36c98e", bg: "#171a21",
};

function preparar(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const ancho = canvas.clientWidth || 320;
  const alto = canvas.clientHeight || 180;
  canvas.width = ancho * dpr;
  canvas.height = alto * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, ancho, alto);
  return { ctx, ancho, alto };
}

function nice(max) {
  if (max <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(max)));
  const f = max / exp;
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nf * exp;
}

/**
 * Dibuja una gráfica de líneas.
 * @param canvas elemento <canvas>
 * @param etiquetas array de strings (eje X)
 * @param series array de { datos:[num|null], color, label }
 * @param opts { yMin, yMax, paso }
 */
export function lineas(canvas, etiquetas, series, opts = {}) {
  const { ctx, ancho, alto } = preparar(canvas);
  const padL = 34, padR = 10, padT = 12, padB = 24;
  const w = ancho - padL - padR;
  const h = alto - padT - padB;

  let vals = series.flatMap((s) => s.datos).filter((v) => v != null && !isNaN(v));
  if (!vals.length) return dibujarVacio(ctx, ancho, alto);
  let yMin = opts.yMin != null ? opts.yMin : Math.min(...vals);
  let yMax = opts.yMax != null ? opts.yMax : Math.max(...vals);
  if (yMin === yMax) { yMin -= 1; yMax += 1; }
  // Margen
  const margen = (yMax - yMin) * 0.1;
  yMin = opts.yMin != null ? yMin : yMin - margen;
  yMax = opts.yMax != null ? yMax : yMax + margen;

  const x = (i) => padL + (etiquetas.length <= 1 ? w / 2 : (i / (etiquetas.length - 1)) * w);
  const y = (v) => padT + h - ((v - yMin) / (yMax - yMin)) * h;

  // Rejilla horizontal + etiquetas Y
  ctx.font = "10px sans-serif"; ctx.fillStyle = COL.txt; ctx.textAlign = "right";
  const lineasY = 4;
  for (let i = 0; i <= lineasY; i++) {
    const val = yMin + (i / lineasY) * (yMax - yMin);
    const yy = y(val);
    ctx.strokeStyle = COL.linea; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, yy); ctx.lineTo(ancho - padR, yy); ctx.stroke();
    ctx.fillText(redondeaEtiqueta(val), padL - 5, yy + 3);
  }

  // Etiquetas X (máx 6)
  ctx.textAlign = "center";
  const paso = Math.max(1, Math.ceil(etiquetas.length / 6));
  for (let i = 0; i < etiquetas.length; i += paso) {
    ctx.fillText(etiquetas[i], x(i), alto - 8);
  }

  // Series
  for (const s of series) {
    ctx.strokeStyle = s.color || COL.primario;
    ctx.lineWidth = 2.2; ctx.lineJoin = "round";
    ctx.beginPath();
    let dibujando = false;
    s.datos.forEach((v, i) => {
      if (v == null || isNaN(v)) { dibujando = false; return; }
      const px = x(i), py = y(v);
      if (!dibujando) { ctx.moveTo(px, py); dibujando = true; } else ctx.lineTo(px, py);
    });
    ctx.stroke();
    // Puntos
    ctx.fillStyle = s.color || COL.primario;
    s.datos.forEach((v, i) => {
      if (v == null || isNaN(v)) return;
      ctx.beginPath(); ctx.arc(x(i), y(v), 3, 0, Math.PI * 2); ctx.fill();
    });
  }
}

/**
 * Gráfica de barras.
 * @param series array de { datos:[num], color }  (se apilan si hay varias)
 */
export function barras(canvas, etiquetas, series, opts = {}) {
  const { ctx, ancho, alto } = preparar(canvas);
  const padL = 30, padR = 10, padT = 12, padB = 24;
  const w = ancho - padL - padR;
  const h = alto - padT - padB;

  // Total apilado por columna
  const totales = etiquetas.map((_, i) => series.reduce((s, ser) => s + (ser.datos[i] || 0), 0));
  let yMax = opts.yMax != null ? opts.yMax : nice(Math.max(1, ...totales));
  if (yMax <= 0) yMax = 1;

  const y = (v) => padT + h - (v / yMax) * h;

  // Rejilla + Y
  ctx.font = "10px sans-serif"; ctx.fillStyle = COL.txt; ctx.textAlign = "right";
  for (let i = 0; i <= 4; i++) {
    const val = (i / 4) * yMax;
    const yy = y(val);
    ctx.strokeStyle = COL.linea; ctx.beginPath(); ctx.moveTo(padL, yy); ctx.lineTo(ancho - padR, yy); ctx.stroke();
    ctx.fillText(redondeaEtiqueta(val), padL - 5, yy + 3);
  }

  const n = etiquetas.length || 1;
  const bw = Math.min(38, (w / n) * 0.6);
  const x = (i) => padL + (w / n) * (i + 0.5);

  etiquetas.forEach((etq, i) => {
    let base = padT + h;
    for (const ser of series) {
      const v = ser.datos[i] || 0;
      if (v <= 0) continue;
      const altura = (v / yMax) * h;
      ctx.fillStyle = ser.color || COL.primario;
      ctx.beginPath();
      const px = x(i) - bw / 2;
      const py = base - altura;
      roundRect(ctx, px, py, bw, altura, 4);
      ctx.fill();
      base -= altura;
    }
    ctx.fillStyle = COL.txt; ctx.textAlign = "center"; ctx.font = "10px sans-serif";
    ctx.fillText(etq, x(i), alto - 8);
  });

  // Línea de meta opcional
  if (opts.meta != null) {
    const yy = y(opts.meta);
    ctx.strokeStyle = COL.ok; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(padL, yy); ctx.lineTo(ancho - padR, yy); ctx.stroke();
    ctx.setLineDash([]);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h);
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, 0);
  ctx.arcTo(x, y + h, x, y, 0);
  ctx.arcTo(x, y, x + w, y, r);
}

function redondeaEtiqueta(v) {
  if (Math.abs(v) >= 100) return Math.round(v).toString();
  return (Math.round(v * 10) / 10).toString();
}

function dibujarVacio(ctx, ancho, alto) {
  ctx.fillStyle = COL.txt; ctx.font = "13px sans-serif"; ctx.textAlign = "center";
  ctx.fillText("Sin datos todavía", ancho / 2, alto / 2);
}
