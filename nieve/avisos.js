// Avisos de nieve: lo lanza GitHub Actions cada mañana (.github/workflows/avisos-nieve.yml).
// Manda la notificación por ntfy (gratis, sin cuentas). El canal va en el secreto NTFY_TOPIC.
// Uso local:  NTFY_TOPIC=canal PRUEBA=true node nieve/avisos.js   (SECO=true = no envía, solo imprime)
import { readFileSync, writeFileSync } from 'node:fs';
import { SITIOS } from './sitios.js';
import { urlPrevision, analizar, tablaFindes, estadoVale, nevadaFuerte, hoyISO, UMBRAL } from './motor.js';

const RUTA_ESTADO = new URL('./avisos-estado.json', import.meta.url);
const URL_APP = 'https://nutricionatleta.github.io/cosi-24/nieve/';
const { NTFY_TOPIC, PRUEBA, SECO } = process.env;
const hoy = hoyISO();
const diasEntre = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const bonito = (iso) => new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(iso));

let estado;
try { estado = JSON.parse(readFileSync(RUTA_ESTADO, 'utf8')); } catch { estado = {}; }
estado.enviados ??= {};

const r = await fetch(urlPrevision(SITIOS));
if (!r.ok) throw new Error(`Open-Meteo ${r.status}`);
const analisis = analizar(SITIOS, await r.json());
const tabla = tablaFindes(analisis);
const vale = estadoVale(analisis);
const lineas = [];
const marcar = (clave) => { estado.enviados[clave] = hoy; };
const yaEnviado = (clave, dias) => estado.enviados[clave] && diasEntre(estado.enviados[clave], hoy) < dias;

// 1) El vale ya se puede canjear (una vez por temporada: se rearma si la base vuelve a desaparecer)
if (vale.listo && !estado.enviados['vale-listo']) {
  lineas.push(`🎉 ¡Primera nevada buena! ${vale.top.sitio.nombre} ya tiene ${vale.top.base} cm de base: el vale se puede canjear.`);
  marcar('vale-listo');
}
if (!vale.listo && vale.top.base < UMBRAL.minima) delete estado.enviados['vale-listo'];

// 2) Nevada fuerte prevista esta semana (como mucho un aviso por sitio cada 5 días)
for (const an of analisis) {
  const n = nevadaFuerte(an);
  if (n.cm >= UMBRAL.fresca && !yaEnviado(`nevada-${an.sitio.id}`, 5)) {
    lineas.push(`❄️ ${an.sitio.nombre}: ~${n.cm} cm a partir del ${bonito(n.desde)}.`);
    marcar(`nevada-${an.sitio.id}`);
  }
}

// 3) Un finde de los próximos 8 días pinta bien (un aviso por finde, y otro si pasa a «de 10»)
for (const f of tabla) {
  if (diasEntre(hoy, f.sab) > 8) continue;
  const p = f.lista[0];
  const nivel = p.nota >= 75 ? 'top' : p.nota >= 60 ? 'bien' : null;
  if (!nivel || estado.enviados[`finde-${f.sab}-${nivel}`]) continue;
  lineas.push(`${nivel === 'top' ? '🔥 Finde de 10' : '👍 Buen finde'}: ${p.an.sitio.nombre} el ${bonito(f.sab)} (${p.nota}/100, ${p.base} cm de base, ${p.sol} % sol).`);
  marcar(`finde-${f.sab}-bien`);
  if (nivel === 'top') marcar(`finde-${f.sab}-top`);
}

if (PRUEBA === 'true' && !lineas.length) {
  const p = tabla.flatMap((f) => f.lista).sort((a, b) => b.nota - a.nota)[0];
  lineas.push(`🧪 Aviso de prueba. Ahora mismo lo mejor: ${p.an.sitio.nombre} el ${bonito(p.sab)} (${p.nota}/100, ${p.base} cm de base).`);
}

// Limpieza: fuera claves de hace más de 60 días (menos la del vale)
for (const [k, f] of Object.entries(estado.enviados)) if (k !== 'vale-listo' && diasEntre(f, hoy) > 60) delete estado.enviados[k];

if (lineas.length) {
  const cuerpo = { topic: NTFY_TOPIC, title: 'Nieve para el skimo 🎿', message: lineas.join('\n'), tags: ['snowflake'], click: URL_APP, priority: 4 };
  if (SECO === 'true' || !NTFY_TOPIC) console.log('[seco]', JSON.stringify({ ...cuerpo, topic: NTFY_TOPIC ? '***' : '(sin canal)' }, null, 2));
  else {
    const e = await fetch('https://ntfy.sh/', { method: 'POST', body: JSON.stringify(cuerpo) });
    if (!e.ok) throw new Error(`ntfy ${e.status}`);
    console.log(`Enviado: ${lineas.length} línea(s)`);
  }
} else console.log('Nada que avisar hoy.', `Mejor base: ${vale.top.base} cm en ${vale.top.sitio.nombre}.`);

// GitHub apaga los cron tras 60 días sin actividad: se anota una revisión cada 3 semanas para mantenerlo vivo.
if (!estado.vivo || diasEntre(estado.vivo, hoy) >= 21) estado.vivo = hoy;
if (SECO !== 'true' && NTFY_TOPIC) writeFileSync(RUTA_ESTADO, `${JSON.stringify(estado, null, 2)}\n`);
