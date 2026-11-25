import { SITIOS, ALUDES, FESTIVOS, CASA, PRESUPUESTO as P } from './sitios.js?v=5';
import { urlPrevision, analizar, tablaFindes, estadoVale, etiqueta, puntuar, hoyISO, UMBRAL } from './motor.js?v=3';

const app = document.getElementById('app');
const K = { cache: 'cosi-nieve-v1', plan: 'cosi-plan-v1', tab: 'cosi-tab' };
const VIGENCIA = 30 * 60e3, FINDES = 10;
const NOCHES = P.noches, PRESUPUESTO = P.alojamiento;
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
    <header class="cab"><div class="cab-top"><h1>Skimo 🎿</h1>${instalada() ? '' : '<button class="instalar" data-accion="instalar">📲 Instalar</button>'}</div>${htmlVale()}</header>
    ${htmlPlan()}
    <div class="vista ${ui.pintada !== ui.tab ? 'entra' : ''}">${vista()}</div>
    <nav class="menu">${TABS.map((t) => `<button data-ir="${t.id}" aria-current="${ui.tab === t.id}"><span>${t.ico}</span>${t.txt}</button>`).join('')}</nav>`;
  ui.pintada = ui.tab;
  if (ui.tab === 'prevision') ponerMapa();
}

// ── mapa (Leaflet se carga solo al abrir la pestaña; el mapa se crea una vez y se reutiliza) ──
let mapa = null, capa = null, mapaEl = null, leaflet = null;
const enFoco = () => calc.analisis.find((a) => a.sitio.id === (ui.foco || plan.sitio)) || [...calc.analisis].sort((a, b) => b.base - a.base)[0];
function cargarLeaflet() {
  leaflet ??= new Promise((ok, mal) => {
    const css = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css' });
    const js = Object.assign(document.createElement('script'), { src: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js', onload: () => ok(window.L), onerror: mal });
    document.head.append(css, js);
  });
  return leaflet;
}
async function ponerMapa() {
  const hueco = document.getElementById('hueco-mapa');
  if (!hueco || !calc) return;
  mapaEl ??= Object.assign(document.createElement('div'), { className: 'mapa' });
  hueco.append(mapaEl);
  let L;
  try { L = await cargarLeaflet(); } catch { leaflet = null; mapaEl.innerHTML = '<p class="vacio">Sin conexión para el mapa</p>'; return; }
  if (!mapa) {
    mapa = L.map(mapaEl, { zoomSnap: 0.25, zoomControl: false, scrollWheelZoom: false, minZoom: 6, maxZoom: 12 });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(mapa);
    L.control.zoom({ position: 'bottomright' }).addTo(mapa);
    verTodos(false);
    capa = L.layerGroup().addTo(mapa);
  } else mapa.invalidateSize();
  capa.clearLayers();
  const icono = (html, clase = '') => L.divIcon({ className: `m ${clase}`, html, iconSize: [0, 0], iconAnchor: [0, 0] });
  const foco = enFoco().sitio.id;
  for (const an of calc.analisis) {
    const s = an.sitio, p = plan.sab ? notaDe(plan.sab, s.id) : null;
    const color = p ? etiqueta(p.nota).clase : an.base >= UMBRAL.base ? 'top' : an.base >= 15 ? 'bien' : 'no';
    const [dx, dy] = s.desvio || [0, 0];
    const html = `<div class="pin ${color} ${plan.sitio === s.id ? 'si' : ''} ${foco === s.id ? 'foco' : ''}" style="--dx:${dx}px;--dy:${dy}px">
      <i class="punto"></i><span class="burbuja">${plan.sitio === s.id ? '✓ ' : ''}${(p || an).base}<small>cm</small></span></div>`;
    L.marker([s.lat, s.lon], { icon: icono(html), zIndexOffset: foco === s.id ? 1000 : 0 })
      .on('click', () => {
        ui.foco = s.id; try { navigator.vibrate?.(8); } catch { /* nada */ }
        mapa.flyTo([s.lat, s.lon], Math.max(mapa.getZoom(), 9), { duration: 0.6 });
        pintar(); document.querySelector('.ficha')?.animate([{ transform: 'scale(.97)', opacity: 0.6 }, { transform: 'none', opacity: 1 }], 220);
      }).addTo(capa);
  }
}
function verTodos(animar = true) {
  const b = SITIOS.map((s) => [s.lat, s.lon]);
  if (animar) mapa.flyToBounds(b, { paddingTopLeft: [40, 48], paddingBottomRight: [40, 20], duration: 0.6 });
  else mapa.fitBounds(b, { paddingTopLeft: [40, 48], paddingBottomRight: [40, 20] });
}

// ── instalar en la pantalla de inicio ────────────────────────
let pedirInstalar = null;
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); pedirInstalar = e; });
addEventListener('appinstalled', () => { document.querySelector('.hoja-fondo')?.remove(); pintar(); });
function instalada() { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; }
const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const ICO_COMPARTIR = '<svg class="ico-c" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M6 11H5v10h14V11h-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function abrirInstalar() {
  document.querySelector('.hoja-fondo')?.remove();
  const pasos = pedirInstalar ? '<button class="btn" data-instalar>📲 Instalar ahora</button>'
    : esIOS ? `<ol class="pasos"><li><span>1</span><p>Abajo en Safari, toca <b>Compartir</b> ${ICO_COMPARTIR}</p></li>
        <li><span>2</span><p>Baja y toca <b>«Añadir a pantalla de inicio»</b></p></li><li><span>3</span><p>Pulsa <b>Añadir</b> y listo ✅</p></li></ol>
        <p class="mini">¿No ves Compartir? Abre este enlace en Safari.</p>`
    : `<ol class="pasos"><li><span>1</span><p>Toca el menú <b>⋮</b> de arriba a la derecha</p></li>
        <li><span>2</span><p>Toca <b>«Instalar aplicación»</b> o <b>«Añadir a pantalla de inicio»</b></p></li><li><span>3</span><p>Confirma y listo ✅</p></li></ol>`;
  const fondo = Object.assign(document.createElement('div'), { className: 'hoja-fondo' });
  fondo.innerHTML = `<div class="hoja" role="dialog" aria-label="Instalar Skimo"><img src="icono-180.png" alt="" class="h-icono">
    <h2>Llévate Skimo al móvil</h2><p class="h-txt">Tendrás un icono con nuestra foto para elegir el finde y ver cuándo nieva ❄️</p>
    ${pasos}<button class="btn sec" data-cerrar>Ahora no</button></div>`;
  fondo.addEventListener('click', async (e) => {
    if (e.target.closest('[data-instalar]') && pedirInstalar) { pedirInstalar.prompt(); await pedirInstalar.userChoice; pedirInstalar = null; fondo.remove(); return; }
    if (e.target === fondo || e.target.closest('[data-cerrar]')) fondo.remove();
  });
  document.body.append(fondo);
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
    ${completo ? `<a class="btn" href="https://wa.me/?text=${enc(mensajePlan())}" target="_blank" rel="noopener">💌 Enviárselo a Pablo</a>` : ''}
  </section>`;
}

// ── pestañas ─────────────────────────────────────────────────
const boton = ({ dato, si, titulo, sub, derecha = '' }) => `<button class="fila ${si ? 'si' : ''}" ${dato}><span class="check"></span>
  <span class="txt"><b>${titulo}</b>${sub ? `<small>${sub}</small>` : ''}</span>${derecha}</button>`;

function vistaPrevision() {
  if (!calc) return '<p class="intro">Cargando…</p>';
  const foco = enFoco(), s = foco.sitio, si = plan.sitio === s.id;
  const p = plan.sab ? notaDe(plan.sab, s.id) : null;
  return `<p class="intro">${plan.sab ? `Cómo pinta el ${rangoFinde(plan.sab)}` : 'Nieve que hay ahora'} <span>Toca una estación del mapa</span></p>
    <div id="hueco-mapa" class="hueco-mapa"><button class="ver-todos" data-accion="centrar">⤢ Ver todas</button></div>
    <section class="ficha ${si ? 'si' : ''}">
      <div class="f-txt"><b>${s.nombre} · ${(p || foco).base} cm</b>
        <small>${plan.sab ? (p ? `${pill(p)} ☀️ ${p.sol} % · 🚗 ${s.coche}` : `Sin previsión aún · 🚗 ${s.coche}`)
          : `${foco.nieve7 ? `❄️ +${foco.nieve7} cm · ` : ''}🚗 ${s.coche}`}</small></div>
      <button class="f-btn ${si ? 'hecho' : ''}" data-sitio="${s.id}">${si ? '✓ Elegido' : 'Elegir'}</button>
    </section>
    <p class="seccion">⛰️ Rutas de skimo <span>${s.nombre}</span></p>
    <div class="rutas">${(s.rutas || []).map((r) => `<a class="ruta" href="${r.url}" target="_blank" rel="noopener">
      <span class="r-ico">⛰️</span><span class="r-txt"><b>${r.nombre}</b>
        <span class="chips"><i>↗ ${r.desnivel} m</i>${r.horas ? `<i>⏱ ${r.horas}</i>` : ''}${r.dificultad ? `<i>${r.dificultad}</i>` : ''}<i>📍 ${r.salida.replace(/^el /, '')}</i></span></span></a>`).join('')}
      ${s.rutas?.length ? '' : '<p class="r-vacio">Aún no tenemos rutas contrastadas aquí.</p>'}
      <a class="ruta mas" href="https://www.google.com/search?q=${encodeURIComponent(`wikiloc esquí de montaña ${s.pueblo}`)}" target="_blank" rel="noopener">
      <span class="r-ico">🔎</span><span class="r-txt"><b>${s.rutas?.length ? 'Más rutas' : 'Buscar rutas'} en Wikiloc</b></span></a></div>
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
  return `<p class="intro">Dónde dormir en ${s.nombre} <span>Viernes y sábado noche</span></p>
    <ul class="lista">${s.dormir.map((d, k) => `<li class="con-enlace">${boton({
      dato: `data-aloj="${s.id}:${k}"`, si: plan.aloj === `${s.id}:${k}`, titulo: `${d.emoji} ${d.nombre}`, sub: d.nota,
    })}<a class="ver" href="${enlace(d)}" target="_blank" rel="noopener">${d.refugio ? 'Su web' : plan.sab ? 'Ver libres' : 'Ver'} ↗</a></li>`).join('')}</ul>
    <p class="pie">${plan.sab ? '«Ver libres» abre Booking con vuestras fechas.' : 'Elige finde y verás lo que queda libre esas fechas.'} En los refugios, mejor confirmar que abren.</p>`;
}

// ── compartir y confeti ──────────────────────────────────────
function mensajePlan() {
  const p = notaDe(plan.sab, plan.sitio);
  return `Pablo, ya lo he elegido 😏🎿\n🗓️ ${rangoFinde(plan.sab)}\n🏔️ ${sitioPor(plan.sitio).nombre}\n🛏️ ${alojDe(plan.aloj).item.nombre}`
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
  else if (d.accion === 'instalar') abrirInstalar();
  else if (d.accion === 'centrar' && mapa) verTodos();
});

// Enlace que manda Sara: …/nieve/#plan=sab~sitio~sitio:k
function leerEnlace() {
  if (location.hash.includes('instalar')) {
    history.replaceState(null, '', location.pathname);
    if (!instalada()) setTimeout(abrirInstalar, 700);
    return;
  }
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
