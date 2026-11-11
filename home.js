/* Главная: фон меняется плавно в зависимости от того, какой блок сейчас на экране */
(function () {
  'use strict';
  var bgs = Array.prototype.slice.call(document.querySelectorAll('.home-bg'));
  var secs = Array.prototype.slice.call(document.querySelectorAll('.home-sec'));
  if (!bgs.length || !secs.length) return;
  var cur = 0;
  function update() {
    var mid = window.innerHeight * 0.55, best = 0;
    secs.forEach(function (s, i) { if (s.getBoundingClientRect().top < mid) best = i; });
    secs.forEach(function (s, i) { s.classList.toggle('is-in', i === best); });
    var b = parseInt(secs[best].getAttribute('data-bg'), 10) || 0;
    if (b !== cur) { bgs[cur].classList.remove('is-active'); bgs[b].classList.add('is-active'); cur = b; }
    document.body.classList.toggle('bg-dim', secs[best].classList.contains('works'));
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
