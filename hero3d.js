/* Главная: 3D-здание, нарисованное «карандашом по бумаге».
 * Камера движется при прокрутке страницы: каждый экран — свой ракурс.
 * Нужна библиотека three.js (подключена в index.html до этого файла). */
(function () {
  'use strict';

  var canvas = document.getElementById('scene');
  var hero = document.querySelector('.hero3d');
  if (!canvas || !hero) return;
  var captions = Array.prototype.slice.call(document.querySelectorAll('.hero3d-cap'));
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function showCaption(i) {
    captions.forEach(function (c, k) { c.classList.toggle('is-active', k === i); });
  }

  /* Прогресс прокрутки внутри блока: 0 — начало, 1 — конец */
  function progress() {
    var r = hero.getBoundingClientRect();
    var span = hero.offsetHeight - window.innerHeight;
    if (span <= 0) return 0;
    return Math.min(1, Math.max(0, -r.top / span));
  }

  if (typeof THREE === 'undefined') { hero.classList.add('no-3d'); fallback(); return; }
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  } catch (e) { hero.classList.add('no-3d'); fallback(); return; }

  function fallback() {
    function upd() { showCaption(Math.round(progress() * (captions.length - 1))); }
    window.addEventListener('scroll', upd, { passive: true });
    upd();
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 2000);

  /* ---------- Сцена: строящийся квартал, как карандашный набросок ---------- */
  var segs = [], soft = [];   // soft — деревья, трава, облака: рисуются легче
  var seedG = 11;
  function R() { seedG = (seedG * 16807) % 2147483647; return (seedG - 1) / 2147483646; }
  function L(a, b, arr) { (arr || segs).push([a[0], a[1], a[2], b[0], b[1], b[2]]); }
  function rect(p1, p2, p3, p4, arr) { L(p1, p2, arr); L(p2, p3, arr); L(p3, p4, arr); L(p4, p1, arr); }
  function box(x0, y0, z0, x1, y1, z1, arr) {
    var c = [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]];
    rect(c[0], c[1], c[2], c[3], arr); rect(c[4], c[5], c[6], c[7], arr);
    L(c[0], c[4], arr); L(c[1], c[5], arr); L(c[2], c[6], arr); L(c[3], c[7], arr);
  }
  function poly(pts, closed, arr) {
    for (var i = 0; i < pts.length - 1; i++) L(pts[i], pts[i + 1], arr);
    if (closed) L(pts[pts.length - 1], pts[0], arr);
  }

  // Жилой дом: этажи, окна, полосы балконов, надстройка на кровле
  function house(cx, cz, w, d, floors, opts) {
    opts = opts || {};
    var FH = 3, H = floors * FH, x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
    var built = opts.building ? floors - 3 : floors;   // у строящегося верх — только каркас
    box(x0, 0, z0, x1, built * FH, z1);
    for (var f = 1; f < built; f++) {
      var y = f * FH;
      if (opts.balcony && f % 1 === 0) { L([x0, y, z1 + 0.6], [x1, y, z1 + 0.6]); L([x0, y + 0.9, z1 + 0.6], [x1, y + 0.9, z1 + 0.6]); }
      else L([x0, y, z1], [x1, y, z1]);
      L([x0, y, z0], [x0, y, z1]);
    }
    for (f = 0; f < built; f++) {
      var wy = f * FH + 0.8;
      for (var x = x0 + 1.6; x < x1 - 0.6; x += 2.6) {
        rect([x - 0.65, wy, z1], [x + 0.65, wy, z1], [x + 0.65, wy + 1.5, z1], [x - 0.65, wy + 1.5, z1]);
        if (R() < 0.5) L([x, wy, z1], [x, wy + 1.5, z1]);
      }
      for (var z = z0 + 1.6; z < z1 - 0.6; z += 2.6) {
        rect([x0, wy, z - 0.65], [x0, wy, z + 0.65], [x0, wy + 1.5, z + 0.65], [x0, wy + 1.5, z - 0.65]);
      }
    }
    if (opts.building) {          // каркас: колонны и плиты перекрытий
      for (f = built; f <= floors; f++) rect([x0, f * FH, z0], [x1, f * FH, z0], [x1, f * FH, z1], [x0, f * FH, z1]);
      for (x = x0; x <= x1 + 0.01; x += w / 4) { L([x, built * FH, z1], [x, H, z1]); L([x, built * FH, z0], [x, H, z0]); }
      for (z = z0; z <= z1 + 0.01; z += d / 2) { L([x0, built * FH, z], [x0, H, z]); L([x1, built * FH, z], [x1, H, z]); }
    } else {
      box(x0, H, z0, x1, H + 0.6, z1);                         // парапет
      if (R() < 0.7) box(cx - 2, H, cz - 1.5, cx + 1.5, H + 2.4, cz + 1.5); // выход на кровлю
    }
  }

  // Башенный кран со стрелой, повёрнутой на угол ang
  function crane(cx, cz, h, jib, ang) {
    var M = 0.9, dx = Math.cos(ang), dz = Math.sin(ang);
    for (var y = 0; y < h; y += 2.4) {
      rect([cx - M, y, cz - M], [cx + M, y, cz - M], [cx + M, y, cz + M], [cx - M, y, cz + M]);
      L([cx - M, y, cz - M], [cx + M, y + 2.4, cz - M]); L([cx + M, y, cz + M], [cx - M, y + 2.4, cz + M]);
      L([cx - M, y, cz + M], [cx - M, y + 2.4, cz - M]); L([cx + M, y, cz - M], [cx + M, y + 2.4, cz + M]);
    }
    L([cx - M, 0, cz - M], [cx - M, h, cz - M]); L([cx + M, 0, cz - M], [cx + M, h, cz - M]);
    L([cx + M, 0, cz + M], [cx + M, h, cz + M]); L([cx - M, 0, cz + M], [cx - M, h, cz + M]);
    box(cx - 1.3, h, cz - 1.3, cx + 1.3, h + 2.2, cz + 1.3);
    var jy = h + 2.2, back = jib * 0.3;
    function P(t, yy) { return [cx + dx * t, yy, cz + dz * t]; }
    L(P(-back, jy), P(jib, jy)); L(P(-back, jy + 1), P(jib, jy + 1));
    for (var t = -back; t < jib; t += 2.2) L(P(t, jy), P(t + 2.2, jy + 1));
    L(P(0, jy + 2.2), P(0, jy + 7)); L(P(0, jy + 7), P(jib * 0.75, jy + 1)); L(P(0, jy + 7), P(-back, jy + 1));
    var cw = P(-back, jy); box(cw[0] - 1.6, jy - 2.2, cw[2] - 1.6, cw[0] + 1.6, jy, cw[2] + 1.6);
    var hk = P(jib * 0.6, jy); L(hk, [hk[0], jy - 14, hk[2]]);
    box(hk[0] - 0.6, jy - 15.5, hk[2] - 0.6, hk[0] + 0.6, jy - 14, hk[2] + 0.6);
    L([hk[0], jy - 15.5, hk[2]], [hk[0], jy - 18, hk[2]]);
  }

  // Дерево/куст: ствол и несколько «каракулей» кроны
  function tree(x, z, h) {
    L([x, 0, z], [x + (R() - 0.5) * 0.4, h * 0.45, z], soft);
    var rings = 3 + Math.floor(R() * 3);
    for (var r = 0; r < rings; r++) {
      var cy = h * (0.45 + 0.5 * R()), rad = h * (0.22 + 0.18 * R());
      var ox = (R() - 0.5) * rad, oz = (R() - 0.5) * rad, pts = [], n = 9, a0 = R() * 6.28;
      for (var k = 0; k < n; k++) {
        var a = a0 + k / n * 6.283, rr = rad * (0.75 + 0.45 * R());
        pts.push([x + ox + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.75, z + oz + Math.sin(a * 1.3) * rr * 0.4]);
      }
      poly(pts, true, soft);
    }
  }
  // Техника: самосвал / погрузчик из простых коробок с колёсами
  function truck(x, z, len) {
    box(x, 0.8, z, x + len * 0.3, 3, z + 2.4);
    box(x + len * 0.32, 0.8, z, x + len, 2.4, z + 2.4);
    [x + 0.9, x + len * 0.6, x + len - 0.9].forEach(function (wx) {
      var pts = [];
      for (var k = 0; k < 8; k++) { var a = k / 8 * 6.283; pts.push([wx + Math.cos(a) * 0.7, 0.75 + Math.sin(a) * 0.7, z + 2.45]); }
      poly(pts, true);
    });
  }

  // Квартал: дальний ряд, средний ряд, строящийся дом
  house(-62, -52, 16, 12, 13, { balcony: true });
  house(-40, -64, 14, 12, 17);
  house(-20, -50, 12, 12, 10, { balcony: true });
  house(2, -70, 18, 14, 19);
  house(24, -54, 12, 12, 12);
  house(44, -66, 16, 12, 16, { balcony: true });
  house(66, -50, 14, 12, 11);
  house(-48, -24, 12, 10, 7);
  house(52, -22, 12, 10, 8, { balcony: true });
  house(8, -32, 16, 12, 11, { building: true });
  crane(-26, -30, 48, 38, -0.15);
  crane(30, -36, 44, 34, 3.6);
  // площадка: техника, бытовки, штабели
  truck(-14, -6, 9); truck(14, -2, 8);
  box(-34, 0, -8, -26, 2.6, -5); box(-24, 0, -8, -16, 2.6, -5);
  box(24, 0, -10, 32, 0.6, -7); box(25, 0.6, -9.6, 31, 1.2, -7.4);
  // деревья и кусты на переднем плане
  for (var t = 0; t < 46; t++) {
    var tx = -90 + R() * 180, tz = -4 + R() * 34;
    if (Math.abs(tx) < 22 && tz < 8) continue;
    tree(tx, tz, 3 + R() * 6);
  }
  // трава штрихами
  for (var gI = 0; gI < 420; gI++) {
    var gx = -95 + R() * 190, gz = 4 + R() * 40, gh = 0.4 + R() * 1.1, lean = (R() - 0.5) * 0.6;
    L([gx, 0, gz], [gx + lean, gh, gz], soft);
  }
  // дорога-подъезд к площадке
  poly([[-6, 0, 50], [-5, 0, 20], [-8, 0, 0], [-12, 0, -14]], false, soft);
  poly([[6, 0, 50], [7, 0, 20], [4, 0, 0], [2, 0, -14]], false, soft);
  // облака: волнистые контуры далеко за кварталом
  [[-60, 92, -140, 16], [-5, 104, -150, 12], [55, 96, -145, 18], [95, 86, -135, 10]].forEach(function (c) {
    var pts = [], n = 22;
    for (var k = 0; k <= n; k++) {
      var a = Math.PI * k / n, bump = 1 + 0.18 * Math.sin(k * 2.1);
      pts.push([c[0] - c[3] + 2 * c[3] * k / n, c[1] + Math.sin(a) * c[3] * 0.35 * bump, c[2]]);
    }
    poly(pts, false, soft); L([c[0] - c[3] - 2, c[1], c[2]], [c[0] + c[3] + 3, c[1], c[2]], soft);
  });

  var axes = soft;

  /* ---------- «Карандаш»: каждый отрезок рисуется неровными штрихами ---------- */
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function sketch(list, passes, jit, over) {
    var out = [];
    list.forEach(function (s) {
      var ax = s[0], ay = s[1], az = s[2], bx = s[3], by = s[4], bz = s[5];
      var dx = bx - ax, dy = by - ay, dz = bz - az;
      var len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
      var ux = dx / len, uy = dy / len, uz = dz / len;
      for (var p = 0; p < passes; p++) {
        var o1 = over * (0.2 + rnd()), o2 = over * (0.2 + rnd());
        var j = function () { return (rnd() - 0.5) * jit * Math.min(1, len / 4 + 0.3); };
        var x1 = ax - ux * o1 + j(), y1 = ay - uy * o1 + j(), z1 = az - uz * o1 + j();
        var x2 = bx + ux * o2 + j(), y2 = by + uy * o2 + j(), z2 = bz + uz * o2 + j();
        // лёгкий изгиб штриха посередине
        var mx = (x1 + x2) / 2 + j() * 0.6, my = (y1 + y2) / 2 + j() * 0.6, mz = (z1 + z2) / 2 + j() * 0.6;
        out.push(x1, y1, z1, mx, my, mz, mx, my, mz, x2, y2, z2);
      }
    });
    return new Float32Array(out);
  }
  segs.sort(function (a, b) {
    return (Math.min(a[1], a[4]) - Math.min(b[1], b[4])) || (a[0] + a[2] - b[0] - b[2]);
  });

  function mkLines(arr, color, opacity) {
    var gg = new THREE.BufferGeometry();
    gg.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    var mm = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: opacity });
    var ll = new THREE.LineSegments(gg, mm);
    scene.add(ll);
    return { geo: gg, mat: mm, count: arr.length / 3 };
  }
  // рисунок намеренно светлый: акцент на тексте
  mkLines(sketch(segs, 1, 0.12, 0.45), 0x3a3530, 0.55);   // основной нажим
  mkLines(sketch(segs, 1, 0.25, 0.8), 0x5a534c, 0.22);    // второй, лёгкий проход
  mkLines(sketch(axes, 1, 0.08, 0.15), 0x5a534c, 0.45);   // деревья, трава, облака


  /* ---------- Ракурсы по прокрутке ---------- */
  var views = [
    { pos: [0, 30, 110], target: [0, 26, -40] },     // панорама квартала
    { pos: [-30, 6, 40], target: [-12, 16, -30] },   // с земли, среди деревьев
    { pos: [34, 20, 12], target: [8, 26, -32] },     // строящийся дом
    { pos: [-70, 58, 6], target: [-26, 50, -30] },   // кран
    { pos: [14, 150, 70], target: [0, 0, -36] }      // с высоты
  ].map(function (v) { return { pos: new THREE.Vector3().fromArray(v.pos), target: new THREE.Vector3().fromArray(v.target) }; });

  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function smooth(t) { return t * t * (3 - 2 * t); }

  // камера идёт по плавной кривой через все ракурсы, без остановок
  var posCurve = new THREE.CatmullRomCurve3(views.map(function (v) { return v.pos; }), false, 'centripetal');
  var tgtCurve = new THREE.CatmullRomCurve3(views.map(function (v) { return v.target; }), false, 'centripetal');

  var camPos = views[0].pos.clone(), camTgt = views[0].target.clone();
  var wantPos = camPos.clone(), wantTgt = camTgt.clone();
  var lastCap = -1;
  function fromScroll() {
    var p = progress();
    var u = smooth(p);
    posCurve.getPoint(u, wantPos);
    tgtCurve.getPoint(u, wantTgt);
    var works = document.querySelector('.works');
    if (works) document.body.classList.toggle('works-on', works.getBoundingClientRect().top < window.innerHeight * 0.7);
    var c = Math.round(p * (views.length - 1));
    if (c !== lastCap) { showCaption(c); lastCap = c; }
  }
  window.addEventListener('scroll', fromScroll, { passive: true });
  fromScroll();
  camPos.copy(wantPos); camTgt.copy(wantTgt);

  /* ---------- Размер и отрисовка ---------- */
  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    var a = w / h;
    camera.aspect = a;
    camera.fov = a < 0.8 ? 62 : 40;
    if (a >= 1.1) camera.setViewOffset(w, h, -w * 0.14, 0, w, h);
    else if (a < 0.8) camera.setViewOffset(w, h, 0, -h * 0.16, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', function () { resize(); fromScroll(); });
  resize();

  var up = new THREE.Vector3();
  function frame(now) {
    // плавное следование за прокруткой + лёгкое «дыхание» камеры
    var lag = reduceMotion ? 1 : 0.035;
    camPos.lerp(wantPos, lag); camTgt.lerp(wantTgt, lag);
    camera.position.copy(camPos);
    if (!reduceMotion) {
      up.set(Math.sin(now / 2600) * 0.35, Math.sin(now / 3100) * 0.25, 0);
      camera.position.add(up);
    }
    camera.lookAt(camTgt);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  hero.classList.add('has-3d');
})();
