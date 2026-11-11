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
  var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);

  /* ---------- Чертёж: набор отрезков ---------- */
  var segs = [];
  function L(a, b) { segs.push([a[0], a[1], a[2], b[0], b[1], b[2]]); }
  function rect(p1, p2, p3, p4) { L(p1, p2); L(p2, p3); L(p3, p4); L(p4, p1); }
  function box(x0, y0, z0, x1, y1, z1) {
    var c = [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]];
    rect(c[0], c[1], c[2], c[3]); rect(c[4], c[5], c[6], c[7]);
    L(c[0], c[4]); L(c[1], c[5]); L(c[2], c[6]); L(c[3], c[7]);
  }
  function winZ(cx, y, zf, w, h) {
    rect([cx - w/2, y, zf], [cx + w/2, y, zf], [cx + w/2, y + h, zf], [cx - w/2, y + h, zf]);
    L([cx, y, zf], [cx, y + h, zf]);
  }
  function winX(cz, y, xf, w, h) {
    rect([xf, y, cz - w/2], [xf, y, cz + w/2], [xf, y + h, cz + w/2], [xf, y + h, cz - w/2]);
    L([xf, y, cz], [xf, y + h, cz]);
  }

  // 1. Административный корпус: 24 × 12 м, 6 этажей
  var AX0 = -12, AX1 = 12, AZ0 = -6, AZ1 = 6, FL = 3, NF = 6, AH = FL * NF;
  box(AX0, 0, AZ0, AX1, AH, AZ1);
  for (var f = 1; f < NF; f++) {
    var y = f * FL;
    rect([AX0, y, AZ0], [AX1, y, AZ0], [AX1, y, AZ1], [AX0, y, AZ1]);
  }
  for (f = 0; f < NF; f++) {
    var wy = f * FL + 0.9;
    for (var x = AX0 + 1.5; x < AX1; x += 2.25) {
      if (f === 0 && Math.abs(x) < 3) continue;
      winZ(x, wy, AZ1, 1.3, 1.6);
      winZ(x, wy, AZ0, 1.3, 1.6);
    }
    for (var z = AZ0 + 1.5; z < AZ1; z += 2.25) winX(z, wy, AX0, 1.3, 1.6);
  }
  rect([-2.4, 0, AZ1], [2.4, 0, AZ1], [2.4, 2.8, AZ1], [-2.4, 2.8, AZ1]);
  L([0, 0, AZ1], [0, 2.8, AZ1]); L([-1.2, 0, AZ1], [-1.2, 2.8, AZ1]); L([1.2, 0, AZ1], [1.2, 2.8, AZ1]);
  L([-2.4, 1.4, AZ1], [2.4, 1.4, AZ1]);
  box(-3.5, 3.2, AZ1, 3.5, 3.6, AZ1 + 3);
  L([-3.2, 0, AZ1 + 2.7], [-3.2, 3.2, AZ1 + 2.7]); L([3.2, 0, AZ1 + 2.7], [3.2, 3.2, AZ1 + 2.7]);
  for (var s = 0; s < 3; s++) L([-3, 0.15 * (s + 1), AZ1 + 3.6 - s * 0.35], [3, 0.15 * (s + 1), AZ1 + 3.6 - s * 0.35]);
  box(AX0, AH, AZ0, AX1, AH + 0.8, AZ1);
  box(-8, AH, -3, -3.5, AH + 3.2, 1);
  box(5, AH, -2, 8, AH + 1.5, 1.5);

  // 2. Производственный корпус: сэндвич-панели, двускатная кровля
  var PX0 = 12, PX1 = 34, PZ0 = -8, PZ1 = 8, PH = 10, RH = 12.5;
  box(PX0, 0, PZ0, PX1, PH, PZ1);
  L([PX0, RH, 0], [PX1, RH, 0]);
  L([PX0, PH, PZ0], [PX0, RH, 0]); L([PX0, PH, PZ1], [PX0, RH, 0]);
  L([PX1, PH, PZ0], [PX1, RH, 0]); L([PX1, PH, PZ1], [PX1, RH, 0]);
  for (x = PX0 + 1.5; x < PX1; x += 1.5) { L([x, 0, PZ1], [x, PH, PZ1]); L([x, 0, PZ0], [x, PH, PZ0]); }
  L([PX0, PH / 2, PZ1], [PX1, PH / 2, PZ1]); L([PX0, PH / 2, PZ0], [PX1, PH / 2, PZ0]);
  for (z = PZ0 + 2; z < PZ1; z += 2) L([PX1, 0, z], [PX1, PH + (RH - PH) * (1 - Math.abs(z) / 8), z]);
  for (var g = 0; g < 3; g++) {
    var gx = PX0 + 5 + g * 6;
    rect([gx - 1.6, 0, PZ1], [gx + 1.6, 0, PZ1], [gx + 1.6, 3.8, PZ1], [gx - 1.6, 3.8, PZ1]);
    for (var gl = 0.95; gl < 3.8; gl += 0.95) L([gx - 1.6, gl, PZ1], [gx + 1.6, gl, PZ1]);
    box(gx - 2, 4.1, PZ1, gx + 2, 4.3, PZ1 + 1.2);
  }
  rect([PX0 + 1, 7.2, PZ1], [PX1 - 1, 7.2, PZ1], [PX1 - 1, 8.4, PZ1], [PX0 + 1, 8.4, PZ1]);

  // 3. Башенный кран
  var CX = -22, CZ = -16, CH = 32, M = 0.8;
  for (var cy = 0; cy < CH; cy += 2) {
    rect([CX - M, cy, CZ - M], [CX + M, cy, CZ - M], [CX + M, cy, CZ + M], [CX - M, cy, CZ + M]);
    L([CX - M, cy, CZ - M], [CX + M, cy + 2, CZ - M]);
    L([CX + M, cy, CZ + M], [CX - M, cy + 2, CZ + M]);
    L([CX - M, cy, CZ + M], [CX - M, cy + 2, CZ - M]);
    L([CX + M, cy, CZ - M], [CX + M, cy + 2, CZ + M]);
  }
  L([CX - M, 0, CZ - M], [CX - M, CH, CZ - M]); L([CX + M, 0, CZ - M], [CX + M, CH, CZ - M]);
  L([CX + M, 0, CZ + M], [CX + M, CH, CZ + M]); L([CX - M, 0, CZ + M], [CX - M, CH, CZ + M]);
  box(CX - 1.2, CH, CZ - 1.2, CX + 1.2, CH + 2, CZ + 1.2);
  var JL = 34, CJ = 10, JY = CH + 2;
  L([CX - CJ, JY, CZ], [CX + JL, JY, CZ]);
  L([CX - CJ, JY + 0.8, CZ], [CX + JL, JY + 0.8, CZ]);
  for (var jx = -CJ; jx < JL; jx += 2) L([CX + jx, JY, CZ], [CX + jx + 2, JY + 0.8, CZ]);
  L([CX, JY + 2, CZ], [CX, JY + 6, CZ]);
  L([CX, JY + 6, CZ], [CX + JL * 0.7, JY + 0.8, CZ]); L([CX, JY + 6, CZ], [CX - CJ, JY + 0.8, CZ]);
  box(CX - CJ, JY - 1.8, CZ - 0.8, CX - CJ + 3, JY, CZ + 0.8);
  L([CX + 22, JY, CZ], [CX + 22, 22, CZ]);
  box(CX + 21.5, 20.8, CZ - 0.5, CX + 22.5, 22, CZ + 0.5);

  // Разбивочные оси на земле (как на листе с чертежом)
  var axes = [];
  for (var ax = -40; ax <= 50; ax += 6) axes.push([ax, 0, -36, ax, 0, 30]);
  for (var az = -36; az <= 30; az += 6) axes.push([-40, 0, az, 50, 0, az]);

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
  var main = mkLines(sketch(segs, 1, 0.09, 0.35), 0x2b2724, 0.85);   // основной нажим
  var soft = mkLines(sketch(segs, 1, 0.18, 0.6), 0x4a4540, 0.35);   // второй, лёгкий проход
  var guide = mkLines(sketch(axes, 1, 0.05, 1.2), 0x9a9188, 0.28);  // оси на «бумаге»


  /* ---------- Ракурсы по прокрутке ---------- */
  var views = [
    { pos: [62, 36, 68], target: [2, 12, 0] },     // общий вид
    { pos: [7, 4.2, 24], target: [0, 4.5, 6] },     // главный вход
    { pos: [50, 7, 30], target: [23, 6, 2] },       // производственный корпус
    { pos: [-40, 22, 22], target: [-14, 32, -16] }, // башенный кран
    { pos: [6, 92, 2], target: [6, 0, 0] }          // вид сверху
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
    if (a >= 1.1) camera.setViewOffset(w, h, -w * 0.2, 0, w, h);
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
