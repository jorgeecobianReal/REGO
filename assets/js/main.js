/* =====================================================================
   Rego dos Campos · interacción y animación
   GSAP 3.15 (ScrollTrigger, SplitText, DrawSVG). Sin scroll suave ni
   secciones fijadas: todo se anima una sola vez al entrar en pantalla.
   ===================================================================== */
(function () {
  'use strict';

  var C = window.REGO_CONFIG || {};
  var html = document.documentElement;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var NS = 'http://www.w3.org/2000/svg';
  var AVO = 'M100 10C126 10 139 38 145 74C151 109 186 136 186 190C186 241 149 272 100 272C51 272 14 241 14 190C14 136 49 109 55 74C61 38 74 10 100 10Z';
  var motion = !!(window.gsap && window.ScrollTrigger && window.SplitText && window.DrawSVGPlugin && !reduce);

  var clean = function (v) { return String(v || '').trim().replace(/^@/, ''); };
  var TIKTOK = clean(C.tiktok);
  var INSTAGRAM = clean(C.instagram);

  // Números pseudoaleatorios con semilla: las láminas salen siempre iguales
  function seeded(seed) {
    var s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }

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

    // Los perfiles del JSON-LD de Organization salen también de config.js
    var ld = $('script[type="application/ld+json"]');
    if (ld) {
      try {
        var org = JSON.parse(ld.textContent);
        org.sameAs = [TIKTOK && 'https://www.tiktok.com/@' + TIKTOK, INSTAGRAM && 'https://www.instagram.com/' + INSTAGRAM + '/'].filter(Boolean);
        ld.textContent = JSON.stringify(org);
      } catch (e) { /* se queda el JSON-LD escrito en index.html */ }
    }
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
      if (short) short.textContent = 'Temporada de ' + join(inSeason);
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
      if (short && best) short.textContent = 'Próxima cosecha en ' + MONTHS[best.m - 1];
    }
  }

  /* ------------------------------------------------------------------
     3. Láminas: punteado de grabado y paisaje de socalcos
     ------------------------------------------------------------------ */
  var STIPPLE = {
    hero: { n: 620, bias: 1.15, r: [.38, .9], seed: 11 },
    dense: { n: 420, bias: 1.1, r: [.4, .95], seed: 23 },
    sparse: { n: 22, bias: 0, r: [.5, .9], seed: 5 },
    ripe: { n: 380, bias: 1, r: [.4, .9], seed: 31 }
  };
  function stipple() {
    var probe = document.createElementNS(NS, 'svg');
    probe.setAttribute('width', '0'); probe.setAttribute('height', '0');
    probe.style.position = 'absolute';
    var shape = document.createElementNS(NS, 'path');
    shape.setAttribute('d', AVO);
    probe.appendChild(shape);
    document.body.appendChild(probe);
    var canTest = typeof shape.isPointInFill === 'function' && typeof DOMPoint === 'function';
    var inside = function (x, y) {
      if (canTest) { try { return shape.isPointInFill(new DOMPoint(x, y)); } catch (e) { canTest = false; } }
      // Aproximación con dos elipses (cuerpo y cuello) si el navegador no sabe medir
      var a = ((x - 100) / 86), b = ((y - 190) / 82);
      var c = ((x - 100) / (24 + (y - 10) * .19)), d = ((y - 92) / 82);
      return a * a + b * b <= 1 || (y > 10 && y < 190 && c * c + d * d <= 1);
    };
    $$('[data-stipple]').forEach(function (g) {
      var o = STIPPLE[g.getAttribute('data-stipple')];
      if (!o || g.firstChild) return;
      var rnd = seeded(o.seed);
      var d = '', k = 0;
      for (var i = 0; i < o.n * 8 && k < o.n; i++) {
        var x = 14 + rnd() * 172, y = 12 + rnd() * 258;
        if (!inside(x, y)) continue;
        // Más denso abajo a la derecha: la luz viene de arriba a la izquierda
        var sh = Math.min(1, Math.max(0, ((x - 70) / 116) * .55 + ((y - 110) / 162) * .65));
        if (rnd() > sh * sh * o.bias + .05) continue;
        var r = o.r[0] + rnd() * (o.r[1] - o.r[0]);
        d += 'M' + (x - r).toFixed(1) + ' ' + y.toFixed(1) + 'a' + r.toFixed(2) + ' ' + r.toFixed(2) + ' 0 1 0 ' + (2 * r).toFixed(2) + ' 0a' + r.toFixed(2) + ' ' + r.toFixed(2) + ' 0 1 0 ' + (-2 * r).toFixed(2) + ' 0';
        k++;
      }
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d);
      g.appendChild(p);
    });
    probe.parentNode.removeChild(probe);
  }

  // Curva suave que pasa por una lista de puntos (Catmull-Rom a Bézier)
  function smoothPath(pts) {
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += 'C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' +
        (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' +
        p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }

  // Lado de una cinta a partir de su eje: puntos desplazados por la normal
  function offsetSide(pts, widths, sign) {
    return pts.map(function (p, k) {
      var a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)];
      var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      return [p[0] - dy / l * widths[k] / 2 * sign, p[1] + dx / l * widths[k] / 2 * sign];
    });
  }

  // Ladera con socalcos: curvas de nivel, filas de árboles y el rego.
  // El rego nace en la vaguada entre las dos lomas y baja la ladera ensanchándose;
  // las curvas de nivel se pliegan en "V" hacia arriba al cruzarlo, como en un mapa.
  function contours() {
    var svg = $('[data-contours]');
    if (!svg) return;
    var rnd = seeded(7);
    var W = 1440, N = 12;
    var bump = function (x, cx, w) { var t = (x - cx) / w; return Math.exp(-t * t); };
    var ph = [rnd() * 6, rnd() * 6, rnd() * 6];
    // Una loma grande a la izquierda y otra menor a la derecha; las curvas bajas se aplanan
    var base = function (x, i) {
      var k = i / (N - 1);
      return 150 + i * 21
        - (112 - k * 92) * bump(x, 560, 360 + k * 260)
        - (58 - k * 44) * bump(x, 1190, 260 + k * 140)
        + Math.sin(x * .004 + ph[0] + i * .35) * 6
        + Math.sin(x * .011 + ph[1] - i * .2) * 2.5;
    };

    // Eje del rego: nace junto a la curva más alta y serpentea hacia abajo y a la izquierda
    var x0 = 930, y0 = base(x0, 0) + 6, yEnd = 412;
    var streamX = function (y) { var d = y - y0; return x0 - d * .3 + Math.sin(d / 30) * (4 + d * .055); };
    var cross = [];
    for (var i = 0; i < N; i++) {
      var cx = streamX(base(x0, i));
      cx = streamX(base(cx, i));
      cross.push(base(cx, i) > y0 + 4 ? cx : null);
    }
    var profile = function (x, i) {
      if (cross[i] === null) return base(x, i);
      var t = (x - cross[i]) / (13 + i * 1.1);
      return base(x, i) - (5 + i * .75) * Math.exp(-t * t);
    };

    var out = '<defs><mask id="rego-reveal" maskUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="440">' +
      '<path class="c-reveal" fill="none" stroke="#fff" stroke-width="18" stroke-linecap="round" d="__AXIS__"/></mask></defs>';
    out += '<g class="c-lines">';
    for (i = 0; i < N; i++) {
      // Más puntos cerca del cauce para que la "V" salga limpia
      var xs = [];
      for (var x = -40; x <= W + 40; x += 40) xs.push(x);
      if (cross[i] !== null) for (var xx = cross[i] - 64; xx <= cross[i] + 64; xx += 8) xs.push(xx);
      xs.sort(function (m, n) { return m - n; });
      var pts = xs.filter(function (v, k) { return k === 0 || v - xs[k - 1] > 4; }).map(function (v) { return [v, profile(v, i)]; });
      out += '<path class="c-line" vector-effect="non-scaling-stroke" d="' + smoothPath(pts) + '"/>';
    }
    out += '</g><g class="c-trees">';
    for (var r = 2; r < N - 2; r += 2) {
      for (var tx = 300 + (r % 4) * 9; tx < 860; tx += 28) {
        if (cross[r] !== null && Math.abs(tx - cross[r]) < 30) continue;
        var ty = profile(tx, r) - 4.2;
        out += '<circle class="c-tree" cx="' + tx.toFixed(1) + '" cy="' + ty.toFixed(1) + '" r="2.6"/>';
      }
    }
    out += '</g>';

    // Cauce: cinta que pasa de un hilo a unos 4 px; el agua corre por encima en destellos
    var axis = [], widths = [];
    for (var y = y0; y <= yEnd; y += 3) {
      var t = (y - y0) / (yEnd - y0);
      axis.push([streamX(y), y]);
      widths.push(.6 + 4.8 * Math.pow(t, .8));
    }
    var left = offsetSide(axis, widths, 1), right = offsetSide(axis, widths, -1).reverse();
    var ribbon = smoothPath(left) + 'L' + smoothPath(right).slice(1) + 'Z';
    var lower = axis.slice(Math.round(axis.length * .16));
    var axisD = smoothPath(axis);
    out += '<g class="c-stream" mask="url(#rego-reveal)">' +
      '<path class="c-rego" d="' + ribbon + '"/>' +
      '<path class="c-flow c-flow--a" d="' + smoothPath(lower) + '"/>' +
      '<path class="c-flow c-flow--b" d="' + smoothPath(lower) + '"/>' +
      '</g>';
    // Manantial: un punto y dos ondas que se abren despacio
    var sx = axis[0][0].toFixed(1), sy = (y0 - 1).toFixed(1);
    out += '<g class="c-spring"><circle class="c-ring" cx="' + sx + '" cy="' + sy + '" r="3"/><circle class="c-ring c-ring--2" cx="' + sx + '" cy="' + sy + '" r="3"/>' +
      '<circle class="c-source" cx="' + sx + '" cy="' + sy + '" r="1.7"/></g>';
    svg.innerHTML = out.replace('__AXIS__', axisD);

    // El agua solo corre mientras la lámina está a la vista
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { svg.classList.toggle('is-live', en[0].isIntersecting); }).observe(svg);
    } else {
      svg.classList.add('is-live');
    }
  }

  /* ------------------------------------------------------------------
     Viento en la lámina de la portada
     El fruto cuelga del pedúnculo como un péndulo pesado, las hojas
     tiemblan más deprisa y la rama apenas cede. Cada pieza es un muelle
     amortiguado que persigue la fuerza del viento: rachas irregulares que
     llegan de izquierda a derecha, con un fondo de brisa y turbulencia.
     ------------------------------------------------------------------ */
  var WIND = {
    //        frecuencia (Hz), amortiguación, grados por unidad de viento, turbulencia
    twig:  { f: 1.15, z: .3,  gain: .6,  turb: .5 },
    leaf:  { f: 2.3,  z: .14, gain: 4.6, turb: 1.7 },
    fruit: { f: .58,  z: .07, gain: 3.6, turb: .35 }
  };
  var windGo = null;   // lo llama la línea de tiempo del dibujo de la portada al terminar
  function initWind() {
    var svg = $('[data-wind-root]');
    if (!svg || reduce) return;
    var parts = $$('[data-wind]', svg).map(function (g, i) {
      var pv = g.getAttribute('data-pivot').split(' ').map(Number);
      var k = WIND[g.getAttribute('data-wind')];
      return { g: g, k: k, px: pv[0], py: pv[1], a: 0, v: 0, ph: i * 2.4, w: 2 * Math.PI * k.f * (1 + (i % 2) * .12) };
    });
    var gusts = [];
    var nextGust = 1.5;
    var push = 0, pushIn = 0;   // racha que añade el puntero al pasar por encima
    var clock = 0;
    var start = motion ? 6 : .3;   // respaldo: normalmente arranca cuando el dibujo avisa
    var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var smooth = function (x) { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };

    // Fuerza del viento en el instante t, llegando antes a las piezas de la izquierda
    var field = function (t, x, ph, turbW) {
      t -= (x - 40) / 320;
      var base = .14 + .06 * Math.sin(.21 * t) + .04 * Math.sin(.47 * t + 1);
      var g = 0;
      for (var i = 0; i < gusts.length; i++) {
        var q = t - gusts[i].t0;
        if (q < 0) continue;
        g += gusts[i].amp * (q < gusts[i].rise ? smooth(q / gusts[i].rise) : Math.exp(-(q - gusts[i].rise) / gusts[i].decay));
      }
      var turb = (Math.sin(1.9 * t + ph) + .6 * Math.sin(3.7 * t + 2 * ph) + .35 * Math.sin(6.3 * t + 3 * ph) + .3 * Math.sin(11.3 * t + 4 * ph) + .2 * Math.sin(17.9 * t + 5 * ph)) * .16 * (.45 + g);
      // Remolinos lentos, algo por debajo del ritmo propio del fruto: lo mecen a un lado y a otro
      var sway = .2 * Math.sin(2.64 * t + ph) * (.6 + .4 * Math.sin(.13 * t + ph));
      return base + g + sway + turb * turbW;
    };

    var step = function (dt) {
      clock += dt;
      if (clock > nextGust) {
        // Rachas cortas: al soltar, el fruto vuelve y se pasa un poco al otro lado
        gusts.push({ t0: clock, amp: .35 + Math.random() * .45, rise: .6 + Math.random() * .5, decay: 1 + Math.random() });
        nextGust = clock + 2.8 + Math.random() * 3.7;
        gusts = gusts.filter(function (gu) { return clock - gu.t0 < 14; });
      }
      pushIn *= Math.exp(-dt * 1.6);
      push += (pushIn - push) * Math.min(1, dt * 5);
      var ramp = smooth((clock - start) / 2.5);
      parts.forEach(function (p) {
        // El viento empuja hacia la derecha: en SVG eso es girar en negativo
        var target = -(field(clock, p.px, p.ph, p.k.turb) + push) * p.k.gain * ramp;
        var acc = p.w * p.w * (target - p.a) - 2 * p.k.z * p.w * p.v;
        p.v += acc * dt;
        p.a += p.v * dt;
      });
    };
    var draw = function () {
      parts.forEach(function (p) { p.g.setAttribute('transform', 'rotate(' + p.a.toFixed(3) + ' ' + p.px + ' ' + p.py + ')'); });
    };

    var running = false, last = 0, raf = 0, onScreen = true;
    var frame = function (now) {
      var dt = Math.min(.05, (now - last) / 1000 || 0);
      last = now;
      // Pasos pequeños para que los muelles sean estables aunque baje la tasa de fotogramas
      for (var n = Math.ceil(dt / (1 / 240)), i = 0; i < n; i++) step(dt / n);
      draw();
      raf = requestAnimationFrame(frame);
    };
    var run = function (on) {
      on = on && onScreen && !document.hidden && !mqReduce.matches;
      if (on === running) return;
      running = on;
      if (on) { last = performance.now(); raf = requestAnimationFrame(frame); }
      else cancelAnimationFrame(raf);
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; run(true); }).observe(svg);
    }
    document.addEventListener('visibilitychange', function () { run(true); });
    // Si se activa "reducir movimiento" con la página abierta, el aguacate vuelve a su sitio y se queda quieto
    mqReduce.addEventListener('change', function () {
      if (mqReduce.matches) parts.forEach(function (p) { p.a = p.v = 0; p.g.removeAttribute('transform'); });
      run(true);
    });

    // Pasar el puntero por encima levanta una pequeña racha en esa dirección
    // Cuenta el recorrido, no la velocidad: igual con cualquier ratón, y con tope para no exagerar
    var lastX = null;
    svg.parentNode.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      if (lastX !== null) pushIn = Math.max(-.45, Math.min(.45, pushIn + (e.clientX - lastX) * .003));
      lastX = e.clientX;
    });
    svg.parentNode.addEventListener('pointerleave', function () { lastX = null; });
    run(true);
    return function () { start = Math.min(start, clock); };
  }

  /* ------------------------------------------------------------------
     4. Guía de maduración
     ------------------------------------------------------------------ */
  function initRipeness() {
    var range = $('#ripe-range');
    if (!range) return;
    var visual = $('.ripe__visual');
    var title = $('.ripe__title');
    var text = $('.ripe__text');
    var stops = [[0, [104, 146, 58]], [45, [74, 104, 44]], [75, [52, 50, 36]], [100, [34, 28, 27]]];
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
      visual.style.setProperty('--ripe', 'rgb(' + colorAt(v).join(',') + ')');
      var s = states.filter(function (st) { return v <= st.max; })[0];
      if (s.t !== last) {
        title.textContent = s.t;
        text.textContent = s.d;
        if (last && motion) gsap.fromTo([title, text], { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: .5, stagger: .05, ease: 'power2.out', overwrite: true, clearProps: 'transform,opacity' });
        last = s.t;
      }
      range.setAttribute('aria-valuetext', s.t);
    };
    range.addEventListener('input', update);
    update();
  }

  /* ------------------------------------------------------------------
     5. Recetario: filtros, buscador y ficha en ventana
     ------------------------------------------------------------------ */
  var RECETAS = window.REGO_RECETAS || [];
  var CATS = ['Desayunos', 'Para picar', 'Entrantes', 'Principales', 'Postres'];
  var norm = function (t) { return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  var plain = function (h) { var d = document.createElement('div'); d.innerHTML = h; return d.textContent; };
  var esc = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  // Solo se permite <em> en los títulos
  var title = function (h) { return esc(h).replace(/&lt;em&gt;/g, '<em>').replace(/&lt;\/em&gt;/g, '</em>'); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var ARROW = '<svg class="rrow__go" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function initRecipes() {
    var list = $('.recipe-list');
    if (!list || !RECETAS.length) return;
    var filters = $('.recipe-filters');
    var search = $('#recipe-search');
    var empty = $('.recipe-empty');
    var dialog = $('#recipe-dialog');
    var body = $('.recipe-dialog__body', dialog);
    var scroller = $('.recipe-dialog__scroll', dialog);
    var state = { cat: 'Todas', q: '', checked: {}, current: -1, opener: null };

    var cats = CATS.filter(function (c) { return RECETAS.some(function (r) { return r.cat === c; }); });
    RECETAS.forEach(function (r) { if (cats.indexOf(r.cat) === -1) cats.push(r.cat); });
    filters.innerHTML = ['Todas'].concat(cats).map(function (c) {
      var n = c === 'Todas' ? RECETAS.length : RECETAS.filter(function (r) { return r.cat === c; }).length;
      return '<button type="button" class="recipe-filter" data-cat="' + esc(c) + '" aria-pressed="' + (c === 'Todas') + '">' + esc(c) + '<small><span class="sr-only">, </span>' + n + '<span class="sr-only">' + (n === 1 ? ' receta' : ' recetas') + '</span></small></button>';
    }).join('');

    var hay = RECETAS.map(function (r) { return norm(plain(r.title) + ' ' + r.cat + ' ' + r.ingredients.join(' ')); });
    list.innerHTML = RECETAS.map(function (r, i) {
      return '<li class="rrow" data-i="' + i + '"><button type="button" class="rrow__btn" aria-haspopup="dialog" aria-controls="recipe-dialog">' +
        '<span class="rrow__n">' + pad(i + 1) + '</span>' +
        '<span class="rrow__title">' + title(r.title) + '</span>' +
        '<span class="rrow__cat">' + esc(r.cat) + '</span>' +
        '<span class="rrow__time">' + esc(r.time) + '</span>' + ARROW + '</button></li>';
    }).join('');
    var rows = $$('.rrow', list);
    var visible = function () { return rows.filter(function (c) { return !c.hidden; }).map(function (c) { return Number(c.getAttribute('data-i')); }); };

    var status = $('[data-recipe-status]');
    var refreshTimer = null;
    var apply = function (animate) {
      var q = norm(state.q.trim());
      var shown = 0;
      var before = rows.map(function (c) { return !c.hidden; });
      rows.forEach(function (c, i) {
        var ok = (state.cat === 'Todas' || RECETAS[i].cat === state.cat) && (!q || hay[i].indexOf(q) !== -1);
        c.hidden = !ok;
        if (ok) shown++;
      });
      empty.hidden = shown > 0;
      if (!animate) return;
      // Solo entran con fundido las filas que acaban de aparecer
      var added = rows.filter(function (c, i) { return !c.hidden && !before[i]; });
      if (motion && added.length) gsap.fromTo(added, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .55, stagger: .03, ease: 'power2.out', clearProps: 'transform,opacity' });
      if (status) status.textContent = shown ? shown + (shown === 1 ? ' receta' : ' recetas') + (state.cat !== 'Todas' ? ' en ' + state.cat : '') : 'No hay recetas con eso. Prueba con otro ingrediente o elige otra categoría.';
      if (motion) {
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
      var ids = visible();
      var pos = ids.indexOf(i);
      if (pos === -1) { ids = RECETAS.map(function (_, k) { return k; }); pos = i; }
      var prev = ids[(pos - 1 + ids.length) % ids.length];
      var next = ids[(pos + 1) % ids.length];
      body.innerHTML =
        '<p class="recipe__kicker"><span>' + pad(i + 1) + ' / ' + pad(RECETAS.length) + '</span><span>' + esc(r.cat) + '</span></p>' +
        '<header class="recipe__head"><h3 class="recipe__title" id="rd-title">' + title(r.title) + '</h3>' +
        '<dl class="recipe__meta">' +
          '<div><dt>Tiempo</dt><dd>' + esc(r.time) + '</dd></div>' +
          '<div><dt>Raciones</dt><dd>' + esc(r.serves) + '</dd></div>' +
          '<div><dt>Dificultad</dt><dd>' + esc(r.level) + '</dd></div>' +
          '<div><dt>Variedad</dt><dd>' + esc(r.variety) + '</dd></div>' +
        '</dl></header>' +
        '<div class="recipe__grid"><div class="recipe__ingredients"><h4>Ingredientes</h4><ul>' +
          r.ingredients.map(function (ing, k) {
            return '<li><label><input type="checkbox" data-k="' + k + '"' + (checked[k] ? ' checked' : '') + '><span>' + esc(ing) + '</span></label></li>';
          }).join('') +
        '</ul></div><div><h4 class="recipe__steps-title">Preparación</h4><ol class="recipe__steps">' + r.steps.map(function (s) { return '<li><span>' + esc(s) + '</span></li>'; }).join('') + '</ol></div></div>' +
        (r.tip ? '<p class="recipe__tip"><span>Consejo</span>' + esc(r.tip) + '</p>' : '') +
        (ids.length > 1 ? '<nav class="recipe-nav" aria-label="Otras recetas">' +
          '<button type="button" data-go="' + prev + '"><span>Anterior</span><strong>' + title(RECETAS[prev].title) + '</strong></button>' +
          '<button type="button" data-go="' + next + '"><span>Siguiente</span><strong>' + title(RECETAS[next].title) + '</strong></button>' +
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
      var t = $('.recipe__title', body);
      if (t) { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }
      if (motion) gsap.fromTo(body, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .5, ease: 'power2.out', clearProps: 'transform,opacity' });
    });

    var open = function (i, opener) {
      render(i);
      state.opener = opener;
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      html.classList.add('dialog-open');
      if (motion) gsap.fromTo(dialog, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .6, ease: 'expo.out', clearProps: 'transform,opacity' });
    };
    var onClosed = function () {
      html.classList.remove('dialog-open');
      if (state.opener) state.opener.focus({ preventScroll: true });
    };
    var close = function () {
      if (typeof dialog.close === 'function') dialog.close();
      else { dialog.removeAttribute('open'); onClosed(); }
    };
    list.addEventListener('click', function (e) {
      var btn = e.target.closest('.rrow__btn');
      if (btn) open(Number(btn.parentNode.getAttribute('data-i')), btn);
    });
    $('.recipe-dialog__close', dialog).addEventListener('click', close);
    dialog.addEventListener('close', onClosed);
    dialog.addEventListener('click', function (e) { if (e.target === dialog) close(); });

    apply(false);
  }

  /* ------------------------------------------------------------------
     6. Menú móvil, cabecera y preguntas
     ------------------------------------------------------------------ */
  function initMenu() {
    var btn = $('.menu-toggle');
    var menu = $('#mobile-menu');
    if (!btn || !menu) return;
    var label = $('.menu-toggle__text', btn);
    var outside = [$('main'), $('.footer'), $('.skip')];
    var setMenu = function (open) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      label.textContent = open ? 'Cerrar' : 'Menú';
      html.classList.toggle('menu-open', open);
      menu.hidden = !open;
      // Con el menú abierto, lo que queda detrás no recibe foco
      outside.forEach(function (el) { if (el) el.inert = open; });
      if (open) {
        var first = $('a', menu);
        if (first) first.focus({ preventScroll: true });
        if (motion) {
          gsap.fromTo(menu, { opacity: 0 }, { opacity: 1, duration: .4, ease: 'power2.out' });
          gsap.fromTo($$('nav li', menu), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: .7, stagger: .05, delay: .1, ease: 'expo.out' });
        }
      }
    };
    btn.addEventListener('click', function () { setMenu(btn.getAttribute('aria-expanded') !== 'true'); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && html.classList.contains('menu-open')) { setMenu(false); btn.focus(); }
    });
    window.matchMedia('(min-width: 961px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });
  }

  // Cabecera: fondo al bajar, se esconde al seguir bajando y vuelve al subir
  function initHeader() {
    var header = $('.site-header');
    if (!header) return;
    var lastY = window.scrollY, ticking = false;
    var lockUntil = location.hash ? Date.now() + 2500 : 0;
    document.addEventListener('click', function (e) {
      if (e.target.closest('a[href^="#"]')) { lockUntil = Date.now() + 1500; header.classList.remove('is-hidden'); }
    });
    var update = function () {
      var y = Math.max(0, window.scrollY);
      header.classList.toggle('is-scrolled', y > 24);
      if (Date.now() < lockUntil) { lastY = y; ticking = false; return; }
      if (!html.classList.contains('menu-open')) {
        if (y > lastY + 4 && y > 480) header.classList.add('is-hidden');
        else if (y < lastY - 4 || y < 480) header.classList.remove('is-hidden');
      }
      lastY = y;
      ticking = false;
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    header.addEventListener('focusin', function () { header.classList.remove('is-hidden'); });
    update();

    // Sección actual en el menú
    var links = $$('.nav a[href^="#"]');
    if (!('IntersectionObserver' in window) || !links.length) return;
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var a = byId[en.target.id];
        if (!a) return;
        if (en.isIntersecting) {
          links.forEach(function (l) { l.classList.remove('is-current'); l.removeAttribute('aria-current'); });
          a.classList.add('is-current');
          a.setAttribute('aria-current', 'true');
        } else if (a.classList.contains('is-current')) {
          a.classList.remove('is-current');
          a.removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  // Preguntas: la respuesta se despliega con suavidad
  function initFaq() {
    if (!motion) return;
    $$('.faq details').forEach(function (d) {
      var sum = $('summary', d), ans = $('.faq__a', d);
      if (!sum || !ans) return;
      sum.addEventListener('click', function (e) {
        e.preventDefault();
        var closing = d.classList.contains('is-closing');
        gsap.killTweensOf(ans);
        if (d.open && !closing) {
          d.classList.add('is-closing');
          gsap.to(ans, { height: 0, opacity: 0, duration: .45, ease: 'power2.inOut', onComplete: function () { d.open = false; d.classList.remove('is-closing'); gsap.set(ans, { clearProps: 'height,opacity' }); } });
        } else {
          d.classList.remove('is-closing');
          d.open = true;
          if (closing) gsap.to(ans, { height: 'auto', opacity: 1, duration: .45, ease: 'power2.out', clearProps: 'height,opacity' });
          else gsap.fromTo(ans, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: .55, ease: 'power2.out', clearProps: 'height,opacity' });
        }
      });
    });
  }

  /* ------------------------------------------------------------------
     7. Animación
     ------------------------------------------------------------------ */
  var drawn = function (svg) { return $$('[data-draw]', svg); };

  // Dibuja una lámina: trazos, luego aguadas, punteado y llamadas
  function plateTimeline(svg) {
    var tl = gsap.timeline();
    var lines = drawn(svg);
    if (lines.length) tl.from(lines, { drawSVG: 0, duration: 1.7, stagger: .1, ease: 'power2.inOut' }, 0);
    var wash = $$('.wash, .art__fine-ring', svg);
    if (wash.length) tl.from(wash, { autoAlpha: 0, duration: 1.2, stagger: .05, ease: 'power1.out' }, .7);
    var pit = $$('.wash--pit', svg);
    if (pit.length) tl.from(pit, { scale: .82, transformOrigin: '50% 50%', duration: 1.2, ease: 'expo.out' }, .9);
    var dots = $$('.art__stipple', svg);
    if (dots.length) tl.from(dots, { autoAlpha: 0, duration: 1.4, ease: 'power1.out' }, 1.1);
    var calls = $$('.art__num, .art__dot', svg);
    if (calls.length) tl.from(calls, { autoAlpha: 0, scale: .6, transformOrigin: '50% 50%', duration: .7, stagger: .12, ease: 'power3.out' }, 1.5);
    return tl;
  }

  function splitLines(el, vars) {
    return SplitText.create(el, {
      type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
      aria: /^H[1-6]$/.test(el.tagName) ? 'auto' : 'none',
      onSplit: function (self) { return gsap.from(self.lines, vars); }
    });
  }

  function intro() {
    var title = $('[data-intro-title]');
    if (title) splitLines(title, { yPercent: 120, duration: 1.4, stagger: .1, ease: 'expo.out', delay: .1 });
    gsap.from($$('[data-intro]'), { opacity: 0, y: 18, duration: 1.2, stagger: .1, delay: .45, ease: 'power3.out', clearProps: 'transform,opacity' });
    gsap.from('.site-header', { opacity: 0, duration: 1, delay: .2, ease: 'power1.out', clearProps: 'opacity' });
    var art = $('.hero__art .art');
    if (art) plateTimeline(art).delay(.35).call(function () { if (windGo) windGo(); }, null, 2.2);
    gsap.from('.hero__art .plate__cap', { autoAlpha: 0, duration: 1, delay: 2 });
  }

  function onEnter(el, fn, start) {
    ScrollTrigger.create({ trigger: el, start: start || 'top 86%', once: true, onEnter: fn });
  }

  function reveals() {
    // Titulares: línea a línea, desde una máscara
    $$('[data-split]').forEach(function (el) {
      splitLines(el, { yPercent: 108, duration: 1.25, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });

    // Bloques y grupos: suben un poco y aparecen
    // Se anima la opacidad, no la visibilidad: el contenido sigue disponible para lectores y teclado
    var show = function (els, stagger) {
      var seen = els.filter(function (e) { return e.getBoundingClientRect().bottom > 0; });
      var past = els.filter(function (e) { return seen.indexOf(e) === -1; });
      if (past.length) gsap.set(past, { opacity: 1, y: 0, clearProps: 'transform,opacity' });
      if (seen.length) gsap.to(seen, { opacity: 1, y: 0, duration: 1.1, stagger: stagger, ease: 'power3.out', clearProps: 'transform,opacity' });
    };
    var single = $$('[data-reveal]');
    gsap.set(single, { opacity: 0, y: 22 });
    ScrollTrigger.batch(single, { start: 'top 90%', once: true, onEnter: function (els) { show(els, .08); } });
    $$('[data-reveal-group]').forEach(function (group) {
      var items = Array.prototype.slice.call(group.children);
      gsap.set(items, { opacity: 0, y: 22 });
      onEnter(group, function () { show(items, .09); }, 'top 88%');
    });
    // Si el teclado llega a un bloque que aún no ha aparecido, se muestra al momento
    document.addEventListener('focusin', function (e) {
      var el = e.target.closest && e.target.closest('[data-reveal], [data-reveal-group] > *');
      if (el) gsap.to(el, { opacity: 1, y: 0, duration: .3, overwrite: true, clearProps: 'transform,opacity' });
    });

    // Láminas e iconos que se dibujan al llegar
    $$('.plate .art').forEach(function (svg) {
      if (svg.closest('.hero__art')) return;
      var tl = plateTimeline(svg).pause();
      onEnter(svg, function () { tl.play(); }, 'top 80%');
    });
    $$('.step__icon').forEach(function (svg, i) {
      var tw = gsap.from(drawn(svg), { drawSVG: 0, duration: 1.4, stagger: .08, ease: 'power2.inOut', paused: true, delay: (i % 5) * .08 });
      onEnter(svg, function () { tw.play(); });
    });
    var rego = $('.rego-line');
    if (rego) {
      var tr = gsap.from(drawn(rego), { drawSVG: 0, duration: 2.4, ease: 'power2.inOut', paused: true });
      onEnter(rego, function () { tr.play(); });
    }

    // Paisaje: curvas de nivel, árboles y el rego
    var land = $('[data-contours]');
    if (land && land.firstChild) {
      var tl = gsap.timeline({ paused: true });
      tl.from($$('.c-line', land), { drawSVG: 0, duration: 2, stagger: .07, ease: 'power2.inOut' })
        .from($$('.c-tree', land), { scale: 0, transformOrigin: '50% 50%', duration: .6, stagger: { each: .006, from: 'random' }, ease: 'power3.out' }, .9)
        .from($$('.c-source', land), { scale: 0, transformOrigin: '50% 50%', duration: .8, ease: 'power3.out' }, 1)
        .from($$('.c-ring', land), { autoAlpha: 0, duration: .6 }, 1.2)
        .from($$('.c-reveal', land), { drawSVG: 0, duration: 3.4, ease: 'power1.inOut' }, 1.2);
      onEnter(land, function () { tl.play(); }, 'top 78%');
    }

    // Cifras: cuentan una vez
    $$('[data-count]').forEach(function (el) {
      var target = Number(el.getAttribute('data-count'));
      var fmt = function (v) { return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };
      // Ancho fijo con el valor final: la unidad no se mueve mientras crecen los dígitos
      el.style.minWidth = Math.ceil(el.getBoundingClientRect().width) + 'px';
      onEnter(el, function () {
        var o = { v: 0 };
        el.textContent = fmt(0);
        gsap.to(o, { v: target, duration: 1.8, ease: 'power2.out', onUpdate: function () { el.textContent = fmt(o.v); }, onComplete: function () { el.textContent = fmt(target); } });
      }, 'top 92%');
    });

    // Calendario: cada barra crece de izquierda a derecha
    var cal = $('.cal');
    if (cal) {
      var cells = $$('td.on', cal);
      gsap.set(cells, { '--k': 0 });
      onEnter(cal, function () { gsap.to(cells, { '--k': 1, duration: .9, stagger: .05, ease: 'power2.out' }); });
    }
  }

  function startMotion() {
    gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);
    // La página está oculta (motion-pending) hasta que cada bloque tiene su estado inicial
    try { intro(); reveals(); } finally { html.classList.remove('motion-pending'); }
  }

  /* ------------------------------------------------------------------
     Inicio
     ------------------------------------------------------------------ */
  applyConfig();
  buildCalendar();
  stipple();
  contours();
  windGo = initWind();
  initRipeness();
  initRecipes();
  initMenu();
  initHeader();
  initFaq();
  if (motion) {
    // Espera a las fuentes (máximo 0,9 s) para partir los titulares en líneas reales
    var go = function () { if (!go.done) { go.done = true; startMotion(); } };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go);
    setTimeout(go, 900);
  } else {
    html.classList.remove('motion-pending');
  }
  // El desplazamiento suave de los enlaces internos se activa tras la carga: la llegada por ancla es directa
  window.addEventListener('load', function () { requestAnimationFrame(function () { html.classList.add('is-ready'); }); });
})();
