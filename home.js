/* Главная: фон меняется «шторкой», когда на экран приходит следующий блок */
(function () {
  'use strict';
  var wrap = document.querySelector('.home-bgs');
  var bgs = Array.prototype.slice.call(document.querySelectorAll('.home-bg'));
  var secs = Array.prototype.slice.call(document.querySelectorAll('.home-sec'));
  if (!wrap || !bgs.length || !secs.length) return;
  var cur = 0, curSec = 0, timer = null;

  // заранее подгружаем все фоны, чтобы шторка не открывала пустое место
  bgs.forEach(function (b) {
    var m = /url\(['"]?([^'")]+)/.exec(b.style.backgroundImage);
    if (m) { var i = new Image(); i.src = m[1]; }
  });

  function show(b, dir) {
    if (b === cur) return;
    bgs.forEach(function (x) { x.classList.remove('is-prev'); });
    bgs[cur].classList.remove('is-active');
    bgs[cur].classList.add('is-prev');
    wrap.setAttribute('data-dir', dir);
    var el = bgs[b];
    el.classList.remove('is-active');
    void el.offsetWidth;            // перезапуск анимации
    el.classList.add('is-active');
    wrap.classList.remove('is-wiping'); void wrap.offsetWidth; wrap.classList.add('is-wiping');
    var prev = cur; cur = b;
    clearTimeout(timer);
    timer = setTimeout(function () { bgs[prev].classList.remove('is-prev'); wrap.classList.remove('is-wiping'); }, 1500);
  }

  function update() {
    var mid = window.innerHeight * 0.55, best = 0;
    secs.forEach(function (s, i) { if (s.getBoundingClientRect().top < mid) best = i; });
    secs.forEach(function (s, i) { s.classList.toggle('is-in', i === best); });
    var dir = best >= curSec ? 'down' : 'up';
    curSec = best;
    show(parseInt(secs[best].getAttribute('data-bg'), 10) || 0, dir);
    document.body.classList.toggle('bg-dim', secs[best].classList.contains('works'));
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
