/* =====================================================================
   Rego dos Campos · interacción y animación
   Librerías: GSAP 3.15 (ScrollTrigger, SplitText, DrawSVG) + Lenis 1.3
   La escena 3D vive en assets/js/scene.js y expone window.REGO_SCENE.
   ===================================================================== */
(function () {
  'use strict';

  var C = window.REGO_CONFIG || {};
  var html = document.documentElement;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var lenis = null;

  var clean = function (v) { return String(v || '').trim().replace(/^@/, ''); };
  var TIKTOK = clean(C.tiktok);
  var INSTAGRAM = clean(C.instagram);
  var smoothstep = function (a, b, v) { var t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

  /* ------------------------------------------------------------------
     1. Contenido que sale de config.js
     ------------------------------------------------------------------ */
  function escapeAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function applyConfig() {
    $$('[data-social="tiktok"]').forEach(function (a) { if (TIKTOK) a.href = 'https://www.tiktok.com/@' + TIKTOK; });
    $$('[data-social="instagram"]').forEach(function (a) { if (INSTAGRAM) a.href = 'https://www.instagram.com/' + INSTAGRAM + '/'; });
    $$('[data-handle="tiktok"]').forEach(function (el) { if (TIKTOK) el.textContent = '@' + TIKTOK; });
    $$('[data-handle="instagram"]').forEach(function (el) { if (INSTAGRAM) el.textContent = '@' + INSTAGRAM; });
    $$('[data-handle-bare="tiktok"]').forEach(function (el) { if (TIKTOK) el.textContent = TIKTOK; });

    var videos = (C.tiktokVideos || []).filter(Boolean);
    var box = $('.social__videos');
    if (videos.length && box) {
      box.innerHTML = videos.map(function (url) {
        var id = (String(url).match(/video\/(\d+)/) || [])[1];
        if (!id) return '';
        return '<blockquote class="tiktok-embed" cite="' + escapeAttr(url) + '" data-video-id="' + id + '">' +
          '<section><a href="' + escapeAttr(url) + '" target="_blank" rel="noopener">Ver vídeo en TikTok</a></section></blockquote>';
      }).join('');
      box.hidden = false;
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.tiktok.com/embed.js';
      document.body.appendChild(s);
    }

    $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  /* ------------------------------------------------------------------
     2. Calendario de temporada
     ------------------------------------------------------------------ */
  function buildCalendar() {
    var body = $('.cal__body');
    if (!body) return;
    var data = C.temporada || {};
    var now = new Date().getMonth() + 1;
    body.innerHTML = '';
    Object.keys(data).forEach(function (name) {
      var set = {};
      (data[name] || []).forEach(function (m) { set[Number(m)] = true; });
      var tr = document.createElement('tr');
      var th = document.createElement('th');
      th.scope = 'row';
      th.textContent = name;
      tr.appendChild(th);
      for (var m = 1; m <= 12; m++) {
        var td = document.createElement('td');
        var on = !!set[m];
        if (on) {
          td.classList.add('on');
          if (m === 1 || !set[m - 1]) td.classList.add('start');
          if (m === 12 || !set[m + 1]) td.classList.add('end');
        }
        if (m === now) td.classList.add('is-now');
        td.innerHTML = '<span class="sr-only">' + MONTHS[m - 1] + ': ' + (on ? 'cosecha' : 'sin cosecha') + '</span>';
        tr.appendChild(td);
      }
      body.appendChild(tr);
    });
    var head = $('.cal thead th[data-m="' + now + '"]');
    if (head) head.classList.add('is-now');

    // Rango de meses legible por variedad: "De octubre a enero"
    var rangeText = function (months) {
      var set = {};
      months.map(Number).forEach(function (m) { set[m] = true; });
      var start = null;
      for (var m = 1; m <= 12; m++) { var prev = m === 1 ? 12 : m - 1; if (set[m] && !set[prev]) { start = m; break; } }
      if (start === null) return months.length === 12 ? 'Todo el año' : '';
      var end = start;
      while (set[end === 12 ? 1 : end + 1] && (end === 12 ? 1 : end + 1) !== start) end = end === 12 ? 1 : end + 1;
      var txt = start === end ? MONTHS[start - 1] : 'de ' + MONTHS[start - 1] + ' a ' + MONTHS[end - 1];
      return txt.charAt(0).toUpperCase() + txt.slice(1);
    };
    $$('[data-season-of]').forEach(function (el) {
      var months = data[el.getAttribute('data-season-of')];
      if (months && months.length) el.textContent = rangeText(months);
    });

    // Frase según el mes actual
    var out = $('[data-season]');
    var short = $('[data-season-short]');
    if (!out && !short) return;
    var names = Object.keys(data);
    var inSeason = names.filter(function (n) { return (data[n] || []).map(Number).indexOf(now) !== -1; });
    var join = function (arr) { return arr.length > 1 ? arr.slice(0, -1).join(', ') + ' y ' + arr[arr.length - 1] : arr[0]; };
    if (inSeason.length) {
      if (out) out.textContent = 'Ahora mismo, en ' + MONTHS[now - 1] + ', es temporada de ' + join(inSeason) + '.';
      if (short) short.textContent = 'Ahora: temporada de ' + join(inSeason);
    } else {
      var best = null;
      names.forEach(function (n) {
        (data[n] || []).map(Number).forEach(function (m) {
          var dist = (m - now + 12) % 12;
          if (dist > 0 && (best === null || dist < best.dist)) best = { dist: dist, m: m, names: [n] };
          else if (best && dist === best.dist && best.names.indexOf(n) === -1) best.names.push(n);
        });
      });
      if (out) out.textContent = best ? 'La próxima cosecha empieza en ' + MONTHS[best.m - 1] + ' con ' + join(best.names) + '.' : '';
      if (short && best) short.textContent = 'Próxima cosecha: ' + MONTHS[best.m - 1];
    }
  }

  /* ------------------------------------------------------------------
     3. Guía de maduración
     ------------------------------------------------------------------ */
  function initRipeness() {
    var range = $('#ripe-range');
    if (!range) return;
    var visual = $('.ripe__visual');
    var avo = $('.ripe__avo');
    var title = $('.ripe__title');
    var text = $('.ripe__text');
    var stops = [[0, [110, 154, 58]], [45, [78, 107, 44]], [75, [58, 50, 38]], [100, [36, 27, 29]]];
    var states = [
      { max: 24, t: 'Duro', d: 'Déjalo de 3 a 5 días a temperatura ambiente, fuera de la nevera.' },
      { max: 54, t: 'Casi', d: 'Cede muy poco al tacto. Mañana o pasado estará listo.' },
      { max: 84, t: 'En su punto', d: 'Cede un poco al presionar junto al rabito. Ábrelo hoy.' },
      { max: 100, t: 'Pasado', d: 'Muy blando. Revisa la pulpa y úsalo hoy, por ejemplo en guacamole.' }
    ];
    var colorAt = function (v) {
      for (var i = 1; i < stops.length; i++) {
        if (v <= stops[i][0]) {
          var a = stops[i - 1], b = stops[i];
          var k = (v - a[0]) / (b[0] - a[0]);
          return a[1].map(function (c, j) { return Math.round(c + (b[1][j] - c) * k); });
        }
      }
      return stops[stops.length - 1][1];
    };
    var last = '';
    var update = function () {
      var v = Number(range.value);
      var c = colorAt(v);
      visual.style.setProperty('--ripe', 'rgb(' + c.join(',') + ')');
      var s = states.filter(function (st) { return v <= st.max; })[0];
      if (s.t !== last) {
        title.textContent = s.t;
        text.textContent = s.d;
        last = s.t;
      }
      range.setAttribute('aria-valuetext', s.t);
      avo.style.transform = 'scale(' + (1 - v * 0.0005) + ',' + (1 - v * 0.0011) + ')';
    };
    range.addEventListener('input', update);
    update();
  }

  /* ------------------------------------------------------------------
     4. Recetario: filtros, buscador y ficha en ventana
     ------------------------------------------------------------------ */
  var RECETAS = window.REGO_RECETAS || [];
  var CATS = ['Desayunos', 'Para picar', 'Entrantes', 'Principales', 'Postres'];
  var norm = function (t) { return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  var plain = function (h) { var d = document.createElement('div'); d.innerHTML = h; return d.textContent; };
  var esc = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  // Solo se permite <em> en los títulos
  var title = function (h) { return esc(h).replace(/&lt;em&gt;/g, '<em>').replace(/&lt;\/em&gt;/g, '</em>'); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function initRecipes() {
    var grid = $('.recipe-grid');
    if (!grid || !RECETAS.length) return;
    var filters = $('.recipe-filters');
    var search = $('#recipe-search');
    var empty = $('.recipe-empty');
    var dialog = $('#recipe-dialog');
    var body = $('.recipe-dialog__body', dialog);
    var scroller = $('.recipe-dialog__scroll', dialog);
    var state = { cat: 'Todas', q: '', checked: {}, current: -1, opener: null };

    $$('[data-recipe-count]').forEach(function (el) { el.textContent = RECETAS.length; });

    var cats = CATS.filter(function (c) { return RECETAS.some(function (r) { return r.cat === c; }); });
    RECETAS.forEach(function (r) { if (cats.indexOf(r.cat) === -1) cats.push(r.cat); });
    filters.innerHTML = ['Todas'].concat(cats).map(function (c) {
      var n = c === 'Todas' ? RECETAS.length : RECETAS.filter(function (r) { return r.cat === c; }).length;
      return '<button type="button" class="recipe-filter" data-cat="' + esc(c) + '" aria-pressed="' + (c === 'Todas') + '">' + esc(c) + ' <small>' + n + '</small></button>';
    }).join('');

    var hay = RECETAS.map(function (r) { return norm(plain(r.title) + ' ' + r.cat + ' ' + r.ingredients.join(' ')); });
    grid.innerHTML = RECETAS.map(function (r, i) {
      return '<li class="rcard" data-i="' + i + '"><button type="button" class="rcard__btn" aria-haspopup="dialog" aria-controls="recipe-dialog">' +
        '<span class="rcard__top"><span class="rcard__n mono">' + pad(i + 1) + '</span><span class="rcard__cat mono">' + esc(r.cat) + '</span></span>' +
        '<span class="rcard__title">' + title(r.title) + '</span>' +
        '<span class="rcard__foot"><span class="rcard__meta mono"><span>' + esc(r.time) + '</span><span>' + esc(r.level) + '</span></span>' +
        '<span class="rcard__go">' + ARROW + '</span></span></button></li>';
    }).join('');
    var cards = $$('.rcard', grid);
    var visible = function () { return cards.filter(function (c) { return !c.hidden; }).map(function (c) { return Number(c.getAttribute('data-i')); }); };

    var refreshTimer = null;
    var apply = function (animate) {
      var q = norm(state.q.trim());
      var shown = 0;
      cards.forEach(function (c, i) {
        var ok = (state.cat === 'Todas' || RECETAS[i].cat === state.cat) && (!q || hay[i].indexOf(q) !== -1);
        c.hidden = !ok;
        if (ok) shown++;
      });
      empty.hidden = shown > 0;
      if (animate && window.gsap && !reduce) {
        gsap.fromTo(cards.filter(function (c) { return !c.hidden; }), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: .6, stagger: .035, ease: 'power3.out', clearProps: 'transform' });
      }
      if (window.ScrollTrigger) {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(function () { ScrollTrigger.refresh(); }, 160);
      }
    };
    filters.addEventListener('click', function (e) {
      var b = e.target.closest('.recipe-filter');
      if (!b) return;
      state.cat = b.getAttribute('data-cat');
      $$('.recipe-filter', filters).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      apply(true);
    });
    var searchTimer = null;
    search.addEventListener('input', function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () { state.q = search.value; apply(true); }, 160);
    });

    var render = function (i) {
      var r = RECETAS[i];
      state.current = i;
      var checked = state.checked[r.id] || (state.checked[r.id] = {});
      var list = visible();
      var pos = list.indexOf(i);
      if (pos === -1) { list = RECETAS.map(function (_, k) { return k; }); pos = i; }
      var prev = list[(pos - 1 + list.length) % list.length];
      var next = list[(pos + 1) % list.length];
      body.innerHTML =
        '<p class="recipe__kicker mono"><span>' + pad(i + 1) + ' / ' + pad(RECETAS.length) + '</span><span>' + esc(r.cat) + '</span></p>' +
        '<header class="recipe__head"><h3 class="recipe__title" id="rd-title">' + title(r.title) + '</h3>' +
        '<dl class="recipe__meta">' +
          '<div><dt>Tiempo</dt><dd>' + esc(r.time) + '</dd></div>' +
          '<div><dt>Raciones</dt><dd>' + esc(r.serves) + '</dd></div>' +
          '<div><dt>Dificultad</dt><dd>' + esc(r.level) + '</dd></div>' +
          '<div><dt>Variedad</dt><dd>' + esc(r.variety) + '</dd></div>' +
        '</dl></header>' +
        '<div class="recipe__grid"><div class="recipe__ingredients"><h4 class="mono">Ingredientes</h4><ul>' +
          r.ingredients.map(function (ing, k) {
            return '<li><label><input type="checkbox" data-k="' + k + '"' + (checked[k] ? ' checked' : '') + '><span>' + esc(ing) + '</span></label></li>';
          }).join('') +
        '</ul></div><ol class="recipe__steps">' + r.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol></div>' +
        (r.tip ? '<p class="recipe__tip"><span class="mono">Consejo</span> ' + esc(r.tip) + '</p>' : '') +
        (list.length > 1 ? '<nav class="recipe-nav" aria-label="Otras recetas">' +
          '<button type="button" data-go="' + prev + '"><span class="mono">Anterior</span><strong>' + title(RECETAS[prev].title) + '</strong></button>' +
          '<button type="button" data-go="' + next + '"><span class="mono">Siguiente</span><strong>' + title(RECETAS[next].title) + '</strong></button>' +
        '</nav>' : '');
      scroller.scrollTop = 0;
    };

    body.addEventListener('change', function (e) {
      var cb = e.target;
      if (cb.type !== 'checkbox') return;
      state.checked[RECETAS[state.current].id][cb.getAttribute('data-k')] = cb.checked;
    });
    body.addEventListener('click', function (e) {
      var b = e.target.closest('[data-go]');
      if (!b) return;
      render(Number(b.getAttribute('data-go')));
      if (window.gsap && !reduce) gsap.fromTo(body, { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: .45, ease: 'power3.out', clearProps: 'transform,opacity,visibility' });
    });

    var open = function (i, opener) {
      render(i);
      state.opener = opener;
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      html.classList.add('dialog-open');
      if (lenis) lenis.stop();
      if (window.gsap && !reduce) gsap.fromTo(dialog, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .55, ease: 'expo.out', clearProps: 'transform,opacity,visibility' });
    };
    var close = function () {
      if (typeof dialog.close === 'function') dialog.close();
      else { dialog.removeAttribute('open'); onClosed(); }
    };
    var onClosed = function () {
      html.classList.remove('dialog-open');
      if (lenis) lenis.start();
      if (state.opener) state.opener.focus({ preventScroll: true });
    };
    grid.addEventListener('click', function (e) {
      var btn = e.target.closest('.rcard__btn');
      if (btn) open(Number(btn.parentNode.getAttribute('data-i')), btn);
    });
    $('.recipe-dialog__close', dialog).addEventListener('click', close);
    dialog.addEventListener('close', onClosed);
    dialog.addEventListener('click', function (e) { if (e.target === dialog) close(); });

    apply(false);

    // Datos estructurados para buscadores (Google entiende recetas)
    try {
      var ld = {
        '@context': 'https://schema.org',
        '@graph': RECETAS.map(function (r) {
          return {
            '@type': 'Recipe',
            name: plain(r.title),
            recipeCategory: r.cat,
            totalTime: 'PT' + r.min + 'M',
            recipeYield: r.serves + ' raciones',
            recipeIngredient: r.ingredients,
            recipeInstructions: r.steps.map(function (t) { return { '@type': 'HowToStep', text: t }; }),
            keywords: 'aguacate, ' + r.variety,
            author: { '@type': 'Organization', name: 'Rego dos Campos' }
          };
        })
      };
      var sc = document.createElement('script');
      sc.type = 'application/ld+json';
      sc.textContent = JSON.stringify(ld);
      document.head.appendChild(sc);
    } catch (err) { /* sin datos estructurados */ }
  }

  /* ------------------------------------------------------------------
     5. Menú móvil
     ------------------------------------------------------------------ */
  var setMenu = function () {};
  function initMenu() {
    var btn = $('.menu-toggle');
    var menu = $('#mobile-menu');
    if (!btn || !menu) return;
    var label = $('.sr-only', btn);
    setMenu = function (open) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      label.textContent = open ? 'Cerrar menú' : 'Abrir menú';
      html.classList.toggle('menu-open', open);
      menu.hidden = !open;
      if (open) {
        if (lenis) lenis.stop();
        if (window.gsap && !reduce) {
          gsap.fromTo(menu, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: .8, ease: 'expo.inOut' });
          gsap.fromTo($$('nav li', menu), { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: .9, stagger: .06, delay: .25, ease: 'expo.out' });
        }
        var first = $('a', menu);
        if (first) first.focus({ preventScroll: true });
      } else if (lenis) {
        lenis.start();
      }
    };
    btn.addEventListener('click', function () { setMenu(btn.getAttribute('aria-expanded') !== 'true'); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && html.classList.contains('menu-open')) { setMenu(false); btn.focus(); }
    });
    window.matchMedia('(min-width: 1101px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });
  }

  /* ------------------------------------------------------------------
     6. Paisaje gallego en canvas (sección La finca)
     ------------------------------------------------------------------ */
  function seeded(seed) {
    return function () {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  }

  function createRain(opts) {
    var drops = [];
    var angle = opts.angle || .2;
    var rand = Math.random;
    var spawn = function (w, h, initial) {
      return {
        x: rand() * (w + h * angle) - h * angle * .5,
        y: initial ? rand() * h : -rand() * h * .3 - 30,
        l: opts.min + rand() * (opts.max - opts.min),
        v: (520 + rand() * 380) * (opts.speed || 1)
      };
    };
    return {
      resize: function (w, h) {
        var n = Math.round((w * h) / 9000 * (opts.density || 1));
        drops.length = 0;
        for (var i = 0; i < n; i++) drops.push(spawn(w, h, true));
      },
      draw: function (ctx, w, h, dt) {
        ctx.strokeStyle = opts.color;
        ctx.lineWidth = opts.width || 1;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (var i = 0; i < drops.length; i++) {
          var d = drops[i];
          d.y += d.v * dt;
          d.x += d.v * dt * angle;
          if (d.y - d.l > h) {
            var nd = spawn(w, h, false);
            d.x = nd.x; d.y = nd.y; d.l = nd.l; d.v = nd.v;
          }
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - d.l * angle, d.y - d.l);
        }
        ctx.stroke();
      }
    };
  }

  function mountCanvas(canvas, scene) {
    if (!canvas || !canvas.getContext) return null;
    var ctx = canvas.getContext('2d');
    var w = 0, h = 0, running = false, last = 0, raf = 0, visible = false;
    var paint = function (dt) { if (w && h) scene.frame(ctx, w, h, dt); };
    var loop = function (t) {
      var dt = Math.min((t - last) / 1000, .05);
      last = t;
      paint(dt);
      if (running) raf = requestAnimationFrame(loop);
    };
    var start = function () {
      if (running || reduce) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    var stop = function () { running = false; cancelAnimationFrame(raf); };
    var resize = function () {
      var r = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scene.resize(w, h);
      paint(0);
    };
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    else { window.addEventListener('resize', resize); resize(); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !document.hidden) start(); else stop();
      }, { rootMargin: '80px' }).observe(canvas);
    } else start();
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else if (visible) start();
    });
    return { repaint: function () { paint(0); } };
  }

  function landScene() {
    // Capas del paisaje, del fondo al frente
    var layers = [
      { base: .50, amp: .05, f: [1.1, 2.6], ph: [.3, 1.7], top: '#4F6E4C', bottom: '#2C4530', alpha: .62, par: .12 },
      { base: .60, amp: .05, f: [1.5, 3.7], ph: [2.1, .4], top: '#3E5E3C', bottom: '#203826', tree: '#27452A', light: '#4C7446', size: 5, rows: 2, par: .28 },
      { base: .69, amp: .045, f: [1.25, 3.1], ph: [1.2, 2.6], top: '#2D4C2F', bottom: '#162A1A', tree: '#1C3620', light: '#3B6038', size: 8.5, rows: 2, par: .48 },
      { base: .76, amp: .04, f: [2.0, 4.4], ph: [.8, 1.1], top: '#1C3421', bottom: '#0B160E', tree: '#10220F', light: '#28462A', size: 14, rows: 2, par: .75, stream: true }
    ];
    var trees = [];
    var mist = [];
    var streamPts = [];
    var progress = .5;
    var time = 0;
    var W = 0, H = 0;
    var rain = createRain({ color: 'rgba(236, 235, 223, .15)', density: .65, min: 12, max: 28, angle: .2, speed: 1.1 });
    var ridge = function (L, nx) {
      return L.base + L.amp * (Math.sin(nx * L.f[0] * Math.PI + L.ph[0]) * .65 + Math.sin(nx * L.f[1] * Math.PI + L.ph[1]) * .35);
    };
    var offset = function (L) { return (progress - .5) * H * .2 * L.par; };
    var canopy = function (ctx, x, y, s) {
      ctx.moveTo(x + s, y); ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.moveTo(x - s * .55 + s * .74, y + s * .3); ctx.arc(x - s * .55, y + s * .3, s * .74, 0, Math.PI * 2);
      ctx.moveTo(x + s * .55 + s * .7, y + s * .28); ctx.arc(x + s * .55, y + s * .28, s * .7, 0, Math.PI * 2);
    };
    // Curva suave por puntos de control (Catmull-Rom)
    var spline = function (pts, steps) {
      var out = [];
      for (var i = 0; i < pts.length - 1; i++) {
        var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
        for (var s = 0; s < steps; s++) {
          var t = s / steps, t2 = t * t, t3 = t2 * t;
          out.push({
            x: .5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
            y: .5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
          });
        }
      }
      out.push(pts[pts.length - 1]);
      return out;
    };
    var drawStream = function (ctx, L) {
      var off = offset(L);
      var pts = streamPts.map(function (p) { return { x: p.x, y: p.y + off }; });
      var n = pts.length;
      // Orillas, agua y brillo: el ancho crece hacia el espectador
      var pass = function (color, w0, w1, alpha, dash) {
        ctx.strokeStyle = color;
        ctx.globalAlpha = alpha;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (dash) { ctx.setLineDash(dash); ctx.lineDashOffset = -time * 60; }
        for (var i = 0; i < n - 1; i += 4) {
          var k = i / n;
          ctx.lineWidth = w0 + (w1 - w0) * k * k;
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          for (var j = i + 1; j <= Math.min(i + 5, n - 1); j++) ctx.lineTo(pts[j].x, pts[j].y);
          ctx.stroke();
        }
        if (dash) ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      };
      pass('#0A140C', 6, 46, .85);
      pass('#4F6E4C', 3.5, 32, .75);
      pass('#9FB47A', 2, 18, .55);
      pass('#EDEDC2', 1, 7, .75, [16, 30]);
    };
    return {
      setProgress: function (p) { progress = p; },
      resize: function (w, h) {
        W = w; H = h;
        var rand = seeded(42);
        var scale = Math.max(.7, Math.min(w / 1400, 1.25));
        trees = layers.map(function (L) {
          if (!L.size) return [];
          var size = L.size * scale;
          var gap = size * 4.4;
          var list = [];
          for (var r = 0; r < L.rows; r++) {
            for (var x = (r % 2) * gap / 2 - gap; x < w + gap; x += gap) {
              if (rand() < .12) continue;
              list.push({ x: x + (rand() - .5) * size * 1.2, r: r, s: size * (.75 + rand() * .45) * (1 + r * .1) });
            }
          }
          return list;
        });
        mist = [];
        for (var i = 0; i < 6; i++) {
          mist.push({ x: rand() * w, y: .44 + rand() * .34, rx: w * (.2 + rand() * .25), k: .1 + rand() * .1, v: 5 + rand() * 12 });
        }
        var L = layers[3];
        var top = ridge(L, .6) * h;
        streamPts = spline([
          { x: w * .6, y: top + 2 }, { x: w * .55, y: top + h * .04 }, { x: w * .66, y: top + h * .1 },
          { x: w * .5, y: top + h * .17 }, { x: w * .6, y: top + h * .24 }, { x: w * .44, y: h + 30 }
        ], 14);
        rain.resize(w, h);
      },
      frame: function (ctx, w, h, dt) {
        time += dt;
        ctx.clearRect(0, 0, w, h);
        // Sol tras la bruma
        var sun = ctx.createRadialGradient(w * .76, h * .2, 0, w * .76, h * .2, Math.max(w, h) * .5);
        sun.addColorStop(0, 'rgba(217, 222, 126, .16)');
        sun.addColorStop(.5, 'rgba(217, 222, 126, .04)');
        sun.addColorStop(1, 'rgba(217, 222, 126, 0)');
        ctx.fillStyle = sun;
        ctx.fillRect(0, 0, w, h);

        for (var i = 0; i < layers.length; i++) {
          var L = layers[i];
          var off = offset(L);
          var topY = (L.base - L.amp) * h + off;
          var g = ctx.createLinearGradient(0, topY, 0, h);
          g.addColorStop(0, L.top);
          g.addColorStop(1, L.bottom);
          ctx.globalAlpha = L.alpha || 1;
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(0, h);
          for (var x = 0; x <= w + 8; x += 8) ctx.lineTo(x, ridge(L, x / w) * h + off);
          ctx.lineTo(w, h);
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 1;

          // Luz rasante sobre la cresta
          ctx.strokeStyle = 'rgba(217, 222, 126, .18)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          for (x = 0; x <= w + 8; x += 8) { var ry = ridge(L, x / w) * h + off; if (x === 0) ctx.moveTo(x, ry); else ctx.lineTo(x, ry); }
          ctx.stroke();

          var list = trees[i];
          if (list && list.length) {
            var size = L.size * Math.max(.7, Math.min(w / 1400, 1.25));
            // Terrazas entre filas
            ctx.strokeStyle = 'rgba(236, 235, 223, .06)';
            ctx.lineWidth = 1;
            for (var r = 0; r <= L.rows; r++) {
              ctx.beginPath();
              for (x = 0; x <= w + 8; x += 12) {
                var ty = ridge(L, x / w) * h + off + (r + .5) * size * 2.6 + size * .6;
                if (x === 0) ctx.moveTo(x, ty); else ctx.lineTo(x, ty);
              }
              ctx.stroke();
            }
            var baseOf = function (tr) { return ridge(L, tr.x / w) * h + off + tr.s * 1.1 + tr.r * size * 2.6; };
            // Sombras en el suelo
            ctx.fillStyle = 'rgba(6, 12, 6, .4)';
            ctx.beginPath();
            for (var t = 0; t < list.length; t++) {
              var tr = list[t], by = baseOf(tr);
              ctx.moveTo(tr.x + tr.s * 1.6, by + tr.s * .35);
              ctx.ellipse(tr.x + tr.s * .35, by + tr.s * .35, tr.s * 1.25, tr.s * .3, 0, 0, Math.PI * 2);
            }
            ctx.fill();
            // Troncos
            ctx.fillStyle = 'rgba(40, 28, 16, .9)';
            ctx.beginPath();
            for (t = 0; t < list.length; t++) {
              tr = list[t]; by = baseOf(tr);
              ctx.rect(tr.x - tr.s * .08, by - tr.s * .3, tr.s * .16, tr.s * .75);
            }
            ctx.fill();
            // Copas
            ctx.fillStyle = L.tree;
            ctx.beginPath();
            for (t = 0; t < list.length; t++) { tr = list[t]; by = baseOf(tr); canopy(ctx, tr.x, by - tr.s * .55, tr.s); }
            ctx.fill();
            // Lado iluminado por el sol (arriba a la derecha)
            ctx.fillStyle = L.light;
            ctx.globalAlpha = .55;
            ctx.beginPath();
            for (t = 0; t < list.length; t++) {
              tr = list[t]; by = baseOf(tr);
              var hx = tr.x + tr.s * .32, hy = by - tr.s * .85;
              ctx.moveTo(hx + tr.s * .62, hy); ctx.arc(hx, hy, tr.s * .62, 0, Math.PI * 2);
            }
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.fillStyle = 'rgba(217, 222, 126, .14)';
            ctx.beginPath();
            for (t = 0; t < list.length; t++) {
              tr = list[t]; by = baseOf(tr);
              var kx = tr.x + tr.s * .45, ky = by - tr.s * 1.02;
              ctx.moveTo(kx + tr.s * .3, ky); ctx.arc(kx, ky, tr.s * .3, 0, Math.PI * 2);
            }
            ctx.fill();
            if (L.stream) drawStream(ctx, L);
          }

          // Bruma entre capas
          if (i < layers.length - 1) {
            var my = ridge(L, .5) * h + off;
            var mg = ctx.createLinearGradient(0, my - h * .05, 0, my + h * .1);
            mg.addColorStop(0, 'rgba(236, 235, 223, 0)');
            mg.addColorStop(.5, 'rgba(236, 235, 223, .09)');
            mg.addColorStop(1, 'rgba(236, 235, 223, 0)');
            ctx.fillStyle = mg;
            ctx.fillRect(0, my - h * .05, w, h * .15);
          }
        }

        // Bancos de niebla que se desplazan
        for (var m = 0; m < mist.length; m++) {
          var b = mist[m];
          b.x += b.v * dt;
          if (b.x - b.rx > w) b.x = -b.rx;
          ctx.save();
          ctx.translate(b.x, b.y * h);
          ctx.scale(1, b.k);
          var fg = ctx.createRadialGradient(0, 0, 0, 0, 0, b.rx);
          fg.addColorStop(0, 'rgba(236, 235, 223, .11)');
          fg.addColorStop(1, 'rgba(236, 235, 223, 0)');
          ctx.fillStyle = fg;
          ctx.beginPath();
          ctx.arc(0, 0, b.rx, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        rain.draw(ctx, w, h, dt);
      }
    };
  }

  /* ------------------------------------------------------------------
     Arranque sin dependencias de animación
     ------------------------------------------------------------------ */
  applyConfig();
  buildCalendar();
  initRipeness();
  initRecipes();
  initMenu();

  var loadFallback = function (sel) {
    $$(sel).forEach(function (img) { if (img.dataset.src && !img.src) img.src = img.dataset.src; });
  };
  if (html.classList.contains('no-webgl')) loadFallback('.scene__fallback-img');
  window.addEventListener('rego:scene-failed', function () { loadFallback('.scene__fallback-img'); });
  if (reduce) loadFallback('.open-static__img');

  var land = landScene();
  var landCanvas = mountCanvas($('.finca__land'), land);

  /* Escena 3D: encendido solo cuando está en pantalla */
  var scene3d = window.REGO_SCENE || null;
  window.addEventListener('rego:scene', function (e) { scene3d = e.detail; wireScene(); });
  function wireScene() {
    if (!scene3d) return;
    if (reduce) { scene3d.setReduced(true); scene3d.setProgress(0); return; }
    var sec = $('.scene');
    var visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !document.hidden) scene3d.start(); else scene3d.stop();
      }, { rootMargin: '120px' }).observe(sec);
    } else scene3d.start();
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) scene3d.stop(); else if (visible) scene3d.start();
    });
    if (finePointer) {
      sec.addEventListener('pointermove', function (e) {
        scene3d.setPointer(e.clientX / window.innerWidth - .5, e.clientY / window.innerHeight - .5);
      });
      sec.addEventListener('pointerleave', function () { scene3d.setPointer(0, 0); });
    }
  }
  wireScene();

  if (!window.gsap || !window.ScrollTrigger) {
    html.classList.add('loaded');
    if (scene3d) scene3d.start();
    return;
  }

  /* ------------------------------------------------------------------
     7. GSAP + Lenis
     ------------------------------------------------------------------ */
  var hasSplit = !!window.SplitText;
  var hasDraw = !!window.DrawSVGPlugin;
  gsap.registerPlugin.apply(gsap, [ScrollTrigger, window.SplitText, window.DrawSVGPlugin].filter(Boolean));
  ScrollTrigger.config({ ignoreMobileResize: true });

  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: .09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    var toTop = id === '#' || id === '#top';
    var target = toTop ? null : document.getElementById(id.slice(1));
    if (!toTop && !target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(toTop ? 0 : target, { duration: 1.6, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
    else if (toTop) window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    if (target) {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
    try { history.replaceState(null, '', toTop ? location.pathname + location.search : id); } catch (err) { /* sin historial */ }
  });

  var fontsReady = Promise.race([
    document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
    new Promise(function (r) { setTimeout(r, 1800); })
  ]);

  /* ---------- Loader ---------- */
  var loader = $('.loader');
  var useLoader = !reduce && loader && getComputedStyle(loader).display !== 'none';
  var loaderTl = null;
  if (useLoader) {
    if (lenis) lenis.stop();
    var counter = $('.loader__count');
    var count = { v: 0 };
    loaderTl = gsap.timeline();
    if (hasDraw) loaderTl.from('.loader__path', { drawSVG: '0%', duration: 1.3, ease: 'power2.inOut' }, 0);
    loaderTl
      .from('.loader__pit', { scale: 0, duration: .7, ease: 'back.out(2.2)' }, .95)
      .from('.loader__word span', { yPercent: 110, duration: 1, ease: 'expo.out' }, .25)
      .to(count, { v: 100, duration: 1.4, ease: 'power2.inOut', onUpdate: function () { counter.textContent = Math.round(count.v); } }, 0);
  }

  Promise.all([fontsReady, loaderTl ? loaderTl.then() : null]).then(init);

  /* ---------- Intro del hero ---------- */
  function heroIntro() {
    var tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' }, onComplete: function () { html.classList.add('intro-done'); } });
    var title = $('.hero__title');
    if (hasSplit) {
      var split = SplitText.create(title, { type: 'lines,words', mask: 'lines', linesClass: 'split-line' });
      tl.from(split.words, { yPercent: 115, duration: 1.5, stagger: .05 }, 0);
    } else {
      tl.from(title, { autoAlpha: 0, y: 40, duration: 1.2 }, 0);
    }
    tl.from('.site-header__inner > *', { autoAlpha: 0, y: -16, duration: 1.1, stagger: .06 }, .1)
      .from('.hero__eyebrow', { autoAlpha: 0, y: 14, duration: 1 }, .15)
      .from('.hero__lead', { autoAlpha: 0, y: 26, duration: 1.3 }, .5)
      .from('.hero__actions > *', { autoAlpha: 0, y: 26, duration: 1.2, stagger: .08 }, .6)
      .from('.scene__foot > *', { autoAlpha: 0, y: 12, duration: 1, stagger: .1 }, 1);
    if (scene3d) {
      var cam = { v: 0 };
      scene3d.setProgress(0);
    }
    return tl;
  }

  /* ---------- Inicio ---------- */
  function init() {
    if (reduce) {
      html.classList.add('loaded', 'intro-done');
    } else {
      var intro = heroIntro();
      if (scene3d) scene3d.start();
      if (useLoader) {
        gsap.timeline({ onComplete: function () { html.classList.add('loaded'); if (lenis) lenis.start(); } })
          .to('.loader__inner', { yPercent: -25, autoAlpha: 0, duration: .7, ease: 'power3.in' }, 0)
          .to('.loader__foot', { autoAlpha: 0, duration: .4 }, 0)
          .to(loader, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, .25)
          .add(function () { intro.play(); }, .7);
      } else {
        html.classList.add('loaded');
        intro.play();
      }
    }

    sceneStory();
    pins();
    reveals();
    marquee();
    finca();
    chrome();
    tones();
    ScrollTrigger.refresh();
  }

  /* ---------- Historia de scroll del hero: el aguacate se abre ---------- */
  function sceneStory() {
    var sec = $('.scene');
    if (!sec || reduce) return;
    var heroLayer = $('.scene__hero');
    var openLayer = $('.scene__open');
    var foot = $('.scene__foot');
    var scrim = $('.scene__scrim');
    var fbClosed = $('.scene__fallback-img--closed');
    var fbOpen = $('.scene__fallback-img--open');
    var items = $$('.anatomy__item', openLayer);
    var lastOpen = null;
    var apply = function (p) {
      var e = smoothstep(.14, .72, p);
      if (scene3d) scene3d.setProgress(e);
      var h = 1 - smoothstep(.03, .2, p);
      gsap.set(heroLayer, { opacity: h, y: -36 * (1 - h) });
      heroLayer.style.pointerEvents = h > .5 ? 'auto' : 'none';
      var o = smoothstep(.56, .78, p);
      gsap.set(openLayer, { opacity: o, y: 24 * (1 - o) });
      openLayer.style.pointerEvents = o > .5 ? 'auto' : 'none';
      items.forEach(function (it, i) {
        var k = smoothstep(.6 + i * .06, .84 + i * .06, p);
        gsap.set(it, { opacity: k, x: (i === 0 ? -1 : 1) * 18 * (1 - k) });
      });
      var isOpen = o > .5;
      if (isOpen !== lastOpen) { openLayer.setAttribute('aria-hidden', isOpen ? 'false' : 'true'); lastOpen = isOpen; }
      gsap.set(foot, { opacity: 1 - smoothstep(.02, .12, p) });
      if (scrim) scrim.style.opacity = h;
      if (fbClosed) { var f = smoothstep(.35, .55, p); gsap.set(fbClosed, { opacity: 1 - f }); gsap.set(fbOpen, { opacity: f }); }
    };
    ScrollTrigger.create({ trigger: sec, start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: function (self) { apply(self.progress); } });
    apply(0);
  }

  /* ---------- Proceso: recorrido horizontal ---------- */
  function pins() {
    var mm = gsap.matchMedia();
    mm.add({ wide: '(min-width: 901px)', motion: '(prefers-reduced-motion: no-preference)' }, function (ctx) {
      if (!ctx.conditions.motion) return;
      var track = $('.proceso__track');
      var steps = $$('.step');
      var bar = $('.proceso__bar span');
      var draw = function (step, trigger) {
        if (!hasDraw) return;
        gsap.from($$('.step__icon path, .step__icon circle', step), { drawSVG: '0%', duration: 1.4, stagger: .12, ease: 'power2.inOut', scrollTrigger: trigger });
      };
      if (ctx.conditions.wide) {
        var dist = function () { return Math.max(0, track.scrollWidth - document.documentElement.clientWidth); };
        var tween = gsap.to(track, {
          x: function () { return -dist(); },
          ease: 'none',
          scrollTrigger: {
            trigger: '.proceso', start: 'top top', end: function () { return '+=' + dist(); },
            pin: '.proceso__pin', scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
            onUpdate: function (self) { gsap.set(bar, { scaleX: self.progress }); }
          }
        });
        var vw = document.documentElement.clientWidth;
        steps.forEach(function (step) {
          var inView = step.getBoundingClientRect().left < vw * .88;
          var trig = inView
            ? { trigger: '.proceso__track', start: 'top 85%', once: true }
            : { trigger: step, containerAnimation: tween, start: 'left 88%', once: true };
          draw(step, trig);
          gsap.from(step.children, { autoAlpha: 0, y: 28, duration: 1.1, stagger: .07, ease: 'power3.out', scrollTrigger: trig });
        });
      } else {
        steps.forEach(function (step) {
          var trig = { trigger: step, start: 'top 85%', once: true };
          draw(step, trig);
          gsap.from(step, { autoAlpha: 0, y: 40, duration: 1.1, ease: 'power3.out', scrollTrigger: trig });
        });
      }
    });
  }

  /* ---------- Titulares, textos y bloques ---------- */
  function reveals() {
    if (reduce) return;

    if (hasSplit) {
      $$('[data-split]').forEach(function (el) {
        SplitText.create(el, {
          type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
          onSplit: function (self) {
            return gsap.from(self.lines, {
              yPercent: 108, duration: 1.3, ease: 'expo.out', stagger: .1,
              scrollTrigger: { trigger: el, start: 'top 86%', once: true }
            });
          }
        });
      });
      var mText = $('.manifesto__text');
      if (mText) {
        var ms = SplitText.create(mText, { type: 'words', wordsClass: 'mw' });
        gsap.fromTo(ms.words, { opacity: .14 }, {
          opacity: 1, ease: 'none', stagger: .08,
          scrollTrigger: { trigger: mText, start: 'top 80%', end: 'bottom 50%', scrub: .6 }
        });
      }
    }

    if (hasDraw) {
      gsap.from('.rego-line__path', { drawSVG: '0%', duration: 2.4, ease: 'power2.inOut', scrollTrigger: { trigger: '.rego-line', start: 'top 85%', once: true } });
    }

    $$('[data-reveal]').forEach(function (el) {
      gsap.from(el, { autoAlpha: 0, y: 36, duration: 1.2, ease: 'power3.out', clearProps: 'transform', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    $$('[data-reveal-group]').forEach(function (g) {
      gsap.from(g.children, { autoAlpha: 0, y: 30, duration: 1.1, stagger: .1, ease: 'power3.out', clearProps: 'transform', scrollTrigger: { trigger: g, start: 'top 88%', once: true } });
    });

    // Contadores de cifras
    var fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };
    $$('[data-count]').forEach(function (el) {
      var end = Number(el.getAttribute('data-count'));
      var prefix = el.getAttribute('data-prefix') || '';
      var o = { v: 0 };
      el.textContent = prefix + '0';
      gsap.to(o, {
        v: end, duration: 2.2, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: function () { el.textContent = prefix + fmt(Math.round(o.v)); }
      });
    });

    // Variedades: el fruto sube con el scroll
    $$('.variety__fig img').forEach(function (img) {
      gsap.fromTo(img, { yPercent: 8 }, { yPercent: -8, ease: 'none', scrollTrigger: { trigger: img.closest('.variety'), start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // Etiqueta nutricional: se endereza al entrar
    gsap.from('.label', { rotation: -6, y: 60, autoAlpha: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.label', start: 'top 85%', once: true } });

    gsap.fromTo('.cal td.on', { '--grow': 0 }, {
      '--grow': 1, duration: .9, ease: 'power3.inOut', stagger: .045,
      scrollTrigger: { trigger: '.cal', start: 'top 82%', once: true }
    });

    var handle = $('.handle');
    if (handle) {
      gsap.from(handle, { autoAlpha: 0, y: 40, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: handle, start: 'top 88%', once: true } });
    }
    gsap.to('.cover--a', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.covers', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.to('.cover--c', { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.covers', start: 'top bottom', end: 'bottom top', scrub: true } });

    gsap.from('.footer__word span', { yPercent: 105, duration: 1.4, ease: 'expo.out', stagger: .09, scrollTrigger: { trigger: '.footer__word', start: 'top 95%', once: true } });

    $$('.faq details').forEach(function (d, i) {
      gsap.from(d, { autoAlpha: 0, y: 20, duration: .9, delay: i * .06, ease: 'power3.out', scrollTrigger: { trigger: d, start: 'top 92%', once: true } });
    });
  }

  /* ---------- Marquee con velocidad según el scroll ---------- */
  function marquee() {
    var track = $('.marquee__track');
    if (!track || reduce) return;
    var loop = gsap.to(track, { xPercent: -50, duration: 42, ease: 'none', repeat: -1 });
    var settle = null;
    ScrollTrigger.create({
      trigger: '.marquee', start: 'top bottom', end: 'bottom top',
      onUpdate: function (self) {
        var boost = 1 + Math.min(Math.abs(self.getVelocity()) / 350, 6);
        gsap.to(loop, { timeScale: boost, duration: .25, overwrite: true });
        if (settle) settle.kill();
        settle = gsap.delayedCall(.2, function () { gsap.to(loop, { timeScale: 1, duration: 1.2, overwrite: true }); });
      }
    });
  }

  /* ---------- Paisaje ---------- */
  function finca() {
    ScrollTrigger.create({
      trigger: '.finca', start: 'top bottom', end: 'bottom top',
      onUpdate: function (self) {
        land.setProgress(self.progress);
        if (reduce && landCanvas) landCanvas.repaint();
      }
    });
  }

  /* ---------- Cabecera, progreso, cursor, botones magnéticos ---------- */
  function chrome() {
    var header = $('.site-header');
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: function (self) {
        var y = self.scroll();
        header.classList.toggle('is-scrolled', y > 24);
        header.classList.toggle('is-hidden', self.direction === 1 && y > 320 && !html.classList.contains('menu-open'));
      }
    });
    header.addEventListener('focusin', function () { header.classList.remove('is-hidden'); });
    var cta = $('.sticky-cta');
    var recetario = $('#cocina');
    if (cta && recetario) {
      ScrollTrigger.create({
        start: 0, end: 'max',
        onUpdate: function (self) {
          var y = self.scroll();
          var limit = recetario.getBoundingClientRect().top + y - window.innerHeight * .6;
          cta.classList.toggle('is-visible', y > window.innerHeight * 1.2 && y < limit && !html.classList.contains('menu-open'));
        }
      });
    }
    gsap.to('.progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });

    // Índice de capítulos
    var chapterLinks = $$('.chapters a');
    chapterLinks.forEach(function (a) {
      var sec = document.getElementById(a.getAttribute('data-target'));
      if (!sec) return;
      ScrollTrigger.create({
        trigger: sec, start: 'top 55%', end: 'bottom 55%',
        onToggle: function (self) {
          if (!self.isActive) return;
          chapterLinks.forEach(function (l) { l.classList.toggle('is-active', l === a); l.classList.remove('is-flash'); });
          a.classList.add('is-flash');
          clearTimeout(a._flash);
          a._flash = setTimeout(function () { a.classList.remove('is-flash'); }, 1600);
        }
      });
    });

    if (!finePointer || reduce) return;

    $$('.variety').forEach(function (card) {
      var img = $('.variety__fig img', card);
      if (!img) return;
      var rot = gsap.quickTo(img, 'rotation', { duration: .9, ease: 'power3' });
      var lift = gsap.quickTo(img, 'y', { duration: .9, ease: 'power3' });
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        rot(((e.clientX - r.left) / r.width - .5) * 10);
        lift(-14);
      });
      card.addEventListener('pointerleave', function () { rot(0); lift(0); });
    });

    html.classList.add('has-cursor');
    var cursor = $('.cursor');
    var label = $('.cursor__label');
    var cx = gsap.quickTo(cursor, 'x', { duration: .35, ease: 'power3' });
    var cy = gsap.quickTo(cursor, 'y', { duration: .35, ease: 'power3' });
    window.addEventListener('pointermove', function (e) { cx(e.clientX); cy(e.clientY); });
    document.addEventListener('pointerleave', function () { html.classList.add('cursor-hidden'); });
    document.addEventListener('pointerenter', function () { html.classList.remove('cursor-hidden'); });
    document.addEventListener('pointerover', function (e) {
      var el = e.target.closest('a, button, label.chip, summary, input[type="range"], [data-cursor]');
      cursor.classList.toggle('is-hover', !!el);
      var text = el && el.getAttribute('data-cursor');
      cursor.classList.toggle('has-label', !!text);
      if (text) label.textContent = text;
    });

    $$('[data-magnetic]').forEach(function (el) {
      var mx = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3' });
      var my = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * .25);
        my((e.clientY - r.top - r.height / 2) * .35);
      });
      el.addEventListener('pointerleave', function () {
        gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, .4)', overwrite: true });
      });
    });
  }

  /* ---------- Cambio de tono por secciones ---------- */
  function tones() {
    var vars = ['--bg', '--fg', '--muted', '--line', '--soft', '--accent', '--on-accent', '--glow'];
    var palette = {};
    ['night', 'moss', 'cream'].forEach(function (name) {
      var probe = document.createElement('div');
      probe.className = 'tone-' + name;
      probe.hidden = true;
      document.body.appendChild(probe);
      var cs = getComputedStyle(probe);
      palette[name] = {};
      vars.forEach(function (v) { palette[name][v] = cs.getPropertyValue(v).trim(); });
      probe.remove();
    });

    html.classList.add('js-tones');
    var meta = $('meta[name="theme-color"]');
    var current = 'night';
    var apply = function (name) {
      if (!palette[name] || name === current) return;
      current = name;
      gsap.to(html, Object.assign({ duration: reduce ? 0 : 1.6, ease: 'sine.inOut', overwrite: 'auto' }, palette[name]));
      if (meta) meta.setAttribute('content', palette[name]['--bg']);
    };

    var sections = $$('[data-tone]').filter(function (s) { return getComputedStyle(s).display !== 'none'; });
    var triggers = [];
    var pick = function () {
      var active = triggers.filter(function (t) { return t.isActive; });
      if (active.length) apply(active[active.length - 1].vars.trigger.getAttribute('data-tone'));
    };
    sections.forEach(function (sec, i) {
      var isLast = i === sections.length - 1;
      triggers.push(ScrollTrigger.create({
        trigger: sec,
        start: isLast ? 'top 75%' : 'top 50%',
        end: 'bottom 50%',
        onToggle: pick
      }));
    });
    ScrollTrigger.addEventListener('refresh', pick);
  }
})();
