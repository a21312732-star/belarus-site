/* Главная: блоки проявляются по прокрутке, рисунок на фоне слегка смещается (параллакс) */
(function () {
  'use strict';
  var bg = document.querySelector('.home-drawing .home-bg');
  var secs = Array.prototype.slice.call(document.querySelectorAll('.home-sec'));
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!secs.length) return;
  function update() {
    var mid = window.innerHeight * 0.55, best = 0;
    secs.forEach(function (s, i) { if (s.getBoundingClientRect().top < mid) best = i; });
    secs.forEach(function (s, i) { s.classList.toggle('is-in', i === best); });
    document.body.classList.toggle('bg-dim', best > 0);
    if (bg && !reduce) {
      var max = document.documentElement.scrollHeight - window.innerHeight || 1;
      var k = Math.min(1, window.pageYOffset / max);
      bg.style.transform = 'translateY(' + (-k * 6) + 'vh) scale(' + (1 + k * 0.08) + ')';
    }
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
