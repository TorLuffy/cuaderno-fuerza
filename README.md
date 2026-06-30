# 💪 Cuaderno de Fuerza

**App en vivo:** https://torluffy.github.io/cuaderno-fuerza/ — ábrela en el móvil e instálala (ver abajo).

App web personal (PWA) para registrar **entrenamiento, recuperación, peso, comida y hábitos**, y ver el progreso en gráficas. Diseñada para **una sola persona**, con un principio claro:

> **Local-first y privada.** No hay servidor, no hay cuentas, no hay login. **Todos tus datos (incluidas las fotos) se guardan SOLO en tu dispositivo** (IndexedDB) y nunca se suben a internet. No hay nada que hackear en la nube.

Funciona en **móvil y PC**, se instala como app (PWA) y funciona **offline**.

---

## ✨ Funcionalidades

- **Entreno**: 3 sesiones full-body A/B/C sembradas (con notas de técnica y lesiones). Registras series con repeticiones y peso, añades/quitas series, notas por sesión. Bloque desplegable de calentamiento/movilidad/acondicionamiento.
- **Recuperación**: deslizadores diarios de dolor lumbar (0-10), molestia en canillas (0-10), sueño (1-5) y energía (1-5).
- **Comida**: registro rápido por comida (proteína/verdura, cómo te sentó), resumen del día y tu plan de dieta.
- **Hábitos**: contador de agua (vasos) y checklist diario que se reinicia cada día.
- **Peso**: histórico con variación + **fotos de progreso** (se redimensionan en el móvil a ~760px y se guardan solo localmente).
- **Progreso**: gráficas de peso, dolor/molestias, volumen semanal, entrenos por semana y adherencia de hábitos.
- **Exportar/Importar JSON** e **informe mensual en Markdown** para pasárselo al entrenador (IA).
- **PIN opcional** (4-6 dígitos) para abrir la app, guardado como hash.

---

## ▶️ Cómo correrlo en local

Una PWA necesita servirse por HTTP (no vale abrir el `index.html` con doble clic). Desde la carpeta del proyecto:

```bash
# Opción 1: con Node (no instala nada permanente)
npx serve .

# Opción 2: con Python
python -m http.server 8080
```

Abre la URL que te indique (p. ej. `http://localhost:8080`).

> Los iconos ya vienen generados. Si quisieras regenerarlos: `node scripts/gen-iconos.mjs`.

---

## 📲 Cómo instalarla como app (PWA)

**En el móvil:**
- **iPhone (Safari):** abre la web → botón **Compartir** → **«Añadir a pantalla de inicio»**.
- **Android (Chrome):** menú **⋮** → **«Instalar aplicación»** (o el banner que aparece). También desde **⚙️ Ajustes → Instalar** dentro de la app.

**En PC (Chrome/Edge):** icono de instalar en la barra de direcciones, o menú → **«Instalar Cuaderno de Fuerza»**.

Tras la primera carga funciona **offline**.

---

## 🚀 Cómo desplegarla gratis

La app es 100% estática (HTML/CSS/JS), así que cualquier hosting estático gratuito sirve.

### Opción A — GitHub Pages (recomendada)
1. Crea un repo en GitHub y sube esta carpeta:
   ```bash
   git init
   git add .
   git commit -m "Cuaderno de Fuerza"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/cuaderno-fuerza.git
   git push -u origin main
   ```
2. En GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama `main`, carpeta `/ (root)`. Guarda.
3. En 1-2 min tendrás la URL `https://TU_USUARIO.github.io/cuaderno-fuerza/`. Ábrela en el móvil e instálala.

> Como las rutas son relativas (`./`), funciona en un subdirectorio de GitHub Pages sin tocar nada.

### Opción B — Netlify (arrastrar y soltar)
1. Entra en [app.netlify.com/drop](https://app.netlify.com/drop).
2. Arrastra la carpeta del proyecto. Te da una URL `https://xxxx.netlify.app` al instante.

### Opción C — Vercel
1. `npm i -g vercel` y ejecuta `vercel` en la carpeta, o importa el repo desde la web de Vercel. Sin configuración: es estático.

En las tres, el plan gratuito sobra. **HTTPS** se activa solo (lo necesita la PWA).

---

## 🔐 Privacidad y tus datos

- Sin backend, sin analítica, sin terceros. Nada sale de tu dispositivo.
- Para **mover los datos a otro móvil** o **enseñárselos al entrenador**: ⚙️ **Ajustes → Exportar JSON** (o **Generar informe del mes**) y comparte ese archivo. En el otro dispositivo: **Importar JSON**.
- Las fotos no se incluyen en el export (por tamaño/privacidad): en el JSON solo van sus fechas.
- Si borras los datos del navegador/app o desinstalas, **se pierden** (no hay copia en la nube). Exporta de vez en cuando como copia de seguridad.

---

## 🧱 Decisiones técnicas (resumen)

- **Vanilla JS (ES modules) + HTML + CSS**, sin framework ni paso de build → cero dependencias, despliegue trivial y máxima longevidad.
- **IndexedDB** con una capa propia mínima (sin librerías) para datos y fotos (blobs). Nada de `localStorage` para imágenes.
- **Gráficas propias en `<canvas>`** (ligeras, sin Chart.js) para no depender de CDNs y que todo funcione offline y privado.
- **PWA a mano**: `manifest.webmanifest` + service worker (cache-first) → instalable y offline. Iconos PNG generados con un script Node sin dependencias.
- **PIN** guardado como hash SHA-256 (Web Crypto), nunca en claro.

---

## 📁 Estructura

```
.
├── index.html
├── manifest.webmanifest
├── sw.js                      # service worker (offline)
├── README.md
├── scripts/gen-iconos.mjs     # generador de iconos PNG
└── src/
    ├── assets/                # iconos PWA
    ├── css/styles.css
    └── js/
        ├── app.js             # navegación, ajustes, PWA
        ├── db.js              # IndexedDB
        ├── seed.js            # programa A/B/C + dieta
        ├── utils.js
        ├── charts.js          # gráficas en canvas
        ├── pin.js
        ├── export.js          # export/import + informe
        └── views/             # una pestaña por archivo
```
