import { SITIOS, ORIGEN, ALUDES, FESTIVOS } from './sitios.js?v=2';
import { urlPrevision, analizar, tablaFindes, mejorPlan, estadoVale, etiqueta, nevadaFuerte, puntuar, hoyISO, UMBRAL } from './motor.js?v=2';

const app = document.getElementById('app');
const K = { cache: 'cosi-nieve-v1', avisos: 'cosi-nieve-avisos', plan: 'cosi-plan-v1', tab: 'cosi-tab' };
const VIGENCIA = 30 * 60e3, MESES = 5;
const URL_APP = 'https://nutricionatleta.github.io/cosi-24/nieve/';
const TABS = [{ id: 'prevision', txt: 'Previsión', ico: '❄️' }, { id: 'calendario', txt: 'Calendario', ico: '📅' }, { id: 'alojamiento', txt: 'Alojamiento', ico: '🏠' }];

// ── utilidades ───────────────────────────────────────────────
function leer(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
function guardar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } }
const fechaLocal = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const isoMas = (iso, n) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const fmt = (iso, o) => new Intl.DateTimeFormat('es-ES', o).format(fechaLocal(iso));
const diaCorto = (iso) => fmt(iso, { weekday: 'short', day: 'numeric' }).replace(/[.,]/g, '');
const rangoFinde = (sab) => `${diaCorto(sab)} – ${diaCorto(isoMas(sab, 1))} ${fmt(sab, { month: 'short' })}`.replace(/[.,]/g, '');
const cielo = (c) => (c === 0 ? '☀️' : c <= 2 ? '🌤️' : c === 3 ? '☁️' : c <= 48 ? '🌫️' : c <= 57 ? '🌦️' : c <= 67 ? '🌧️' : c <= 77 ? '🌨️' : c <= 82 ? '🌦️' : c <= 86 ? '🌨️' : '⛈️');
const hace = (t) => { const m = Math.round((Date.now() - t) / 60e3); return m < 1 ? 'ahora mismo' : m < 60 ? `hace ${m} min` : `hace ${Math.round(m / 60)} h`; };
const sitioPor = (id) => SITIOS.find((s) => s.id === id);
const enc = encodeURIComponent;
const mayus = (t) => t[0].toUpperCase() + t.slice(1);
const vibrar = () => { try { navigator.vibrate?.(12); } catch { /* nada */ } };

// ── estado ───────────────────────────────────────────────────
const datos = { json: null, hora: 0 };
const ui = { tab: TABS.some((t) => t.id === leer(K.tab)) ? leer(K.tab) : 'prevision', finde: null, abierto: null, zona: null };
let plan = { sab: null, sitio: null, aloj: null, ...leer(K.plan) };
let calc = null;

const alojDe = (clave) => { if (!clave) return null; const [id, k] = clave.split(':'); const s = sitioPor(id); return s?.dormir[+k] ? { sitio: s, item: s.dormir[+k] } : null; };
const pasos = () => [plan.sab, plan.sitio, plan.aloj].filter(Boolean).length;
function notaDe(sab, id) {
  const an = calc?.analisis.find((a) => a.sitio.id === id);
  const i = an ? an.dias.findIndex((d) => d.fecha === sab) : -1;
  return i >= 0 && i + 1 < an.dias.length ? puntuar(an, i) : null;
}
function cambiarPlan(cambios) {
  const antes = pasos();
  plan = { ...plan, ...cambios };
  if (plan.aloj && plan.sitio && !plan.aloj.startsWith(`${plan.sitio}:`)) plan.aloj = null; // el alojamiento va con su sitio
  if (plan.sab && isoMas(plan.sab, 1) < hoyISO()) plan.sab = null;
  guardar(K.plan, plan); vibrar(); pintar();
  if (antes < 3 && pasos() === 3) { confeti(); aviso('¡Plan completo! Mándaselo a Pablo 💌'); }
}

// ── datos (caché 30 min; si falla la red, tira de lo guardado) ─
async function cargar(forzar = false) {
  const cache = leer(K.cache);
  if (cache?.json && !datos.json) { Object.assign(datos, cache); pintar(); }
  if (!forzar && cache && Date.now() - cache.hora < VIGENCIA) return;
  document.body.classList.add('cargando');
  try {
    const r = await fetch(urlPrevision(SITIOS));
    if (!r.ok) throw new Error(r.status);
    datos.json = await r.json(); datos.hora = Date.now();
    guardar(K.cache, datos); pintar();
  } catch {
    aviso(datos.json ? 'Sin conexión: enseño la última previsión guardada' : 'No llego a la previsión ahora mismo 🥶');
  } finally { document.body.classList.remove('cargando'); }
}
function aviso(txt) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = txt;
  document.body.append(t); setTimeout(() => t.remove(), 3200);
}

// ── pintar ───────────────────────────────────────────────────
function pintar() {
  if (datos.json) {
    const analisis = analizar(SITIOS, datos.json), tabla = tablaFindes(analisis);
    calc = { analisis, tabla, mejor: mejorPlan(tabla), vale: estadoVale(analisis) };
  }
  const vista = { prevision: vistaPrevision, calendario: vistaCalendario, alojamiento: vistaAlojamiento }[ui.tab];
  app.innerHTML = `
    <header class="cab"><p class="ante">Vale por un finde de skimo</p><h1>¿Cuándo nos vamos? <span>🎿</span></h1></header>
    ${htmlPlan()}
    <div class="vista ${ui.pintada !== ui.tab ? 'entra' : ''}">${vista()}</div>
    <nav class="menu">${TABS.map((t) => `<button data-ir="${t.id}" aria-current="${ui.tab === t.id}"><span>${t.ico}</span>${t.txt}</button>`).join('')}</nav>`;
  ui.pintada = ui.tab;
}

function htmlPlan() {
  const s = sitioPor(plan.sitio), a = alojDe(plan.aloj), n = pasos();
  const p = plan.sab && plan.sitio ? notaDe(plan.sab, plan.sitio) : null;
  const slot = (tab, ico, txt, valor) => `<button class="slot ${valor ? 'ok' : ''}" data-ir="${tab}">
    <span class="s-ico">${valor ? '✓' : ico}</span><small>${txt}</small><b>${valor || 'Elegir'}</b></button>`;
  const pista = !plan.sab ? 'Empieza eligiendo finde en el calendario 👇' : !plan.sitio ? 'Ahora elige sitio en la previsión 👇' : 'Solo falta dónde dormir 👇';
  let nota = '';
  if (p) { const e = etiqueta(p.nota); nota = `<p class="plan-nota ${e.clase}">${e.emoji} Previsión para ese finde: <b>${p.nota}/100</b> · ${p.base} cm de base${p.lejos ? ' (aún lejos, puede cambiar)' : ''}</p>`; }
  else if (plan.sab && plan.sitio && calc) nota = '<p class="plan-nota">⏳ Ese finde aún no entra en la previsión (se ve a 16 días).</p>';
  return `<section class="tarjeta plan ${n === 3 ? 'completo' : ''}">
    <div class="plan-cab"><p class="ante">Nuestro plan</p><span class="puntos">${[0, 1, 2].map((i) => `<i class="${i < n ? 'si' : ''}"></i>`).join('')}</span></div>
    <div class="slots">
      ${slot('calendario', '🗓️', 'Finde', plan.sab && rangoFinde(plan.sab))}
      ${slot('prevision', '🏔️', 'Sitio', s?.nombre)}
      ${slot('alojamiento', '🛏️', 'Dormir', a?.item.nombre)}
    </div>
    ${nota}
    ${n === 3 ? `<div class="acciones">
        <a class="btn" href="https://wa.me/?text=${enc(mensajePlan())}" target="_blank" rel="noopener">💌 Enviárselo a Pablo</a>
        <button class="btn sec" data-accion="ics">📅 Al calendario</button></div>`
    : `<p class="plan-pista">${pista}</p>`}
    ${n ? '<button class="enl borrar" data-accion="borrar">empezar de cero</button>' : ''}
  </section>`;
}

// ── pestaña: previsión ──────────────────────────────────────
function vistaPrevision() {
  if (!calc) return '<div class="esqueleto"><i></i><i></i><i></i></div>';
  return `${htmlVale(calc.vale)}${htmlMejor(calc.mejor)}${htmlFindes(calc.tabla)}
    <h2 class="seccion">Cómo está cada sitio</h2>
    <div class="sitios">${[...calc.analisis].sort((a, b) => b.base - a.base || b.nieve7 - a.nieve7).map(htmlSitio).join('')}</div>
    ${htmlAvisos()}
    <section class="tarjeta aludes"><h3>⚠️ Antes de salir: riesgo de aludes</h3>
      <div class="enlaces">${ALUDES.map((a) => `<a href="${a.url}" target="_blank" rel="noopener">${a.nombre}</a>`).join('')}</div></section>
    <footer class="pie">Nieve estimada a la cota de cada sitio (≈2.000 m) · datos de <a href="https://open-meteo.com" target="_blank" rel="noopener">Open-Meteo</a><br>
      Actualizado ${hace(datos.hora)} · <button class="enl" data-accion="recargar">actualizar</button></footer>`;
}

function htmlVale(v) {
  const pct = Math.min(100, Math.round((v.top.base / UMBRAL.base) * 100));
  return `<section class="tarjeta vale ${v.listo ? 'listo' : ''}">
    <div class="vale-top"><span class="vale-emoji">${v.listo ? '🎉' : '❄️'}</span><div>
      <h2>${v.listo ? '¡Ya hay nieve! El vale se puede canjear' : 'Esperando la primera nevada buena'}</h2>
      <p>${v.listo ? `${v.top.sitio.nombre} ya tiene <b>${v.top.base} cm</b> de base.`
        : `Lo mejor ahora: <b>${v.top.base} cm</b> en ${v.top.sitio.nombre}. Faltan ${v.falta} cm para los ${UMBRAL.base} que pedimos.`}</p>
    </div></div>
    <div class="barra"><i style="width:${pct}%"></i></div>
  </section>`;
}

function htmlMejor(p) {
  if (!p || p.nota < 35) {
    const prox = calc.analisis.map((an) => ({ an, ...nevadaFuerte(an) })).sort((a, b) => b.cm - a.cm)[0];
    return `<section class="tarjeta mejor vacio"><p class="ante">El mejor plan según la nieve</p>
      <h2>Aún no hay finde con nieve 😴</h2>
      <p>${prox.cm >= 3 ? `Lo próximo: <b>~${prox.cm} cm</b> en ${prox.an.sitio.nombre} a partir del ${fmt(prox.desde, { weekday: 'long', day: 'numeric' })}. `
        : 'Esta semana no se espera nieve. '}Mientras, ya podéis ir eligiendo finde y sitio.</p></section>`;
  }
  const e = etiqueta(p.nota), elegido = plan.sab === p.sab && plan.sitio === p.an.sitio.id;
  return `<section class="tarjeta mejor">
    <div class="mejor-top"><div>
        <p class="ante">El mejor plan según la nieve</p><h2>${p.an.sitio.nombre}</h2><p class="cuando">${rangoFinde(p.sab)}</p></div>
      <div class="aro ${e.clase}" style="--n:${p.nota}"><b>${p.nota}</b><small>/100</small></div></div>
    <p class="sello ${e.clase}">${e.emoji} ${e.txt}${p.lejos ? ' · <span class="lejos">a más de una semana: puede cambiar</span>' : ''}</p>
    ${chips(p)}
    <div class="acciones"><button class="btn ${elegido ? 'hecho' : ''}" data-elegir="${p.sab}|${p.an.sitio.id}">${elegido ? '✓ Es nuestro plan' : '✅ Elegir este plan'}</button></div>
  </section>`;
}

const chips = (p) => `<ul class="chips">
  <li>🏔️ <b>${p.base}</b> cm base</li><li>❄️ <b>${p.fresca}</b> cm nuevos</li><li>☀️ <b>${p.sol}</b> % sol</li>
  <li>💨 <b>${p.viento}</b> km/h</li><li>🌡️ <b>${p.tmin}</b>/${p.tmax} °C</li></ul>`;

function htmlFindes(tabla) {
  if (!tabla.length) return '';
  if (ui.finde === null) ui.finde = Math.max(0, tabla.findIndex((t) => t.sab === plan.sab));
  ui.finde = Math.min(ui.finde, tabla.length - 1);
  const f = tabla[ui.finde];
  return `<h2 class="seccion">Finde a finde <small>toca uno para elegirlo</small></h2>
  <div class="pestanas" role="tablist">${tabla.map((t, i) => `<button role="tab" aria-selected="${i === ui.finde}" data-finde="${i}">${rangoFinde(t.sab)}</button>`).join('')}</div>
  ${htmlRanking(f)}
  ${f.lista[0]?.lejos ? '<p class="nota-lejos">Previsión a más de 7 días: tómatela como una pista, no como un hecho.</p>' : ''}`;
}

function htmlRanking(f) {
  return `<ol class="ranking">${f.lista.map((p) => {
    const e = etiqueta(p.nota), si = plan.sab === f.sab && plan.sitio === p.an.sitio.id;
    return `<li><button class="${si ? 'elegido' : ''}" data-elegir="${f.sab}|${p.an.sitio.id}">
      <div class="r-nom"><b>${si ? '✓ ' : ''}${p.an.sitio.nombre}</b><small>${p.base} cm · ${p.fresca ? `+${p.fresca} nuevo${p.fresca === 1 ? '' : 's'} · ` : ''}${p.sol} % sol</small></div>
      <div class="r-barra ${e.clase}"><i style="width:${Math.max(4, p.nota)}%"></i></div>
      <span class="r-nota ${e.clase}">${p.nota}</span></button></li>`;
  }).join('')}</ol>`;
}

function grafica(an) {
  const d = an.dias, n = d.length, W = 10, H = 56;
  const maxN = Math.max(20, ...d.map((x) => x.nieve)), maxE = Math.max(60, ...d.map((x) => x.espesor));
  const finde = d.map((x, i) => ([0, 6].includes(fechaLocal(x.fecha).getDay()) ? `<rect x="${i * W}" y="0" width="${W}" height="${H}" class="g-finde${plan.sab && (x.fecha === plan.sab || x.fecha === isoMas(plan.sab, 1)) ? ' sel' : ''}"/>` : '')).join('');
  const barras = d.map((x, i) => { const h = (x.nieve / maxN) * (H - 8); return x.nieve ? `<rect x="${i * W + 2}" y="${H - h}" width="${W - 4}" height="${h}" rx="1.5" class="g-nieve${i < an.iHoy ? ' pasado' : ''}"/>` : ''; }).join('');
  const linea = d.map((x, i) => `${i * W + W / 2},${(H - (x.espesor / maxE) * (H - 8)).toFixed(1)}`).join(' ');
  return `<svg class="grafica" viewBox="0 0 ${n * W} ${H}" preserveAspectRatio="none" aria-hidden="true">
    ${finde}<line x1="${an.iHoy * W}" x2="${an.iHoy * W}" y1="0" y2="${H}" class="g-hoy"/>${barras}
    <polyline points="${linea}" class="g-espesor"/></svg>`;
}

function htmlSitio(an) {
  const s = an.sitio, abierto = ui.abierto === s.id, elegido = plan.sitio === s.id;
  const prox = an.dias.slice(an.iHoy, an.iHoy + 10);
  return `<article class="tarjeta sitio ${abierto ? 'abierto' : ''} ${elegido ? 'elegido' : ''}">
    <button class="s-cab" data-sitio="${s.id}" aria-expanded="${abierto}">
      <div class="s-nom"><b>${elegido ? '✓ ' : ''}${s.nombre}</b><small>${s.zona} · ${s.coche} desde ${ORIGEN}</small></div>
      <div class="s-datos"><span><b>${an.base}</b> cm</span><small>${an.nieve7 ? `+${an.nieve7} esta semana` : 'sin nevadas a la vista'}</small></div>
    </button>
    ${grafica(an)}
    <div class="g-leyenda"><span><i class="l-n"></i>nieve nueva</span><span><i class="l-e"></i>espesor</span><span><i class="l-f"></i>findes</span><span class="mas">${abierto ? 'menos ▴' : 'detalle ▾'}</span></div>
    ${abierto ? `<div class="detalle">
      <p class="s-nota">${s.nota}</p>
      <table><thead><tr><th>Día</th><th></th><th>Nieve</th><th>Base</th><th>°C</th><th>Viento</th></tr></thead><tbody>
      ${prox.map((x) => `<tr class="${[0, 6].includes(fechaLocal(x.fecha).getDay()) ? 'f' : ''}"><td>${diaCorto(x.fecha)}</td><td>${cielo(x.code)}</td><td>${x.nieve ? `<b>${x.nieve}</b>` : '–'}</td><td>${x.espesor}</td><td>${x.tmin}/${x.tmax}</td><td>${x.viento}</td></tr>`).join('')}
      </tbody></table>
      <div class="acciones"><button class="btn ${elegido ? 'hecho' : ''}" data-elegir-sitio="${s.id}">${elegido ? '✓ Elegido' : `🏔️ Elegir ${s.nombre}`}</button>
        <a class="btn sec" href="${s.web}" target="_blank" rel="noopener">Web ↗</a></div>
    </div>` : ''}
  </article>`;
}

function htmlAvisos() {
  const tema = leer(K.avisos);
  if (!tema) return '';
  return `<section class="tarjeta avisos"><h3>🔔 Avisos de nieve al móvil</h3>
    <ol><li>Instala <b>ntfy</b>: <a href="https://apps.apple.com/app/ntfy/id1625396347" target="_blank" rel="noopener">iPhone</a> · <a href="https://play.google.com/store/apps/details?id=io.heckel.ntfy" target="_blank" rel="noopener">Android</a></li>
      <li>Pulsa <b>+</b> y suscríbete a este canal:</li></ol>
    <button class="tema" data-accion="copiar">${tema} <span>copiar</span></button>
    <p class="mini">Llega un aviso cuando se espere una nevada fuerte, cuando un finde pinte bien y cuando el vale se pueda canjear.</p></section>`;
}

// ── pestaña: calendario ─────────────────────────────────────
function vistaCalendario() {
  const hoy = hoyISO();
  // nota por sábado (del sitio elegido, o la mejor) y nieve máxima por día
  const notaSab = new Map(), nieveDia = new Map();
  for (const f of calc?.tabla || []) {
    const p = plan.sitio ? f.lista.find((x) => x.an.sitio.id === plan.sitio) : f.lista[0];
    if (p) notaSab.set(f.sab, p.nota);
  }
  for (const an of calc?.analisis || []) {
    if (plan.sitio && an.sitio.id !== plan.sitio) continue;
    an.dias.forEach((d) => { if (d.fecha >= hoy) nieveDia.set(d.fecha, Math.max(nieveDia.get(d.fecha) || 0, d.nieve)); });
  }
  const [y0, m0] = hoy.split('-').map(Number);
  let meses = '';
  for (let k = 0; k < MESES; k++) {
    const primero = new Date(y0, m0 - 1 + k, 1), y = primero.getFullYear(), m = primero.getMonth();
    const total = new Date(y, m + 1, 0).getDate(), hueco = (primero.getDay() + 6) % 7;
    let celdas = '<i></i>'.repeat(hueco);
    for (let d = 1; d <= total; d++) {
      const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dow = new Date(y, m, d).getDay(), finde = dow === 6 || dow === 0;
      const sab = dow === 0 ? isoMas(iso, -1) : iso, pasado = finde ? isoMas(sab, 1) < hoy : iso < hoy;
      const nota = finde ? notaSab.get(sab) : undefined;
      const clases = [finde ? 'fin' : '', pasado ? 'pasado' : '', iso === hoy ? 'hoy' : '', FESTIVOS[iso] ? 'festivo' : '',
        finde && plan.sab === sab ? 'sel' : '', nota !== undefined ? `n-${etiqueta(nota).clase}` : ''].join(' ');
      const copo = (nieveDia.get(iso) || 0) >= 5 ? '<em>❄</em>' : '';
      celdas += finde && !pasado
        ? `<button class="dia ${clases}" data-sab="${sab}" title="${FESTIVOS[iso] || ''}">${d}${copo}</button>`
        : `<span class="dia ${clases}" title="${FESTIVOS[iso] || ''}">${d}${copo}</span>`;
    }
    meses += `<section class="mes"><h3>${mayus(new Intl.DateTimeFormat("es-ES", { month: "long" }).format(primero))} ${y}</h3>
      <div class="sem">${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((x) => `<b>${x}</b>`).join('')}</div><div class="grid">${celdas}</div></section>`;
  }
  return `${htmlFindeElegido()}
    <div class="leyenda-cal"><span><i class="n-top"></i>de 10</span><span><i class="n-bien"></i>bueno</span><span><i class="n-justo"></i>justito</span><span><i class="n-no"></i>aún no</span><span><i class="sin"></i>sin previsión</span><span>❄ nevada</span><span><i class="fes"></i>festivo</span></div>
    <p class="mini centro">${plan.sitio ? `Colores según ${sitioPor(plan.sitio).nombre}.` : 'Colores según el mejor sitio de cada finde.'} Toca un sábado o domingo.</p>
    <div class="meses">${meses}</div>`;
}

function htmlFindeElegido() {
  if (!plan.sab) return '<section class="tarjeta guia"><h2>🗓️ ¿Qué finde te va bien?</h2><p>Toca un sábado o un domingo. Los colores dicen cómo pinta la nieve (se ven unos 16 días por delante).</p></section>';
  const f = calc?.tabla.find((t) => t.sab === plan.sab);
  const fest = [isoMas(plan.sab, -1), isoMas(plan.sab, 2)].filter((d) => FESTIVOS[d]).map((d) => `${FESTIVOS[d]} (${diaCorto(d)})`);
  return `<section class="tarjeta guia elegido" id="finde-elegido">
    <p class="ante">Finde elegido</p><h2>${rangoFinde(plan.sab)}</h2>
    ${fest.length ? `<p class="puente">🎉 Puente: ${fest.join(' y ')}</p>` : ''}
    ${f ? `<p class="mini">¿Dónde pinta mejor? Toca uno para elegirlo:</p>${htmlRanking(f)}`
      : '<p class="mini">Aún no hay previsión para ese finde: cuando falten unas dos semanas verás aquí qué sitio pinta mejor.</p>'}
    ${!plan.sitio || !f ? '<button class="btn sec ancho" data-ir="prevision">Ver la previsión de los sitios →</button>' : ''}
  </section>`;
}

// ── pestaña: alojamiento ────────────────────────────────────
function vistaAlojamiento() {
  const zona = sitioPor(ui.zona || plan.sitio || calc?.mejor?.an.sitio.id) || SITIOS[0];
  const sab = plan.sab, dom = sab && isoMas(sab, 1);
  const fechas = sab ? `&checkin=${sab}&checkout=${dom}` : '';
  const booking = (q) => `https://www.booking.com/searchresults.es.html?ss=${enc(q)}&group_adults=2&no_rooms=1&group_children=0${fechas}`;
  const airbnb = (q) => `https://www.airbnb.es/s/${enc(q)}/homes?adults=2${fechas}`;
  const mapa = (q) => `https://www.google.com/maps/search/?api=1&query=${enc(q)}`;
  const web = (q) => `https://www.google.com/search?q=${enc(`${q} reserva`)}`;
  return `<div class="zonas">${SITIOS.map((s) => `<button class="${s.id === zona.id ? 'on' : ''}" data-zona="${s.id}">${plan.sitio === s.id ? '✓ ' : ''}${s.nombre}</button>`).join('')}</div>
    <section class="tarjeta guia">
      ${sab ? `<p class="ante">Disponibilidad real para</p><h2>${rangoFinde(sab)}</h2><p class="mini">1 noche · 2 personas · los botones abren Booking y Airbnb con esas fechas.</p>`
        : '<h2>🛏️ ¿Dónde dormimos?</h2><p class="mini">Elige antes el finde y los botones te enseñarán lo que queda libre esas fechas.</p><button class="btn sec ancho" data-ir="calendario">Elegir finde →</button>'}
    </section>
    <div class="alojs">${zona.dormir.map((d, k) => {
      const clave = `${zona.id}:${k}`, si = plan.aloj === clave;
      return `<article class="tarjeta aloj ${si ? 'elegido' : ''}">
        <div class="a-top"><span class="a-emoji">${d.emoji}</span><div><b>${d.nombre}</b><small>${d.tipo} · ${zona.zona}</small></div></div>
        <p>${d.nota}</p>
        <div class="a-links">${d.refugio
          ? `<a href="${web(d.busca)}" target="_blank" rel="noopener">Reservar en su web ↗</a>`
          : `<a href="${booking(d.busca)}" target="_blank" rel="noopener">Booking ↗</a><a href="${airbnb(d.busca)}" target="_blank" rel="noopener">Airbnb ↗</a>`}
          <a href="${mapa(d.busca)}" target="_blank" rel="noopener">Mapa ↗</a></div>
        <button class="btn ${si ? 'hecho' : ''}" data-aloj="${clave}">${si ? '✓ Aquí dormimos' : '❤️ Me quedo con este'}</button>
      </article>`;
    }).join('')}</div>
    <p class="mini centro">Los refugios se reservan en su web y en invierno no todos abren: mirad antes.<br>
      ¿Otra idea en ${zona.pueblo}? <a href="${booking(zona.pueblo)}" target="_blank" rel="noopener">Booking</a> · <a href="${airbnb(zona.pueblo)}" target="_blank" rel="noopener">Airbnb</a></p>`;
}

// ── compartir ────────────────────────────────────────────────
function enlacePlan() { return `${URL_APP}#plan=${[plan.sab, plan.sitio, plan.aloj].join('~')}`; }
function mensajePlan() {
  const a = alojDe(plan.aloj), p = notaDe(plan.sab, plan.sitio);
  return `Pablo, ya lo he elegido 😏🎿\n🗓️ ${rangoFinde(plan.sab)}\n🏔️ ${sitioPor(plan.sitio).nombre}\n🛏️ ${a.item.nombre}`
    + `${p ? `\n❄️ Previsión: ${p.nota}/100, ${p.base} cm de base` : ''}\n${enlacePlan()}`;
}
function descargarIcs() {
  const s = sitioPor(plan.sitio), a = alojDe(plan.aloj);
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//cosi//skimo//ES', 'BEGIN:VEVENT',
    `UID:skimo-${plan.sab}@cosi`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART;VALUE=DATE:${plan.sab.replaceAll('-', '')}`, `DTEND;VALUE=DATE:${isoMas(plan.sab, 2).replaceAll('-', '')}`,
    `SUMMARY:Skimo en ${s.nombre} 🎿`, `LOCATION:${a.item.nombre}`, `DESCRIPTION:El vale de cumple de Cosi ❄️ ${enlacePlan()}`,
    'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const el = document.createElement('a');
  el.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  el.download = `skimo-${plan.sab}.ics`; el.click();
  setTimeout(() => URL.revokeObjectURL(el.href), 5000);
}

// ── confeti (lienzo temporal, se borra solo) ────────────────
function confeti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas'), x = c.getContext('2d'), dpr = devicePixelRatio || 1;
  c.className = 'confeti'; c.width = innerWidth * dpr; c.height = innerHeight * dpr; document.body.append(c); x.scale(dpr, dpr);
  const col = ['#8fd6ff', '#ff9ec4', '#6ff0b0', '#ffd166', '#ffffff'];
  const ps = Array.from({ length: 110 }, () => ({ x: innerWidth / 2, y: innerHeight * 0.35, vx: (Math.random() - 0.5) * 11, vy: -Math.random() * 11 - 3, r: Math.random() * 6, g: col[Math.floor(Math.random() * col.length)], w: 4 + Math.random() * 5 }));
  const t0 = performance.now();
  (function paso(t) {
    x.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of ps) { p.vy += 0.32; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += 0.15; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.g; x.fillRect(-p.w / 2, -2, p.w, 4); x.restore(); }
    if (t - t0 < 2600) requestAnimationFrame(paso); else c.remove();
  })(t0);
}

// ── eventos (uno solo, delegado) ─────────────────────────────
app.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-ir],[data-elegir],[data-elegir-sitio],[data-sab],[data-aloj],[data-zona],[data-finde],[data-sitio],[data-accion]');
  if (!b) return;
  const d = b.dataset;
  if (d.ir) { ui.tab = d.ir; guardar(K.tab, ui.tab); pintar(); scrollTo({ top: 0 }); return; }
  if (d.elegir) { const [sab, sitio] = d.elegir.split('|'); cambiarPlan({ sab, sitio }); aviso(`Elegido: ${sitioPor(sitio).nombre}, ${rangoFinde(sab)}`); return; }
  if (d.elegirSitio) { cambiarPlan({ sitio: d.elegirSitio }); return; }
  if (d.sab) {
    cambiarPlan({ sab: plan.sab === d.sab ? null : d.sab });
    document.getElementById('finde-elegido')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  if (d.aloj) { const a = alojDe(d.aloj); cambiarPlan({ sitio: a.sitio.id, aloj: plan.aloj === d.aloj ? null : d.aloj }); return; }
  if (d.zona) { ui.zona = d.zona; pintar(); return; }
  if (d.finde) { ui.finde = +d.finde; pintar(); return; }
  if (d.sitio) { ui.abierto = ui.abierto === d.sitio ? null : d.sitio; pintar(); return; }
  if (d.accion === 'recargar') cargar(true);
  if (d.accion === 'ics') descargarIcs();
  if (d.accion === 'borrar') { plan = { sab: null, sitio: null, aloj: null }; guardar(K.plan, plan); ui.zona = null; pintar(); }
  if (d.accion === 'copiar') {
    try { await navigator.clipboard.writeText(leer(K.avisos)); aviso('Copiado ✅ Pégalo en ntfy'); } catch { aviso('Mantén pulsado para copiar'); }
  }
});

// Enlaces especiales: …/nieve/#avisos=canal  y  …/nieve/#plan=sab~sitio~sitio:k
function leerEnlace() {
  const avisos = location.hash.match(/avisos=([\w-]+)/);
  if (avisos) guardar(K.avisos, avisos[1]);
  const compartido = location.hash.match(/plan=([\d-]*)~(\w*)~([\w:]*)/);
  if (compartido && sitioPor(compartido[2])) {
    const [, sab, sitio, aloj] = compartido;
    plan = { sab: sab || null, sitio, aloj: alojDe(aloj) ? aloj : null }; guardar(K.plan, plan);
    setTimeout(() => { aviso('💌 Este es el plan que ha elegido Cosi'); confeti(); }, 400);
  }
  if (avisos || compartido) { history.replaceState(null, '', location.pathname); pintar(); }
}
leerEnlace();
addEventListener('hashchange', leerEnlace);

document.addEventListener('visibilitychange', () => { if (!document.hidden) cargar(); });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
pintar();
cargar();
