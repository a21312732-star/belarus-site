/* Главная: объёмная 3D-модель склада по фото объекта «Белпромстрой».
 * Камера движется при прокрутке страницы. Нужна библиотека three.js. */
(function () {
  'use strict';

  var canvas = document.getElementById('scene');
  var hero = document.querySelector('.hero3d');
  if (!canvas || !hero) return;
  var captions = Array.prototype.slice.call(document.querySelectorAll('.hero3d-cap'));
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function showCaption(i) { captions.forEach(function (c, k) { c.classList.toggle('is-active', k === i); }); }
  function progress() {
    var r = hero.getBoundingClientRect(), span = hero.offsetHeight - window.innerHeight;
    return span <= 0 ? 0 : Math.min(1, Math.max(0, -r.top / span));
  }
  function worksToggle() {
    var works = document.querySelector('.works');
    if (works) document.body.classList.toggle('works-on', works.getBoundingClientRect().top < window.innerHeight * 0.7);
  }
  function fallback() {
    hero.classList.add('no-3d');
    function upd() { showCaption(Math.round(progress() * (captions.length - 1))); worksToggle(); }
    window.addEventListener('scroll', upd, { passive: true }); upd();
  }
  if (typeof THREE === 'undefined') { fallback(); return; }
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); }
  catch (e) { fallback(); return; }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e0c0a);
  scene.fog = new THREE.Fog(0x0e0c0a, 140, 420);
  var camera = new THREE.PerspectiveCamera(38, 1, 0.5, 1200);

  /* ---------- Свет: вечернее небо, тёплое солнце ---------- */
  scene.add(new THREE.HemisphereLight(0x8fa6c9, 0x1a140f, 0.55));
  var sun = new THREE.DirectionalLight(0xffe2b8, 1.6);
  sun.position.set(-90, 110, 120);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  var sc = sun.shadow.camera; sc.left = -120; sc.right = 120; sc.top = 90; sc.bottom = -90; sc.near = 10; sc.far = 400;
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  var fill = new THREE.DirectionalLight(0x6f86b0, 0.35); fill.position.set(120, 40, -60); scene.add(fill);

  /* ---------- Текстуры, нарисованные в canvas ---------- */
  function tex(w, h, draw, rx, ry) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx || 1, ry || 1);
    t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
    return t;
  }
  function panelTex(base, seam, rx) {   // сэндвич-панели: вертикальные швы
    return tex(256, 64, function (g, w, h) {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      for (var x = 0; x < w; x += 8) { g.fillStyle = 'rgba(0,0,0,0.035)'; g.fillRect(x, 0, 2, h); }
      g.fillStyle = seam; g.fillRect(0, 0, 3, h); g.fillRect(w / 2, 0, 3, h);
    }, rx, 1);
  }
  var fenceTex = tex(64, 128, function (g, w, h) {   // забор: горизонтальные ламели
    g.fillStyle = '#1f4fb0'; g.fillRect(0, 0, w, h);
    for (var y = 0; y < h; y += 16) { g.fillStyle = '#163b88'; g.fillRect(0, y + 11, w, 5); }
  }, 30, 1);
  function noiseTex(base, spread, rx, ry) {
    return tex(128, 128, function (g, w, h) {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 2600; i++) {
        var v = (Math.random() - 0.5) * spread;
        g.fillStyle = 'rgba(' + (v > 0 ? '255,255,255,' : '0,0,0,') + Math.abs(v) + ')';
        g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
      }
    }, rx, ry);
  }

  function mat(o) { return new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.75, metalness: 0.05 }, o)); }
  var mBlue = mat({ color: 0x1f55c4 });
  var mBeige = mat({ color: 0xd9d2bd });
  var mDark = mat({ color: 0x15171c, roughness: 0.6 });
  var mGray = mat({ color: 0x8b8f96, metalness: 0.5, roughness: 0.4 });

  function block(w, h, d, m, x, y, z, noShadow) {
    var mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = !noShadow; mesh.receiveShadow = true;
    scene.add(mesh); return mesh;
  }

  /* ---------- Склад 72 × 36 × 14 м ---------- */
  var W = 72, D = 36, H = 14, PL = 1.3, MID = 9.4;
  var beigeL = panelTex('#d9d2bd', '#c6bea7', 18), beigeS = panelTex('#d9d2bd', '#c6bea7', 9);
  var blueL = panelTex('#1f55c4', '#19479f', 18), blueS = panelTex('#1f55c4', '#19479f', 9);
  block(W, PL, D, mBlue, 0, 0, 0);                                     // синий цоколь
  block(W, MID - PL, D, [mat({ map: beigeS }), mat({ map: beigeS }), mBeige, mBeige, mat({ map: beigeL }), mat({ map: beigeL })], 0, PL, 0);
  block(W, H - MID, D, [mat({ map: blueS }), mat({ map: blueS }), mBlue, mBlue, mat({ map: blueL }), mat({ map: blueL })], 0, MID, 0);
  block(W, 0.25, D, mat({ color: 0x4a4e55, roughness: 0.9 }), 0, H, 0);           // кровля (мембрана)
  var trim = mat({ color: 0xc9ccd2, metalness: 0.4, roughness: 0.4 });            // отлив по периметру
  block(W + 0.3, 0.4, 0.3, trim, 0, H, D / 2); block(W + 0.3, 0.4, 0.3, trim, 0, H, -D / 2);
  block(0.3, 0.4, D + 0.3, trim, -W / 2, H, 0); block(0.3, 0.4, D + 0.3, trim, W / 2, H, 0);
  block(6, H + 0.6, D + 0.2, mBlue, W / 2 - 3, 0, 0);                  // синий торцевой блок

  [-8, 12].forEach(function (x) {                                       // доки
    block(4.6, 4.4, 1.2, mat({ color: 0x23262c }), x, 0.6, D / 2 + 0.6);
    block(3.4, 3.4, 0.3, mDark, x, 1.0, D / 2 + 1.2, true);
    var seal = mat({ color: 0xc8a43a });
    block(0.35, 3.6, 0.5, seal, x - 1.85, 0.9, D / 2 + 1.25);
    block(0.35, 3.6, 0.5, seal, x + 1.85, 0.9, D / 2 + 1.25);
    block(4.2, 0.35, 0.5, seal, x, 4.4, D / 2 + 1.25);
    block(4.8, 0.6, 1.4, mBlue, x, 0, D / 2 + 0.7);
  });
  var LX = 9;                                                           // лестница с ограждением
  block(0.12, H + 0.6 - 5.5, 0.12, mGray, LX - 0.4, 5.5, D / 2 + 0.6);
  block(0.12, H + 0.6 - 5.5, 0.12, mGray, LX + 0.4, 5.5, D / 2 + 0.6);
  for (var ry = 5.8; ry < H + 0.6; ry += 0.4) block(0.8, 0.05, 0.05, mGray, LX, ry, D / 2 + 0.6, true);
  for (var cy = 7.5; cy < H + 0.6; cy += 1.2) {
    var ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.035, 4, 16, Math.PI), mGray);
    ring.position.set(LX, cy, D / 2 + 0.75); ring.rotation.x = Math.PI / 2; scene.add(ring);
  }
  block(5, H + 1.5, 5, mBlue, -W / 2 - 1.5, 0, D / 2 - 3);             // лестничная клетка
  block(2.2, H, 0.2, mat({ color: 0x223a5c, metalness: 0.6, roughness: 0.15 }), -W / 2 - 1.5, 0.8, D / 2 - 0.4, true);
  block(9, 3.4, 5, mat({ map: panelTex('#1f55c4', '#19479f', 3) }), -22, 0, D / 2 + 3); // пристройки
  block(3.2, 2.2, 0.15, mat({ color: 0x163b88 }), -22, 0, D / 2 + 5.6);
  block(4, 3, 4, mBlue, -31, 0, D / 2 + 3);

  /* ---------- Участок ---------- */
  var asphalt = mat({ map: noiseTex('#2c2d30', 0.16, 30, 30), roughness: 0.95 });
  var grass = mat({ map: noiseTex('#3f6a2e', 0.22, 24, 24), roughness: 1 });
  var ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat({ color: 0x17140f, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  function flat(w, d, m, x, z, y) {
    var p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m);
    p.rotation.x = -Math.PI / 2; p.position.set(x, y || 0.02, z); p.receiveShadow = true; scene.add(p); return p;
  }
  flat(150, 90, asphalt, 0, 10, 0.02);
  flat(48, 14, grass, -36, D / 2 + 11, 0.04);
  flat(48, 14, grass, 40, D / 2 + 11, 0.04);
  flat(400, 16, asphalt, 0, D / 2 + 30, 0.03);
  var markM = mat({ color: 0xd8d4c8 });
  for (var mx = -190; mx < 200; mx += 10) flat(5, 0.25, markM, mx, D / 2 + 30, 0.05);
  flat(400, 2.5, mat({ color: 0x55524b }), 0, D / 2 + 21.5, 0.05);

  function fence(x0, x1, z) {
    var len = x1 - x0, cx = (x0 + x1) / 2;
    var t = fenceTex.clone(); t.needsUpdate = true; t.repeat.set(len / 2.5, 1);
    block(len, 2.0, 0.15, mat({ map: t, roughness: 0.5 }), cx, 0, z);
    block(len, 0.35, 0.16, mat({ color: 0xd9d2bd }), cx, 2.0, z);
    var postM = mat({ color: 0x163b88 });
    for (var x = x0; x <= x1; x += 3) block(0.12, 2.5, 0.25, postM, x, 0, z);
  }
  fence(-75, -6, D / 2 + 19); fence(8, 75, D / 2 + 19);

  var thujaM = mat({ color: 0x1f3a20, roughness: 1 });
  [-50, -44, -38, -14, -11, 13, 16, 30, 36, 42, 52].forEach(function (x, i) {
    var h = 2.8 + (i % 3) * 0.6;
    var m = new THREE.Mesh(new THREE.ConeGeometry(h * 0.18, h, 9), thujaM);
    m.position.set(x, h / 2, D / 2 + 17 - (i % 2)); m.castShadow = true; scene.add(m);
  });

  function lamp(x, z, h) {
    block(0.25, h, 0.25, mGray, x, 0, z);
    block(2, 0.15, 0.25, mGray, x - 0.9, h, z);
    var l = new THREE.PointLight(0xffd59a, 0.6, 26, 2); l.position.set(x - 1.8, h - 0.4, z); scene.add(l);
    block(0.7, 0.2, 0.4, mat({ color: 0xffe7b5, emissive: 0xffd59a, emissiveIntensity: 1.2 }), x - 1.8, h - 0.3, z, true);
  }
  lamp(-30, D / 2 + 22.5, 9); lamp(22, D / 2 + 22.5, 9); lamp(60, D / 2 + 22.5, 9);

  var pineM = mat({ color: 0x0b140d, roughness: 1 }), trunkM = mat({ color: 0x3a2a1c });
  var seed = 5; function R() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  for (var i = 0; i < 90; i++) {                                       // сосновый лес позади
    var px = -160 + R() * 320, pz = -60 - R() * 90, ph = 14 + R() * 12;
    var pine = new THREE.Mesh(new THREE.ConeGeometry(ph * 0.22, ph, 7), pineM);
    pine.position.set(px, ph / 2 + 4, pz); scene.add(pine);
    var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 5, 5), trunkM); trunk.position.set(px, 2.5, pz); scene.add(trunk);
  }

  /* ---------- Ракурсы по прокрутке ---------- */
  var views = [
    { pos: [-46, 16, 96], target: [6, 7, 0] },      // с улицы, как на фото
    { pos: [4, 3.2, 40], target: [3, 3, 18] },       // доки крупно
    { pos: [78, 14, 52], target: [26, 6, 0] },       // угол и торец
    { pos: [-6, 1.7, 52], target: [-4, 5, 12] },     // от въезда: забор и туи
    { pos: [30, 120, 100], target: [0, 0, 6] }       // с высоты
  ].map(function (v) { return { pos: new THREE.Vector3().fromArray(v.pos), target: new THREE.Vector3().fromArray(v.target) }; });
  function smooth(t) { return t * t * (3 - 2 * t); }
  var posCurve = new THREE.CatmullRomCurve3(views.map(function (v) { return v.pos; }), false, 'centripetal');
  var tgtCurve = new THREE.CatmullRomCurve3(views.map(function (v) { return v.target; }), false, 'centripetal');
  var camPos = views[0].pos.clone(), camTgt = views[0].target.clone();
  var wantPos = camPos.clone(), wantTgt = camTgt.clone(), lastCap = -1;
  function fromScroll() {
    var p = progress(), u = smooth(p);
    posCurve.getPoint(u, wantPos); tgtCurve.getPoint(u, wantTgt);
    worksToggle();
    var c = Math.round(p * (views.length - 1));
    if (c !== lastCap) { showCaption(c); lastCap = c; }
  }
  window.addEventListener('scroll', fromScroll, { passive: true });
  fromScroll(); camPos.copy(wantPos); camTgt.copy(wantTgt);

  function resize() {
    var w = window.innerWidth, h = window.innerHeight, a = w / h;
    renderer.setSize(w, h, false);
    camera.aspect = a; camera.fov = a < 0.8 ? 60 : 38;
    if (a >= 1.1) camera.setViewOffset(w, h, -w * 0.16, 0, w, h);
    else if (a < 0.8) camera.setViewOffset(w, h, 0, -h * 0.16, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', function () { resize(); fromScroll(); });
  resize();

  var sway = new THREE.Vector3();
  function frame(now) {
    var lag = reduceMotion ? 1 : 0.035;
    camPos.lerp(wantPos, lag); camTgt.lerp(wantTgt, lag);
    camera.position.copy(camPos);
    if (!reduceMotion) { sway.set(Math.sin(now / 2600) * 0.3, Math.sin(now / 3100) * 0.2, 0); camera.position.add(sway); }
    camera.lookAt(camTgt);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  hero.classList.add('has-3d');
})();
