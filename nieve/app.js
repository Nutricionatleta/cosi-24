import { SITIOS, ALUDES, FESTIVOS, PRESUPUESTO as P } from './sitios.js?v=3';
import { urlPrevision, analizar, tablaFindes, estadoVale, etiqueta, puntuar, hoyISO, UMBRAL } from './motor.js?v=3';

const app = document.getElementById('app');
const K = { cache: 'cosi-nieve-v1', plan: 'cosi-plan-v1', tab: 'cosi-tab' };
const VIGENCIA = 30 * 60e3, FINDES = 10;
const NOCHES = P.noches, PRESUPUESTO = P.alojamiento;
const MATERIAL = P.material.personas * P.material.dias * P.material.porDia;
const URL_APP = 'https://nutricionatleta.github.io/cosi-24/nieve/';
const TABS = [{ id: 'prevision', txt: 'Previsión', ico: '❄️' }, { id: 'calendario', txt: 'Calendario', ico: '📅' }, { id: 'alojamiento', txt: 'Alojamiento', ico: '🛏️' }];
const PASOS = [['sab', 'calendario', 'Finde'], ['sitio', 'prevision', 'Sitio'], ['aloj', 'alojamiento', 'Dormir']];

// ── utilidades ───────────────────────────────────────────────
function leer(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
function guardar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } }
const fechaLocal = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const isoMas = (iso, n) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const fmt = (iso, o) => new Intl.DateTimeFormat('es-ES', o).format(fechaLocal(iso));
const diaCorto = (iso) => fmt(iso, { weekday: 'short', day: 'numeric' }).replace(/[.,]/g, '');
const rangoFinde = (sab) => `${diaCorto(sab)} – ${diaCorto(isoMas(sab, 1))} ${fmt(sab, { month: 'short' })}`.replace(/[.,]/g, '');
const hace = (t) => { const m = Math.round((Date.now() - t) / 60e3); return m < 1 ? 'ahora' : m < 60 ? `hace ${m} min` : `hace ${Math.round(m / 60)} h`; };
const sitioPor = (id) => SITIOS.find((s) => s.id === id);
const enc = encodeURIComponent;

// ── estado ───────────────────────────────────────────────────
const datos = { json: null, hora: 0 };
const ui = { tab: TABS.some((t) => t.id === leer(K.tab)) ? leer(K.tab) : 'calendario' };
let plan = { sab: null, sitio: null, aloj: null, ...leer(K.plan) };
let calc = null;

const alojDe = (c) => { if (!c) return null; const [id, k] = c.split(':'); const s = sitioPor(id); return s?.dormir[+k] ? { sitio: s, item: s.dormir[+k] } : null; };
const hechos = () => PASOS.filter(([k]) => plan[k]).length;
function notaDe(sab, id) {
  const an = calc?.analisis.find((a) => a.sitio.id === id);
  const i = an ? an.dias.findIndex((d) => d.fecha === sab) : -1;
  return i >= 0 && i + 1 < an.dias.length ? puntuar(an, i) : null;
}
const pill = (p) => { if (!p) return '<span class="pill gris">—</span>'; const e = etiqueta(p.nota); return `<span class="pill ${e.clase}">${e.txt}</span>`; };

function elegir(cambios, eligiendo) {
  const antes = hechos();
  plan = { ...plan, ...cambios };
  if (plan.aloj && !plan.aloj.startsWith(`${plan.sitio}:`)) plan.aloj = null; // el alojamiento va con su sitio
  guardar(K.plan, plan);
  try { navigator.vibrate?.(10); } catch { /* nada */ }
  pintar();
  if (antes < 3 && hechos() === 3) { confeti(); aviso('¡Plan listo! Mándaselo a Pablo 💌'); return; }
  const falta = PASOS.find(([k]) => !plan[k]);
  if (eligiendo && falta && falta[1] !== ui.tab) setTimeout(() => irA(falta[1]), 380); // pasa solo al siguiente paso
}
function irA(tab) { ui.tab = tab; guardar(K.tab, tab); pintar(); scrollTo({ top: 0 }); }

// ── datos (caché 30 min; sin red tira de lo guardado) ────────
async function cargar(forzar = false) {
  const cache = leer(K.cache);
  if (cache?.json && !datos.json) { Object.assign(datos, cache); pintar(); }
  if (!forzar && cache && Date.now() - cache.hora < VIGENCIA) return;
  try {
    const r = await fetch(urlPrevision(SITIOS));
    if (!r.ok) throw new Error(r.status);
    datos.json = await r.json(); datos.hora = Date.now();
    guardar(K.cache, datos); pintar();
  } catch { aviso(datos.json ? 'Sin conexión: última previsión guardada' : 'No llego a la previsión 🥶'); }
}
function aviso(txt) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = txt;
  document.body.append(t); setTimeout(() => t.remove(), 2800);
}

// ── pintar ───────────────────────────────────────────────────
function pintar() {
  if (datos.json) { const analisis = analizar(SITIOS, datos.json); calc = { analisis, tabla: tablaFindes(analisis), vale: estadoVale(analisis) }; }
  const vista = { prevision: vistaPrevision, calendario: vistaCalendario, alojamiento: vistaAlojamiento }[ui.tab];
  app.innerHTML = `
    <header class="cab"><h1>Skimo 🎿</h1>${htmlVale()}</header>
    ${htmlPlan()}
    <div class="vista ${ui.pintada !== ui.tab ? 'entra' : ''}">${vista()}</div>
    <nav class="menu">${TABS.map((t) => `<button data-ir="${t.id}" aria-current="${ui.tab === t.id}"><span>${t.ico}</span>${t.txt}</button>`).join('')}</nav>`;
  ui.pintada = ui.tab;
}

function htmlVale() {
  if (!calc) return '<p class="vale">Mirando la nieve…</p>';
  const { listo, top } = calc.vale, pct = Math.min(100, Math.round((top.base / UMBRAL.base) * 100));
  return `<p class="vale">${listo ? `🎉 ¡Ya hay nieve! ${top.sitio.nombre} tiene ${top.base} cm` : `Vale por un finde de skimo · ${top.base} de ${UMBRAL.base} cm para canjearlo`}</p>
    <div class="barra ${listo ? 'listo' : ''}"><i style="width:${pct}%"></i></div>`;
}

function htmlPlan() {
  const valor = { sab: plan.sab && rangoFinde(plan.sab), sitio: sitioPor(plan.sitio)?.nombre, aloj: alojDe(plan.aloj)?.item.nombre };
  const completo = hechos() === 3;
  return `<section class="plan ${completo ? 'completo' : ''}">
    <div class="slots">${PASOS.map(([k, tab, nombre]) => `<button class="slot ${valor[k] ? 'ok' : ''} ${ui.tab === tab ? 'aqui' : ''}" data-ir="${tab}">
      <small>${valor[k] ? '✓ ' : ''}${nombre}</small><b>${valor[k] || 'Elegir'}</b></button>`).join('')}</div>
    <p class="gasto">💶 Dormir máx. ${PRESUPUESTO} € + material ~${MATERIAL} € = <b>~${PRESUPUESTO + MATERIAL} €</b></p>
    ${completo ? `<a class="btn" href="https://wa.me/?text=${enc(mensajePlan())}" target="_blank" rel="noopener">💌 Enviárselo a Pablo</a>` : ''}
  </section>`;
}

// ── pestañas ─────────────────────────────────────────────────
const boton = ({ dato, si, titulo, sub, derecha = '' }) => `<button class="fila ${si ? 'si' : ''}" ${dato}><span class="check"></span>
  <span class="txt"><b>${titulo}</b>${sub ? `<small>${sub}</small>` : ''}</span>${derecha}</button>`;

function vistaPrevision() {
  if (!calc) return '<p class="intro">Cargando…</p>';
  const lista = calc.analisis.map((an) => ({ an, p: plan.sab ? notaDe(plan.sab, an.sitio.id) : null }))
    .sort((a, b) => (b.p?.nota ?? -1) - (a.p?.nota ?? -1) || b.an.base - a.an.base);
  return `<p class="intro">${plan.sab ? `Cómo pinta el ${rangoFinde(plan.sab)}` : 'Nieve que hay ahora en cada sitio'}</p>
    <ul class="lista">${lista.map(({ an, p }) => `<li>${boton({
      dato: `data-sitio="${an.sitio.id}"`, si: plan.sitio === an.sitio.id, titulo: an.sitio.nombre,
      sub: `${an.sitio.coche}${an.nieve7 ? ` · +${an.nieve7} cm esta semana` : ''}`,
      derecha: `<span class="der"><b>${(p || an).base} cm</b>${plan.sab ? pill(p) : ''}</span>`,
    })}</li>`).join('')}</ul>
    <p class="pie">Antes de salir, mirad el riesgo de aludes: ${ALUDES.map((a) => `<a href="${a.url}" target="_blank" rel="noopener">${a.nombre.split(' (')[0]}</a>`).join(' · ')}<br>
      Open-Meteo · ${hace(datos.hora)} · <button class="enl" data-accion="recargar">actualizar</button></p>`;
}

function vistaCalendario() {
  const hoy = hoyISO(), dow = fechaLocal(hoy).getDay();
  const primero = dow === 0 ? isoMas(hoy, -1) : isoMas(hoy, 6 - dow);
  const filas = Array.from({ length: FINDES }, (_, i) => isoMas(primero, i * 7)).map((sab) => {
    const f = calc?.tabla.find((t) => t.sab === sab);
    const p = f && (plan.sitio ? f.lista.find((x) => x.an.sitio.id === plan.sitio) : f.lista[0]);
    const fest = [isoMas(sab, -1), isoMas(sab, 2)].filter((d) => FESTIVOS[d]).map((d) => FESTIVOS[d]);
    const sub = fest.length ? `🎉 Puente de ${fest.join(' y ')}` : !p ? 'Aún sin previsión' : plan.sitio ? '' : `Mejor en ${p.an.sitio.nombre}`;
    return `<li>${boton({ dato: `data-sab="${sab}"`, si: plan.sab === sab, titulo: rangoFinde(sab), sub, derecha: `<span class="der">${pill(p)}</span>` })}</li>`;
  });
  return `<p class="intro">¿Qué finde te va bien?${plan.sitio ? ` <span>Previsión de ${sitioPor(plan.sitio).nombre}</span>` : ''}</p>
    <ul class="lista">${filas.join('')}</ul>
    <p class="pie">La nieve se ve unos 16 días por delante.</p>`;
}

function vistaAlojamiento() {
  const s = sitioPor(plan.sitio);
  if (!s) return '<div class="vacio"><p>Primero elige el sitio</p><button class="btn sec" data-ir="prevision">Elegir sitio</button></div>';
  // 2 noches (viernes y sábado) y tope de presupuesto: Booking filtra por precio/noche
  const fechas = plan.sab ? `&checkin=${isoMas(plan.sab, 1 - NOCHES)}&checkout=${isoMas(plan.sab, 1)}` : '';
  const tope = `&nflt=${enc(`price=EUR-0-${Math.floor(PRESUPUESTO / NOCHES)}-1`)}`;
  const enlace = (d) => (d.refugio ? `https://www.google.com/search?q=${enc(`${d.busca} reserva`)}`
    : `https://www.booking.com/searchresults.es.html?ss=${enc(d.busca)}&group_adults=2&no_rooms=1&group_children=0${fechas}${tope}`);
  return `<p class="intro">Dónde dormir en ${s.nombre} <span>${NOCHES} noches · máx. ${PRESUPUESTO} €</span></p>
    <ul class="lista">${s.dormir.map((d, k) => `<li class="con-enlace">${boton({
      dato: `data-aloj="${s.id}:${k}"`, si: plan.aloj === `${s.id}:${k}`, titulo: `${d.emoji} ${d.nombre}`, sub: d.nota,
    })}<a class="ver" href="${enlace(d)}" target="_blank" rel="noopener">${d.refugio ? 'Su web' : plan.sab ? 'Ver libres' : 'Ver'} ↗</a></li>`).join('')}</ul>
    <p class="pie">${plan.sab ? `«Ver libres» abre Booking del viernes al domingo, solo con lo que cabe en ${PRESUPUESTO} €.` : 'Elige finde y verás lo que queda libre esas fechas.'} En los refugios, mejor confirmar que abren.</p>`;
}

// ── compartir y confeti ──────────────────────────────────────
function mensajePlan() {
  const p = notaDe(plan.sab, plan.sitio);
  return `Pablo, ya lo he elegido 😏🎿\n🗓️ ${rangoFinde(plan.sab)}\n🏔️ ${sitioPor(plan.sitio).nombre}\n🛏️ ${alojDe(plan.aloj).item.nombre} (${NOCHES} noches, máx. ${PRESUPUESTO} €)`
    + `${p ? `\n❄️ ${p.base} cm de nieve` : ''}\n${URL_APP}#plan=${[plan.sab, plan.sitio, plan.aloj].join('~')}`;
}
function confeti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas'), x = c.getContext('2d'), dpr = devicePixelRatio || 1;
  c.className = 'confeti'; c.width = innerWidth * dpr; c.height = innerHeight * dpr; document.body.append(c); x.scale(dpr, dpr);
  const col = ['#8fd6ff', '#ff9ec4', '#6fe3a5', '#ffd166', '#ffffff'];
  const ps = Array.from({ length: 90 }, () => ({ x: innerWidth / 2, y: innerHeight * 0.3, vx: (Math.random() - 0.5) * 10, vy: -Math.random() * 10 - 3, r: Math.random() * 6, g: col[Math.floor(Math.random() * 5)], w: 4 + Math.random() * 5 }));
  const t0 = performance.now();
  (function paso(t) {
    x.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of ps) { p.vy += 0.3; p.x += p.vx; p.y += p.vy; p.r += 0.15; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.g; x.fillRect(-p.w / 2, -2, p.w, 4); x.restore(); }
    if (t - t0 < 2400) requestAnimationFrame(paso); else c.remove();
  })(t0);
}

// ── eventos ──────────────────────────────────────────────────
app.addEventListener('click', (e) => {
  const b = e.target.closest('[data-ir],[data-sab],[data-sitio],[data-aloj],[data-accion]');
  if (!b) return;
  const d = b.dataset;
  if (d.ir) irA(d.ir);
  else if (d.sab) elegir({ sab: plan.sab === d.sab ? null : d.sab }, plan.sab !== d.sab);
  else if (d.sitio) elegir({ sitio: plan.sitio === d.sitio ? null : d.sitio }, plan.sitio !== d.sitio);
  else if (d.aloj) elegir({ aloj: plan.aloj === d.aloj ? null : d.aloj }, plan.aloj !== d.aloj);
  else if (d.accion === 'recargar') cargar(true);
});

// Enlace que manda Sara: …/nieve/#plan=sab~sitio~sitio:k
function leerEnlace() {
  const m = location.hash.match(/plan=([\d-]*)~(\w*)~([\w:]*)/);
  if (!m) return;
  if (sitioPor(m[2])) {
    plan = { sab: m[1] || null, sitio: m[2], aloj: alojDe(m[3]) ? m[3] : null }; guardar(K.plan, plan);
    setTimeout(() => { aviso('💌 El plan que ha elegido Cosi'); confeti(); }, 400);
  }
  history.replaceState(null, '', location.pathname); pintar();
}
leerEnlace();
addEventListener('hashchange', leerEnlace);
document.addEventListener('visibilitychange', () => { if (!document.hidden) cargar(); });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
pintar();
cargar();
