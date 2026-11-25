/* Sara cumple 24 — motor del juego. Los textos y fotos se cambian en datos.js */
(() => {
  'use strict';
  const D = window.DATOS;
  const app = document.getElementById('app');

  const PASOS = ['puerta', 'intro', 'sopa', 'viajes', 'test', 'memory', 'pixel', 'final'];
  const JUEGOS = ['sopa', 'viajes', 'test', 'memory', 'pixel'];
  const TITULOS = { sopa: 'Sopa de letras', viajes: 'Nuestros viajes', test: '¿Cuánto me conoces?', memory: 'Memory', pixel: '¿Dónde estamos?' };
  const KEY = 'sara24-progreso-v1';

  // ---------------- utilidades ----------------
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const limpiaPalabra = (s) => norm(s).toUpperCase();
  const rand = (n) => Math.floor(Math.random() * n);
  const barajar = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sacudir = (el) => { el.classList.remove('sacude'); void el.offsetWidth; el.classList.add('sacude'); };
  const media = (foto, emoji, cls = '') =>
    `<div class="media ${cls}">${foto ? `<img src="${foto}" alt="" data-emoji="${emoji || '📷'}" draggable="false">` : `<span class="emoji">${emoji || '📷'}</span>`}</div>`;
  // Si una foto no existe, se pone su emoji.
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (img.tagName === 'IMG' && img.dataset.emoji) {
      const s = document.createElement('span'); s.className = 'emoji'; s.textContent = img.dataset.emoji; img.replaceWith(s);
    }
  }, true);

  function toast(txt) {
    document.querySelectorAll('.toast').forEach((t) => t.remove());
    const t = h(`<div class="toast">${txt}</div>`);
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  }

  // ---------------- progreso ----------------
  let estado = { paso: 0, letras: [] };
  const guardar = () => { try { localStorage.setItem(KEY, JSON.stringify(estado)); } catch (e) { /* sin almacenamiento */ } };
  (function cargar() {
    const q = new URLSearchParams(location.search);
    if (q.has('reset')) { try { localStorage.removeItem(KEY); } catch (e) { /* nada */ } }
    else {
      try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Number.isInteger(s.paso) && Array.isArray(s.letras)) estado = s; } catch (e) { /* nada */ }
    }
    if (q.has('paso')) {
      const p = Math.max(0, Math.min(PASOS.length - 1, parseInt(q.get('paso'), 10) || 0));
      estado = { paso: p, letras: D.letrasEnOrden.slice(0, Math.max(0, p - 2)) };
    }
    const a = D.letrasEnOrden.slice().sort().join(''), b = D.palabraFinal.toUpperCase().split('').sort().join('');
    if (a !== b) console.warn('OJO: letrasEnOrden no tiene las mismas letras que palabraFinal');
  })();

  function cabecera(juego) {
    const i = JUEGOS.indexOf(juego);
    const slots = D.palabraFinal.split('').map((_, k) =>
      `<span class="slot ${estado.letras[k] ? 'llena' : ''}">${estado.letras[k] || ''}</span>`).join('');
    return `<header class="cab"><div class="cab-top"><span class="chip">Prueba ${i + 1} de ${JUEGOS.length}</span><span class="cab-titulo">${TITULOS[juego]}</span></div><div class="slots">${slots}</div></header>`;
  }

  function ganar(texto) {
    const letra = D.letrasEnOrden[estado.letras.length];
    estado.letras.push(letra);
    estado.paso++;
    guardar();
    fx.confeti();
    const ultimo = estado.letras.length >= JUEGOS.length;
    const m = h(`<div class="modal"><div class="modal-caja pop">
      <p class="modal-txt">${texto}</p>
      <p class="peq">Has ganado la letra</p>
      <div class="letra-grande">${letra}</div>
      <button class="btn">${ultimo ? 'Ir a la prueba final ✨' : 'Siguiente prueba →'}</button>
    </div></div>`);
    m.querySelector('button').onclick = () => { m.remove(); render(); };
    document.body.appendChild(m);
  }

  function render() {
    fx.nevar(false);
    document.body.classList.toggle('noche', PASOS[estado.paso] === 'final');
    app.innerHTML = '';
    window.scrollTo(0, 0);
    PANTALLAS[PASOS[estado.paso]]();
  }

  // ---------------- 0. puerta ----------------
  function puerta() {
    const [antes, despues = ''] = (D.acertijo || '____').split('____');
    const el = h(`<section class="pantalla centro">
      <div class="portada"><p class="pre">para</p><h1 class="nombre">${D.nombre}</h1><div class="num24">${D.edad}</div></div>
      <p class="sub">Esta web es solo para una persona.<br>Rellena la frase para entrar.</p>
      <form class="form-pass" autocomplete="off">
        <p class="acertijo">${antes}<input type="text" class="hueco-txt" aria-label="Palabra que falta" autocapitalize="none" spellcheck="false" maxlength="20">${despues}</p>
        <button class="btn" type="submit">Entrar</button>
      </form>
      <p class="msg" aria-live="polite"></p>
    </section>`);
    const form = el.querySelector('form'), inp = el.querySelector('input'), msg = el.querySelector('.msg');
    const fallos = ['Mmm… no.', 'Esa no es 🙃'];
    let n = 0;
    form.onsubmit = (e) => {
      e.preventDefault();
      if (norm(inp.value) === norm(D.contrasena)) { inp.blur(); estado.paso = 1; guardar(); render(); return; }
      n++; sacudir(form);
      msg.textContent = n >= 2 ? D.pistaContrasena : fallos[0];
      if (n >= 4) msg.textContent = D.pistaContrasena + ' (4 letras)';
    };
    app.appendChild(el);
  }

  // ---------------- 1. intro ----------------
  function intro() {
    const el = h(`<section class="pantalla centro">
      <div class="intro-txt">${D.intro.map((p) => `<p>${p}</p>`).join('')}</div>
      <div class="slots" style="margin:10px 0">${D.palabraFinal.split('').map(() => '<span class="slot"></span>').join('')}</div>
      <button class="btn">Empezar 🎁</button>
    </section>`);
    el.querySelector('button').onclick = () => { estado.paso = 2; guardar(); render(); };
    app.appendChild(el);
  }

  // ---------------- 2. sopa de letras ----------------
  function crearSopa(palabras, n) {
    const dirs = [[0, 1], [1, 0], [1, 1], [-1, 1]];
    const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let intento = 0; intento < 300; intento++) {
      const g = Array.from({ length: n }, () => Array(n).fill(null));
      const pos = {};
      let ok = true;
      for (const w of palabras.slice().sort((a, b) => b.length - a.length)) {
        let colocada = false;
        for (let t = 0; t < 400 && !colocada; t++) {
          const [dr, dc] = dirs[rand(dirs.length)];
          const r = rand(n), c = rand(n);
          const er = r + dr * (w.length - 1), ec = c + dc * (w.length - 1);
          if (er < 0 || er >= n || ec < 0 || ec >= n) continue;
          let cabe = true;
          for (let i = 0; i < w.length; i++) { const x = g[r + dr * i][c + dc * i]; if (x && x !== w[i]) { cabe = false; break; } }
          if (!cabe) continue;
          pos[w] = [];
          for (let i = 0; i < w.length; i++) { g[r + dr * i][c + dc * i] = w[i]; pos[w].push((r + dr * i) * n + (c + dc * i)); }
          colocada = true;
        }
        if (!colocada) { ok = false; break; }
      }
      if (ok) return { letras: g.flat().map((x) => x || ABC[rand(ABC.length)]), pos };
    }
    throw new Error('No caben las palabras en la sopa');
  }

  function sopa() {
    const items = D.sopa.map((x) => (typeof x === 'string' ? { palabra: x } : x)).map((x) => ({ ...x, clave: limpiaPalabra(x.palabra) }));
    const n = Math.max(10, ...items.map((x) => x.clave.length));
    const { letras, pos } = crearSopa(items.map((x) => x.clave), n);
    const halladas = new Set();

    const el = h(`<section class="pantalla">${cabecera('sopa')}
      <p class="instr">Encuentra las ${items.length} palabras. Arrastra el dedo de la primera a la última letra (o toca la primera y luego la última).</p>
      <div class="sopa" style="grid-template-columns:repeat(${n},1fr)">${letras.map((l, i) => `<div class="celda" data-i="${i}">${l}</div>`).join('')}</div>
      <div class="palabras">${items.map((x) => `<span data-c="${x.clave}">${x.palabra}</span>`).join('')}</div>
    </section>`);
    const grid = el.querySelector('.sopa');
    const celdas = [...grid.children];

    const linea = (a, b) => {
      const r1 = Math.floor(a / n), c1 = a % n, r2 = Math.floor(b / n), c2 = b % n;
      const dr = Math.sign(r2 - r1), dc = Math.sign(c2 - c1);
      const len = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1));
      if (!(r1 === r2 || c1 === c2 || Math.abs(r2 - r1) === Math.abs(c2 - c1))) return [a];
      return Array.from({ length: len + 1 }, (_, i) => (r1 + dr * i) * n + (c1 + dc * i));
    };
    const pintar = (lista) => { celdas.forEach((c) => c.classList.remove('temp')); lista.forEach((i) => celdas[i].classList.add('temp')); };
    const celdaEn = (x, y) => { const e = document.elementFromPoint(x, y); return e && e.classList.contains('celda') ? +e.dataset.i : null; };

    function comprobar(a, b) {
      const sel = linea(a, b);
      const s1 = sel.join(','), s2 = sel.slice().reverse().join(',');
      for (const x of items) {
        if (halladas.has(x.clave)) continue;
        const p = pos[x.clave].join(',');
        if (p === s1 || p === s2) {
          halladas.add(x.clave);
          pos[x.clave].forEach((i) => celdas[i].classList.add('hallada'));
          el.querySelector(`[data-c="${x.clave}"]`).classList.add('ok');
          if (halladas.size === items.length) setTimeout(() => ganar('¡Sopa completada! 🧩'), 500);
          else if (x.nota) toast(x.nota);
          return;
        }
      }
      if (sel.length > 1) sacudir(grid);
    }

    let ini = null, act = null, arrastrando = false, tapPendiente = false;
    grid.addEventListener('pointerdown', (e) => {
      const c = celdaEn(e.clientX, e.clientY);
      if (c === null) return;
      e.preventDefault();
      if (tapPendiente && c !== ini) { comprobar(ini, c); tapPendiente = false; ini = null; pintar([]); return; }
      tapPendiente = false;
      ini = c; act = c; arrastrando = true; pintar([c]);
    });
    window.addEventListener('pointermove', (e) => {
      if (!arrastrando) return;
      const c = celdaEn(e.clientX, e.clientY);
      if (c !== null && c !== act) { act = c; pintar(linea(ini, act)); }
    });
    const soltar = () => {
      if (!arrastrando) return;
      arrastrando = false;
      if (act === ini) { tapPendiente = true; pintar([ini]); return; }
      comprobar(ini, act); ini = null; pintar([]);
    };
    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', soltar);
    app.appendChild(el);
  }

  // ---------------- 3. viajes ----------------
  function viajes() {
    const total = D.viajes.length;
    let orden = barajar(D.viajes.map((_, i) => i));
    while (total > 1 && orden.every((v, i) => v === i)) orden = barajar(orden);
    let intentos = 0;

    const el = h(`<section class="pantalla">${cabecera('viajes')}
      <p class="instr">Arrastra las tarjetas para ordenar nuestros viajes del <b>más antiguo</b> (arriba) al <b>más reciente</b> (abajo).</p>
      <div class="lista"></div>
      <p class="feedback" aria-live="polite"></p>
      <button class="btn ancho">Comprobar</button>
    </section>`);
    const lista = el.querySelector('.lista'), fb = el.querySelector('.feedback'), btn = el.querySelector('.btn');

    function pintar() {
      lista.innerHTML = orden.map((v, k) => {
        const x = D.viajes[v];
        return `<div class="viaje" data-v="${v}">
          <span class="pos">${k + 1}</span>${media(x.foto, x.emoji)}
          <div class="info"><b>${x.nombre}</b><span class="fecha oculto">${x.fecha || ''}</span></div>
          <span class="asa" aria-hidden="true">⠿</span>
        </div>`;
      }).join('');
    }
    const renumerar = () => lista.querySelectorAll('.pos').forEach((p, k) => { p.textContent = k + 1; });

    // Arrastrar: la tarjeta sigue al dedo y las demás se apartan. La tarjeta arrastrada
    // nunca se mueve en el DOM (se mueven las vecinas) para no perder el puntero.
    let drag = null;
    lista.addEventListener('pointerdown', (e) => {
      const it = e.target.closest('.viaje');
      if (!it || btn.disabled) return;
      e.preventDefault();
      try { it.setPointerCapture(e.pointerId); } catch (err) { /* nada */ }
      drag = { it, y0: e.pageY, id: e.pointerId, gap: parseFloat(getComputedStyle(lista).rowGap) || 10 };
      it.classList.add('arrastrando');
      fb.textContent = '';
    });
    lista.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (e.clientY < 70) window.scrollBy(0, -10); else if (e.clientY > innerHeight - 70) window.scrollBy(0, 10);
      const { it, gap } = drag;
      it.style.transform = `translateY(${e.pageY - drag.y0}px)`;
      const r = it.getBoundingClientRect(), centro = r.top + r.height / 2;
      const next = it.nextElementSibling, prev = it.previousElementSibling;
      if (next) {
        const rn = next.getBoundingClientRect();
        if (centro > rn.top + rn.height / 2) { lista.insertBefore(next, it); drag.y0 += rn.height + gap; }
      }
      if (prev) {
        const rp = prev.getBoundingClientRect();
        if (centro < rp.top + rp.height / 2) { lista.insertBefore(prev, it.nextElementSibling); drag.y0 -= rp.height + gap; }
      }
      it.style.transform = `translateY(${e.pageY - drag.y0}px)`;
      renumerar();
    });
    const soltar = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag.it.style.transform = '';
      drag.it.classList.remove('arrastrando');
      drag = null;
      orden = [...lista.children].map((c) => +c.dataset.v);
      renumerar();
    };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => lista.addEventListener(t, soltar));

    btn.onclick = () => {
      intentos++;
      const bien = orden.filter((v, i) => v === i).length;
      if (bien === total) {
        lista.querySelectorAll('.viaje').forEach((v) => { v.classList.add('bien'); v.querySelector('.fecha').classList.remove('oculto'); });
        lista.querySelectorAll('.asa').forEach((f) => f.remove());
        btn.disabled = true;
        fb.textContent = 'Así fue nuestra historia 💛';
        setTimeout(() => ganar('¡Orden perfecto! Qué memoria 🧳'), 1600);
        return;
      }
      sacudir(lista);
      fb.textContent = `Tienes ${bien} de ${total} en su sitio 🤔`;
      if (intentos >= 3) {
        const malo = orden.findIndex((v, i) => v !== i);
        fb.textContent += ` Pista: el nº ${malo + 1} no va ahí.`;
      }
    };
    pintar();
    app.appendChild(el);
  }

  // ---------------- 4. test ----------------
  function test() {
    let i = 0;
    const el = h(`<section class="pantalla">${cabecera('test')}<div class="q"></div></section>`);
    const q = el.querySelector('.q');
    function pregunta() {
      const p = D.test[i];
      q.innerHTML = `<span class="contador">Pregunta ${i + 1} de ${D.test.length}</span>
        <p class="pregunta">${p.pregunta}</p>
        <div class="opciones">${p.opciones.map((o, k) => `<button class="opcion" data-k="${k}">${o}</button>`).join('')}</div>
        <p class="feedback" aria-live="polite"></p>
        <button class="btn ancho oculto">${i === D.test.length - 1 ? 'Terminar' : 'Siguiente →'}</button>`;
      const fb = q.querySelector('.feedback'), sig = q.querySelector('.btn');
      let resuelta = false;
      q.querySelector('.opciones').onclick = (e) => {
        const b = e.target.closest('.opcion');
        if (!b || resuelta || b.classList.contains('mal')) return;
        if (+b.dataset.k === p.correcta) {
          resuelta = true; b.classList.add('bien'); fb.textContent = p.siAcierta || '¡Bien! 💛'; sig.classList.remove('oculto');
        } else {
          b.classList.add('mal'); sacudir(b); fb.textContent = (p.comentarios && p.comentarios[b.dataset.k]) || p.siFalla || 'Nop, prueba otra 😜';
        }
      };
      sig.onclick = () => { i++; if (i < D.test.length) pregunta(); else ganar('¡Aprobada con nota! 📝'); };
    }
    pregunta();
    app.appendChild(el);
  }

  // ---------------- 5. memory ----------------
  function memory() {
    const cartas = barajar(D.memory.flatMap((x, k) => [{ ...x, k }, { ...x, k }]));
    let abiertas = [], bloqueo = false, pares = 0, movs = 0;
    const el = h(`<section class="pantalla">${cabecera('memory')}
      <p class="instr">Encuentra las parejas. <span class="contador">Movimientos: <b>0</b></span></p>
      <div class="memory">${cartas.map((c, i) => `<button class="carta" data-i="${i}" aria-label="Carta"><div class="in">
        <div class="cara dorso">?</div>${media(c.foto, c.emoji, 'cara frente')}
      </div></button>`).join('')}</div>
    </section>`);
    const contador = el.querySelector('.contador b');
    el.querySelector('.memory').onclick = (e) => {
      const b = e.target.closest('.carta');
      if (!b || bloqueo || b.classList.contains('vuelta') || b.classList.contains('par')) return;
      b.classList.add('vuelta');
      abiertas.push(b);
      if (abiertas.length < 2) return;
      movs++; contador.textContent = movs;
      const [a, c] = abiertas;
      if (cartas[a.dataset.i].k === cartas[c.dataset.i].k) {
        a.classList.add('par'); c.classList.add('par'); abiertas = []; pares++;
        if (pares === D.memory.length) setTimeout(() => ganar(`¡Todas las parejas en ${movs} movimientos! 🃏`), 700);
      } else {
        bloqueo = true;
        setTimeout(() => { a.classList.remove('vuelta'); c.classList.remove('vuelta'); abiertas = []; bloqueo = false; }, 900);
      }
    };
    app.appendChild(el);
  }

  // ---------------- 6. foto pixelada ----------------
  function pixel() {
    const P = D.pixel, N = 360, BLOQUES = [36, 24, 16, 11, 7, 4];
    let nivel = 0, fallos = 0;
    const el = h(`<section class="pantalla">${cabecera('pixel')}
      <p class="pregunta">${P.pregunta}</p>
      <canvas class="pixel-cv" width="${N}" height="${N}"></canvas>
      <p class="pista" aria-live="polite"></p>
      <form class="form-adivina" autocomplete="off">
        <input type="text" placeholder="Escribe el sitio" aria-label="Respuesta" spellcheck="false">
        <div class="fila"><button type="button" class="btn sec" data-a="nitida">Más nítida 🔍</button><button type="submit" class="btn">Probar</button></div>
      </form>
      <p class="feedback" aria-live="polite"></p>
    </section>`);
    const cv = el.querySelector('canvas'), ctx = cv.getContext('2d');
    const pista = el.querySelector('.pista'), fb = el.querySelector('.feedback'), form = el.querySelector('form'), inp = el.querySelector('input');
    const src = document.createElement('canvas'); src.width = N; src.height = N;
    const sctx = src.getContext('2d');

    function dibujar(nitida) {
      ctx.clearRect(0, 0, N, N);
      if (nitida) { ctx.imageSmoothingEnabled = true; ctx.drawImage(src, 0, 0); return; }
      const w = Math.ceil(N / BLOQUES[nivel]);
      const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = w;
      const t = tmp.getContext('2d'); t.imageSmoothingEnabled = true; t.drawImage(src, 0, 0, w, w);
      ctx.imageSmoothingEnabled = false; ctx.drawImage(tmp, 0, 0, w, w, 0, 0, N, N);
    }
    const img = new Image();
    img.onload = () => {
      const s = Math.min(img.width, img.height);
      sctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, N, N);
      dibujar();
    };
    img.onerror = () => {
      const g = sctx.createLinearGradient(0, 0, N, N); g.addColorStop(0, '#9ad0ff'); g.addColorStop(1, '#ffd6e5');
      sctx.fillStyle = g; sctx.fillRect(0, 0, N, N);
      sctx.font = '220px serif'; sctx.textAlign = 'center'; sctx.textBaseline = 'middle'; sctx.fillText(P.emoji || '📷', N / 2, N / 2 + 10);
      dibujar();
    };
    img.src = P.foto;

    function enfocar() {
      if (nivel < BLOQUES.length - 1) { nivel++; dibujar(); }
      const k = Math.min(P.pistas.length, Math.floor(nivel / 2));
      if (k > 0) pista.textContent = P.pistas[k - 1];
    }
    el.querySelector('[data-a=nitida]').onclick = () => { enfocar(); fb.textContent = ''; };
    form.onsubmit = (e) => {
      e.preventDefault();
      if (!inp.value.trim()) return;
      if (P.respuestas.some((r) => norm(r) === norm(inp.value))) {
        inp.blur(); dibujar(true); form.classList.add('oculto');
        fb.textContent = '¡Exacto! 📸';
        setTimeout(() => ganar('¡La has reconocido! 📍'), 1300);
        return;
      }
      fallos++; sacudir(form); enfocar();
      fb.textContent = fallos >= 5 ? `Empieza por «${P.respuestas[0].charAt(0).toUpperCase()}»…` : 'Nop. Ahora se ve un poco mejor 👀';
      if (fallos >= 7 && !el.querySelector('[data-a=rindo]')) {
        const r = h('<button type="button" class="btn sec ancho" data-a="rindo" style="margin-top:10px">Me rindo 🏳️</button>');
        r.onclick = () => { dibujar(true); form.classList.add('oculto'); r.remove(); fb.textContent = `Era: ${P.respuestas[0]}. Rata 🐀`; setTimeout(() => ganar('Te la regalo… por ser tu cumple 😜'), 1500); };
        el.appendChild(r);
      }
    };
    app.appendChild(el);
  }

  // ---------------- 7. final ----------------
  function final() {
    const palabra = D.palabraFinal.toUpperCase();
    const fichas = estado.letras.length === palabra.length ? estado.letras.slice() : D.letrasEnOrden.slice();
    const puestos = Array(palabra.length).fill(null); // índice de ficha en cada hueco
    let fallos = 0;
    const R = D.regalo;

    const el = h(`<section class="pantalla final">
      <div class="centro" style="min-height:auto;padding-top:20px">
        <h2>La palabra secreta</h2>
        <p class="sub">Tienes las ${palabra.length} letras. Ordénalas tocándolas.</p>
      </div>
      <div class="huecos">${puestos.map((_, k) => `<button class="hueco" data-h="${k}" aria-label="Hueco ${k + 1}"></button>`).join('')}</div>
      <div class="fichas">${fichas.map((l, k) => `<button class="ficha" data-f="${k}">${l}</button>`).join('')}</div>
      <p class="feedback" aria-live="polite"></p>
      <div class="zona-rasca oculto">
        <p class="sub" style="text-align:center">Y ahora… <b>rasca</b> 👇</p>
        <div class="rasca">
          <div class="vale">
            ${R.foto ? `<img class="vale-foto" src="${R.foto}" alt="" draggable="false">` : ''}
            <span class="ante">${R.antetitulo}</span>
            <span class="titulo">${R.titulo}</span>
            <span class="subt">${R.subtitulo}</span>
            <ul>${R.detalles.map((d) => `<li>${d}</li>`).join('')}</ul>
            <span class="validez">${R.validez}</span>
            ${R.notaNieve ? `<span class="nieve">${R.notaNieve}</span>` : ''}
          </div>
          <canvas aria-label="Rasca para descubrir"></canvas>
        </div>
      </div>
      <div class="carta-final oculto">${D.carta.map((p) => `<p>${p}</p>`).join('')}<p class="firma">${D.firma}</p><a class="btn-nieve" href="nieve/">❄️ ¿Cuándo lo canjeamos? Mira la nieve</a></div>
    </section>`);
    const huecos = el.querySelector('.huecos'), fb = el.querySelector('.feedback');
    const botFichas = [...el.querySelectorAll('.ficha')], botHuecos = [...el.querySelectorAll('.hueco')];

    function pintar() {
      botHuecos.forEach((b, k) => { const f = puestos[k]; b.textContent = f === null ? '' : fichas[f]; b.classList.toggle('llena', f !== null); });
      botFichas.forEach((b, k) => b.classList.toggle('usada', puestos.includes(k)));
    }
    el.querySelector('.fichas').onclick = (e) => {
      const b = e.target.closest('.ficha');
      if (!b || huecos.classList.contains('ok')) return;
      const libre = puestos.indexOf(null);
      if (libre === -1) return;
      puestos[libre] = +b.dataset.f; pintar(); fb.textContent = '';
      if (!puestos.includes(null)) comprobar();
    };
    huecos.onclick = (e) => {
      const b = e.target.closest('.hueco');
      if (!b || huecos.classList.contains('ok')) return;
      puestos[+b.dataset.h] = null; pintar();
    };
    function comprobar() {
      const intento = puestos.map((f) => fichas[f]).join('');
      if (intento === palabra) {
        huecos.classList.add('ok');
        fb.textContent = `¡${palabra}! 🏔️`;
        fx.confeti();
        setTimeout(() => { el.querySelector('.fichas').classList.add('oculto'); mostrarRasca(); }, 1200);
        return;
      }
      fallos++; sacudir(huecos);
      fb.textContent = fallos >= 2 ? D.pistaPalabra : 'Casi… prueba otro orden (toca una letra de arriba para quitarla)';
      if (fallos >= 4) fb.textContent = `${D.pistaPalabra} Empieza por «${palabra[0]}».`;
    }

    function mostrarRasca() {
      const zona = el.querySelector('.zona-rasca');
      zona.classList.remove('oculto');
      fx.nevar(true);
      // Espera a que carguen la foto y las fuentes: así la capa de rascar mide lo mismo que el vale.
      const fotoVale = zona.querySelector('.vale-foto');
      const listo = Promise.all([
        document.fonts ? document.fonts.ready.catch(() => {}) : null,
        fotoVale && !fotoVale.complete ? new Promise((ok) => { fotoVale.onload = fotoVale.onerror = ok; }) : null,
      ]);
      Promise.race([listo, new Promise((ok) => setTimeout(ok, 2500))]).then(() => requestAnimationFrame(() => {
        const caja = zona.querySelector('.rasca'), cv = caja.querySelector('canvas'), ctx = cv.getContext('2d', { willReadFrequently: true });
        const r = caja.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
        cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
        ctx.scale(dpr, dpr);
        const g = ctx.createLinearGradient(0, 0, r.width, r.height);
        g.addColorStop(0, '#cfd6e6'); g.addColorStop(.5, '#f4f6fb'); g.addColorStop(1, '#aab4cc');
        ctx.fillStyle = g; ctx.fillRect(0, 0, r.width, r.height);
        ctx.fillStyle = 'rgba(27,45,94,.08)';
        for (let i = 0; i < 260; i++) ctx.fillRect(Math.random() * r.width, Math.random() * r.height, 2, 2);
        ctx.fillStyle = '#1b2d5e'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = '800 30px Fraunces, Georgia, serif'; ctx.fillText('🎁 Rasca aquí', r.width / 2, r.height / 2 - 14);
        ctx.font = '700 16px Nunito, sans-serif'; ctx.fillText('con el dedo', r.width / 2, r.height / 2 + 22);
        zona.scrollIntoView({ behavior: 'smooth', block: 'center' });

        let rascando = false, last = null, movs = 0, hecho = false;
        const punto = (e) => { const b = cv.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
        function trazo(p) {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.lineWidth = 42; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.beginPath(); ctx.moveTo((last || p).x, (last || p).y); ctx.lineTo(p.x + .1, p.y + .1); ctx.stroke();
          last = p;
          if (++movs % 8 === 0) medir();
        }
        function medir() {
          const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
          let vacios = 0, total = 0;
          for (let i = 3; i < d.length; i += 4 * 24) { total++; if (d[i] < 50) vacios++; }
          if (!hecho && vacios / total > 0.4) descubrir();
        }
        function descubrir() {
          hecho = true; cv.style.opacity = '0'; cv.style.pointerEvents = 'none';
          fx.confeti(); setTimeout(() => fx.confeti(), 500); setTimeout(() => fx.confeti(), 1000);
          setTimeout(() => {
            const carta = el.querySelector('.carta-final'); carta.classList.remove('oculto');
            setTimeout(() => carta.scrollIntoView({ behavior: 'smooth', block: 'start' }), 2500);
          }, 1200);
        }
        cv.addEventListener('pointerdown', (e) => { e.preventDefault(); rascando = true; last = null; trazo(punto(e)); });
        cv.addEventListener('pointermove', (e) => { if (rascando) trazo(punto(e)); });
        ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => cv.addEventListener(t, () => { if (rascando) medir(); rascando = false; last = null; }));
      }));
    }
    pintar();
    app.appendChild(el);
  }

  // ---------------- efectos (confeti + nieve) ----------------
  const fx = (() => {
    const cv = document.getElementById('fx'), ctx = cv.getContext('2d');
    let parts = [], raf = null, nieve = false, dpr = 1;
    const COL = ['#ff4f86', '#ff8a5b', '#ffd166', '#7b5cff', '#22b36b', '#4cc9f0'];
    const tam = () => { dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; };
    tam(); addEventListener('resize', tam);
    const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
    function arrancar() { if (!raf) raf = requestAnimationFrame(tick); }
    function tick() {
      raf = null;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      if (nieve && parts.length < 140 && Math.random() < .5) {
        parts.push({ t: 'n', x: Math.random() * innerWidth, y: -10, vy: Math.random() * 1.1 + .5, r: Math.random() * 2.6 + 1, f: Math.random() * 6 });
      }
      parts = parts.filter((p) => {
        if (p.t === 'c') {
          p.vy += .32; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore();
          return p.y < innerHeight + 30;
        }
        p.f += .02; p.x += Math.sin(p.f) * .5; p.y += p.vy;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fill();
        return nieve && p.y < innerHeight + 10;
      });
      if (parts.length || nieve) arrancar();
    }
    return {
      confeti(n = 130) {
        if (quieto) return;
        for (let i = 0; i < n; i++) {
          parts.push({ t: 'c', x: innerWidth / 2 + (Math.random() - .5) * 120, y: innerHeight * .4, vx: (Math.random() - .5) * 14, vy: -Math.random() * 13 - 4,
            r: Math.random() * 7 + 5, rot: Math.random() * 6, vr: (Math.random() - .5) * .35, c: COL[i % COL.length] });
        }
        arrancar();
      },
      nevar(on) { nieve = on && !quieto; if (nieve) arrancar(); },
    };
  })();

  const PANTALLAS = { puerta, intro, sopa, viajes, test, memory, pixel, final };
  render();
})();
