// Cálculos compartidos por la web y por los avisos (GitHub Actions).
// Datos: Open-Meteo (gratis, sin clave). Nieve en cm, espesor del modelo a la cota del sitio.

export const UMBRAL = { base: 40, ideal: 70, fresca: 20, minima: 15 }; // cm

const VARIABLES = 'snowfall_sum,snow_depth_max,weather_code,temperature_2m_max,temperature_2m_min,'
  + 'precipitation_probability_max,wind_speed_10m_max,sunshine_duration,daylight_duration';

export function urlPrevision(sitios) {
  return 'https://api.open-meteo.com/v1/forecast'
    + `?latitude=${sitios.map((s) => s.lat).join(',')}`
    + `&longitude=${sitios.map((s) => s.lon).join(',')}`
    + `&elevation=${sitios.map((s) => s.alt).join(',')}`
    + `&daily=${VARIABLES}&past_days=7&forecast_days=16&timezone=Europe%2FMadrid`;
}

export const hoyISO = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(new Date());
export const diaSemana = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).getDay(); };
const num = (v) => (Number.isFinite(v) ? v : 0);
const suma = (arr) => arr.reduce((a, b) => a + num(b), 0);

/** Convierte la respuesta de Open-Meteo en { sitio, dias[], hoy, base, nieve7, nievePasada } por sitio. */
export function analizar(sitios, json) {
  const lista = Array.isArray(json) ? json : [json];
  const hoy = hoyISO();
  return sitios.map((sitio, k) => {
    const d = lista[k].daily;
    const dias = d.time.map((fecha, i) => ({
      fecha,
      nieve: Math.round(num(d.snowfall_sum[i])),
      espesor: Math.round(num(d.snow_depth_max[i]) * 100),
      code: d.weather_code[i],
      tmax: Math.round(num(d.temperature_2m_max[i])),
      tmin: Math.round(num(d.temperature_2m_min[i])),
      pp: num(d.precipitation_probability_max[i]),
      viento: Math.round(num(d.wind_speed_10m_max[i])),
      sol: d.daylight_duration[i] ? Math.min(1, num(d.sunshine_duration[i]) / d.daylight_duration[i]) : 0,
    }));
    let iHoy = dias.findIndex((x) => x.fecha === hoy);
    if (iHoy < 0) iHoy = Math.min(7, dias.length - 1);
    return {
      sitio, dias, iHoy,
      base: dias[iHoy].espesor,
      nieve7: suma(dias.slice(iHoy, iHoy + 7).map((x) => x.nieve)),
      nievePasada: suma(dias.slice(Math.max(0, iHoy - 7), iHoy).map((x) => x.nieve)),
    };
  });
}

/** Fines de semana (sábado) desde hoy que caben en la previsión. */
export function findes(an) {
  const { dias, iHoy } = an;
  const out = [];
  for (let i = Math.max(0, iHoy - 1); i < dias.length - 1; i++) {
    if (diaSemana(dias[i].fecha) === 6 && i + 1 >= iHoy) out.push(i);
  }
  return out;
}

/** Nota 0-100 de un finde (sábado = índice s) en un sitio, con los motivos. */
export function puntuar(an, s) {
  const d = an.dias, sab = d[s], dom = d[s + 1];
  const base = sab.espesor;
  const fresca = suma(d.slice(Math.max(0, s - 3), s).map((x) => x.nieve));
  const tormenta = sab.nieve + dom.nieve;
  const sol = (sab.sol + dom.sol) / 2;
  const pp = (sab.pp + dom.pp) / 2;
  const viento = Math.max(sab.viento, dom.viento);

  let nota = Math.min(base / UMBRAL.ideal, 1) * 45 + Math.min(fresca / UMBRAL.fresca, 1) * 15
    + sol * 20 + (1 - pp / 100) * 10 + Math.max(0, Math.min(1, (60 - viento) / 30)) * 10;
  if (base < UMBRAL.base) nota = Math.min(nota, 15 + base * 0.75); // sin base no hay plan: 18 cm → máx. 28
  if (tormenta >= 25) nota -= 10; // nevando fuerte mientras estáis: poca visibilidad y aludes

  return {
    nota: Math.max(0, Math.round(nota)), base, fresca, tormenta, viento,
    sol: Math.round(sol * 100), pp: Math.round(pp),
    tmin: Math.min(sab.tmin, dom.tmin), tmax: Math.max(sab.tmax, dom.tmax),
    sab: sab.fecha, dom: dom.fecha, lejos: s - an.iHoy > 7,
  };
}

export function etiqueta(nota) {
  if (nota >= 75) return { txt: 'Finde de 10', emoji: '🔥', clase: 'top' };
  if (nota >= 55) return { txt: 'Buen plan', emoji: '👍', clase: 'bien' };
  if (nota >= 35) return { txt: 'Justito', emoji: '🤔', clase: 'justo' };
  return { txt: 'Aún no', emoji: '⏳', clase: 'no' };
}

/** Todos los (finde × sitio) puntuados, agrupados por sábado. */
export function tablaFindes(analisis) {
  const porSab = new Map();
  for (const an of analisis) {
    for (const s of findes(an)) {
      const p = { ...puntuar(an, s), an };
      if (!porSab.has(p.sab)) porSab.set(p.sab, []);
      porSab.get(p.sab).push(p);
    }
  }
  return [...porSab.entries()].sort(([a], [b]) => a.localeCompare(b))
    .map(([sab, lista]) => ({ sab, lista: lista.sort((a, b) => b.nota - a.nota) }));
}

export function mejorPlan(tabla) {
  let mejor = null;
  for (const f of tabla) for (const p of f.lista) if (!mejor || p.nota > mejor.nota) mejor = p;
  return mejor;
}

/** ¿Ha llegado ya «la primera nevada buena»? */
export function estadoVale(analisis) {
  const top = [...analisis].sort((a, b) => b.base - a.base)[0];
  return { listo: top.base >= UMBRAL.base, top, falta: Math.max(0, UMBRAL.base - top.base) };
}

/** Mayor nevada en 3 días seguidos dentro de la próxima semana. */
export function nevadaFuerte(an) {
  const { dias, iHoy } = an;
  let mejor = { cm: 0, desde: null };
  for (let i = iHoy; i < Math.min(dias.length - 2, iHoy + 7); i++) {
    const cm = dias[i].nieve + dias[i + 1].nieve + dias[i + 2].nieve;
    if (cm > mejor.cm) mejor = { cm, desde: dias[i].fecha };
  }
  return mejor;
}
