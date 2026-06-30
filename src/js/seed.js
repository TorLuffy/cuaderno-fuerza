/* ====== Datos sembrados: programa de entreno y dieta de referencia ======
   Programación full-body A/B/C, 3 días/semana. Respeta lesiones:
   - Lumbar izquierda: priorizar bisagra de cadera, nunca cargar con espalda flexionada.
   - Periostitis en canillas: CERO impacto/carrera. */

export const SESIONES = {
  A: {
    nombre: "Sesión A — Empuje + Base",
    ejercicios: [
      { nombre: "Sentadilla goblet", rango: "3×8-10",
        nota: "Empieza ~8-10 kg. RESPIRA en cada repe, no aguantes el aire.", peso: 9 },
      { nombre: "Flexiones inclinadas (manos en banco/encimera)", rango: "3×6-8",
        nota: "Empieza inclinadas. NO al fallo. Calienta hombro antes y para si pincha.", peso: 0 },
      { nombre: "Puente de glúteos", rango: "3×12",
        nota: "Aprieta glúteo arriba 1s. No arquees la lumbar.", peso: 0 },
      { nombre: "Press militar mancuernas", rango: "3×8-10",
        nota: "Ligero. Core firme, cuida el hombro sensible.", peso: 6 },
      { nombre: "Plancha frontal", rango: "3×15-20s",
        nota: "Cadera firme, glúteo apretado.", peso: 0 },
    ],
  },
  B: {
    nombre: "Sesión B — Bisagra + Tracción",
    ejercicios: [
      { nombre: "Peso muerto rumano (mancuernas)", rango: "3×8",
        nota: "MUY ligero o solo con palo al principio. BISAGRA de cadera, espalda recta. Técnica > peso (isquios cortos).", peso: 6 },
      { nombre: "Remo con mancuerna", rango: "3×8-10",
        nota: "Apoya mano en banco. Codo atrás.", peso: 8 },
      { nombre: "Zancada estática", rango: "3×8/pierna",
        nota: "Sin saltos. Rodilla no pasa la punta del pie.", peso: 0 },
      { nombre: "Pallof press (anti-rotación)", rango: "3×10/lado",
        nota: "Goma o polea. Oro para la lumbar: aguanta sin girar el tronco.", peso: 0 },
      { nombre: "Plancha lateral", rango: "3×15-20s/lado",
        nota: "Empieza por el lado DERECHO (el más flojo). Mismas repes en ambos.", peso: 0 },
    ],
  },
  C: {
    nombre: "Sesión C — Full + Canillas",
    ejercicios: [
      { nombre: "Sentadilla goblet", rango: "3×8-10",
        nota: "Tempo controlado, respira.", peso: 9 },
      { nombre: "Flexiones inclinadas", rango: "3×6-8",
        nota: "Como en A: inclinadas, sin fallo.", peso: 0 },
      { nombre: "Puente glúteo a una pierna", rango: "3×8/pierna",
        nota: "Cadera nivelada.", peso: 0 },
      { nombre: "Face pull / pájaro", rango: "3×12",
        nota: "Hombros sanos y postura.", peso: 0 },
      { nombre: "Dorsiflexión + elevación de talón", rango: "3×15",
        nota: "Rehab canillas: sube punta del pie y luego talón, lento.", peso: 0 },
      { nombre: "Plancha frontal", rango: "2×15-20s",
        nota: "Cierre de core.", peso: 0 },
    ],
  },
};

// Texto del bloque calentamiento/movilidad/acondicionamiento
export const CALENTAMIENTO = {
  antes: [
    "Marcha en el sitio + círculos de brazos + rotaciones de cadera.",
    "10 sentadillas suaves. Activación de hombro con goma.",
    "Equilibrio a una pierna 2×20-30s/pie, empezando por el DERECHO.",
  ],
  despues: [
    "10-15 min de bici o caminar en cuesta suave (sin impacto).",
    "+5 min de movilidad de isquios/cadera casi a diario.",
  ],
  regla: "Molestia leve OK; dolor agudo en hombro o lumbar = PARAR.",
};

// Dieta de referencia (pestaña Comida → "Mi plan")
export const PLAN_DIETA = {
  metodo: "Método del plato en cada comida: ½ verdura/ensalada, ¼ proteína, ¼ carbohidrato integral, + una grasa buena (aceite de oliva, aguacate, frutos secos).",
  proteina: "~120-140 g/día repartida. Fuentes: pescado, huevos, yogur griego, legumbres, tofu, queso fresco (y carne cuando comas solo).",
  porque: "Acabas con hambre/sin energía porque las comidas con poco freno (refinados, poca proteína/fibra) suben y bajan el azúcar. Solución: proteína + verdura + carbo integral.",
  dia: [
    ["Desayuno", "Huevos + pan integral + fruta (o yogur griego + avena + fruta)."],
    ["Comida", "Pescado/legumbre + arroz/patata + ensalada grande + aceite de oliva."],
    ["Snack", "Yogur griego + nueces (o fruta + queso fresco)."],
    ["Cena", "Pescado o tortilla + verduras salteadas + algo de quinoa/patata."],
  ],
  snacks: "Snacks que quitan el hambre (con proteína): yogur griego, huevo cocido, hummus con zanahoria, frutos secos, queso fresco.",
  objetivo: "Objetivo composición: comer en torno al gasto o algo por encima — no comer menos, comer mejor.",
};

// Hábitos del checklist diario
export const HABITOS_LISTA = [
  { id: "proteina",  texto: "Proteína en cada comida" },
  { id: "verdura",   texto: "Verdura/fruta en 2+ comidas" },
  { id: "sinUltra",  texto: "Sin ultraprocesados" },
  { id: "mover",     texto: "Moverme 10 min+" },
  { id: "dormir",    texto: "Dormir 7-8 h" },
];

export const META_AGUA = 8; // vasos (~2 L)
