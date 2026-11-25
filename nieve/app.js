import { SITIOS, ORIGEN, ALUDES } from './sitios.js';
import { urlPrevision, analizar, tablaFindes, mejorPlan, estadoVale, etiqueta, nevadaFuerte, UMBRAL } from './motor.js';

const app = document.getElementById('app');
const CLAVE = 'cosi-nieve-v1', CLAVE_AVISOS = 'cosi-nieve-avisos', VIGENCIA = 30 * 60e3;
const URL_APP = 'https://nutricionatleta.github.io/cosi-24/nieve/';
let estado = { json: null, hora: 0, finde: 0, abierto: null };

// ── utilidades ───────────────────────────────────────────────
const leer = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };
const fechaLocal = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const fmt = (iso, o) => new Intl.DateTimeFormat('es-ES', o).format(fechaLocal(iso));
const diaCorto = (iso) => fmt(iso, { weekday: 'short', day: 'numeric' }).replace('.', '');
const rangoFinde = (sab, dom) => `${diaCorto(sab)} – ${diaCorto(dom)} ${fmt(dom, { month: 'short' })}`.replace(/[.,]/g, '');
const cielo = (c) => (c === 0 ? '☀️' : c <= 2 ? '🌤️' : c === 3 ? '☁️' : c <= 48 ? '🌫️' : c <= 57 ? '🌦️' : c <= 67 ? '🌧️' : c <= 77 ? '🌨️' : c <= 82 ? '🌦️' : c <= 86 ? '🌨️' : '⛈️');
const hace = (t) => { const m = Math.round((Date.now() - t) / 60e3); return m < 1 ? 'ahora mismo' : m < 60 ? `hace ${m} min` : `hace ${Math.round(m / 60)} h`; };

// ── datos (caché 30 min; si falla la red, tira de lo guardado) ─
async function cargar(forzar = false) {
  const cache = leer(CLAVE);
  if (cache?.json) { estado.json = cache.json; estado.hora = cache.hora; pintar(); }
  if (!forzar && cache && Date.now() - cache.hora < VIGENCIA) return;
  marcarCargando(true);
  try {
    const r = await fetch(urlPrevision(SITIOS));
    if (!r.ok) throw new Error(r.status);
    estado.json = await r.json(); estado.hora = Date.now();
    guardar(CLAVE, { json: estado.json, hora: estado.hora });
    pintar();
  } catch {
    if (!estado.json) app.innerHTML = `<div class="error">No llego a la previsión ahora mismo 🥶<br><button class="btn" data-accion="recargar">Reintentar</button></div>`;
    else aviso('Sin conexión: te enseño la última previsión guardada');
  } finally { marcarCargando(false); }
}
function marcarCargando(si) { document.body.classList.toggle('cargando', si); }
function aviso(txt) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = txt;
  document.body.append(t); setTimeout(() => t.remove(), 3200);
}

// ── pintar ───────────────────────────────────────────────────
function pintar() {
  if (!estado.json) return;
  const analisis = analizar(SITIOS, estado.json);
  const tabla = tablaFindes(analisis);
  const mejor = mejorPlan(tabla);
  const vale = estadoVale(analisis);
  estado.finde = Math.min(estado.finde, tabla.length - 1);

  app.innerHTML = `
    <header class="cab">
      <p class="ante">Vale por un finde de skimo</p>
      <h1>¿Cuándo nos vamos? <span>🎿</span></h1>
    </header>
    ${htmlVale(vale)}
    ${htmlMejor(mejor, analisis)}
    ${htmlFindes(tabla)}
    <h2 class="sec">Cómo está cada sitio</h2>
    <div class="sitios">${[...analisis].sort((a, b) => b.base - a.base || b.nieve7 - a.nieve7).map(htmlSitio).join('')}</div>
    ${htmlAvisos()}
    <section class="tarjeta aludes">
      <h3>⚠️ Antes de salir: riesgo de aludes</h3>
      <div class="enlaces">${ALUDES.map((a) => `<a href="${a.url}" target="_blank" rel="noopener">${a.nombre}</a>`).join('')}</div>
    </section>
    <footer class="pie">
      Nieve estimada a la cota de cada sitio (≈2.000 m) · datos de <a href="https://open-meteo.com" target="_blank" rel="noopener">Open-Meteo</a><br>
      Actualizado ${hace(estado.hora)} · <button class="enl" data-accion="recargar">actualizar</button>
    </footer>`;
}

function htmlVale(v) {
  const pct = Math.min(100, Math.round((v.top.base / UMBRAL.base) * 100));
  return `<section class="tarjeta vale ${v.listo ? 'listo' : ''}">
    <div class="vale-top">
      <span class="vale-emoji">${v.listo ? '🎉' : '❄️'}</span>
      <div>
        <h2>${v.listo ? '¡Ya hay nieve! El vale se puede canjear' : 'Esperando la primera nevada buena'}</h2>
        <p>${v.listo
          ? `${v.top.sitio.nombre} ya tiene <b>${v.top.base} cm</b> de base.`
          : `Lo mejor ahora: <b>${v.top.base} cm</b> en ${v.top.sitio.nombre}. Faltan ${v.falta} cm para los ${UMBRAL.base} que pedimos.`}</p>
      </div>
    </div>
    <div class="barra"><i style="width:${pct}%"></i></div>
  </section>`;
}

function htmlMejor(p, analisis) {
  if (!p || p.nota < 35) {
    const prox = analisis.map((an) => ({ an, ...nevadaFuerte(an) })).sort((a, b) => b.cm - a.cm)[0];
    return `<section class="tarjeta mejor vacio"><p class="ante">El mejor plan</p>
      <h2>Aún no hay finde con nieve 😴</h2>
      <p>${prox.cm >= 3
        ? `Lo próximo: <b>~${prox.cm} cm</b> en ${prox.an.sitio.nombre} a partir del ${fmt(prox.desde, { weekday: 'long', day: 'numeric' })}. `
        : 'Esta semana no se espera nieve. '}En cuanto un finde pinte bien, aparece aquí.</p></section>`;
  }
  const e = etiqueta(p.nota);
  return `<section class="tarjeta mejor">
    <div class="mejor-top">
      <div>
        <p class="ante">El mejor plan</p>
        <h2>${p.an.sitio.nombre}</h2>
        <p class="cuando">${rangoFinde(p.sab, p.dom)}</p>
      </div>
      <div class="aro ${e.clase}" style="--n:${p.nota}"><b>${p.nota}</b><small>/100</small></div>
    </div>
    <p class="sello ${e.clase}">${e.emoji} ${e.txt}${p.lejos ? ' · <span class="lejos">a más de una semana: puede cambiar</span>' : ''}</p>
    ${chips(p)}
    <div class="acciones">
      <a class="btn" href="https://wa.me/?text=${encodeURIComponent(mensajePlan(p))}" target="_blank" rel="noopener">💬 Proponérselo</a>
      <button class="btn sec" data-accion="ics">📅 Al calendario</button>
    </div>
  </section>`;
}

function chips(p) {
  return `<ul class="chips">
    <li title="Nieve en el suelo">🏔️ <b>${p.base}</b> cm base</li>
    <li title="Nieve nueva los 3 días antes">❄️ <b>${p.fresca}</b> cm nuevos</li>
    <li>☀️ <b>${p.sol}</b> % sol</li>
    <li>💨 <b>${p.viento}</b> km/h</li>
    <li>🌡️ <b>${p.tmin}</b>/${p.tmax} °C</li>
  </ul>`;
}

function htmlFindes(tabla) {
  if (!tabla.length) return '';
  const f = tabla[estado.finde];
  return `<h2 class="sec">Finde a finde</h2>
  <div class="pestanas" role="tablist">${tabla.map((t, i) => `<button role="tab" aria-selected="${i === estado.finde}" data-finde="${i}">${diaCorto(t.sab)} ${fmt(t.sab, { month: 'short' }).replace('.', '')}</button>`).join('')}</div>
  <ol class="ranking">${f.lista.map((p) => {
    const e = etiqueta(p.nota);
    return `<li>
      <div class="r-nom"><b>${p.an.sitio.nombre}</b><small>${p.base} cm · ${p.fresca ? `+${p.fresca} nuevo${p.fresca === 1 ? '' : 's'} · ` : ''}${p.sol} % sol</small></div>
      <div class="r-barra ${e.clase}"><i style="width:${Math.max(4, p.nota)}%"></i></div>
      <span class="r-nota ${e.clase}">${p.nota}</span>
    </li>`;
  }).join('')}</ol>
  ${f.lista[0]?.lejos ? '<p class="nota-lejos">Previsión a más de 7 días: tómatela como una pista, no como un hecho.</p>' : ''}`;
}

function grafica(an) {
  const d = an.dias, n = d.length, W = 10, H = 56;
  const maxN = Math.max(20, ...d.map((x) => x.nieve));
  const maxE = Math.max(60, ...d.map((x) => x.espesor));
  const finde = d.map((x, i) => { const w = fechaLocal(x.fecha).getDay(); return w === 6 || w === 0 ? `<rect x="${i * W}" y="0" width="${W}" height="${H}" class="g-finde"/>` : ''; }).join('');
  const barras = d.map((x, i) => { const h = (x.nieve / maxN) * (H - 8); return x.nieve ? `<rect x="${i * W + 2}" y="${H - h}" width="${W - 4}" height="${h}" rx="1.5" class="g-nieve${i < an.iHoy ? ' pasado' : ''}"/>` : ''; }).join('');
  const linea = d.map((x, i) => `${i * W + W / 2},${(H - (x.espesor / maxE) * (H - 8)).toFixed(1)}`).join(' ');
  return `<svg class="grafica" viewBox="0 0 ${n * W} ${H}" preserveAspectRatio="none" aria-hidden="true">
    ${finde}<line x1="${an.iHoy * W}" x2="${an.iHoy * W}" y1="0" y2="${H}" class="g-hoy"/>${barras}
    <polyline points="${linea}" class="g-espesor" vector-effect="non-scaling-stroke"/></svg>`;
}

function htmlSitio(an) {
  const s = an.sitio, abierto = estado.abierto === s.id;
  const prox = an.dias.slice(an.iHoy, an.iHoy + 10);
  return `<article class="tarjeta sitio ${abierto ? 'abierto' : ''}">
    <button class="s-cab" data-sitio="${s.id}" aria-expanded="${abierto}">
      <div class="s-nom"><b>${s.nombre}</b><small>${s.zona} · ${s.coche} desde ${ORIGEN}</small></div>
      <div class="s-datos"><span><b>${an.base}</b> cm</span><small>${an.nieve7 ? `+${an.nieve7} esta semana` : 'sin nevadas a la vista'}</small></div>
    </button>
    ${grafica(an)}
    <div class="g-leyenda"><span><i class="l-n"></i>nieve nueva</span><span><i class="l-e"></i>espesor</span><span><i class="l-f"></i>findes</span></div>
    ${abierto ? `<div class="detalle">
      <p class="s-nota">${s.nota}</p>
      <table><thead><tr><th>Día</th><th></th><th>Nieve</th><th>Base</th><th>°C</th><th>Viento</th></tr></thead><tbody>
      ${prox.map((x) => `<tr class="${[0, 6].includes(fechaLocal(x.fecha).getDay()) ? 'f' : ''}"><td>${diaCorto(x.fecha)}</td><td>${cielo(x.code)}</td><td>${x.nieve ? `<b>${x.nieve}</b>` : '–'}</td><td>${x.espesor}</td><td>${x.tmin}/${x.tmax}</td><td>${x.viento}</td></tr>`).join('')}
      </tbody></table>
      <a class="enl" href="${s.web}" target="_blank" rel="noopener">Web de la estación ↗</a>
    </div>` : ''}
  </article>`;
}

function htmlAvisos() {
  const tema = leer(CLAVE_AVISOS);
  if (!tema) return '';
  return `<section class="tarjeta avisos">
    <h3>🔔 Avisos de nieve al móvil</h3>
    <ol>
      <li>Instala <b>ntfy</b>: <a href="https://apps.apple.com/app/ntfy/id1625396347" target="_blank" rel="noopener">iPhone</a> · <a href="https://play.google.com/store/apps/details?id=io.heckel.ntfy" target="_blank" rel="noopener">Android</a></li>
      <li>Pulsa <b>+</b> y suscríbete a este canal:</li>
    </ol>
    <button class="tema" data-accion="copiar">${tema} <span>copiar</span></button>
    <p class="mini">Llega un aviso cuando se espere una nevada fuerte, cuando un finde pinte bien y cuando el vale se pueda canjear.</p>
  </section>`;
}

// ── compartir ────────────────────────────────────────────────
function mensajePlan(p) {
  return `Cosi, ¿nos vamos de skimo a ${p.an.sitio.nombre} el ${rangoFinde(p.sab, p.dom)}? 🎿\n`
    + `🏔️ ${p.base} cm de base${p.fresca ? `, ${p.fresca} cm nuevos` : ''} y ${p.sol} % de sol. ¡Toca canjear el vale! ❄️\n${URL_APP}`;
}
function descargarIcs() {
  const p = mejorPlan(tablaFindes(analizar(SITIOS, estado.json)));
  if (!p) return;
  const sig = (iso) => { const d = fechaLocal(iso); d.setDate(d.getDate() + 1); return new Intl.DateTimeFormat('sv-SE').format(d).replaceAll('-', ''); };
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//cosi//skimo//ES', 'BEGIN:VEVENT',
    `UID:skimo-${p.sab}@cosi`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART;VALUE=DATE:${p.sab.replaceAll('-', '')}`, `DTEND;VALUE=DATE:${sig(p.dom)}`,
    `SUMMARY:Skimo en ${p.an.sitio.nombre} 🎿`, `DESCRIPTION:El vale de cumple de Cosi ❄️ ${URL_APP}`,
    'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = `skimo-${p.sab}.ics`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

// ── eventos (uno solo, delegado) ─────────────────────────────
app.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-accion],[data-finde],[data-sitio]');
  if (!b) return;
  if (b.dataset.finde) { estado.finde = +b.dataset.finde; pintar(); return; }
  if (b.dataset.sitio) { estado.abierto = estado.abierto === b.dataset.sitio ? null : b.dataset.sitio; pintar(); return; }
  const acc = b.dataset.accion;
  if (acc === 'recargar') cargar(true);
  if (acc === 'ics') descargarIcs();
  if (acc === 'copiar') {
    try { await navigator.clipboard.writeText(leer(CLAVE_AVISOS)); aviso('Copiado ✅ Pégalo en ntfy'); } catch { aviso('Mantén pulsado para copiar'); }
  }
});

// Canal de avisos: llega en el enlace (…/nieve/#avisos=canal), nunca está en el código público.
const m = location.hash.match(/avisos=([\w-]+)/);
if (m) { guardar(CLAVE_AVISOS, m[1]); history.replaceState(null, '', location.pathname); }

document.addEventListener('visibilitychange', () => { if (!document.hidden) cargar(); });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
cargar();
